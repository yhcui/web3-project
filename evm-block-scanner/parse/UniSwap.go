package parse

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

type uniswapv4Support struct {
	Standard Parser
	Contract common.Address
}
type uniswapv4 map[uint64]uniswapv4Support

func (u uniswapv4) Handler(tx *Transaction) (err error) {
	standard := u[tx.ChainId.Uint64()].Standard

	erc20, ok := standard.(ERC20Like)
	if !ok {
		return nil
	}

	// 1. 初始化数据结构
	inputBalances := make(map[common.Address]*big.Int)
	outputBalances := make(map[common.Address]*big.Int)
	userAddr := tx.From
	nativeAddr := common.Address{} // 代表 ETH/BNB

	for _, log := range tx.Logs {
		transferLog, ok := log.(*ERC20TransferEvent)
		if !ok {
			continue
		}
		// 统计 ERC20 Input
		if transferLog.From == userAddr {
			if _, ok := inputBalances[transferLog.TokenAddress]; !ok {
				inputBalances[transferLog.TokenAddress] = new(big.Int)
			}
			inputBalances[transferLog.TokenAddress].Add(inputBalances[transferLog.TokenAddress], transferLog.Value)
		}
		// 统计 ERC20 Output
		if transferLog.To == userAddr {
			if _, ok := outputBalances[transferLog.TokenAddress]; !ok {
				outputBalances[transferLog.TokenAddress] = new(big.Int)
			}
			outputBalances[transferLog.TokenAddress].Add(outputBalances[transferLog.TokenAddress], transferLog.Value)
		}
	}

	if len(inputBalances) == 0 || len(outputBalances) == 0 {
		// 解析内部交易补全
		erc20.ParseInternalTransactions(tx)
		for _, intx := range tx.InternalTxs {
			// 核心判定：只统计和用户直接相关的原生币流动
			if intx.Value != nil && intx.Value.Cmp(big.NewInt(0)) > 0 {
				// 如果是用户发出的内部转账（通常较少见，除非是某些特殊的Hook回退资金）
				if intx.From == userAddr {
					if _, ok := inputBalances[nativeAddr]; !ok {
						inputBalances[nativeAddr] = new(big.Int)
					}
					inputBalances[nativeAddr].Add(inputBalances[nativeAddr], intx.Value)
				}
				// 如果是发给用户的内部转账（这是最常见的：合约卖出 Token 换回 ETH 给用户）
				if intx.To == userAddr {
					if _, ok := outputBalances[nativeAddr]; !ok {
						outputBalances[nativeAddr] = new(big.Int)
					}
					outputBalances[nativeAddr].Add(outputBalances[nativeAddr], intx.Value)
				}
			}
		}
	}

	// 净额处理 (Netting)
	// 如果同一个币种既在 input 又在 output，进行抵消，只保留差额
	for addr, inAmt := range inputBalances {
		if outAmt, ok := outputBalances[addr]; ok {
			if inAmt.Cmp(outAmt) > 0 {
				inputBalances[addr].Sub(inAmt, outAmt)
				delete(outputBalances, addr)
			} else if outAmt.Cmp(inAmt) > 0 {
				outputBalances[addr].Sub(outAmt, inAmt)
				delete(inputBalances, addr)
			} else {
				delete(inputBalances, addr)
				delete(outputBalances, addr)
			}
		}
	}

	// 构造最终的 SwapSummary
	if tx.To == nil || (len(inputBalances) == 0 && len(outputBalances) == 0) {
		return nil
	}

	summary := &SwapSummary{
		Name:    "swap",
		Inputs:  make([]SwapAsset, 0),
		Outputs: make([]SwapAsset, 0),
		Router:  *tx.To,
	}

	// 填充 Inputs
	for addr, amt := range inputBalances {
		if amt.Cmp(big.NewInt(0)) <= 0 {
			continue
		}
		tokenInfo := tx.getTokenInfo(standard.String(), addr)
		summary.Inputs = append(summary.Inputs, SwapAsset{
			Value:         new(big.Int).Set(amt),
			ValueFormated: tokenInfo.ParseFloatAmount(amt),
			TokenAddress:  addr,
			TokenInfo:     tokenInfo,
		})
	}

	// 填充 Outputs
	for addr, amt := range outputBalances {
		if amt.Cmp(big.NewInt(0)) <= 0 {
			continue
		}
		tokenInfo := tx.getTokenInfo(standard.String(), addr)
		summary.Outputs = append(summary.Outputs, SwapAsset{
			Value:         new(big.Int).Set(amt),
			ValueFormated: tokenInfo.ParseFloatAmount(amt),
			TokenAddress:  addr,
			TokenInfo:     tokenInfo,
		})
	}

	// 只有当输入和输出都存在时，才认为是一笔有效的 Swap
	if len(summary.Inputs) > 0 && len(summary.Outputs) > 0 {
		tx.setSummary(summary)
	}
	return nil
}

func (u uniswapv4) Match(tx *Transaction) bool {
	s, ok := u[tx.ChainId.Uint64()]
	if !ok {
		return false
	}
	return tx.matchContract(s.Contract)
}

func (u uniswapv4) Priority() int {
	return 100
}

func (u uniswapv4) String() string {
	return "Uniswap v4"
}

var UniSwapv4 uniswapv4 = uniswapv4{
	1:  uniswapv4Support{ERC20, common.HexToAddress("0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af")},
	56: uniswapv4Support{BEP20, common.HexToAddress("0x1906c1d672b88cD1B9aC7593301cA990F94Eae07")},
}

func init() {
	registerProtocol(UniSwapv4)
}
