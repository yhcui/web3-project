package adapter

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"

	"evm-scanner/parse"
	"github.com/ethereum/go-ethereum/common"
)

// StandardActivity Gateway 标准化活动数据
type StandardActivity struct {
	ID              string `json:"id"`
	SchemaVersion   string `json:"schema_version"`
	Chain           string `json:"chain"`
	Address         string `json:"address"`
	IsBackfill      bool   `json:"is_backfill,omitempty"`
	EventType       string `json:"event_type"`
	AssetType       string `json:"asset_type"`
	TokenSymbol     string `json:"token_symbol"`
	TokenContract   string `json:"token_contract"`
	TokenDecimals   int    `json:"token_decimals"`
	Amount          string `json:"amount"`
	AmountFormatted string `json:"amount_formatted"`
	TxID            string `json:"tx_id"`
	BlockNumber     int64  `json:"block_number"`
	BlockHash       string `json:"block_hash"`
	Timestamp       int64  `json:"timestamp"`
	From            string `json:"from"`
	To              string `json:"to"`
	Status          string `json:"status"`

	Transfers []TransferItem `json:"transfers"`

	RawData map[string]any `json:"raw_data"`
}

// TransferItem aligns with gateway's unified transfer model.
type TransferItem struct {
	AssetType     string `json:"asset_type"`
	TokenContract string `json:"token_contract"`
	TokenSymbol   string `json:"token_symbol"`
	TokenDecimals int    `json:"token_decimals"`
	Amount        string `json:"amount"`
	From          string `json:"from"`
	To            string `json:"to"`
	LogIndex      int    `json:"log_index"`
}

// SwapSummary aligns with gateway's unified swap model.
type SwapSummary struct {
	In        []SwapLeg `json:"in,omitempty"`
	Out       []SwapLeg `json:"out,omitempty"`
	Protocols []string  `json:"protocols,omitempty"`
}

type SwapLeg struct {
	AssetType     string `json:"asset_type"`
	TokenContract string `json:"token_contract"`
	TokenSymbol   string `json:"token_symbol"`
	TokenDecimals int    `json:"token_decimals"`
	Amount        string `json:"amount"`
	Direction     string `json:"direction"`
}

// Normalize 将 EVM Transaction 标准化为 Gateway 格式
func Normalize(tx *parse.Transaction, subscribedAddr string) (*StandardActivity, error) {
	if tx == nil {
		return nil, fmt.Errorf("transaction is nil")
	}

	// 生成唯一 ID (基于 txHash + subscribedAddress)
	id := generateActivityID(tx.Hash.Hex(), subscribedAddr)

	// Normalize casing early (EVM addresses should be lowercase for consistent matching)
	subscribedAddr = strings.ToLower(strings.TrimSpace(subscribedAddr))

	// 事件类型检测
	eventType := detectEventType(tx)

	// Token 信息
	assetType := ""
	tokenSymbol := ""
	tokenContract := ""
	tokenDecimals := 0

	if tx.NativeCurrency != nil {
		// Prefer chain-native symbol (ETH/BNB/...), which aligns better with gateway's AssetType.
		assetType = strings.ToUpper(strings.TrimSpace(tx.NativeCurrency.Symbol))
		if assetType == "" {
			assetType = "NATIVE"
		}
		tokenSymbol = tx.NativeCurrency.Symbol
		tokenDecimals = int(tx.NativeCurrency.Decimals)
	}

	// 金额 (使用 tx.Value)
	amount := "0"
	if tx.Value != nil {
		amount = tx.Value.String()
	}
	amountFormatted := formatAmount(tx.Value, tokenDecimals)

	// To 地址
	toAddr := ""
	if tx.To != nil {
		toAddr = strings.ToLower(tx.To.Hex())
	}

	// 区块号
	blockNumber := int64(0)
	if tx.BlockNumber != nil {
		blockNumber = tx.BlockNumber.Int64()
	}
	blockHash := ""
	if tx.BlockHash != (common.Hash{}) {
		blockHash = tx.BlockHash.Hex()
	}

	// Fee
	fee := ""
	feeFormatted := tx.FeeFormatted
	if tx.Fee != nil {
		fee = tx.Fee.String()
		if feeFormatted == "" && tokenDecimals > 0 {
			feeFormatted = formatAmount(tx.Fee, tokenDecimals)
		}
	}

	chain := strings.ToLower(tx.Origin)
	status := normalizeStatus(tx.Status)
	fromAddr := strings.ToLower(tx.From.Hex())

	// Optional unified fields (only fill when strictly known; never infer)
	transfers, primaryTransfer, primaryApproval := extractERC20TransfersAndPrimaries(tx, subscribedAddr)
	swap := extractSwapSummary(tx)
	selectedTransfer := primaryTransfer
	if selectedTransfer == nil && swap == nil {
		selectedTransfer = selectPrimaryTransferForAddress(transfers, subscribedAddr)
	}
	if swap != nil {
		eventType = "swap"
	}

	// Only set top-level token fields when the tx clearly represents a single ERC20 transfer/approval
	// that involves the subscribed address. This avoids guessing in multi-leg txs (e.g., swaps).
	if swap == nil {
		if selectedTransfer != nil {
			assetType = tokenAssetTypeForTx(tx)
			tokenContract = selectedTransfer.TokenContract
			tokenSymbol = selectedTransfer.TokenSymbol
			tokenDecimals = selectedTransfer.TokenDecimals
			amount = selectedTransfer.Amount
			amountFormatted = selectedTransfer.AmountFormatted
			if selectedTransfer.From != "" {
				fromAddr = selectedTransfer.From
			}
			if selectedTransfer.To != "" {
				toAddr = selectedTransfer.To
			}
			eventType = "transfer"
		} else if primaryApproval != nil {
			assetType = tokenAssetTypeForTx(tx)
			tokenContract = primaryApproval.TokenContract
			tokenSymbol = primaryApproval.TokenSymbol
			tokenDecimals = primaryApproval.TokenDecimals
			amount = primaryApproval.Amount
			amountFormatted = primaryApproval.AmountFormatted
			if primaryApproval.From != "" {
				fromAddr = primaryApproval.From
			}
			if primaryApproval.To != "" {
				toAddr = primaryApproval.To
			}
			if primaryApproval.Amount == "0" {
				eventType = "revoke"
			} else {
				eventType = "approval"
			}
		}
	}
	if transfers == nil {
		transfers = []TransferItem{}
	}

	rawData := map[string]any{
		"protocol":               tx.Protocol,
		"fee":                    fee,
		"fee_formatted":          feeFormatted,
		"input_data":             tx.InputData,
		"top_contract_call_data": tx.InputData,
		"internal_txs":           tx.InternalTxs,
		"logs":                   tx.Logs,
		"swap":                   swap,
	}

	return &StandardActivity{
		ID:              id,
		SchemaVersion:   "v1",
		Chain:           chain,
		Address:         subscribedAddr,
		EventType:       eventType,
		AssetType:       assetType,
		TokenSymbol:     tokenSymbol,
		TokenContract:   tokenContract,
		TokenDecimals:   tokenDecimals,
		Amount:          amount,
		AmountFormatted: amountFormatted,
		TxID:            tx.Hash.Hex(),
		BlockNumber:     blockNumber,
		BlockHash:       blockHash,
		Timestamp:       int64(tx.Timestamp),
		From:            fromAddr,
		To:              toAddr,
		Status:          status,
		Transfers:       transfers,
		RawData:         rawData,
	}, nil
}

func normalizeStatus(status string) string {
	s := strings.ToLower(strings.TrimSpace(status))
	switch s {
	case "successful", "success", "ok":
		return "SUCCESS"
	case "failed", "failure", "reverted", "revert":
		return "FAILED"
	case "unknown", "":
		return "UNKNOWN"
	default:
		// Preserve as-is (but uppercased) for unexpected values.
		return strings.ToUpper(status)
	}
}

type primaryTokenFill struct {
	TokenContract   string
	TokenSymbol     string
	TokenDecimals   int
	Amount          string
	AmountFormatted string
	From            string
	To              string
}

func selectPrimaryTransferForAddress(transfers []TransferItem, subscribedAddr string) *primaryTokenFill {
	subscribedLower := strings.ToLower(strings.TrimSpace(subscribedAddr))
	if subscribedLower == "" {
		return nil
	}
	bestIndex := -1
	var bestAmount *big.Int

	for i := range transfers {
		transfer := transfers[i]
		from := strings.ToLower(strings.TrimSpace(transfer.From))
		to := strings.ToLower(strings.TrimSpace(transfer.To))
		if from != subscribedLower && to != subscribedLower {
			continue
		}
		amount := parseAmountString(transfer.Amount)
		if bestIndex == -1 {
			bestIndex = i
			bestAmount = amount
			continue
		}
		if amount == nil {
			continue
		}
		if bestAmount == nil || amount.Cmp(bestAmount) > 0 {
			bestIndex = i
			bestAmount = amount
		}
	}

	if bestIndex < 0 {
		return nil
	}
	transfer := transfers[bestIndex]
	fill := &primaryTokenFill{
		TokenContract: transfer.TokenContract,
		TokenSymbol:   transfer.TokenSymbol,
		TokenDecimals: transfer.TokenDecimals,
		Amount:        transfer.Amount,
		From:          transfer.From,
		To:            transfer.To,
	}
	fill.AmountFormatted = formatAmountString(transfer.Amount, transfer.TokenDecimals)
	return fill
}

func parseAmountString(amount string) *big.Int {
	amount = strings.TrimSpace(amount)
	if amount == "" {
		return nil
	}
	value := new(big.Int)
	if _, ok := value.SetString(amount, 10); !ok {
		return nil
	}
	return value
}

func formatAmountString(amount string, decimals int) string {
	value := parseAmountString(amount)
	if value == nil {
		return amount
	}
	return formatAmount(value, decimals)
}

func extractERC20TransfersAndPrimaries(tx *parse.Transaction, subscribedAddr string) (transfers []TransferItem, primaryTransfer *primaryTokenFill, primaryApproval *primaryTokenFill) {
	if tx == nil {
		return nil, nil, nil
	}

	subscribedLower := strings.ToLower(strings.TrimSpace(subscribedAddr))
	if subscribedLower == "" {
		return nil, nil, nil
	}

	transfers = make([]TransferItem, 0)
	tokenAssetType := tokenAssetTypeForTx(tx)

	// Track candidates for safe top-level fill.
	var relevantTransferEvents []*parse.ERC20TransferEvent
	var relevantApprovalEvents []*parse.ERC20ApprovalEvent
	var totalTransferEvents int
	var totalApprovalEvents int

	for i, lg := range tx.Logs {
		switch ev := lg.(type) {
		case *parse.ERC20TransferEvent:
			totalTransferEvents++
			from := strings.ToLower(ev.From.Hex())
			to := strings.ToLower(ev.To.Hex())
			item := TransferItem{
				AssetType:     tokenAssetType,
				TokenContract: strings.ToLower(ev.TokenAddress.Hex()),
				TokenSymbol:   "",
				TokenDecimals: 0,
				Amount:        "0",
				From:          from,
				To:            to,
				LogIndex:      i,
			}
			if ev.Value != nil {
				item.Amount = ev.Value.String()
			}
			if ev.TokenInfo != nil {
				item.TokenSymbol = ev.TokenInfo.Symbol
				item.TokenDecimals = int(ev.TokenInfo.Decimals)
			}
			transfers = append(transfers, item)

			if from == subscribedLower || to == subscribedLower {
				relevantTransferEvents = append(relevantTransferEvents, ev)
			}

		case *parse.ERC20ApprovalEvent:
			totalApprovalEvents++
			owner := strings.ToLower(ev.Owner.Hex())
			if owner == subscribedLower {
				relevantApprovalEvents = append(relevantApprovalEvents, ev)
			}
		}
	}

	// Safe primary transfer fill: exactly one ERC20 Transfer event total, and it involves the subscribed address.
	if totalTransferEvents == 1 && len(relevantTransferEvents) == 1 {
		ev := relevantTransferEvents[0]
		fill := &primaryTokenFill{
			TokenContract: strings.ToLower(ev.TokenAddress.Hex()),
			TokenSymbol:   "",
			TokenDecimals: 0,
			Amount:        "0",
			From:          strings.ToLower(ev.From.Hex()),
			To:            strings.ToLower(ev.To.Hex()),
		}
		if ev.Value != nil {
			fill.Amount = ev.Value.String()
		}
		fill.AmountFormatted = ev.ValueFormated
		if ev.TokenInfo != nil {
			fill.TokenSymbol = ev.TokenInfo.Symbol
			fill.TokenDecimals = int(ev.TokenInfo.Decimals)
		}
		primaryTransfer = fill
	}

	// Safe primary approval fill: exactly one ERC20 Approval event total, and owner is the subscribed address.
	if totalApprovalEvents == 1 && len(relevantApprovalEvents) == 1 {
		ev := relevantApprovalEvents[0]
		fill := &primaryTokenFill{
			TokenContract: strings.ToLower(ev.TokenAddress.Hex()),
			TokenSymbol:   "",
			TokenDecimals: 0,
			Amount:        "0",
			From:          strings.ToLower(ev.Owner.Hex()),
			To:            strings.ToLower(ev.Spender.Hex()),
		}
		if ev.Value != nil {
			fill.Amount = ev.Value.String()
		}
		fill.AmountFormatted = ev.ValueFormated
		if ev.TokenInfo != nil {
			fill.TokenSymbol = ev.TokenInfo.Symbol
			fill.TokenDecimals = int(ev.TokenInfo.Decimals)
		}
		primaryApproval = fill
	}

	return transfers, primaryTransfer, primaryApproval
}

func extractSwapSummary(tx *parse.Transaction) *SwapSummary {
	if tx == nil || tx.Summary == nil {
		return nil
	}

	var s *parse.SwapSummary
	switch v := tx.Summary.(type) {
	case *parse.SwapSummary:
		s = v
	case parse.SwapSummary:
		s = &v
	default:
		return nil
	}

	out := &SwapSummary{}
	if tx.Protocol != "" {
		out.Protocols = []string{tx.Protocol}
	}

	// Inputs => SwapSummary.In, Outputs => SwapSummary.Out
	if len(s.Inputs) > 0 {
		out.In = make([]SwapLeg, 0, len(s.Inputs))
		for _, a := range s.Inputs {
			leg := swapLegFromAsset(tx, a, "IN")
			out.In = append(out.In, leg)
		}
	}
	if len(s.Outputs) > 0 {
		out.Out = make([]SwapLeg, 0, len(s.Outputs))
		for _, a := range s.Outputs {
			leg := swapLegFromAsset(tx, a, "OUT")
			out.Out = append(out.Out, leg)
		}
	}

	if len(out.In) == 0 && len(out.Out) == 0 && len(out.Protocols) == 0 {
		return nil
	}
	return out
}

func swapLegFromAsset(tx *parse.Transaction, a parse.SwapAsset, dir string) SwapLeg {
	assetType := tokenAssetTypeForTx(tx)
	contract := strings.ToLower(a.TokenAddress.Hex())
	if a.TokenAddress == parse.NativeAddress {
		contract = ""
		if tx != nil && tx.NativeCurrency != nil && tx.NativeCurrency.Symbol != "" {
			assetType = strings.ToUpper(tx.NativeCurrency.Symbol)
		} else {
			assetType = "NATIVE"
		}
	}

	leg := SwapLeg{
		AssetType:     assetType,
		TokenContract: contract,
		TokenSymbol:   "",
		TokenDecimals: 0,
		Amount:        "0",
		Direction:     dir,
	}
	if a.Value != nil {
		leg.Amount = a.Value.String()
	}
	if a.TokenInfo != nil {
		leg.TokenSymbol = a.TokenInfo.Symbol
		leg.TokenDecimals = int(a.TokenInfo.Decimals)
	}
	return leg
}

func tokenAssetTypeForTx(tx *parse.Transaction) string {
	if tx != nil && tx.ChainId != nil {
		switch tx.ChainId.Uint64() {
		case 56:
			return "BEP20"
		}
	}
	return "ERC20"
}

// generateActivityID 生成唯一活动 ID
func generateActivityID(txHash, address string) string {
	raw := fmt.Sprintf("%s:%s", txHash, address)
	hash := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(hash[:16])
}

// detectEventType 检测事件类型
func detectEventType(tx *parse.Transaction) string {
	// 检查 Summary 类型
	if tx.Summary != nil {
		summaryType := fmt.Sprintf("%T", tx.Summary)
		if strings.Contains(summaryType, "Swap") {
			return "swap"
		}
	}

	// 检查 InputData 方法
	if tx.InputData != nil && tx.InputData.Method != "" {
		method := strings.ToLower(tx.InputData.Method)
		if strings.Contains(method, "swap") {
			return "swap"
		}
	}

	// 默认为 transfer
	return "transfer"
}

// formatAmount 格式化金额
func formatAmount(amount *big.Int, decimals int) string {
	if amount == nil {
		return "0"
	}

	divisor := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil)
	amountFloat := new(big.Float).SetInt(amount)
	divisorFloat := new(big.Float).SetInt(divisor)
	result := new(big.Float).Quo(amountFloat, divisorFloat)

	return result.Text('f', 6)
}
