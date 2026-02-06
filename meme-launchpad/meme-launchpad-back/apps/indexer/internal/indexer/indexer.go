package indexer

import (
	"context"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/meme-launchpad/indexer/internal/config"
	"github.com/meme-launchpad/indexer/internal/database"
	evtypes "github.com/meme-launchpad/indexer/internal/types"
	"go.uber.org/zap"
)

// Indexer 区块链事件索引器
type Indexer struct {
	client           *ethclient.Client
	db               *database.DB
	cfg              *config.ChainConfig
	logger           *zap.Logger
	contractAddress  common.Address
	contractABI      abi.ABI
	stopCh           chan struct{}
	currentBatchSize uint64 // 动态调整的批量大小
}

// New 创建索引器实例
func New(cfg *config.ChainConfig, db *database.DB, logger *zap.Logger) (*Indexer, error) {
	// 连接以太坊客户端
	client, err := ethclient.Dial(cfg.RPC)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RPC: %w", err)
	}

	// 验证链ID
	chainID, err := client.ChainID(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get chain ID: %w", err)
	}

	if chainID.Int64() != cfg.ChainID {
		return nil, fmt.Errorf("chain ID mismatch: expected %d, got %d", cfg.ChainID, chainID.Int64())
	}

	// 解析ABI
	contractABI, err := abi.JSON(strings.NewReader(MEMECoreABI))
	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %w", err)
	}

	logger.Info("Indexer initialized",
		zap.String("chain", cfg.Name),
		zap.Int64("chainID", cfg.ChainID),
		zap.String("contract", cfg.CoreContract),
	)

	return &Indexer{
		client:           client,
		db:               db,
		cfg:              cfg,
		logger:           logger,
		contractAddress:  common.HexToAddress(cfg.CoreContract),
		contractABI:      contractABI,
		stopCh:           make(chan struct{}),
		currentBatchSize: uint64(cfg.BlockBatchSize),
	}, nil
}

// Start 启动索引器
func (idx *Indexer) Start(ctx context.Context) error {
	idx.logger.Info("Starting indexer...")

	// 获取最后同步的区块
	lastBlock, err := idx.db.GetLastSyncedBlock(ctx, strings.ToLower(idx.cfg.CoreContract))
	if err != nil {
		return fmt.Errorf("failed to get last synced block: %w", err)
	}

	startBlock := idx.cfg.StartBlock
	if lastBlock > 0 {
		startBlock = lastBlock + 1
	}

	idx.logger.Info("Starting sync from block", zap.Uint64("startBlock", startBlock))

	// 启动历史区块同步
	go idx.syncHistoricalBlocks(ctx, startBlock)

	// 启动实时区块监听
	go idx.watchNewBlocks(ctx)

	return nil
}

// Stop 停止索引器
func (idx *Indexer) Stop() {
	close(idx.stopCh)
	idx.client.Close()
	idx.logger.Info("Indexer stopped")
}

// syncHistoricalBlocks 同步历史区块
func (idx *Indexer) syncHistoricalBlocks(ctx context.Context, startBlock uint64) {
	ticker := time.NewTicker(time.Duration(idx.cfg.PollInterval) * time.Second)
	defer ticker.Stop()

	currentBlock := startBlock
	consecutiveSuccesses := 0

	for {
		select {
		case <-ctx.Done():
			return
		case <-idx.stopCh:
			return
		case <-ticker.C:
			// 获取最新区块号
			latestBlock, err := idx.client.BlockNumber(ctx)
			if err != nil {
				idx.logger.Error("Failed to get latest block number", zap.Error(err))
				continue
			}

			if currentBlock > latestBlock {
				continue
			}

			// 使用动态批量大小
			toBlock := currentBlock + idx.currentBatchSize - 1
			if toBlock > latestBlock {
				toBlock = latestBlock
			}

			// 同步区块范围内的事件
			if err := idx.syncBlockRange(ctx, currentBlock, toBlock); err != nil {
				// 检查是否是 limit exceeded 错误
				if strings.Contains(err.Error(), "limit exceeded") || strings.Contains(err.Error(), "query returned more than") {
					// 减小批量大小
					idx.currentBatchSize = idx.currentBatchSize / 2
					if idx.currentBatchSize < 10 {
						idx.currentBatchSize = 10
					}
					idx.logger.Warn("Reducing batch size due to limit exceeded",
						zap.Uint64("newBatchSize", idx.currentBatchSize),
					)
					consecutiveSuccesses = 0
					continue
				}

				idx.logger.Error("Failed to sync block range",
					zap.Uint64("from", currentBlock),
					zap.Uint64("to", toBlock),
					zap.Error(err),
				)
				continue
			}

			// 成功后逐步恢复批量大小
			consecutiveSuccesses++
			if consecutiveSuccesses >= 10 && idx.currentBatchSize < uint64(idx.cfg.BlockBatchSize) {
				idx.currentBatchSize = idx.currentBatchSize * 2
				if idx.currentBatchSize > uint64(idx.cfg.BlockBatchSize) {
					idx.currentBatchSize = uint64(idx.cfg.BlockBatchSize)
				}
				idx.logger.Info("Increasing batch size", zap.Uint64("newBatchSize", idx.currentBatchSize))
				consecutiveSuccesses = 0
			}

			// 更新最后同步的区块
			if err := idx.db.UpdateLastSyncedBlock(ctx, strings.ToLower(idx.cfg.CoreContract), toBlock); err != nil {
				idx.logger.Error("Failed to update last synced block", zap.Error(err))
			}

			idx.logger.Info("Synced blocks",
				zap.Uint64("from", currentBlock),
				zap.Uint64("to", toBlock),
				zap.Uint64("latest", latestBlock),
				zap.Uint64("batchSize", idx.currentBatchSize),
			)

			currentBlock = toBlock + 1
		}
	}
}

// watchNewBlocks 监听新区块（实时）
func (idx *Indexer) watchNewBlocks(ctx context.Context) {
	// 使用 WebSocket 订阅新区块头
	if idx.cfg.WSS == "" {
		idx.logger.Warn("WSS not configured, skipping real-time subscription")
		return
	}

	wsClient, err := ethclient.Dial(idx.cfg.WSS)
	if err != nil {
		idx.logger.Error("Failed to connect to WebSocket", zap.Error(err))
		return
	}
	defer wsClient.Close()

	headers := make(chan *types.Header)
	sub, err := wsClient.SubscribeNewHead(ctx, headers)
	if err != nil {
		idx.logger.Error("Failed to subscribe to new heads", zap.Error(err))
		return
	}
	defer sub.Unsubscribe()

	idx.logger.Info("Subscribed to new block headers via WebSocket")

	for {
		select {
		case <-ctx.Done():
			return
		case <-idx.stopCh:
			return
		case err := <-sub.Err():
			idx.logger.Error("WebSocket subscription error", zap.Error(err))
			return
		case header := <-headers:
			idx.logger.Debug("New block received", zap.Uint64("block", header.Number.Uint64()))
		}
	}
}

// syncBlockRange 同步指定区块范围内的事件
func (idx *Indexer) syncBlockRange(ctx context.Context, fromBlock, toBlock uint64) error {
	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(fromBlock)),
		ToBlock:   big.NewInt(int64(toBlock)),
		Addresses: []common.Address{idx.contractAddress},
	}

	logs, err := idx.client.FilterLogs(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to filter logs: %w", err)
	}

	if len(logs) == 0 {
		return nil
	}

	idx.logger.Info("Found logs", zap.Int("count", len(logs)))

	// 收集所有区块时间戳
	blockTimestamps := make(map[uint64]uint64)

	// 分类处理事件
	var tokenCreatedEvents []*evtypes.TokenCreatedEvent
	var tokenBoughtEvents []*evtypes.TokenBoughtEvent
	var tokenSoldEvents []*evtypes.TokenSoldEvent
	var tokenGraduatedEvents []*evtypes.TokenGraduatedEvent

	for _, vLog := range logs {
		// 获取区块时间戳
		timestamp, ok := blockTimestamps[vLog.BlockNumber]
		if !ok {
			block, err := idx.client.BlockByNumber(ctx, big.NewInt(int64(vLog.BlockNumber)))
			if err != nil {
				idx.logger.Error("Failed to get block", zap.Uint64("block", vLog.BlockNumber), zap.Error(err))
				continue
			}
			timestamp = block.Time()
			blockTimestamps[vLog.BlockNumber] = timestamp
		}

		// 解析事件
		switch vLog.Topics[0] {
		case idx.contractABI.Events["TokenCreated"].ID:
			event, err := idx.parseTokenCreatedEvent(vLog, timestamp)
			if err != nil {
				idx.logger.Error("Failed to parse TokenCreated event", zap.Error(err))
				continue
			}
			tokenCreatedEvents = append(tokenCreatedEvents, event)
			idx.logger.Info("TokenCreated event",
				zap.String("token", event.TokenAddress),
				zap.String("creator", event.CreatorAddress),
				zap.String("name", event.Name),
				zap.String("symbol", event.Symbol),
			)

		case idx.contractABI.Events["TokenBought"].ID:
			event, err := idx.parseTokenBoughtEvent(vLog, timestamp)
			if err != nil {
				idx.logger.Error("Failed to parse TokenBought event", zap.Error(err))
				continue
			}
			tokenBoughtEvents = append(tokenBoughtEvents, event)
			idx.logger.Debug("TokenBought event",
				zap.String("token", event.TokenAddress),
				zap.String("buyer", event.BuyerAddress),
				zap.String("bnbAmount", event.BnbAmount.String()),
			)

		case idx.contractABI.Events["TokenSold"].ID:
			event, err := idx.parseTokenSoldEvent(vLog, timestamp)
			if err != nil {
				idx.logger.Error("Failed to parse TokenSold event", zap.Error(err))
				continue
			}
			tokenSoldEvents = append(tokenSoldEvents, event)
			idx.logger.Debug("TokenSold event",
				zap.String("token", event.TokenAddress),
				zap.String("seller", event.SellerAddress),
				zap.String("tokenAmount", event.TokenAmount.String()),
			)

		case idx.contractABI.Events["TokenGraduated"].ID:
			event, err := idx.parseTokenGraduatedEvent(vLog, timestamp)
			if err != nil {
				idx.logger.Error("Failed to parse TokenGraduated event", zap.Error(err))
				continue
			}
			tokenGraduatedEvents = append(tokenGraduatedEvents, event)
			idx.logger.Info("TokenGraduated event",
				zap.String("token", event.TokenAddress),
				zap.String("liquidityBNB", event.LiquidityBNB.String()),
			)
		}
	}

	// 批量写入数据库
	if err := idx.db.BatchInsertTokenCreatedEvents(ctx, tokenCreatedEvents); err != nil {
		idx.logger.Error("Failed to insert TokenCreated events", zap.Error(err))
	}
	if err := idx.db.BatchInsertTokenBoughtEvents(ctx, tokenBoughtEvents); err != nil {
		idx.logger.Error("Failed to insert TokenBought events", zap.Error(err))
	}
	if err := idx.db.BatchInsertTokenSoldEvents(ctx, tokenSoldEvents); err != nil {
		idx.logger.Error("Failed to insert TokenSold events", zap.Error(err))
	}

	// TokenGraduated 事件较少，逐个插入
	for _, event := range tokenGraduatedEvents {
		if err := idx.db.InsertTokenGraduatedEvent(ctx, event); err != nil {
			idx.logger.Error("Failed to insert TokenGraduated event", zap.Error(err))
		}
	}

	return nil
}

// parseTokenCreatedEvent 解析 TokenCreated 事件
func (idx *Indexer) parseTokenCreatedEvent(vLog types.Log, timestamp uint64) (*evtypes.TokenCreatedEvent, error) {
	event := struct {
		Name        string
		Symbol      string
		TotalSupply *big.Int
		RequestId   [32]byte
	}{}

	if err := idx.contractABI.UnpackIntoInterface(&event, "TokenCreated", vLog.Data); err != nil {
		return nil, err
	}

	return &evtypes.TokenCreatedEvent{
		TokenAddress:    common.BytesToAddress(vLog.Topics[1].Bytes()).Hex(),
		CreatorAddress:  common.BytesToAddress(vLog.Topics[2].Bytes()).Hex(),
		Name:            event.Name,
		Symbol:          event.Symbol,
		TotalSupply:     event.TotalSupply,
		RequestID:       common.BytesToHash(event.RequestId[:]).Hex(),
		TransactionHash: vLog.TxHash.Hex(),
		BlockNumber:     vLog.BlockNumber,
		BlockTimestamp:  timestamp,
		LogIndex:        vLog.Index,
	}, nil
}

// parseTokenBoughtEvent 解析 TokenBought 事件
func (idx *Indexer) parseTokenBoughtEvent(vLog types.Log, timestamp uint64) (*evtypes.TokenBoughtEvent, error) {
	event := struct {
		BnbAmount           *big.Int
		TokenAmount         *big.Int
		TradingFee          *big.Int
		VirtualBNBReserve   *big.Int
		VirtualTokenReserve *big.Int
		AvailableTokens     *big.Int
		CollectedBNB        *big.Int
	}{}

	if err := idx.contractABI.UnpackIntoInterface(&event, "TokenBought", vLog.Data); err != nil {
		return nil, err
	}

	return &evtypes.TokenBoughtEvent{
		TokenAddress:        common.BytesToAddress(vLog.Topics[1].Bytes()).Hex(),
		BuyerAddress:        common.BytesToAddress(vLog.Topics[2].Bytes()).Hex(),
		BnbAmount:           event.BnbAmount,
		TokenAmount:         event.TokenAmount,
		TradingFee:          event.TradingFee,
		VirtualBNBReserve:   event.VirtualBNBReserve,
		VirtualTokenReserve: event.VirtualTokenReserve,
		AvailableTokens:     event.AvailableTokens,
		CollectedBNB:        event.CollectedBNB,
		TransactionHash:     vLog.TxHash.Hex(),
		BlockNumber:         vLog.BlockNumber,
		BlockTimestamp:      timestamp,
		LogIndex:            vLog.Index,
	}, nil
}

// parseTokenSoldEvent 解析 TokenSold 事件
func (idx *Indexer) parseTokenSoldEvent(vLog types.Log, timestamp uint64) (*evtypes.TokenSoldEvent, error) {
	event := struct {
		TokenAmount         *big.Int
		BnbAmount           *big.Int
		TradingFee          *big.Int
		VirtualBNBReserve   *big.Int
		VirtualTokenReserve *big.Int
		AvailableTokens     *big.Int
		CollectedBNB        *big.Int
	}{}

	if err := idx.contractABI.UnpackIntoInterface(&event, "TokenSold", vLog.Data); err != nil {
		return nil, err
	}

	return &evtypes.TokenSoldEvent{
		TokenAddress:        common.BytesToAddress(vLog.Topics[1].Bytes()).Hex(),
		SellerAddress:       common.BytesToAddress(vLog.Topics[2].Bytes()).Hex(),
		TokenAmount:         event.TokenAmount,
		BnbAmount:           event.BnbAmount,
		TradingFee:          event.TradingFee,
		VirtualBNBReserve:   event.VirtualBNBReserve,
		VirtualTokenReserve: event.VirtualTokenReserve,
		AvailableTokens:     event.AvailableTokens,
		CollectedBNB:        event.CollectedBNB,
		TransactionHash:     vLog.TxHash.Hex(),
		BlockNumber:         vLog.BlockNumber,
		BlockTimestamp:      timestamp,
		LogIndex:            vLog.Index,
	}, nil
}

// parseTokenGraduatedEvent 解析 TokenGraduated 事件
func (idx *Indexer) parseTokenGraduatedEvent(vLog types.Log, timestamp uint64) (*evtypes.TokenGraduatedEvent, error) {
	event := struct {
		LiquidityBNB    *big.Int
		LiquidityTokens *big.Int
		LiquidityResult *big.Int
	}{}

	if err := idx.contractABI.UnpackIntoInterface(&event, "TokenGraduated", vLog.Data); err != nil {
		return nil, err
	}

	return &evtypes.TokenGraduatedEvent{
		TokenAddress:    common.BytesToAddress(vLog.Topics[1].Bytes()).Hex(),
		LiquidityBNB:    event.LiquidityBNB,
		LiquidityTokens: event.LiquidityTokens,
		LiquidityResult: event.LiquidityResult,
		TransactionHash: vLog.TxHash.Hex(),
		BlockNumber:     vLog.BlockNumber,
		BlockTimestamp:  timestamp,
		LogIndex:        vLog.Index,
	}, nil
}
