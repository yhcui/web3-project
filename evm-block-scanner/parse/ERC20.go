package parse

import (
	"evm-scanner/token"
	"evm-scanner/types"
	"log"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
)

type ERC20Like struct {
	ChainId uint64
	Name    string
}

func (ERC20Like) Priority() int {
	return 0
}

func (erc ERC20Like) Handler(tx *Transaction) error {
	return nil
}

func (e ERC20Like) String() string {
	return e.Name
}

func (e ERC20Like) Match(tx *Transaction) bool {
	return tx.ChainId.Uint64() == e.ChainId && tx.matchMethod(erc20MethodId_Transfer)
}

func (erc ERC20Like) ParseLog(tx *Transaction, vLog *types.Log) any {
	transferLog := erc.ParseTransferEvent(tx, vLog)
	if transferLog != nil {
		return transferLog
	}
	approvalLog := erc.ParseApprovalEvent(tx, vLog)
	if approvalLog != nil {
		return approvalLog
	}
	return nil
}

func (erc ERC20Like) ParseTransferEvent(tx *Transaction, log *types.Log) *ERC20TransferEvent {
	if len(log.Topics) == 3 && log.Topics[0] == erc20TransferSigHash {
		token := tx.getTokenInfo(erc.String(), log.Address)
		value := new(big.Int).SetBytes(log.Data)
		return &ERC20TransferEvent{
			Method:        "Transfer",
			TokenAddress:  log.Address,
			From:          common.BytesToAddress(log.Topics[1].Bytes()),
			To:            common.BytesToAddress(log.Topics[2].Bytes()),
			Value:         value,
			TokenInfo:     token,
			Type:          erc.String(),
			ValueFormated: token.ParseFloatAmount(value),
		}
	}
	return nil
}

func (erc ERC20Like) ParseApprovalEvent(tx *Transaction, log *types.Log) *ERC20ApprovalEvent {
	if len(log.Topics) == 3 && log.Topics[0] == erc20ApprovalSigHash {
		token := tx.getTokenInfo(erc.String(), log.Address)
		value := new(big.Int).SetBytes(log.Data)
		return &ERC20ApprovalEvent{
			Type:          erc.String(),
			Method:        "Approval",
			TokenAddress:  log.Address,
			Owner:         common.BytesToAddress(log.Topics[1].Bytes()),
			Spender:       common.BytesToAddress(log.Topics[2].Bytes()),
			Value:         value,
			TokenInfo:     token,
			ValueFormated: token.ParseFloatAmount(value),
		}
	}
	return nil
}

// 解析内部交易并添加到 tx.InternalTxs 中
func (erc ERC20Like) ParseInternalTransactions(tx *Transaction) {
	start := time.Now()
	if trace := tx.trace("ParseInternalTransactions"); trace != nil {
		tx.InternalTxs = FlattenTrace(trace, tx.NativeCurrency)
	}
	if elapsed := time.Since(start); elapsed >= 2*time.Second {
		log.Printf("[%s] Slow trace transaction: tx=%s protocol=%s duration=%s", strings.ToUpper(tx.Origin), tx.Hash.Hex(), erc.String(), elapsed.Round(100*time.Millisecond))
	}
}

var (
	erc20ApprovalSigHash   = common.HexToHash("0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925")
	erc20TransferSigHash   = common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")
	erc20MethodId_Name     = common.FromHex("0x06fdde03") // name()
	erc20MethodId_Symbol   = common.FromHex("0x95d89b41") // symbol()
	erc20MethodId_Decimals = common.FromHex("0x313ce567") // decimals()
	erc20MethodId_Transfer = common.FromHex("0xa9059cbb")
)

var ERC20 = ERC20Like{ChainId: 1, Name: "ERC-20"}
var _ LogParser = ERC20

func init() {
	registerProtocol(ERC20)
	token.Register(ERC20.String(), erc20MethodId_Name, erc20MethodId_Symbol, erc20MethodId_Decimals)
}

type ERC20TransferEvent struct {
	Method        string         `json:"method"`
	From          common.Address `json:"from"`
	To            common.Address `json:"to"`
	Type          string         `json:"type"`
	Value         *big.Int       `json:"value"`
	ValueFormated string         `json:"value_formatted"`
	TokenInfo     *token.Info    `json:"token"`
	TokenAddress  common.Address `json:"token_address"`
}

type ERC20ApprovalEvent struct {
	Type          string         `json:"type"`
	Method        string         `json:"method"`
	Owner         common.Address `json:"owner"`
	Spender       common.Address `json:"spender"`
	Value         *big.Int       `json:"value"`
	ValueFormated string         `json:"value_formatted"`
	TokenAddress  common.Address `json:"token_address"`
	TokenInfo     *token.Info    `json:"token"`
}
