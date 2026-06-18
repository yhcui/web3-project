package main

import (
	"context"
	"errors"
	"evm-scanner/config"
	"evm-scanner/gateway"
	_ "evm-scanner/parse"
	"evm-scanner/pkg/logger"
	"evm-scanner/scanner"
	"evm-scanner/service"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

var configFile string
var cacheDir = "cache"

const tokenDiscoveryMaxConcurrent = 8

func main() {
	flag.StringVar(&configFile, "c", "./config.yaml", "config file path")
	flag.Parse()

	if err := os.MkdirAll(cacheDir, 0755); err != nil && !errors.Is(err, os.ErrExist) {
		fmt.Printf("Failed to create cache directory [%s]: %v\n", cacheDir, err)
		return
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load(configFile)
	if err != nil {
		fmt.Printf("Failed to load config file: %v\n", err)
		return
	}

	// 初始化日志
	logger.Init(cfg.Log)

	filter := scanner.Filter{}
	if cfg.SkipCatchUp {
		logger.Info().Msg("skip_catch_up=true, will start from latest block on restart")
	}
	app, err := NewApp(cacheDir, cfg.SkipCatchUp, &filter)
	if err != nil {
		logger.Error().Err(err).Msg("failed to initialize app")
		return
	}

	// 初始化 Endpoints
	for _, endpoint := range cfg.Endpoints {
		app.Add(endpoint)
	}
	// 配置 L2 网络
	for _, endpoint := range cfg.Endpoints {
		if endpoint.L1 == "" {
			continue
		}
		l1 := app.GetScannerByName(endpoint.L1)
		if l1 == nil {
			logger.Fatal().Str("endpoint", endpoint.Name).Str("l1", endpoint.L1).Msg("cannot find L1 endpoint")
		}
		l2 := app.GetScannerByName(endpoint.Name)
		if l2 == nil {
			logger.Fatal().Str("endpoint", endpoint.Name).Str("l1", endpoint.L1).Msg("cannot find L2 endpoint")
		}
		l2.Client.L1 = l1.Client
		l1.Client.L2 = append(l1.Client.L2, l2.Client)
	}

	for _, s := range app.Scanners {
		s.Client.Endpoint.StartHealthCheck(10 * time.Second)
	}
	defer func() {
		for _, s := range app.Scanners {
			s.Client.Endpoint.StopHealthCheck()
		}
	}()

	service.Start(ctx, cfg.ServerAddress, app.Scanners, cfg.EtherscanApiKey, cfg.EtherscanApiPRS, app)

	// 初始化 Gateway 客户端
	if cfg.Gateway.Enabled {
		gatewayClient := gateway.NewClient(gateway.Config{
			Enabled:           cfg.Gateway.Enabled,
			URL:               cfg.Gateway.URL,
			ReconnectInterval: time.Duration(cfg.Gateway.ReconnectInterval) * time.Millisecond,
			PingInterval:      time.Duration(cfg.Gateway.PingInterval) * time.Millisecond,
		}, "evm", "1.0.0")

		// 设置订阅回调
		gatewayClient.SetSubscribeHandler(
			func(addresses []string) {
				// 订阅地址：需要匹配 from=addr OR to=addr
				for _, addr := range addresses {
					addr = strings.ToLower(strings.TrimSpace(addr))
					if addr == "" {
						continue
					}
					filter.Add(addr+":from", scanner.FilterArgs{From: addr, To: ""})
					filter.Add(addr+":to", scanner.FilterArgs{From: "", To: addr})
					fmt.Printf("[Gateway] 订阅地址: %s\n", addr)
				}
			},
			func(addresses []string) {
				for _, addr := range addresses {
					addr = strings.ToLower(strings.TrimSpace(addr))
					if addr == "" {
						continue
					}
					filter.Remove(addr + ":from")
					filter.Remove(addr + ":to")
					fmt.Printf("[Gateway] 取消订阅: %s\n", addr)
				}
			},
		)
		gatewayClient.SetSyncHandler(func(addresses []string) {
			filter.Clear()
			for _, addr := range addresses {
				addr = strings.ToLower(strings.TrimSpace(addr))
				if addr == "" {
					continue
				}
				filter.Add(addr+":from", scanner.FilterArgs{From: addr, To: ""})
				filter.Add(addr+":to", scanner.FilterArgs{From: "", To: addr})
			}
			fmt.Printf("[Gateway] 全量同步完成: %d\n", len(addresses))
		})

		historyProviders := make([]service.HistoryProvider, 0, 2)
		if strings.TrimSpace(cfg.EtherscanApiKey) != "" {
			historyProviders = append(historyProviders, service.NewEtherscanClient(cfg.EtherscanApiKey, cfg.EtherscanApiPRS))
		}
		if len(cfg.HistoryFallback.BlockscoutHosts) > 0 {
			historyProviders = append(historyProviders, service.NewBlockscoutClient(cfg.HistoryFallback.BlockscoutHosts, cfg.HistoryFallback.BlockscoutPRS))
		}
		if len(historyProviders) == 0 {
			fmt.Printf("[Backfill] history providers disabled: no etherscan_api_key and no history_fallback.blockscout_hosts\n")
		} else {
			names := make([]string, 0, len(historyProviders))
			for _, provider := range historyProviders {
				if provider == nil {
					continue
				}
				names = append(names, provider.Name())
			}
			fmt.Printf("[Backfill] history providers enabled: %s\n", strings.Join(names, ","))
		}

		discoverySem := make(chan struct{}, tokenDiscoveryMaxConcurrent)
		gatewayClient.SetTokenDiscoveryHandler(func(task gateway.TokenDiscoveryTask) {
			select {
			case discoverySem <- struct{}{}:
			default:
				resp := gateway.TokenDiscoveryResult{
					RequestID: strings.TrimSpace(task.RequestID),
					Backend:   "scanner-evm-busy",
					Tokens:    []gateway.TokenDiscoveryToken{},
					Error:     fmt.Sprintf("token discovery busy: max_concurrency=%d", tokenDiscoveryMaxConcurrent),
				}
				if resp.RequestID == "" {
					fmt.Printf("[Gateway] skip overloaded token discovery task: empty request id\n")
					return
				}
				if err := gatewayClient.SendTokenDiscoveryResult(resp); err != nil {
					fmt.Printf("[Gateway] failed to send token discovery busy result: request_id=%s error=%v\n", task.RequestID, err)
				}
				return
			}
			go func(task gateway.TokenDiscoveryTask) {
				defer func() { <-discoverySem }()
				resp := gateway.TokenDiscoveryResult{
					RequestID: strings.TrimSpace(task.RequestID),
					Backend:   "scanner-evm-error",
					Tokens:    []gateway.TokenDiscoveryToken{},
				}
				if resp.RequestID == "" {
					fmt.Printf("[Gateway] skip token discovery task: empty request id\n")
					return
				}

				req := scanner.DiscoveryRequest{
					Chain:   strings.ToLower(strings.TrimSpace(task.Chain)),
					Address: strings.ToLower(strings.TrimSpace(task.Address)),
				}
				if len(task.Candidates) > 0 {
					req.Candidates = make([]scanner.DiscoveryCandidate, 0, len(task.Candidates))
					for _, item := range task.Candidates {
						req.Candidates = append(req.Candidates, scanner.DiscoveryCandidate{
							ContractAddress: strings.ToLower(strings.TrimSpace(item.ContractAddress)),
							Symbol:          strings.TrimSpace(item.Symbol),
							MarketCapRank:   item.MarketCapRank,
						})
					}
				}

				discovery, err := app.DiscoverTokenBalances(ctx, req)
				if err != nil {
					resp.Error = err.Error()
				} else if discovery != nil {
					resp.Backend = discovery.Backend
					resp.CheckedCandidates = discovery.CheckedCandidates
					resp.RPCRequests = discovery.RPCRequests
					resp.Tokens = make([]gateway.TokenDiscoveryToken, 0, len(discovery.Tokens))
					for _, token := range discovery.Tokens {
						resp.Tokens = append(resp.Tokens, gateway.TokenDiscoveryToken{
							TokenContract: token.TokenContract,
							TokenSymbol:   token.TokenSymbol,
							TokenDecimals: token.TokenDecimals,
							Balance:       token.Balance,
							MarketCapRank: token.MarketCapRank,
						})
					}
				}

				if err := gatewayClient.SendTokenDiscoveryResult(resp); err != nil {
					fmt.Printf("[Gateway] failed to send token discovery result: request_id=%s error=%v\n", task.RequestID, err)
				}
			}(task)
		})

		// 从 scanners 收集实际链名，用于 register
		chains := make([]string, 0, len(app.Scanners))
		for _, sc := range app.Scanners {
			origin := sc.Origin()
			if origin != "" {
				chains = append(chains, origin)
			}
		}
		if len(chains) > 0 {
			gatewayClient.SetChains(chains)
		}

		gatewayClient.Start(ctx)
		app.RegisterHandler(gatewayClient.NewHandler(&filter))
		fmt.Printf("[Gateway] EVM Scanner connected to: %s\n", cfg.Gateway.URL)
	}

	go func() {
		ticker := time.NewTicker(time.Minute)
		defer ticker.Stop()
		startTime := time.Now().Format("2006-01-02 15:04:05")

		var prevStats AllStats

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				stats, nextPrevStats := CollectStats(app.Scanners, prevStats)
				prevStats = nextPrevStats
				fmt.Println(FormatStats(stats, startTime))
			}
		}
	}()

	app.Start(ctx)

	<-ctx.Done()

	fmt.Println("Shutting down gracefully...")
	for _, scanner := range app.Scanners {
		chainID := scanner.ChainId()
		if chainID == nil || chainID.Sign() == 0 {
			fmt.Printf("Skip token cache flush: scanner chain id is not ready (name=%s)\n", scanner.Name)
			continue
		}
		err := scanner.TokenManager.WriteCacheToFile()
		if err != nil {
			fmt.Printf("Failed to marshal token cache: chain_id=%s, err=%v\n", chainID.String(), err)
		}
	}

	app.Close()
}
