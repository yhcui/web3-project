package parse

import (
	"bytes"
	"context"
	"evm-scanner/token"
	"evm-scanner/types"
	"log"
	"math/big"
	"sort"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/shopspring/decimal"
)

type Parser interface {
	Match(tx *Transaction) bool
	Priority() int // 返回优先级，数字越大越先执行
	String() string
	Handler(tx *Transaction) (err error)
}

var protocolParsers = make([]Parser, 0)

func registerProtocol(parser Parser) {
	protocolParsers = append(protocolParsers, parser)
	// 每次注册后按优先级从大到小排序
	sort.Slice(protocolParsers, func(i, j int) bool {
		return protocolParsers[i].Priority() > protocolParsers[j].Priority()
	})
}

type Transaction struct {
	Type                  uint8                  `json:"type"`
	Status                string                 `json:"status"`
	Timestamp             uint64                 `json:"timestamp"`
	Hash                  common.Hash            `json:"hash"`
	BlockHash             common.Hash            `json:"block_hash"`
	Nonce                 uint64                 `json:"nonce"`
	Origin                string                 `json:"origin"`
	ChainId               *big.Int               `json:"chain_id"`
	BlockNumber           *big.Int               `json:"block_number"`
	From                  common.Address         `json:"from"`
	To                    *common.Address        `json:"to"`
	Value                 *big.Int               `json:"value"`
	NativeCurrency        *token.Info            `json:"native_currency"`
	InputData             *InputData             `json:"top_contract_call_data"`
	Protocol              string                 `json:"protocol"`
	Fee                   *big.Int               `json:"fee"`
	FeeFormatted          string                 `json:"fee_formatted"`
	GasPriceGwei          *big.Int               `json:"gas_price_gwei"`
	GasPriceGweiFormatted string                 `json:"gas_price_formatted"`
	GasLimit              uint64                 `json:"gas_limit"`
	GasUsage              uint64                 `json:"gas_usage"`
	Summary               any                    `json:"summary"`
	InternalTxs           []InternalTransactions `json:"internal_txns"`
	Logs                  []any                  `json:"logs"`

	provider Provider
	ctx      context.Context
	receipt  *types.Receipt
}

func (t *Transaction) getTokenInfo(standard string, address common.Address) *token.Info {
	tk, err := t.provider.GetToken(t.ctx, standard, address)
	if err != nil {
		log.Printf("Failed to get token info: %v", err)
		return nil
	}
	if tk == nil {
		return token.NativeCurrencys[t.ChainId.Uint64()]
	}
	return tk

}

func (t *Transaction) setSummary(summary any) {
	if t.Summary != nil {
		log.Printf("Duplicate summary, Will be Replaced: old=%v, new=%v", t.Summary, summary)
	}
	t.Summary = summary
}

func (t *Transaction) matchContract(contract common.Address) bool {
	return t.To != nil && t.To.Cmp(contract) == 0
}

func (t *Transaction) matchMethod(methodId []byte) bool {
	if len(t.InputData.Raw) < 4 {
		return false
	}
	return bytes.Equal(t.InputData.Raw[:4], methodId)
}

func (t *Transaction) trace(why string) *types.TraceFrame {
	return t.provider.TraceTransaction(why, t.ctx, t.Hash)
}

type GetReceiptFunc func(common.Hash) (*types.Receipt, error)
type GetTokenFunc func(common.Address) *token.Info
type Provider interface {
	GetReceipt(why string, ctx context.Context, hash common.Hash) (*types.Receipt, error)
	GetToken(ctx context.Context, standard string, address common.Address) (*token.Info, error)
	Origin() string
	ChainId() *big.Int
	TraceTransaction(why string, ctx context.Context, txHash common.Hash) *types.TraceFrame
}

// Parse 解析 Transaction，避免types.Transaction不支持Arbitrum交易类型
func Parse(ctx context.Context, provider Provider, timestamp uint64, rawTx *types.Transaction, blockBaseFee *big.Int) (*Transaction, error) {
	chainId := provider.ChainId()
	hash := rawTx.Hash
	to := rawTx.To

	// 从 receipt 获取更多信息
	var err error
	var receipt *types.Receipt
	if rawTx.Receipt != nil {
		receipt = rawTx.Receipt
	} else {
		receiptStart := time.Now()
		receipt, err = provider.GetReceipt("Parse Transaction", ctx, hash)
		if err != nil {
			return nil, err
		}
		if elapsed := time.Since(receiptStart); elapsed >= 2*time.Second {
			log.Printf("[%s] Slow receipt fetch: tx=%s duration=%s", strings.ToUpper(provider.Origin()), hash.Hex(), elapsed.Round(100*time.Millisecond))
		}
	}

	// 计算或获取发送者地址
	from := rawTx.From
	if from == (common.Address{}) {
		// 如果from为空，尝试从receipt获取，或者标记为unknown
		log.Printf("Warning: transaction from address is empty for tx %s", hash.Hex())
	}

	// 获取gas价格
	var gasPrice *big.Int

	// 优先权最高：使用 Receipt 里的实际成交价（最准，包含 Arbitrum 的 L1+L2 综合折算）
	if receipt.EffectiveGasPrice != nil && receipt.EffectiveGasPrice.ToInt().Sign() > 0 {
		gasPrice = receipt.EffectiveGasPrice.ToInt()
	} else {
		gasPrice = rawTx.EffectiveGasPrice(blockBaseFee)
	}

	if gasPrice == nil {
		gasPrice = big.NewInt(0)
	}

	// 获取value
	value := big.NewInt(0)
	if rawTx.Value != nil {
		value = rawTx.Value.ToInt()
	}

	tx_ := Transaction{
		Type:           uint8(rawTx.Type),
		Timestamp:      timestamp,
		Hash:           hash,
		Nonce:          uint64(rawTx.Nonce),
		Origin:         provider.Origin(),
		ChainId:        chainId,
		BlockNumber:    receipt.BlockNumber.ToInt(),
		From:           from,
		To:             to,
		Value:          value,
		NativeCurrency: token.NativeCurrencys[chainId.Uint64()],
		InputData:      ParseInputData(rawTx.Input),
		Logs:           make([]any, 0),
		GasLimit:       uint64(rawTx.Gas),
		GasUsage:       uint64(receipt.GasUsed),
		InternalTxs:    make([]InternalTransactions, 0),

		provider: provider,
		ctx:      ctx,
		receipt:  receipt,
	}

	if rawTx.BlockHash != nil {
		tx_.BlockHash = *rawTx.BlockHash
	}

	switch uint64(receipt.Status) {
	case types.ReceiptStatusFailed:
		tx_.Status = "failed"
	case types.ReceiptStatusSuccessful:
		tx_.Status = "successful"
	default:
		tx_.Status = "unknown"
	}

	gasUsed := new(big.Int).SetUint64(uint64(receipt.GasUsed))
	feeWei := new(big.Int).Mul(gasUsed, gasPrice)

	priceDec := decimal.NewFromBigInt(gasPrice, 0)
	feeDec := decimal.NewFromBigInt(feeWei, 0)

	tx_.GasPriceGwei = priceDec.BigInt()
	tx_.GasPriceGweiFormatted = priceDec.Shift(-9).Truncate(6).String()
	tx_.Fee = feeWei
	tx_.FeeFormatted = feeDec.Shift(-18).StringFixed(8)

	for _, parser := range protocolParsers {
		if !parser.Match(&tx_) {
			continue
		}
		tx_.Protocol = parser.String()
		if logParser, ok := parser.(LogParser); ok {
			for _, log := range receipt.Logs {
				result := logParser.ParseLog(&tx_, log)
				if result != nil {
					tx_.Logs = append(tx_.Logs, result)
				} else {
					tx_.Logs = append(tx_.Logs, ParseRawLog(&tx_, log))
				}
			}
		} else {
			for _, log := range receipt.Logs {
				if erc20Log := ERC20.ParseLog(&tx_, log); erc20Log != nil {
					tx_.Logs = append(tx_.Logs, erc20Log)
				} else {
					tx_.Logs = append(tx_.Logs, ParseRawLog(&tx_, log))
				}
			}
		}

		err = parser.Handler(&tx_)
		if err != nil {
			log.Printf("Failed to parse transaction with %s protocol: tx_hash=%s, error=%v", parser.String(), hash, err)
			continue
		}
		break
	}

	return &tx_, nil
}
