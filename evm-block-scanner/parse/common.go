package parse

import (
	"evm-scanner/token"
	"evm-scanner/types"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
)

var ChainSupport = map[uint64]Parser{
	1:  ERC20,
	56: BEP20,
}

var NativeAddress = common.Address{}

type InternalTransactions struct {
	From          common.Address `json:"from"`
	To            common.Address `json:"to"`
	Value         *big.Int       `json:"value"`
	ValueFormated string         `json:"value_formatted"`
	LimitGas      uint64         `json:"limit_gas"`
	UsedGas       uint64         `json:"used_gas"`
}

// FlattenTrace 将递归的 TraceFrame 转换为扁平的 InternalTransactions 列表
func FlattenTrace(root *types.TraceFrame, token *token.Info) []InternalTransactions {
	var result []InternalTransactions = make([]InternalTransactions, 0)
	if root == nil {
		return result
	}

	// 定义递归辅助函数
	var dfs func(frame *types.TraceFrame)
	dfs = func(frame *types.TraceFrame) {
		if frame == nil {
			return
		}

		// 核心转换逻辑：
		// 只有在 Value > 0 时我们才认为这是一笔“转账型”内部交易
		val := (*big.Int)(&frame.Value)
		if val != nil && val.Cmp(big.NewInt(0)) > 0 {
			tx := InternalTransactions{
				From:          frame.From,
				To:            frame.To,
				Value:         new(big.Int).Set(val),
				ValueFormated: token.ParseFloatAmount(val),
				LimitGas:      uint64(frame.Gas),
				UsedGas:       uint64(frame.GasUsed),
			}
			result = append(result, tx)
		}

		// 递归处理子调用
		for _, child := range frame.Calls {
			dfs(child)
		}
	}

	// 开始从根节点遍历
	dfs(root)
	return result
}

type SwapAsset struct {
	TokenAddress  common.Address `json:"token_address"`
	TokenInfo     *token.Info    `json:"token"`
	Value         *big.Int       `json:"value"`
	ValueFormated string         `json:"value_formated"`
}
type SwapSummary struct {
	Name    string         `json:"name"`
	Inputs  []SwapAsset    `json:"inputs"`
	Outputs []SwapAsset    `json:"outputs"`
	Router  common.Address `json:"router "`
}
type RawEvent struct {
	Type    string         `json:"type"`
	Name    string         `json:"method"`
	Topics  []common.Hash  `json:"topics"`
	Data    hexutil.Bytes  `json:"data"`
	Address common.Address `json:"address"`
}
