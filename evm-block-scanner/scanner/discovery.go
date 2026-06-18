package scanner

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"evm-scanner/client"
	"evm-scanner/parse"
	"evm-scanner/token"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
)

type DiscoveryCandidate struct {
	ContractAddress string
	Symbol          string
	MarketCapRank   int64
}

type DiscoveryRequest struct {
	Chain      string
	Address    string
	Candidates []DiscoveryCandidate
}

type DiscoveryToken struct {
	TokenContract string
	TokenSymbol   string
	TokenDecimals int
	Balance       string
	MarketCapRank int64
}

type DiscoveryResult struct {
	Backend           string
	CheckedCandidates int64
	RPCRequests       int64
	Tokens            []DiscoveryToken
}

type normalizedDiscoveryCandidate struct {
	ContractAddress common.Address
	ContractHex     string
	Symbol          string
	MarketCapRank   int64
}

const (
	discoveryRPCTimeout       = 2 * time.Second
	discoveryMulticallTimeout = 6 * time.Second
	defaultDiscoveryWorkers   = 32
	defaultMulticallBatchSize = 1000
	maxMulticallBatchSize     = 2000
	multicall3AddressHex      = "0xcA11bde05977b3631167028862bE2a173976CA11"
)

const multicall3ABIJSON = `[
	{
		"inputs":[
			{"internalType":"bool","name":"requireSuccess","type":"bool"},
			{
				"components":[
					{"internalType":"address","name":"target","type":"address"},
					{"internalType":"bytes","name":"callData","type":"bytes"}
				],
				"internalType":"struct Multicall3.Call[]",
				"name":"calls",
				"type":"tuple[]"
			}
		],
		"name":"tryAggregate",
		"outputs":[
			{
				"components":[
					{"internalType":"bool","name":"success","type":"bool"},
					{"internalType":"bytes","name":"returnData","type":"bytes"}
				],
				"internalType":"struct Multicall3.Result[]",
				"name":"returnData",
				"type":"tuple[]"
			}
		],
		"stateMutability":"view",
		"type":"function"
	}
]`

type multicall3Call struct {
	Target   common.Address
	CallData []byte
}

type multicall3Result struct {
	Success    bool
	ReturnData []byte
}

var (
	multicall3Address = common.HexToAddress(multicall3AddressHex)
	multicall3ABIOnce sync.Once
	multicall3ABIInst abi.ABI
	multicall3ABIErr  error
)

func (s *Scanner) DiscoverTokenBalances(ctx context.Context, req DiscoveryRequest) (*DiscoveryResult, error) {
	if s == nil {
		return nil, fmt.Errorf("scanner is nil")
	}
	addrHex := strings.ToLower(strings.TrimSpace(req.Address))
	if !common.IsHexAddress(addrHex) {
		return nil, fmt.Errorf("invalid discovery address")
	}
	owner := common.HexToAddress(addrHex)

	chain := strings.ToLower(strings.TrimSpace(req.Chain))
	if chain == "" {
		chain = strings.ToLower(strings.TrimSpace(s.Origin()))
	}

	result := &DiscoveryResult{
		Backend: "scanner-evm-" + chain,
		Tokens:  make([]DiscoveryToken, 0, len(req.Candidates)+1),
	}

	candidates := normalizeDiscoveryCandidates(req.Candidates)
	result.CheckedCandidates = int64(len(candidates))
	if len(candidates) > 0 {
		if err := s.discoverERC20Balances(ctx, chain, owner, candidates, result); err != nil {
			return nil, err
		}
	}
	s.appendNativeToken(ctx, chain, owner, result)
	sortDiscoveryTokens(result.Tokens)
	return result, nil
}

func (s *Scanner) discoverERC20Balances(ctx context.Context, chain string, owner common.Address, candidates []normalizedDiscoveryCandidate, result *DiscoveryResult) error {
	batchSize := s.discoveryMulticallBatch
	if batchSize <= 0 {
		batchSize = defaultMulticallBatchSize
	}
	if batchSize > maxMulticallBatchSize {
		batchSize = maxMulticallBatchSize
	}

	fallbackBatches := 0
	for start := 0; start < len(candidates); start += batchSize {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		end := start + batchSize
		if end > len(candidates) {
			end = len(candidates)
		}
		batch := candidates[start:end]

		if err := s.discoverERC20BalancesWithMulticall(ctx, owner, batch, result); err != nil {
			fallbackBatches++
			log.Printf("[Discovery] multicall batch failed, fallback balanceOf: chain=%s address=%s batch_start=%d batch_end=%d batch_size=%d error=%v",
				chain, owner.Hex(), start, end, len(batch), err)
			if fallbackErr := s.discoverERC20BalancesFallback(ctx, owner, batch, result); fallbackErr != nil {
				return fmt.Errorf("multicall batch failed(start=%d,end=%d): %v; fallback failed: %w", start, end, err, fallbackErr)
			}
		}
	}

	if fallbackBatches > 0 {
		log.Printf("[Discovery] token discovery completed with fallback: chain=%s address=%s candidates=%d batch_size=%d fallback_batches=%d rpc_requests=%d",
			chain, owner.Hex(), len(candidates), batchSize, fallbackBatches, result.RPCRequests)
	}
	return nil
}

func (s *Scanner) discoverERC20BalancesWithMulticall(ctx context.Context, owner common.Address, candidates []normalizedDiscoveryCandidate, result *DiscoveryResult) error {
	callData, err := encodeMulticallTryAggregate(owner, candidates)
	if err != nil {
		return err
	}

	callCtx, cancel := context.WithTimeout(ctx, discoveryMulticallTimeout)
	defer cancel()
	var out []byte
	err = s.Client.Endpoint.Call(func(c *client.Wrapped, e *error) {
		if err := c.WaitLimit(callCtx, "token_discovery_multicall", "eth_call"); err != nil {
			*e = err
			return
		}

		msg := ethereum.CallMsg{
			To:   &multicall3Address,
			Data: callData,
		}
		out, err = c.CallContract(callCtx, msg, nil)
		atomic.AddInt64(&result.RPCRequests, 1)
		if err != nil {
			*e = err
			return
		}
	})
	if err != nil {
		return err
	}
	callResults, err := decodeMulticallTryAggregate(out)
	if err != nil {
		return err
	}
	if len(callResults) != len(candidates) {
		return fmt.Errorf("unexpected multicall result size: got=%d want=%d", len(callResults), len(candidates))
	}

	for i, callResult := range callResults {
		if !callResult.Success || len(callResult.ReturnData) == 0 {
			continue
		}
		balance := new(big.Int).SetBytes(callResult.ReturnData)
		if token, ok := s.toDiscoveryToken(ctx, candidates[i], balance); ok {
			result.Tokens = append(result.Tokens, token)
		}
	}
	return nil
}

func (s *Scanner) discoverERC20BalancesFallback(ctx context.Context, owner common.Address, candidates []normalizedDiscoveryCandidate, result *DiscoveryResult) error {
	workers := s.discoveryFallbackWorkers
	if workers <= 0 {
		workers = defaultDiscoveryWorkers
	}
	workers = min(workers, len(candidates))
	if workers < 1 {
		workers = 1
	}
	jobs := make(chan normalizedDiscoveryCandidate, len(candidates))
	var (
		wg sync.WaitGroup
		mu sync.Mutex
	)

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for candidate := range jobs {
				if ctx.Err() != nil {
					return
				}
				balance, err := s.readERC20Balance(ctx, candidate.ContractAddress, owner)
				atomic.AddInt64(&result.RPCRequests, 1)
				if err != nil || balance == nil || balance.Sign() <= 0 {
					continue
				}

				item, ok := s.toDiscoveryToken(ctx, candidate, balance)
				if !ok {
					continue
				}
				mu.Lock()
				result.Tokens = append(result.Tokens, item)
				mu.Unlock()
			}
		}()
	}

	for _, c := range candidates {
		jobs <- c
	}
	close(jobs)
	wg.Wait()
	return nil
}

func (s *Scanner) toDiscoveryToken(ctx context.Context, candidate normalizedDiscoveryCandidate, balance *big.Int) (DiscoveryToken, bool) {
	if balance == nil || balance.Sign() <= 0 {
		return DiscoveryToken{}, false
	}

	tokenSymbol := strings.ToUpper(strings.TrimSpace(candidate.Symbol))
	tokenDecimals := 0
	infoCtx, cancelInfo := context.WithTimeout(ctx, discoveryRPCTimeout)
	info, infoErr := s.GetToken(infoCtx, parse.ERC20.String(), candidate.ContractAddress)
	cancelInfo()
	if infoErr == nil && info != nil {
		if strings.TrimSpace(info.Symbol) != "" {
			tokenSymbol = strings.ToUpper(strings.TrimSpace(info.Symbol))
		}
		tokenDecimals = int(info.Decimals)
	}

	return DiscoveryToken{
		TokenContract: candidate.ContractHex,
		TokenSymbol:   tokenSymbol,
		TokenDecimals: tokenDecimals,
		Balance:       balance.String(),
		MarketCapRank: candidate.MarketCapRank,
	}, true
}

func (s *Scanner) readERC20Balance(ctx context.Context, contract common.Address, owner common.Address) (*big.Int, error) {
	callCtx, cancel := context.WithTimeout(ctx, discoveryRPCTimeout)
	defer cancel()
	var out []byte
	err := s.Client.Endpoint.Call(func(c *client.Wrapped, e *error) {
		if err := c.WaitLimit(callCtx, "token_discovery_balance_of", "eth_call"); err != nil {
			*e = err
			return
		}
		msg := ethereum.CallMsg{
			To:   &contract,
			Data: buildBalanceOfData(owner),
		}
		out, *e = c.CallContract(callCtx, msg, nil)
	})
	if err != nil {
		return nil, err
	}
	if len(out) == 0 {
		return big.NewInt(0), nil
	}
	return new(big.Int).SetBytes(out), nil
}

func (s *Scanner) appendNativeToken(ctx context.Context, chain string, owner common.Address, result *DiscoveryResult) {
	callCtx, cancel := context.WithTimeout(ctx, discoveryRPCTimeout)
	defer cancel()
	var balance *big.Int
	err := s.Client.Endpoint.Call(func(c *client.Wrapped, e *error) {
		if err := c.WaitLimit(callCtx, "token_discovery_native_balance", "eth_getBalance"); err != nil {
			*e = err
			return
		}
		balance, *e = c.BalanceAt(callCtx, owner, nil)
		atomic.AddInt64(&result.RPCRequests, 1)

	})
	if err != nil || balance == nil || balance.Sign() <= 0 {
		return
	}

	info := nativeCurrencyInfo(s.ChainId().Uint64())
	result.Tokens = append(result.Tokens, DiscoveryToken{
		TokenContract: nativeTokenContract(chain),
		TokenSymbol:   info.Symbol,
		TokenDecimals: int(info.Decimals),
		Balance:       balance.String(),
		MarketCapRank: 0,
	})
}

func normalizeDiscoveryCandidates(items []DiscoveryCandidate) []normalizedDiscoveryCandidate {
	if len(items) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(items))
	out := make([]normalizedDiscoveryCandidate, 0, len(items))
	for _, item := range items {
		contract := strings.ToLower(strings.TrimSpace(item.ContractAddress))
		if !common.IsHexAddress(contract) {
			continue
		}
		hexAddr := common.HexToAddress(contract).Hex()
		key := strings.ToLower(hexAddr)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, normalizedDiscoveryCandidate{
			ContractAddress: common.HexToAddress(hexAddr),
			ContractHex:     strings.ToLower(hexAddr),
			Symbol:          strings.TrimSpace(item.Symbol),
			MarketCapRank:   item.MarketCapRank,
		})
	}
	return out
}

func sortDiscoveryTokens(tokens []DiscoveryToken) {
	sort.Slice(tokens, func(i, j int) bool {
		ri := tokens[i].MarketCapRank
		rj := tokens[j].MarketCapRank
		if ri == 0 {
			ri = -1
		}
		if rj == 0 {
			rj = -1
		}
		if ri != rj {
			return ri < rj
		}
		return tokens[i].TokenContract < tokens[j].TokenContract
	})
}

func buildBalanceOfData(owner common.Address) []byte {
	selector := []byte{0x70, 0xa0, 0x82, 0x31}
	param := common.LeftPadBytes(owner.Bytes(), 32)
	data := make([]byte, 0, len(selector)+len(param))
	data = append(data, selector...)
	data = append(data, param...)
	return data
}

func getMulticall3ABI() (abi.ABI, error) {
	multicall3ABIOnce.Do(func() {
		multicall3ABIInst, multicall3ABIErr = abi.JSON(strings.NewReader(multicall3ABIJSON))
	})
	return multicall3ABIInst, multicall3ABIErr
}

func encodeMulticallTryAggregate(owner common.Address, candidates []normalizedDiscoveryCandidate) ([]byte, error) {
	mcABI, err := getMulticall3ABI()
	if err != nil {
		return nil, err
	}
	calls := make([]multicall3Call, 0, len(candidates))
	for _, candidate := range candidates {
		calls = append(calls, multicall3Call{
			Target:   candidate.ContractAddress,
			CallData: buildBalanceOfData(owner),
		})
	}
	return mcABI.Pack("tryAggregate", false, calls)
}

func decodeMulticallTryAggregate(output []byte) ([]multicall3Result, error) {
	mcABI, err := getMulticall3ABI()
	if err != nil {
		return nil, err
	}
	var decoded []struct {
		Success    bool   `abi:"success"`
		ReturnData []byte `abi:"returnData"`
	}
	if err := mcABI.UnpackIntoInterface(&decoded, "tryAggregate", output); err != nil {
		return nil, err
	}
	out := make([]multicall3Result, 0, len(decoded))
	for _, item := range decoded {
		out = append(out, multicall3Result{
			Success:    item.Success,
			ReturnData: item.ReturnData,
		})
	}
	return out, nil
}

func nativeTokenContract(chain string) string {
	chain = strings.ToLower(strings.TrimSpace(chain))
	switch chain {
	case "ethereum":
		chain = "eth"
	case "arbitrum":
		chain = "arb"
	case "optimism":
		chain = "op"
	case "bnb", "bnbchain", "binance-smart-chain", "binance smart chain":
		chain = "bsc"
	case "matic":
		chain = "polygon"
	}
	if chain == "" {
		chain = "eth"
	}
	return "native:" + chain
}

func nativeCurrencyInfo(chainID uint64) *token.Info {
	if info, ok := token.NativeCurrencys[chainID]; ok && info != nil {
		return info
	}
	return &token.Info{
		Symbol:   "ETH",
		Decimals: 18,
		Name:     "Ether",
	}
}
