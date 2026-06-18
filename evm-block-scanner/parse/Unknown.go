package parse

import "evm-scanner/types"

type unknown struct{}

func (unknown) Priority() int {
	return -100
}

func (unknown) Handler(tx *Transaction) error {
	standard := ChainSupport[tx.ChainId.Uint64()]
	if standard != nil {
		return standard.Handler(tx)
	}
	return nil
}

func (unknown) String() string {
	return "Unknown"
}

// 优先级最低，总是能匹配到
func (unknown) Match(tx *Transaction) bool {
	return true
}

func (unknown) ParseLog(tx *Transaction, vLog *types.Log) any {
	// 以 ERC-20 解析
	return ERC20.ParseLog(tx, vLog)
}

var Unknown = unknown{}
var _ Parser = (*unknown)(nil)
var _ LogParser = (*unknown)(nil)

func init() {
	registerProtocol(Unknown)
}
