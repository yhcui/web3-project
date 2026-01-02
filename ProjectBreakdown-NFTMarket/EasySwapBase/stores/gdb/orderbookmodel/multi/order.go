package multi

import (
	"fmt"

	"github.com/shopspring/decimal"
)

const (
	/*
		在NFT市场中，Listing和Offer形成了交易的两个基本方向：
		Listing: 卖方主动挂单等待买家
		Offer: 买方主动出价寻求卖家
		这种设计支持了NFT市场中常见的两种交易模式：直接购买（通过Listing）和议价交易（通过Offer）

		CollectionBidOrder (集合竞价订单)
		范围: 针对整个NFT集合
		意图: 对某个NFT集合中的任意NFT进行出价
		应用场景: 用户愿意购买特定集合中的任何一件作品，不限定具体ID

		ItemBidOrder (物品竞价订单)
		范围: 针对特定的单个NFT
		意图: 对具体某个NFT进行出价
		应用场景: 用户只想购买特定的某个NFT（由collection_address和token_id确定）
	*/
	ListingOrder       = 1 // 挂单/出售订单，用户想要出售NFT
	OfferOrder         = 2 // 报价/购买订单，用户想要购买NFT
	CollectionBidOrder = 3 // 集合竞价订单
	ItemBidOrder       = 4 // 物品竞价订单
)

const (
	//活跃状态 - 订单处于有效期内，可以被匹配交易
	OrderStatusActive = 0
	//非活跃状态 - 订单暂时不可用，可能因为某些条件未满足
	OrderStatusInactive = 1
	//已过期状态 - 订单超过了设置的 ExpireTime，自动失效
	OrderStatusExpired = 2
	//已取消状态 - 订单被用户主动取消
	OrderStatusCancelled = 3
	//已完成状态 - 订单已完全成交，交易完成
	OrderStatusFilled = 4
	//待签名状态 - 订单需要进一步的签名确认才能激活
	OrderStatusNeedSign = 5
)

const (
	ListingType = 1
	OfferType   = 2
)

const (
	MarketOrderBook = iota
)

type Order struct {
	ID                int64           `gorm:"column:id" json:"id"` //  主键
	MarketplaceId     int             `gorm:"column:marketplace_id" json:"marketplace_id"`
	CollectionAddress string          `gorm:"column:collection_address" json:"collection_address"`
	TokenId           string          `gorm:"column:token_id" json:"token_id"`
	OrderID           string          `gorm:"column:order_id" json:"order_id"`                            //  订单唯一id
	OrderStatus       int             `gorm:"column:order_status;default:0;NOT NULL" json:"order_status"` // 订单状态
	EventTime         int64           `gorm:"column:event_time" json:"event_time"`
	ExpireTime        int64           `gorm:"column:expire_time" json:"expire_time"` // in seconds
	CurrencyAddress   string          `gorm:"column:currency_address" json:"currency_address"`
	Price             decimal.Decimal `gorm:"column:price" json:"price"`
	Maker             string          `gorm:"column:maker" json:"maker"`
	Taker             string          `gorm:"column:taker" json:"taker"`
	QuantityRemaining int64           `gorm:"column:quantity_remaining" json:"quantity_remaining"`
	Size              int64           `gorm:"column:size" json:"size"`
	// 1: listing 2:offer 3:collection bid 4:item bid
	OrderType  int64 `gorm:"column:order_type" json:"order_type"`
	Salt       int64 `gorm:"column:salt" json:"salt"`
	CreateTime int64 `json:"create_time" gorm:"column:create_time;type:bigint(20);autoCreateTime:milli;comment:创建时间"` // 创建时间
	UpdateTime int64 `json:"update_time" gorm:"column:update_time;type:bigint(20);autoUpdateTime:milli;comment:更新时间"` // 更新时间
}

func OrderTableName(chainName string) string {
	return fmt.Sprintf("ob_order_%s", chainName)
}
