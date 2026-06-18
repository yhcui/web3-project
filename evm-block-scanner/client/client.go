package client

import (
	"context"
	"errors"
	clientpool "evm-scanner/common/client-pool"
	"evm-scanner/common/rate"
	"evm-scanner/config"
	"evm-scanner/storage"
	"evm-scanner/types"
	"log"
	"math/big"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/gorilla/websocket"
)

type Block struct {
	RawBlock  *types.Block
	Timestamp uint64
}

func (b *Block) BaseFee() *big.Int {
	if b.RawBlock.BaseFeePerGas == nil {
		return nil
	}
	return b.RawBlock.BaseFeePerGas.ToInt()
}

// Number 返回区块高度
func (b *Block) Number() *big.Int {
	if b == nil || b.RawBlock == nil || b.RawBlock.Number == nil {
		return nil
	}
	return b.RawBlock.Number.ToInt()
}

// RawTransactions 返回原始交易列表
func (b *Block) RawTransactions() []types.Transaction {
	if b.RawBlock != nil {
		return b.RawBlock.Transactions
	}
	return nil
}

// RawTransactionsWithReceipts 返回原始交易列表，并通过 BlockReceipts 为每笔交易填充 Receipt
func (b *Block) RawTransactionsWithReceipts(why string, ctx context.Context, ep *Endpoint) ([]types.Transaction, error) {
	txs := b.RawTransactions()
	if len(txs) == 0 {
		return txs, nil
	}
	receipts, err := ep.BlockReceipts(why, ctx, b.Number())
	if err != nil {
		return nil, err
	}
	receiptMap := make(map[uint]*types.Receipt, len(receipts))
	for _, r := range receipts {
		receiptMap[uint(r.TransactionIndex)] = r
	}
	for i := range txs {
		if txs[i].TransactionIndex != nil {
			b.RawBlock.Transactions[i].Receipt = receiptMap[uint(*txs[i].TransactionIndex)]
		}
	}
	return b.RawBlock.Transactions, nil
}

type monitorInfo struct {
	height   uint64
	l1Height uint64
	txHash   common.Hash
	ch       chan<- TransactionStatus
	from     common.Address
	nonce    uint64
}

type Client struct {
	Name       string
	Endpoint   Endpoint
	L1         *Client
	L2         []*Client
	ChainId    *big.Int
	chainIdInt uint64
	queueDB    *storage.BlockQueue
	cacheDir   string
	interval   time.Duration
	onInit     func()

	pendingSub   ethereum.Subscription
	monitorTxs   map[common.Hash]monitorInfo
	monitorTxsMu sync.RWMutex

	// 并发控制
	maxWorkers          int
	baseCooldown        time.Duration
	heightCheckInterval time.Duration // 定期高度检查间隔
	skipCatchUp         bool          // 重启时跳过追块
}

func (c *Client) Close() {
	c.queueDB.Close()
}

func NewClient(cfg config.Endpoint, cacheDir string, skipCatchUp bool, onInit func()) *Client {
	maxWorkers := cfg.MaxWorkers
	if maxWorkers == 0 {
		maxWorkers = 10
	}
	baseCooldown := time.Duration(cfg.BaseCooldown) * time.Second
	if baseCooldown == 0 {
		baseCooldown = 5 * time.Second
	}
	heightCheckInterval := time.Duration(cfg.HeightCheckInterval) * time.Second
	if heightCheckInterval == 0 {
		heightCheckInterval = 30 * time.Second
	}

	return &Client{
		Name:                cfg.Name,
		Endpoint:            NewEndpoint(cfg.Urls, cfg.Name),
		L2:                  make([]*Client, 0),
		cacheDir:            cacheDir,
		interval:            time.Duration(cfg.Interval) * time.Millisecond,
		onInit:              onInit,
		monitorTxs:          make(map[common.Hash]monitorInfo),
		maxWorkers:          maxWorkers,
		baseCooldown:        baseCooldown,
		heightCheckInterval: heightCheckInterval,
		skipCatchUp:         skipCatchUp,
	}
}

func (c *Client) Sleep() {
	time.Sleep(c.interval)
}

func (c *Client) Init(ctx context.Context) error {
	if c.ChainId == nil {
		log.Printf("[%s] Initializing client...", c.Name)
		id, err := c.Endpoint.ChainId("Client init", ctx)
		if err != nil {
			return err
		}

		c.ChainId = id
		c.chainIdInt = id.Uint64()

		// 创建该链的 BlockQueue
		queueDB, err := storage.NewBlockQueue(c.cacheDir, c.chainIdInt, c.Name)
		if err != nil {
			return err
		}
		c.queueDB = queueDB

		if c.onInit != nil {
			c.onInit()
		}
	}

	latestHeight, err := c.Endpoint.BlockNumber("Client init", ctx)
	if err != nil {
		log.Printf("[%s] Get latest height failed: %v", c.Name, err)
		return err
	}

	// 跳过追块：清空旧队列，直接从最新区块开始
	if c.skipCatchUp {
		currentHeight := c.queueDB.GetContinueFromBlock()
		if err := c.queueDB.ResetTo(latestHeight); err != nil {
			log.Printf("[%s] Failed to reset queue to latest height: %v", c.Name, err)
			return err
		}
		if currentHeight > 0 && currentHeight < latestHeight {
			log.Printf("[%s] skip_catch_up: skipped %d blocks (%d → %d)",
				c.Name, latestHeight-currentHeight, currentHeight, latestHeight)
		} else {
			log.Printf("[%s] skip_catch_up: starting from latest block %d", c.Name, latestHeight)
		}
	} else {
		currentHeight := c.queueDB.GetContinueFromBlock()
		if currentHeight > 0 && currentHeight < latestHeight {
			log.Printf("[%s] Catching up from block %d to %d (%d blocks behind)",
				c.Name, currentHeight, latestHeight, latestHeight-currentHeight)
		} else {
			log.Printf("[%s] Starting from latest block %d", c.Name, latestHeight)
		}
	}

	return nil
}

type TransactionStatus struct {
	Status        string `json:"status"` // not-found, pending, confirmed, replaced
	Confirmations uint64 `json:"confirmations"`
}

func (c *Client) Confirmations(latestHeight uint64, block *types.Block) uint64 {
	txHeight := block.Number.ToInt().Uint64()
	if c.IsL2Network() {
		txHeight = block.L1BlockNumber.ToInt().Uint64()
	}
	if txHeight > latestHeight {
		// 区块没跟上导致的
		log.Printf("[%s] block number %d is higher than latest height %d", c.Name, txHeight, latestHeight)
		return 0
	}
	return latestHeight - txHeight + 1
}

func (c *Client) SubscribeTransaction(ctx context.Context, txHash common.Hash, ch chan<- TransactionStatus) error {
	if c.ChainId == nil {
		return errors.New("not ready")
	}

	rawTx, isPending, err := c.Endpoint.TransactionByHash("SubscribeTransaction:Check Tx initial status", ctx, txHash)
	if err != nil {
		if err_, ok := err.(*websocket.CloseError); ok && err_.Code == 1011 && err_.Text == "" {
			// 适配 api.zan.top 的错误，当查询不存在的 hash 的时候会返回这个错误
		} else {
			return err
		}
	}

	info := monitorInfo{
		txHash: txHash,
		ch:     ch,
	}
	defer func() {
		c.monitorTxsMu.Lock()
		c.monitorTxs[txHash] = info
		c.monitorTxsMu.Unlock()
	}()

	if rawTx == nil {
		ch <- TransactionStatus{Status: "not-found"}
		return nil
	}

	latestHeight := c.queueDB.GetContinueFromBlock()

	blockNumber := rawTx.BlockNumber

	if c.IsL2Network() {
		latestHeight = c.L1.queueDB.GetContinueFromBlock()
		rec, err := c.Endpoint.TransactionReceipt("SubscribeTransaction:Get L1 block height", ctx, txHash)
		if err != nil {
			return err
		}
		if rec != nil {
			blockNumber = rec.L1BlockNumber
		}
	}

	if isPending {
		ch <- TransactionStatus{Status: "pending"}
	} else {
		ch <- TransactionStatus{Status: "confirmed", Confirmations: c.Confirmations(latestHeight, &types.Block{
			Number:        rawTx.BlockNumber,
			L1BlockNumber: blockNumber,
		})}
	}
	if c.IsL2Network() {
		info.l1Height = blockNumber.ToInt().Uint64()
	}
	info.height = rawTx.BlockNumber.ToInt().Uint64()
	info.nonce = uint64(rawTx.Nonce)
	info.from = rawTx.From

	return nil
}

func (c *Client) IsL2Network() bool {
	return c.L1 != nil
}
func (c *Client) checkTransactionsInBlock(ctx context.Context, block *types.Block) {
	c.monitorTxsMu.Lock()
	defer c.monitorTxsMu.Unlock()
	if len(c.monitorTxs) == 0 {
		return
	}
	// 记录不在此区块的交易，后续检查是否有更高的nonce
	skipCheckNonceTxHashes := make(map[common.Hash]bool)

	latestHeight := c.queueDB.GetContinueFromBlock()
	if c.IsL2Network() {
		latestHeight = c.L1.queueDB.GetContinueFromBlock()
	}
	// 给已经确认的交易持续发送区块确认数消息
	for _, info := range c.monitorTxs {
		if info.height == 0 {
			continue
		}
		skipCheckNonceTxHashes[info.txHash] = true
		if c.L1 == nil {
			select {
			case info.ch <- TransactionStatus{Status: "confirmed", Confirmations: c.Confirmations(latestHeight, &types.Block{
				Number: (*hexutil.Big)(big.NewInt(int64(info.height))),
			})}:
			default:
				close(info.ch)
				delete(c.monitorTxs, info.txHash)
			}
		}
	}

	for _, tx := range block.Transactions {
		info, ok := c.monitorTxs[tx.Hash]
		if !ok {
			continue
		}

		info.height = block.Number.ToInt().Uint64()
		if c.IsL2Network() {
			info.l1Height = block.L1BlockNumber.ToInt().Uint64()
		}
		c.monitorTxs[tx.Hash] = info

		if c.L1 == nil {
			select {
			case info.ch <- TransactionStatus{Status: "confirmed", Confirmations: c.Confirmations(latestHeight, block)}:
			default:
				close(info.ch)
				delete(c.monitorTxs, info.txHash)
			}
		}

		skipCheckNonceTxHashes[tx.Hash] = true
	}

	for txHash, info := range c.monitorTxs {
		if skipCheckNonceTxHashes[txHash] {
			continue
		}
		nonce, err := c.Endpoint.NonceAt("SubscribeTransaction:Check Tx nonce", ctx, info.from, nil)
		if err != nil {
			log.Printf("[%s] Get nonce failed: %v", c.Name, err)
			continue
		}
		if nonce > info.nonce {
			select {
			case info.ch <- TransactionStatus{Status: "replaced"}:
				close(info.ch)
				delete(c.monitorTxs, txHash)
			default:
				close(info.ch)
				delete(c.monitorTxs, txHash)
			}
		}
	}
}

func (c *Client) blockWorker(ctx context.Context, ch chan<- Block, sleep time.Duration) {
	select {
	case <-ctx.Done():
		return
	case <-time.After(sleep):
		// 先拉取到几个新区块再开始处理任务，使其优先处理新区块
	}

	taskCh := make(chan storage.QueueItem, c.maxWorkers)

	// 启动任务生产者，每次拉取 5 个任务，确保任务队列优先处理新区块
	go c.taskProducer(ctx, taskCh, 5)

	sem := make(chan struct{}, c.maxWorkers)
	var wg sync.WaitGroup

loop:
	for task := range taskCh {
		select {
		case <-ctx.Done():
			break loop
		case sem <- struct{}{}:
			wg.Add(1)
			go func(task storage.QueueItem) {
				defer wg.Done()
				defer func() { <-sem }()

				select {
				case <-ctx.Done():
					return
				default:
				}

				blockHeight := task.BlockNum

				rawBlock, err := c.Endpoint.BlockByNumber(
					"Client.getBlock",
					ctx,
					new(big.Int).SetUint64(blockHeight),
				)

				if err != nil {
					if errors.Is(err, rate.ErrQuit) {
						return
					}
					if errors.Is(err, clientpool.ErrUnprocessed) {
						log.Printf("[%s](%d) No available client to process block, retry later", c.Name, blockHeight)
						time.Sleep(c.baseCooldown)
						return
					}

					// 失败：更新失败次数和冷却时间
					newFailureCount := task.FailureCount + 1
					cooldownDuration := c.baseCooldown * time.Duration(newFailureCount)
					nextRetryAt := time.Now().Add(cooldownDuration).Unix()

					log.Printf("[%s](%d) Get block failed (attempt %d): %v, cooldown: %v",
						c.Name, blockHeight, newFailureCount, err, cooldownDuration)

					if err := c.queueDB.MarkFailed(blockHeight, nextRetryAt); err != nil {
						log.Printf("[%s] Failed to mark block %d as failed: %v",
							c.Name, blockHeight, err)
					}

					return
				}

				// 成功：检测 reorg
				blockHash := rawBlock.Hash.Hex()
				parentHash := rawBlock.ParentHash.Hex()

				reorged, rollbackTo, err := c.queueDB.DetectAndHandleReorg(blockHeight, blockHash, parentHash)
				if err != nil {
					log.Printf("[%s](%d) Reorg detection failed: %v", c.Name, blockHeight, err)
				} else if reorged {
					log.Printf("[%s] Reorg handled: rolled back to block %d, re-processing from there",
						c.Name, rollbackTo)
					// 重组后，当前区块需要重新处理
					if err := c.queueDB.AddBlock(blockHeight, storage.PriorityNew); err != nil {
						log.Printf("[%s] Failed to re-add block %d after reorg: %v",
							c.Name, blockHeight, err)
					}
					return
				}

				// 保存区块哈希信息
				if err := c.queueDB.SaveProcessedBlock(blockHeight, blockHash, parentHash); err != nil {
					log.Printf("[%s](%d) Failed to save block hash: %v", c.Name, blockHeight, err)
				}

				// 发送区块
				ch <- Block{
					Timestamp: uint64(rawBlock.Timestamp),
					RawBlock:  rawBlock,
				}

				c.checkTransactionsInBlock(ctx, rawBlock)

				// 从队列删除
				if err := c.queueDB.RemoveBlock(blockHeight); err != nil {
					log.Printf("[%s] Failed to remove block %d: %v",
						c.Name, blockHeight, err)
				}

				if task.FailureCount > 0 {
					log.Printf("[%s](%d) Succeeded after %d failures",
						c.Name, blockHeight, task.FailureCount)
				}
			}(task)
		}
	}

	wg.Wait()
}

// 生产者：持续从数据库拉取任务
func (c *Client) taskProducer(ctx context.Context, taskCh chan<- storage.QueueItem, batchSize int) {
	minInterval := 100 * time.Millisecond
	maxInterval := 2 * time.Second
	currentInterval := minInterval
	emptyCount := 0

	ticker := time.NewTicker(currentInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			close(taskCh) // 关闭任务队列
			return
		case <-ticker.C:
			tasks, err := c.queueDB.GetTasks(batchSize)
			if err != nil {
				log.Printf("[%s] Failed to get tasks: %v", c.Name, err)
				continue
			}

			if len(tasks) == 0 {
				emptyCount++
				if emptyCount > 3 {
					newInterval := min(currentInterval*2, maxInterval)
					if newInterval != currentInterval {
						currentInterval = newInterval
						ticker.Reset(currentInterval)
						log.Printf("[%s] Queue empty, increasing poll interval to %v", c.Name, currentInterval)
					}
				}
				continue
			}

			// 有任务时，恢复最小间隔
			if currentInterval != minInterval {
				currentInterval = minInterval
				ticker.Reset(currentInterval)
				log.Printf("[%s] Tasks found, resetting poll interval to %v", c.Name, currentInterval)
			}
			emptyCount = 0

			// 将任务放入队列
			for _, task := range tasks {
				select {
				case taskCh <- task:
					// 成功放入
				case <-ctx.Done():
					return
				}
			}
		}
	}
}

func (c *Client) Subscribe(ctx context.Context) (<-chan Block, error) {
	if err := c.Init(ctx); err != nil {
		return nil, err
	}

	ch := make(chan Block, 10)

	ctx_, cancel := context.WithCancel(ctx)

	headerCh := make(chan *types.Header)
	go c.blockWorker(ctx_, ch, c.interval)

	// 定期检查链上最新高度，补充 WebSocket 可能遗漏的区块
	go c.periodicHeightCheck(ctx_)

	// 定期清理旧的已处理区块记录（保留最近 1000 个）
	go c.periodicCleanup(ctx_)

	go func() {
		for {
			select {
			case <-ctx_.Done():
				return
			case header, ok := <-headerCh:
				if !ok || header == nil {
					return
				}

				if len(c.L2) > 0 {
					var latestHeight_ uint64
					var err error
					for _, c2 := range c.L2 {
						if len(c2.monitorTxs) != 0 {
							if latestHeight_ == 0 {
								latestHeight_, err = c.Endpoint.BlockNumber("Support L2 chain confirmations", ctx_)
								if err != nil {
									log.Printf("[%s] Get L1 latest height failed: %v", c.Name, err)
								}
							}
							c2.triggerL2TransactionsMonitor(latestHeight_)
						}
					}
				}

				targetHeight := header.Number.ToInt().Uint64()
				currentHeight := c.queueDB.GetContinueFromBlock()

				if err := c.queueDB.AddBlockRange(currentHeight+1, targetHeight, storage.PriorityNew); err != nil {
					log.Printf("[%s] Failed to add block range %d-%d to queue: %v",
						c.Name, currentHeight+1, targetHeight, err)
				}
			}
		}
	}()

	go func() {
		defer cancel()
		defer close(ch)
		defer close(headerCh)
		for {
			select {
			case <-ctx.Done():
				return
			default:
				err := c.Endpoint.SubscribeBlock("Client.SubscribeBlock", ctx_, headerCh)
				if errors.Is(err, rate.ErrQuit) {
					return
				}
				// 未处理，说明没有可用的 wss 节点，尝试使用 rpc 轮询
				if errors.Is(err, clientpool.ErrUnprocessed) {
					latestHeader, err := c.Endpoint.HeaderByNumber("Polling Block Headers", ctx_, nil)
					if err != nil {
						if errors.Is(err, rate.ErrQuit) {
							return
						}
						log.Printf("[%s] Get latest header failed: %v", c.Name, err)
						c.Sleep()
						continue
					}
					headerCh <- &types.Header{
						Number: (*hexutil.Big)(latestHeader.Number),
					}
					c.Sleep()
				} else if err != nil {
					log.Printf("[%s] Subscribe block failed: %v", c.Name, err)
					c.Sleep()
					continue
				}
			}
		}
	}()

	return ch, nil
}

func (c *Client) triggerL2TransactionsMonitor(latestHeight uint64) {
	if c.L1 == nil {
		panic("L1 client is nil")
	}
	zero := (*hexutil.Big)(new(big.Int))
	for _, info := range c.monitorTxs {
		if info.height == 0 {
			continue
		}
		select {
		case info.ch <- TransactionStatus{Status: "confirmed", Confirmations: c.Confirmations(latestHeight, &types.Block{
			Number:        zero,
			L1BlockNumber: (*hexutil.Big)(big.NewInt(int64(info.l1Height))),
		})}:
		default:
			close(info.ch)
			delete(c.monitorTxs, info.txHash)
		}
	}
}

// periodicHeightCheck 定期检查链上最新高度，补充 WebSocket 可能遗漏的区块
// 这解决了 WebSocket 推送延迟导致的区块遗漏问题
func (c *Client) periodicHeightCheck(ctx context.Context) {
	ticker := time.NewTicker(c.heightCheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// 查询链上最新高度
			latestHeight, err := c.Endpoint.BlockNumber("Periodic height check", ctx)
			if err != nil {
				log.Printf("[%s] Periodic height check failed: %v", c.Name, err)
				continue
			}

			// 获取队列中的最大区块号
			currentHeight := c.queueDB.GetContinueFromBlock()

			// 计算差距
			if latestHeight > currentHeight {
				gap := latestHeight - currentHeight
				log.Printf("[%s] Height check: detected %d missing blocks (queue: %d, chain: %d), adding to queue",
					c.Name, gap, currentHeight, latestHeight)

				// 将遗漏的区块加入队列
				if err := c.queueDB.AddBlockRange(currentHeight+1, latestHeight, storage.PriorityNew); err != nil {
					log.Printf("[%s] Failed to add missing blocks %d-%d to queue: %v",
						c.Name, currentHeight+1, latestHeight, err)
				}
			} else if latestHeight < currentHeight {
				log.Printf("[%s] Height check: queue ahead of chain (queue: %d, chain: %d), possible reorg - verifying...",
					c.Name, currentHeight, latestHeight)

				// 验证最新的几个区块是否发生了 reorg
				// 从链上获取 currentHeight 区块，检查哈希是否匹配
				block, err := c.Endpoint.BlockByNumber("Verify reorg", ctx, (*big.Int)(big.NewInt(int64(currentHeight))))
				if err != nil {
					log.Printf("[%s] Failed to get block %d for reorg verification: %v",
						c.Name, currentHeight, err)
				} else {
					savedHash, _, err := c.queueDB.GetProcessedBlock(currentHeight)
					if err == nil && savedHash != block.Hash.Hex() {
						log.Printf("[%s] Reorg confirmed: block %d hash mismatch (saved: %s, chain: %s)",
							c.Name, currentHeight, savedHash, block.Hash.Hex())

						// 回滚到链上最新高度
						if err := c.queueDB.RollbackToBlock(latestHeight); err != nil {
							log.Printf("[%s] Failed to rollback to block %d: %v",
								c.Name, latestHeight, err)
						} else {
							log.Printf("[%s] Rolled back to block %d due to reorg",
								c.Name, latestHeight)
						}
					}
				}
			} else {
				log.Printf("[%s] Height check: no missing blocks detected (queue: %d, chain: %d)", c.Name, currentHeight, latestHeight)
			}
		}
	}
}

// periodicCleanup 定期清理旧的已处理区块记录
func (c *Client) periodicCleanup(ctx context.Context) {
	// 每小时清理一次
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// 保留最近 1000 个区块的记录（用于检测 reorg）
			if err := c.queueDB.CleanupOldProcessedBlocks(1000); err != nil {
				log.Printf("[%s] Failed to cleanup old processed blocks: %v", c.Name, err)
			} else {
				log.Printf("[%s] Cleaned up old processed blocks (kept recent 1000)", c.Name)
			}
		}
	}
}
