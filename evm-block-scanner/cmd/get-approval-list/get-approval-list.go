package main

import (
	"context"
	"encoding/json"
	"evm-scanner/client"
	"evm-scanner/config"
	"evm-scanner/scanner"
	"evm-scanner/service"
	"evm-scanner/token"
	"fmt"
	"math/big"
	"os"
	"strconv"

	"github.com/ethereum/go-ethereum/common"
)

func main() {
	var endpointIndex int
	var targetAddress string
	var configFile = "config.yaml"
	var err error

	if len(os.Args) < 3 {
		fmt.Println("Usage: scan-approval <endpoint(index)> <target-address> [config-file]")
		os.Exit(1)
	}
	if len(os.Args) > 3 {
		configFile = os.Args[3]
	}

	endpointIndex, err = strconv.Atoi(os.Args[1])
	if err != nil {
		fmt.Println("Invalid endpoint index:", os.Args[1])
		os.Exit(1)
	}

	targetAddress = os.Args[2]
	if !common.IsHexAddress(targetAddress) {
		fmt.Println("Invalid EVM address:", targetAddress)
		os.Exit(1)
	}

	cfg, err := config.Load(configFile)
	if err != nil {
		fmt.Println("Failed to load config:", err)
		os.Exit(1)
	}

	// 执行扫描逻辑
	results, err := runScan(cfg.Endpoints[endpointIndex], cfg.EtherscanApiKey, common.HexToAddress(targetAddress))
	if err != nil {
		fmt.Println("Failed to scan approvals:", err)
		os.Exit(1)
	}

	// 输出 JSON
	resJson, _ := json.MarshalIndent(results, "", "    ")
	fmt.Println(string(resJson))
}

func runScan(node config.Endpoint, apiKey string, address common.Address) ([]service.ApprovalLog, error) {
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		return nil, err
	}
	cacheDir += "/evm-scanner-approval"
	_ = os.MkdirAll(cacheDir, 0755)

	ctx := context.Background()
	c := client.NewClient(node, cacheDir, false, nil)
	if err := c.Init(ctx); err != nil {
		return nil, err
	}
	cli := service.NewEtherscanClient(apiKey, 3)

	// 构造 Provider
	p := &ApprovalProvider{
		c: c,
	}
	p.tokenManager = token.NewManager(p, cacheDir)

	return service.FindApprovalList(p, cli, c.ChainId.Uint64(), address)
}

// ApprovalProvider 适配 service.ApprovalListProvider 接口
type ApprovalProvider struct {
	c            *client.Client
	tokenManager *token.Manager
}

// GetEndpointByChainID implements [service.Provider].
func (p *ApprovalProvider) GetEndpointByChainID(chainID uint64) *client.Endpoint {
	panic("unimplemented")
}

// GetScannerByChainID implements [service.Provider].
func (p *ApprovalProvider) GetScannerByChainID(chainID uint64) *scanner.Scanner {
	panic("unimplemented")
}

// GetTokenByChainID implements service.ApprovalListProvider.
func (p *ApprovalProvider) GetTokenByChainID(chainID uint64, address common.Address) *token.Info {
	return nil
}

// Origin implements token.Provider.
func (p *ApprovalProvider) Origin() string {
	return "Test Provider"
}

func (p *ApprovalProvider) GetClient() *client.Endpoint { return &p.c.Endpoint }
func (p *ApprovalProvider) ChainId() *big.Int           { return p.c.ChainId }
