package main

import (
	"context"
	"encoding/json"
	"evm-scanner/client"
	"evm-scanner/config"
	"evm-scanner/parse"
	"evm-scanner/token"
	"evm-scanner/types"
	"fmt"
	"log"
	"math/big"
	"os"
	"strconv"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
)

func main() {
	var endpointIndex int
	var targetTxHash string
	var configFile = "config.yaml"
	var err error
	if len(os.Args) < 3 {
		fmt.Println("Usage: parse-tx <endpoint(index)> <target-tx-hash>")
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

	targetTxHash = os.Args[2]
	fmt.Println("Target tx hash:", targetTxHash)

	cfg, err := config.Load(configFile)
	if err != nil {
		fmt.Println("Failed to load config:", err)
		os.Exit(1)
	}
	tx, err := parseTx(cfg.Endpoints[endpointIndex], targetTxHash)
	if err != nil {
		fmt.Println("Failed to parse transaction:", err)
		os.Exit(1)
	}
	txJson, err := json.MarshalIndent(tx, "", "    ")
	if err != nil {
		fmt.Println("Failed to marshal transaction:", err)
		os.Exit(1)
	}
	fmt.Println(string(txJson))
}
func parseTx(node config.Endpoint, targetTxHash string) (*parse.Transaction, error) {
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		return nil, err
	}
	cacheDir += "/evm-scanner"
	_ = os.MkdirAll(cacheDir, 0755)
	defer os.RemoveAll(cacheDir)

	ctx := context.Background()
	c := client.NewClient(node, cacheDir, false, nil)
	if err := c.Init(ctx); err != nil {
		return nil, err
	}
	hash := common.Hash(hexutil.MustDecode(targetTxHash))

	raw_tx, isPending, err := c.Endpoint.TransactionByHash("", ctx, hash)
	if err != nil {
		return nil, err
	}
	if isPending {
		return nil, fmt.Errorf("Transaction is pending")
	}

	receipt, err := c.Endpoint.TransactionReceipt("", ctx, hash)
	if err != nil {
		return nil, err
	}

	header, err := c.Endpoint.HeaderByNumber("", ctx, receipt.BlockNumber.ToInt())
	if err != nil {
		return nil, err
	}

	var provider = new(Provider)
	provider.c = c
	provider.tokenManager = token.NewManager(provider, cacheDir)

	tx, err := parse.Parse(ctx, provider, uint64(header.Time), raw_tx, nil)
	if err != nil {
		return nil, err
	}
	return tx, nil
}

type Provider struct {
	c            *client.Client
	tokenManager *token.Manager
}

func (p *Provider) GetClient() *client.Endpoint {
	return &p.c.Endpoint
}

func (p *Provider) ChainId() *big.Int {
	return p.c.ChainId
}

func (p *Provider) GetReceipt(_ string, ctx context.Context, hash common.Hash) (*types.Receipt, error) {
	return p.c.Endpoint.TransactionReceipt("", ctx, hash)
}

func (p *Provider) GetToken(ctx context.Context, standard string, address common.Address) (*token.Info, error) {
	return p.tokenManager.GetInfo(ctx, standard, address)
}

func (p *Provider) Origin() string {
	return "Test ParseTx"
}

func (s *Provider) TraceTransaction(_ string, ctx context.Context, txHash common.Hash) *types.TraceFrame {
	t, err := s.c.Endpoint.TraceTransaction("", ctx, txHash)
	if err != nil {
		log.Printf("[%s] Trace transaction failed: %v", "Test ParseTx", err)
	}
	return t
}

var _ parse.Provider = &Provider{}
