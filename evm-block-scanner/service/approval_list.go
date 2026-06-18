package service

import (
	"context"
	"encoding/json"
	"errors"
	"evm-scanner/client"
	"evm-scanner/scanner"
	"evm-scanner/token"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"net/url"
	"strconv"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
)

func HandleApprovalList(prefix string, mux *http.ServeMux, apiKey string, apiPRS int, provider Provider) {
	cli := NewEtherscanClient(apiKey, apiPRS)
	// 访问路径示例: /prefix/?chain_id=1&address=0x123
	mux.HandleFunc(prefix, func(w http.ResponseWriter, r *http.Request) {
		// 获取 Query 参数
		chainID_Query := r.URL.Query().Get("chain_id")
		address_Query := r.URL.Query().Get("address")

		var chainId uint64
		var address common.Address

		if chainID_Query == "" || address_Query == "" {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Bad Request: missing chain_id or address"))
			return
		}
		chainId, err := strconv.ParseUint(chainID_Query, 10, 64)
		if err != nil {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Bad Request: invalid chain_id"))
			return
		}
		address = common.HexToAddress(address_Query)

		log.Printf("[*ApprovalList] chain_id=%d, address=%s", chainId, address)
		result, err := FindApprovalList(provider, cli, chainId, address)
		if errors.Is(err, ErrEtherscanMaxRateLimitReached) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusTooManyRequests)
			return
		}
		if err != nil {
			log.Printf("[*ApprovalList] failed to fetch approval list: chain_id=%d, address=%s, error=%v", chainId, address, err)
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if result == nil {
			result = make([]ApprovalLog, 0)
		}

		for i := range result {
			result[i].TokenInfo = provider.GetTokenByChainID(chainId, result[i].TokenAddress)
		}

		resultBytes, err := json.Marshal(result)
		if err != nil {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		w.Write(resultBytes)
	})
}

type Provider interface {
	GetTokenByChainID(chainID uint64, address common.Address) *token.Info
	GetEndpointByChainID(chainID uint64) *client.Endpoint
	GetScannerByChainID(chainID uint64) *scanner.Scanner
	Origin() string
}
type ApprovalLog struct {
	TokenAddress common.Address `json:"token_address"`
	TokenInfo    *token.Info    `json:"token_info"`
	Spender      common.Address `json:"spender"`
	Value        *big.Int       `json:"value"`
}

// Approval 事件的 Topic0 签名
var approvalTopic0 = common.HexToHash("0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925")

func FindApprovalList(provider Provider, cli *EtherscanClient, chainId uint64, address common.Address) ([]ApprovalLog, error) {
	ctx := context.Background()
	endpoint := provider.GetEndpointByChainID(chainId)
	if endpoint == nil {
		return nil, fmt.Errorf("unsupported chain id: %d", chainId)
	}

	var startBlock uint64
	var err error

	// 首先尝试使用备用节点获取地址的首笔交易区块高度
	if num, err := FindFirstTransactionBlockWithNonce(ctx, provider, chainId, address); err == nil {
		startBlock = num.Uint64()
	} else {
		log.Printf("[*ApprovalList] failed to get first tx block with nonce by backup client, error=%v", err)
		log.Printf("[*ApprovalList] try to get first tx block with etherscan, chain_id=%d, client=%s", chainId, address.Hex())

		// 1. 从 Etherscan 获取该地址的首笔交易区块高度
		params := url.Values{}
		params.Add("module", "account")
		params.Add("action", "txlist")
		params.Add("address", address.Hex())
		params.Add("startblock", "0")
		params.Add("endblock", "99999999")
		params.Add("page", "1")
		params.Add("offset", "1")
		params.Add("sort", "asc")
		params.Add("chainid", strconv.Itoa(int(chainId)))

		var txResult []struct {
			BlockNumber string `json:"blockNumber"`
		}
		err := cli.Get(ctx, chainId, params, &txResult)
		if err != nil && !errors.Is(err, ErrEtherscanNoTransactionsFound) {
			log.Printf("[*ApprovalList] failed to get first tx block with etherscan: %v", err)
		}

		if len(txResult) > 0 {
			startBlock, _ = strconv.ParseUint(txResult[0].BlockNumber, 10, 64)
		}
	}

	// 2. 获取当前最新的区块高度
	head, err := endpoint.BlockNumber("FindApprovalList", ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get head block number: %v", err)
	}

	if startBlock == 0 {
		// 3. 兜底逻辑：在前两个方式失败后，取最近的 5000 个区块扫描
		if head > 5000 {
			startBlock = head - 5000
		} else {
			startBlock = 1
		}
		log.Printf("[*ApprovalList] no first tx found, fallback to scan last 5000 blocks: startBlock=%d", startBlock)
	}

	// 4. 分片扫描配置
	const chunkSize = 10000 // 每次查询 1 万个区块

	var wg sync.WaitGroup
	var mu sync.Mutex

	// 使用 Map 去重：key = tokenAddress_spenderAddress
	// 这样多次 Approval 记录会自动保留最后一次处理的结果
	approvalsMap := make(map[string]ApprovalLog)

	ownerTopic := common.BytesToHash(common.LeftPadBytes(address.Bytes(), 32))

	for i := startBlock; i <= head; i += chunkSize {
		end := min(i+chunkSize-1, head)

		wg.Add(1)

		go func(from, to uint64) {
			defer wg.Done()

			q := ethereum.FilterQuery{
				FromBlock: new(big.Int).SetUint64(from),
				ToBlock:   new(big.Int).SetUint64(to),
				Topics: [][]common.Hash{
					{approvalTopic0}, // Topic 0: Approval 签名
					{ownerTopic},     // Topic 1: 授权人 (indexed)
				},
			}

			logs, err := endpoint.FilterLogs("FindApprovalList", ctx, q)
			if err != nil {
				log.Printf("FilterLogs error in range [%d-%d]: %v", from, to, err)
				return
			}

			for _, lg := range logs {
				// 校验 Topic 数量 (Approval 事件需包含 Sig, Owner, Spender)
				if len(lg.Topics) < 3 {
					continue
				}

				spender := common.BytesToAddress(lg.Topics[2].Bytes()[12:])
				val := new(big.Int).SetBytes(lg.Data)

				key := fmt.Sprintf("%s_%s", lg.Address.Hex(), spender.Hex())

				mu.Lock()
				approvalsMap[key] = ApprovalLog{
					TokenAddress: lg.Address,
					Spender:      spender,
					Value:        val,
					TokenInfo:    nil, // 暂时不处理 TokenInfo
				}
				mu.Unlock()
			}
		}(i, end)
	}

	wg.Wait()

	// 5. 将 Map 转换为 Slice 返回
	result := make([]ApprovalLog, 0, len(approvalsMap))
	for _, v := range approvalsMap {
		result = append(result, v)
	}

	return result, nil
}

func FindFirstTransactionBlockWithNonce(ctx context.Context, provider Provider, chainId uint64, address common.Address) (*big.Int, error) {
	endpoint := provider.GetEndpointByChainID(chainId)
	if endpoint == nil {
		return nil, fmt.Errorf("unsupported chain id: %d", chainId)
	}

	log.Printf("[*ApprovalList] get first tx block with nonce, chain_id=%d, client=%s", chainId, address.Hex())

	latestBlock, err := endpoint.BlockNumber("FindFirstTransactionBlockWithNonce", ctx)
	if err != nil {
		return nil, fmt.Errorf("can not get latest block: %v", err)
	}

	latestNonce, err := endpoint.NonceAt("FindFirstTransactionBlockWithNonce:Get latest nonce", ctx, address, big.NewInt(int64(latestBlock)))

	if err != nil {
		return nil, fmt.Errorf("get nonce err: %v", err)
	}

	if latestNonce == 0 {
		return nil, fmt.Errorf("empty tx in account")
	}

	left := uint64(0)
	right := latestBlock
	var firstBlock uint64

	for left <= right {
		mid := left + (right-left)/2

		var nonce uint64
		var err error

		// 1. 局部重试机制
		for i := range 3 {
			nonce, err = endpoint.NonceAt("FindFirstTransactionBlockWithNonce:Get nonce", ctx, address, big.NewInt(int64(mid)))
			if err == nil {
				break
			}
			time.Sleep(time.Duration(i+1) * 200 * time.Millisecond)
			continue
		}

		if err != nil {
			return nil, fmt.Errorf("get nonce err: %v", err)
		}

		if nonce > 0 {
			firstBlock = mid
			right = mid - 1
		} else {
			left = mid + 1
		}

		log.Printf("[*ApprovalList] try block %d, nonce %d in account %s", mid, nonce, address.Hex())
	}

	return big.NewInt(int64(firstBlock)), nil
}
