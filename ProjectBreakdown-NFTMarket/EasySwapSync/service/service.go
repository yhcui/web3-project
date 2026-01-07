package service

import (
	"context"
	"fmt"
	"sync"

	"github.com/ProjectsTask/EasySwapBase/chain"
	"github.com/ProjectsTask/EasySwapBase/chain/chainclient"
	"github.com/ProjectsTask/EasySwapBase/ordermanager"
	"github.com/ProjectsTask/EasySwapBase/stores/xkv"
	"github.com/pkg/errors"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"gorm.io/gorm"

	"github.com/ProjectsTask/EasySwapSync/service/orderbookindexer"

	"github.com/ProjectsTask/EasySwapSync/model"
	"github.com/ProjectsTask/EasySwapSync/service/collectionfilter"
	"github.com/ProjectsTask/EasySwapSync/service/config"
)

type Service struct {
	ctx              context.Context
	config           *config.Config
	kvStore          *xkv.Store
	db               *gorm.DB
	wg               *sync.WaitGroup
	collectionFilter *collectionfilter.Filter
	orderbookIndexer *orderbookindexer.Service
	orderManager     *ordermanager.OrderManager
}

// 创建和初始化 Service 实例，该实例负责管理整个 NFT 订单簿同步服务的运行。
func New(ctx context.Context, cfg *config.Config) (*Service, error) {
	var kvConf kv.KvConf
	for _, con := range cfg.Kv.Redis {
		kvConf = append(kvConf, cache.NodeConf{
			RedisConf: redis.RedisConf{
				Host: con.Host,
				Type: con.Type,
				Pass: con.Pass,
			},
			Weight: 2,
		})
	}

	//使用 xkv.NewStore(kvConf) 创建键值存储实例 --
	// 实际就是连连缓存
	kvStore := xkv.NewStore(kvConf)

	var err error
	//通过 model.NewDB(cfg.DB) 创建数据库连接
	db := model.NewDB(cfg.DB)

	//用于过滤 NFT 集合
	collectionFilter := collectionfilter.New(ctx, db, cfg.ChainCfg.Name, cfg.ProjectCfg.Name)

	//订单管理器
	orderManager := ordermanager.New(ctx, db, kvStore, cfg.ChainCfg.Name, cfg.ProjectCfg.Name)

	var orderbookSyncer *orderbookindexer.Service

	//区块链客户端，用于连接 RPC 节点
	var chainClient chainclient.ChainClient
	//使用 cfg.AnkrCfg.HttpsUrl 和 cfg.AnkrCfg.ApiKey 构建完整的 RPC URL
	fmt.Println("chainClient url:" + cfg.AnkrCfg.HttpsUrl + cfg.AnkrCfg.ApiKey)

	//创建 EVM 兼容的区块链客户端
	chainClient, err = chainclient.New(int(cfg.ChainCfg.ID), cfg.AnkrCfg.HttpsUrl+cfg.AnkrCfg.ApiKey)
	if err != nil {
		return nil, errors.Wrap(err, "failed on create evm client")
	}

	switch cfg.ChainCfg.ID {
	//根据链 ID（以太坊、Optimism、Sepolia）创建订单簿索引器
	case chain.EthChainID, chain.OptimismChainID, chain.SepoliaChainID:
		//将数据库、KV 存储、区块链客户端和订单管理器传递给索引器
		orderbookSyncer = orderbookindexer.New(ctx, cfg, db, kvStore, chainClient, cfg.ChainCfg.ID, cfg.ChainCfg.Name, orderManager)
	}
	if err != nil {
		return nil, errors.Wrap(err, "failed on create trade info server")
	}
	//组装所有组件到 Service 结构体中
	manager := Service{
		ctx:              ctx,
		config:           cfg,
		db:               db,
		kvStore:          kvStore,
		collectionFilter: collectionFilter,
		orderbookIndexer: orderbookSyncer,
		orderManager:     orderManager,
		wg:               &sync.WaitGroup{},
	}
	return &manager, nil
}

func (s *Service) Start() error {
	// 不要移动位置
	if err := s.collectionFilter.PreloadCollections(); err != nil {
		return errors.Wrap(err, "failed on preload collection to filter")
	}

	// 同步地板价 同步订单创建 取消 和成交的事件
	s.orderbookIndexer.Start()
	s.orderManager.Start()
	return nil
}
