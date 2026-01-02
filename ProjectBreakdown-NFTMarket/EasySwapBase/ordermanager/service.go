package ordermanager

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/pkg/errors"
	"github.com/shopspring/decimal"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/core/threading"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/ProjectsTask/EasySwapBase/logger/xzap"
	"github.com/ProjectsTask/EasySwapBase/stores/gdb/orderbookmodel/multi"
	"github.com/ProjectsTask/EasySwapBase/stores/xkv"
)

// 实现订单管理器，用于处理NFT订单的生命周期管理
const (

	//时间轮的长度，1秒为一个单位，1小时为一个周期
	// WheelSize : length of time wheel, 1s for a unit, 1h for a cycle
	WheelSize           = 3600
	List                = 3
	CacheOrdersQueuePre = "cache:es:orders:%s"
)

// 生成订单缓存键
func GenOrdersCacheKey(chain string) string {
	return fmt.Sprintf(CacheOrdersQueuePre, chain)
}

// 订单：集合订单活动
// Activity ：collection order-activity
type Order struct {
	// order Id 订单ID
	orderID        string
	CollectionAddr string
	// chain suffix name: ethw/bsc
	//链后缀名: ethw/bsc
	ChainSuffix string
	// expireIn - createIn (unit: s)
	CycleCount int64
	// position of the task on the time wheel
	//任务在时间轮上的位置
	WheelPosition int64

	Next *Order
}

// 时间轮结构体
type wheel struct {
	// linked list
	NotifyActivities *Order
}

type OrderManager struct {
	chain string

	// cycle time wheel
	//循环时间轮
	TimeWheel [WheelSize]wheel
	// current time wheel index
	//当前时间轮索引
	CurrentIndex int64

	collectionOrders map[string]*collectionTradeInfo

	collectionListedCh chan string
	project            string

	Xkv *xkv.Store
	DB  *gorm.DB
	Ctx context.Context
	Mux *sync.RWMutex
}

// NewDelayQueue : create func instance entrance
// 创建延迟队列实例入口
func New(ctx context.Context, db *gorm.DB, xkv *xkv.Store, chain string, project string) *OrderManager {
	return &OrderManager{
		chain:              chain,
		Xkv:                xkv,
		DB:                 db,
		Ctx:                ctx,
		Mux:                new(sync.RWMutex),
		collectionOrders:   make(map[string]*collectionTradeInfo),
		collectionListedCh: make(chan string, 1000),
		project:            project,
	}
}

// 启动订单管理器
func (om *OrderManager) Start() {
	/*
		threading.GoSafe 是 go-zero 框架提供的一个安全的 goroutine 启动函数。
		主要特点：
		安全启动协程：在新协程中执行函数，如果函数执行过程中发生 panic，会捕获并处理，避免整个程序崩溃
		异常处理：自动捕获协程中的 panic，记录日志并优雅处理，而不是让程序崩溃
		简化并发编程：提供一个安全的并发执行方式，无需手动处理 recover
	*/
	// listen redis cache
	threading.GoSafe(om.ListenNewListingLoop) // 处理新订单
	threading.GoSafe(om.orderExpiryProcess)   // 处理订单过期状态
	threading.GoSafe(om.floorPriceProcess)    // 处理floorprice更新
	threading.GoSafe(om.listCountProcess)     // 处理listCount更新
}

// 停止订单管理器
func (om *OrderManager) Stop() {
}

// 挂单信息结构体
type ListingInfo struct {
	ExpireIn       int64           `json:"expire_in"`
	OrderId        string          `json:"order_id"`
	CollectionAddr string          `json:"collection_addr"`
	TokenID        string          `json:"token_id"`
	Price          decimal.Decimal `json:"price"`
	Maker          string          `json:"maker"`
}

// 监听新挂单循环
func (om *OrderManager) ListenNewListingLoop() {
	//通过 GenOrdersCacheKey(om.chain) 生成的缓存键
	key := GenOrdersCacheKey(om.chain)
	for {
		//从 Redis 缓存中弹出（Lpop）一个订单数据
		result, err := om.Xkv.Lpop(key)
		//检查是否有错误或返回结果为空
		if err != nil || result == "" {
			//如果错误不是 redis.Nil（表示队列为空），记录警告日志
			if err != nil && err != redis.Nil {
				xzap.WithContext(context.Background()).Warn("failed on get order from cache", zap.Error(err), zap.String("result", result))
			}
			//休眠 1 秒后继续循环，避免频繁空轮询
			time.Sleep(1 * time.Second)
			continue
		}

		//记录成功从缓存获取到挂单的信息日志
		xzap.WithContext(om.Ctx).Info("get listing from cache", zap.String("result", result))
		var listing ListingInfo
		//将从缓存获取的 JSON 字符串反序列化为 ListingInfo 结构体

		if err := json.Unmarshal([]byte(result), &listing); err != nil {
			//如果反序列化失败，记录警告日志并继续下一次循环
			xzap.WithContext(om.Ctx).Warn("failed on Unmarshal order info", zap.Error(err))
			continue
		}
		//验证订单 ID 是否为空
		if listing.OrderId == "" {
			//如果为空，记录错误日志并跳过处理
			xzap.WithContext(om.Ctx).Error("invalid null order id")
			continue
		}

		// 订单已经过期
		if listing.ExpireIn < time.Now().Unix() {
			//如果订单已过期，记录信息日志
			xzap.WithContext(om.Ctx).Info("expired activity order", zap.String("order_id", listing.OrderId))

			// 更新订单状态-调用 updateOrdersStatus 方法将订单状态更新为过期状态
			if err := om.updateOrdersStatus(listing.OrderId, multi.OrderStatusExpired); err != nil {
				//记录更新失败的错误日志
				xzap.WithContext(om.Ctx).Error("failed on update activity status", zap.String("order_id", listing.OrderId), zap.Error(err))
			}

			// 添加更新floorprice事件 - 创建类型为 Expired 的交易事件
			if err := om.addUpdateFloorPriceEvent(&TradeEvent{
				EventType:      Expired,
				CollectionAddr: listing.CollectionAddr,
				TokenID:        listing.TokenID,
				OrderId:        listing.OrderId,
				From:           listing.Maker,
			}); err != nil {
				xzap.WithContext(om.Ctx).Error("failed on add update floor price event", zap.String("order_id", listing.OrderId), zap.Error(err))
			}
			continue
		} else { // 订单未过期
			//对于未过期订单，创建类型为 Listing 的交易事件
			if err := om.addUpdateFloorPriceEvent(&TradeEvent{ // 添加更新floorprice事件
				EventType:      Listing,
				CollectionAddr: listing.CollectionAddr,
				TokenID:        listing.TokenID,
				OrderId:        listing.OrderId,
				Price:          listing.Price,
				From:           listing.Maker,
			}); err != nil {
				xzap.WithContext(om.Ctx).Error("failed on push order to update price queue", zap.Error(err), zap.String("order_id", listing.OrderId),
					zap.String("order_id", listing.OrderId),
					zap.String("price", listing.Price.String()),
					zap.String("chain", om.chain))
			}

			// 添加到订单过期检查队列 - 计算距离订单过期还有多少秒
			delaySeconds := listing.ExpireIn - time.Now().Unix()
			//将订单添加到过期检查队列，以便在过期时进行处理
			if err := om.addToOrderExpiryCheckQueue(delaySeconds, om.chain, listing.OrderId, listing.CollectionAddr); err != nil {
				xzap.WithContext(om.Ctx).Error("failed on push order to expired check queue", zap.Error(err), zap.String("order_id", listing.OrderId),
					zap.String("chain", om.chain))
			}
		}
	}
}

// 将订单添加到订单管理器队列
func (om *OrderManager) AddToOrderManagerQueue(order *multi.Order) error {
	if order.TokenId == "" {
		return errors.New("order manger need token id")
	}
	rawInfo, err := json.Marshal(ListingInfo{
		ExpireIn:       order.ExpireTime,
		OrderId:        order.OrderID,
		CollectionAddr: order.CollectionAddress,
		TokenID:        order.TokenId,
		Price:          order.Price,
		Maker:          order.Maker,
	})
	if err != nil {
		return errors.Wrap(err, "failed on marshal listing info")
	}

	if _, err := om.Xkv.Lpush(GenOrdersCacheKey(om.chain), string(rawInfo)); err != nil {
		return errors.Wrap(err, "failed on add to queue")
	}

	return nil
}
