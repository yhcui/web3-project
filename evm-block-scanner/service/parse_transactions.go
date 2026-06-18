package service

import (
	"context"
	"encoding/json"
	"evm-scanner/adapter"
	"evm-scanner/scanner"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"strconv"
	"sync"

	"github.com/ethereum/go-ethereum/common"
)

const (
	maxTransactionsPerRequest = 50
	maxConcurrentParsing      = 10
)

// TransactionInput 单个交易的输入信息
type TransactionInput struct {
	TxHash      string `json:"tx_hash"`
	BlockNumber string `json:"block_number"`
}

// ParseTransactionsRequest 请求结构
type ParseTransactionsRequest struct {
	ChainID      uint64             `json:"chain_id"`
	Address      string             `json:"address"`
	Transactions []TransactionInput `json:"transactions"`
}

// ParseTransactionResult 单个交易的解析结果
type ParseTransactionResult struct {
	TxHash string                    `json:"tx_hash"`
	Status string                    `json:"status"` // "success" or "error"
	Data   *adapter.StandardActivity `json:"data,omitempty"`
	Error  string                    `json:"error,omitempty"`
}

// ParseTransactionsResponse 响应结构
type ParseTransactionsResponse struct {
	Results []ParseTransactionResult `json:"results"`
}

// HandleParseTransactions 处理批量解析交易的 HTTP 请求
func HandleParseTransactions(prefix string, mux *http.ServeMux, provider Provider) {
	mux.HandleFunc(prefix, func(w http.ResponseWriter, r *http.Request) {
		// 只接受 POST 请求
		if r.Method != http.MethodPost {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusMethodNotAllowed)
			w.Write([]byte("Method Not Allowed: only POST is supported"))
			return
		}

		// 解析请求体
		var req ParseTransactionsRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(fmt.Sprintf("Bad Request: invalid JSON body: %v", err)))
			return
		}

		// 参数验证
		if req.ChainID == 0 {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Bad Request: chain_id is required"))
			return
		}

		if req.Address == "" {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Bad Request: address is required"))
			return
		}

		if !common.IsHexAddress(req.Address) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Bad Request: address has invalid format"))
			return
		}

		if len(req.Transactions) == 0 {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Bad Request: transactions cannot be empty"))
			return
		}

		if len(req.Transactions) > maxTransactionsPerRequest {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(fmt.Sprintf("Bad Request: transactions exceeds maximum limit of %d", maxTransactionsPerRequest)))
			return
		}

		// 验证每个交易的输入
		for i, tx := range req.Transactions {
			if tx.TxHash == "" {
				w.Header().Set("Content-Type", "text/plain; charset=utf-8")
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(fmt.Sprintf("Bad Request: transactions[%d].tx_hash is required", i)))
				return
			}
			if len(tx.TxHash) != 66 || tx.TxHash[:2] != "0x" {
				w.Header().Set("Content-Type", "text/plain; charset=utf-8")
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(fmt.Sprintf("Bad Request: transactions[%d].tx_hash has invalid format", i)))
				return
			}
			if tx.BlockNumber == "" {
				w.Header().Set("Content-Type", "text/plain; charset=utf-8")
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(fmt.Sprintf("Bad Request: transactions[%d].block_number is required", i)))
				return
			}
			// 验证 block_number 可以转换为数字
			if _, err := strconv.ParseUint(tx.BlockNumber, 10, 64); err != nil {
				w.Header().Set("Content-Type", "text/plain; charset=utf-8")
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(fmt.Sprintf("Bad Request: transactions[%d].block_number has invalid format: %v", i, err)))
				return
			}
		}

		// 获取对应链的 Scanner
		sc := provider.GetScannerByChainID(req.ChainID)
		if sc == nil {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(fmt.Sprintf("Chain not found: chain_id=%d", req.ChainID)))
			return
		}

		log.Printf("[ParseTransactions] chain_id=%d, address=%s, tx_count=%d", req.ChainID, req.Address, len(req.Transactions))

		// 并发解析交易
		results := parseTransactionsConcurrently(r.Context(), sc, req.Transactions, req.Address)

		// 返回结果
		response := ParseTransactionsResponse{
			Results: results,
		}

		responseBytes, err := json.Marshal(response)
		if err != nil {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Internal Server Error: failed to marshal response"))
			return
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		w.Write(responseBytes)
	})
}

// parseTransactionsConcurrently 并发解析多个交易
func parseTransactionsConcurrently(ctx context.Context, sc *scanner.Scanner, transactions []TransactionInput, address string) []ParseTransactionResult {
	results := make([]ParseTransactionResult, len(transactions))
	var wg sync.WaitGroup
	var mu sync.Mutex

	// 使用信号量限制并发数
	sem := make(chan struct{}, maxConcurrentParsing)

	for i, tx := range transactions {
		wg.Add(1)
		go func(index int, input TransactionInput) {
			defer wg.Done()

			// 获取信号量
			sem <- struct{}{}
			defer func() { <-sem }()

			result := parseSingleTransaction(ctx, sc, input, address)

			// 写入结果（需要加锁）
			mu.Lock()
			results[index] = result
			mu.Unlock()
		}(i, tx)
	}

	wg.Wait()
	return results
}

// parseSingleTransaction 解析单个交易
func parseSingleTransaction(ctx context.Context, sc *scanner.Scanner, input TransactionInput, address string) ParseTransactionResult {
	result := ParseTransactionResult{
		TxHash: input.TxHash,
		Status: "error",
	}

	txHash := common.HexToHash(input.TxHash)

	// 解析 block_number
	blockNum, err := strconv.ParseUint(input.BlockNumber, 10, 64)
	if err != nil {
		result.Error = fmt.Sprintf("invalid block_number: %v", err)
		return result
	}
	blockNumber := new(big.Int).SetUint64(blockNum)

	// 使用 Scanner 的 ParseTransactionByHash 方法
	parsedTx, err := sc.ParseTransactionByHash(ctx, txHash, blockNumber)
	if err != nil {
		result.Error = err.Error()
		return result
	}

	// 使用 Normalize 转换为 StandardActivity
	activity, err := adapter.Normalize(parsedTx, address)
	if err != nil {
		result.Error = fmt.Sprintf("failed to normalize: %v", err)
		return result
	}

	// 成功
	result.Status = "success"
	result.Data = activity
	result.Error = ""

	return result
}
