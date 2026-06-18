package main

import (
	"context"
	"evm-scanner/client"
	"evm-scanner/config"
	"evm-scanner/parse"
	"evm-scanner/scanner"
	"evm-scanner/service"
	"evm-scanner/storage"
	"evm-scanner/token"
	"fmt"
	"log"
	"runtime/debug"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/google/uuid"
)

// 定义处理函数类型，或者使用接口
type HandlerFunc func(msg *parse.Transaction)

type App struct {
	Scanners    []*scanner.Scanner
	backfillDB  *storage.BackfillDB
	handlers    []HandlerFunc
	ch          chan *parse.Transaction
	cacheDir    string
	filter      *scanner.Filter
	skipCatchUp bool
}

// GetToken implements service.Provider.
func (s *App) GetTokenByChainID(chainID uint64, address common.Address) *token.Info {
	for _, s := range s.Scanners {
		if s.ChainId().Uint64() == chainID {
			ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(time.Second*3))
			defer cancel()
			token, _ := s.GetToken(ctx, parse.ERC20.String(), address)
			return token
		}
	}
	return nil
}

// GetEndpointByChainID implements service.Provider.
func (s *App) GetEndpointByChainID(chainID uint64) *client.Endpoint {
	for _, s := range s.Scanners {
		if s.ChainId().Uint64() == chainID {
			return &s.Client.Endpoint
		}
	}
	return nil
}

func (s *App) GetScannerByName(name string) *scanner.Scanner {
	for _, s := range s.Scanners {
		if s.Name == name {
			return s
		}
	}
	return nil
}

// Origin implements service.Provider.
func (s *App) Origin() string {
	return "evm-scanner"
}

// GetScannerByChainID implements service.Provider.
func (s *App) GetScannerByChainID(chainID uint64) *scanner.Scanner {
	for _, s := range s.Scanners {
		if s.ChainId().Uint64() == chainID {
			return s
		}
	}
	return nil
}

var _ service.Provider = &App{}

func NewApp(cacheDir string, skipCatchUp bool, filter *scanner.Filter) (*App, error) {
	backfillDB, err := storage.NewBackfillDB(cacheDir + "/backfill.db")
	if err != nil {
		return nil, err
	}

	return &App{
		Scanners:    make([]*scanner.Scanner, 0),
		backfillDB:  backfillDB,
		handlers:    make([]HandlerFunc, 0),
		ch:          make(chan *parse.Transaction, 1024),
		cacheDir:    cacheDir,
		filter:      filter,
		skipCatchUp: skipCatchUp,
	}, nil
}

func (s *App) Close() {
	s.backfillDB.Close()
	for _, sc := range s.Scanners {
		sc.Close()
	}
}

// RegisterHandler 添加处理逻辑
func (s *App) RegisterHandler(h HandlerFunc) {
	s.handlers = append(s.handlers, h)
}

func (s *App) Add(cfg config.Endpoint) string {
	id := uuid.New().String()
	newScanner := scanner.NewScanner(cfg, s.cacheDir, s.skipCatchUp, s.filter)
	s.Scanners = append(s.Scanners, newScanner)
	return id
}

func (s *App) Start(ctx context.Context) {
	// 1. 启动所有扫描器（生产者）
	for _, sc := range s.Scanners {
		go sc.Start(ctx, s.ch)
	}

	// 2. 启动消费者处理器
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case msg := <-s.ch:
				// 遍历所有注册的 handler 处理这笔交易
				for _, handler := range s.handlers {
					h := handler
					go func(m *parse.Transaction) {
						defer func() {
							if r := recover(); r != nil {
								// 打印错误堆栈，方便排查是哪个 handler 出问题了
								log.Printf("[Panic] Handler recovered from panic: %v\nHash: %s\nStack: %s",
									r, m.Hash, string(debug.Stack()))
							}
						}()
						h(m)
					}(msg)
				}
			}
		}
	}()
}

func (s *App) DiscoverTokenBalances(ctx context.Context, req scanner.DiscoveryRequest) (*scanner.DiscoveryResult, error) {
	target := s.pickScanner(req.Chain)
	if target == nil {
		return nil, fmt.Errorf("scanner not found for chain=%s", strings.TrimSpace(req.Chain))
	}
	req.Chain = normalizeDiscoveryChain(req.Chain)
	if req.Chain == "" || req.Chain == "evm" {
		req.Chain = normalizeDiscoveryChain(target.Origin())
	}
	return target.DiscoverTokenBalances(ctx, req)
}

func (s *App) pickScanner(chain string) *scanner.Scanner {
	if len(s.Scanners) == 0 {
		return nil
	}
	target := normalizeDiscoveryChain(chain)
	if target == "" {
		return s.Scanners[0]
	}
	if target == "evm" {
		return s.Scanners[0]
	}

	for _, sc := range s.Scanners {
		if sc == nil {
			continue
		}
		if normalizeDiscoveryChain(sc.Origin()) == target {
			return sc
		}
		if normalizeDiscoveryChain(sc.Chain) == target {
			return sc
		}
	}
	return nil
}

func normalizeDiscoveryChain(chain string) string {
	c := strings.ToLower(strings.TrimSpace(chain))
	switch c {
	case "ethereum":
		return "eth"
	case "bnb", "bnbchain", "binance-smart-chain", "binance smart chain":
		return "bsc"
	case "arbitrum":
		return "arb"
	case "optimism":
		return "op"
	case "matic":
		return "polygon"
	}
	return c
}
