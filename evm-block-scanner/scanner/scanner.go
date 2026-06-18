package scanner

import (
	"context"
	"errors"
	"evm-scanner/client"
	"evm-scanner/common/rate"
	"evm-scanner/config"
	"evm-scanner/parse"
	"evm-scanner/token"
	"evm-scanner/types"
	"fmt"
	"log"
	"math/big"
	"runtime/debug"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/ethereum/go-ethereum/common"
)

type Scanner struct {
	Client                   *client.Client
	Name                     string
	Chain                    string
	filter                   *Filter
	TokenManager             *token.Manager
	discoveryMulticallBatch  int
	discoveryFallbackWorkers int
}

func (s *Scanner) Start(ctx context.Context, ch chan<- *parse.Transaction) {
	for {
		blockCh, err := s.Client.Subscribe(ctx)
		if err != nil {
			log.Printf("[%s] Subscribe failed: %v", s.Name, err)
			if !waitContext(ctx, 3*time.Second) {
				return
			}
			continue
		}

		reconnect := false
		for {
			if reconnect {
				break
			}
			select {
			case <-ctx.Done():
				return
			case block, ok := <-blockCh:
				if !ok {
					log.Printf("[%s] block subscription closed, reconnecting", s.Name)
					reconnect = true
					continue
				}
				height := block.Number()
				if height == nil || block.RawBlock == nil {
					log.Printf("[%s] skip invalid block payload", s.Name)
					continue
				}
				heightNum := height.Uint64()
				timestamp := block.Timestamp
				transactions := block.RawTransactions()
				totalTransactions := len(transactions)
				if totalTransactions == 0 {
					continue
				}

				// 收集所有被监听的地址（用于 bloom filter）
				watchedAddrs := s.filter.WatchedAddresses()

				// === 第一层：from/to 快速匹配（零开销）===
				var directMatch []*types.Transaction
				var needDeepCheck []*types.Transaction
				for i := range transactions {
					tx := &transactions[i]
					from := strings.ToLower(tx.From.Hex())
					matched := s.filter.ShouldProcess(FilterArgs{From: from})
					if !matched && tx.To != nil {
						to := strings.ToLower(tx.To.Hex())
						matched = s.filter.ShouldProcess(FilterArgs{To: to})
					}
					if matched {
						directMatch = append(directMatch, tx)
					} else {
						needDeepCheck = append(needDeepCheck, tx)
					}
				}

				// === 第二层：bloom filter 预判 ===
				var bloomMatch []*types.Transaction
				if len(needDeepCheck) > 0 && len(watchedAddrs) > 0 {
					receipts, err := s.Client.Endpoint.BlockReceipts("Bloom filter pre-check", ctx, height)
					if err != nil {
						// 降级：BlockReceipts 失败时只处理 directMatch，不跳过整个区块
						log.Printf("[%s](%d) BlockReceipts failed, degrading to directMatch only (%d txs): %v",
							s.Name, heightNum, len(directMatch), err)
					} else {
						receiptMap := make(map[uint]*types.Receipt, len(receipts))
						for _, r := range receipts {
							receiptMap[uint(r.TransactionIndex)] = r
						}
						// 为 directMatch 也挂上预取的 receipt
						for _, tx := range directMatch {
							if tx.TransactionIndex != nil {
								tx.Receipt = receiptMap[uint(*tx.TransactionIndex)]
							}
						}
						// bloom filter 筛选 needDeepCheck
						for _, tx := range needDeepCheck {
							if tx.TransactionIndex == nil {
								continue
							}
							r := receiptMap[uint(*tx.TransactionIndex)]
							if r != nil && s.filter.ReceiptMayContainWatchedAddress(r.Bloom, watchedAddrs) {
								tx.Receipt = r
								bloomMatch = append(bloomMatch, tx)
							}
						}
					}
				}

				// 合并候选交易
				candidates := make([]*types.Transaction, 0, len(directMatch)+len(bloomMatch))
				candidates = append(candidates, directMatch...)
				candidates = append(candidates, bloomMatch...)

				if len(candidates) == 0 {
					log.Printf("[%s](%d) Processed block: total=%d matched=0 in 0.0 seconds",
						s.Name, heightNum, totalTransactions)
					continue
				}

				wg := sync.WaitGroup{}
				blockStart := time.Now()
				var matchedCount int64
				var successCount int64
				var failedCount int64
				for _, txPtr := range candidates {
					wg.Add(1)
					go func(wg *sync.WaitGroup, tx_ types.Transaction) {
						defer wg.Done()
						defer func() {
							if r := recover(); r != nil {
								msg := fmt.Sprintf("[%s](%d) Recovered from panic: %v\n", s.Name, r, heightNum)
								msg += "Tx_Hash: " + tx_.Hash.Hex() + "\n"
								msg += string(debug.Stack())
								log.Println(msg)
							}
						}()
						tx, err := parse.Parse(ctx, s, timestamp, &tx_, block.BaseFee())
						if err != nil {
							if errors.Is(err, rate.ErrQuit) {
								return
							}
							atomic.AddInt64(&failedCount, 1)
							log.Printf("[%s](%d) Parse tx %s failed: %v", s.Name, heightNum, tx_.Hash.Hex(), err)
							return
						}

						// === 第三层：精确过滤（消除 bloom 假阳性）===
						if !s.filter.ShouldProcessParsedTx(tx) {
							return
						}

						atomic.AddInt64(&matchedCount, 1)
						atomic.AddInt64(&successCount, 1)
						select {
						case <-ctx.Done():
							return
						case ch <- tx:
						}
					}(&wg, *txPtr)
				}
				go func(wg *sync.WaitGroup, height uint64, total int) {
					wg.Wait()
					log.Printf("[%s](%d) Processed block: total=%d candidates=%d matched=%d parsed=%d failed=%d in %.1f seconds",
						s.Name,
						height,
						total,
						len(candidates),
						atomic.LoadInt64(&matchedCount),
						atomic.LoadInt64(&successCount),
						atomic.LoadInt64(&failedCount),
						time.Since(blockStart).Seconds(),
					)
				}(&wg, heightNum, totalTransactions)
			}
		}
		if !waitContext(ctx, 500*time.Millisecond) {
			return
		}
	}
}

func (s *Scanner) Close() {
	s.Client.Close()
}

func waitContext(ctx context.Context, d time.Duration) bool {
	if d <= 0 {
		return true
	}
	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}

func NewScanner(cfg config.Endpoint, cacheDir string, skipCatchUp bool, filter *Filter) *Scanner {
	s := &Scanner{
		Name:                     cfg.Name,
		Chain:                    strings.ToLower(strings.TrimSpace(cfg.Chain)),
		filter:                   filter,
		discoveryMulticallBatch:  cfg.MulticallBatchSize,
		discoveryFallbackWorkers: cfg.DiscoveryWorkers,
	}
	s.TokenManager = token.NewManager(s, cacheDir)
	s.Client = client.NewClient(cfg, cacheDir, skipCatchUp, func() {
		n, err := s.TokenManager.ReadCacheFromFile()
		if err != nil {
			log.Printf("[%s] Failed to read token cache: chain_id: %d, error: %v\n", s.Name, s.ChainId(), err)
		} else {
			log.Printf("[%s] Succeed to read token cache: chain_id: %d tokens: %d\n", s.Name, s.ChainId(), n)
		}
	})
	return s
}

var _ parse.Provider = &Scanner{}

// implements parse.Provider.
func (s *Scanner) ChainId() *big.Int {
	return s.Client.ChainId
}

func (s *Scanner) GetReceipt(why string, ctx context.Context, hash common.Hash) (*types.Receipt, error) {
	return s.Client.Endpoint.TransactionReceipt(why, ctx, hash)
}

func (s *Scanner) GetToken(ctx context.Context, standard string, address common.Address) (*token.Info, error) {
	return s.TokenManager.GetInfo(ctx, standard, address)
}

func (s *Scanner) Origin() string {
	if s.Chain != "" {
		return s.Chain
	}
	if s.Client != nil && s.Client.ChainId != nil {
		if name := chainNameFromID(s.Client.ChainId.Uint64()); name != "" {
			return name
		}
	}
	return strings.ToLower(s.Name)
}

func (s *Scanner) TraceTransaction(why string, ctx context.Context, txHash common.Hash) *types.TraceFrame {
	t, err := s.Client.Endpoint.TraceTransaction(why, ctx, txHash)
	if err != nil {
		log.Printf("[%s] Trace transaction failed: %v", s.Name, err)
	}
	return t
}

var _ token.Provider = &Scanner{}

func (s *Scanner) GetClient() *client.Endpoint {
	return &s.Client.Endpoint
}

func (s *Scanner) GetRawClient() *client.Client {
	return s.Client
}

// ParseTransactionByHash 通过交易哈希和区块号解析交易
// blockNumber: 交易所在的区块号，用于获取区块头信息（timestamp 和 baseFee）
func (s *Scanner) ParseTransactionByHash(ctx context.Context, txHash common.Hash, blockNumber *big.Int) (*parse.Transaction, error) {
	// 1. 获取原始交易
	rawTx, isPending, err := s.Client.Endpoint.TransactionByHash("ParseTransactionByHash", ctx, txHash)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}
	if isPending {
		return nil, fmt.Errorf("transaction is pending")
	}

	// 2. 获取区块头（使用传入的 blockNumber，获取 timestamp 和 baseFee）
	header, err := s.Client.Endpoint.HeaderByNumber("ParseTransactionByHash", ctx, blockNumber)
	if err != nil {
		return nil, fmt.Errorf("failed to get block header: %w", err)
	}

	// 3. 解析交易
	var baseFee *big.Int
	if header.BaseFee != nil {
		baseFee = header.BaseFee.ToInt()
	}
	return parse.Parse(ctx, s, uint64(header.Time), rawTx, baseFee)
}
