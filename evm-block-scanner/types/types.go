package types

import (
	"math/big"
	"strconv"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/core/types"
)

type TraceFrame struct {
	Type    string         `json:"type"` // CALL, DELEGATECALL, STATICCALL, etc.
	From    common.Address `json:"from"`
	To      common.Address `json:"to"`
	Value   hexutil.Big    `json:"value"` // 内部转账的金额 (Hex)
	Input   hexutil.Bytes  `json:"input"`
	Output  hexutil.Bytes  `json:"output"`
	Calls   []*TraceFrame  `json:"calls"` // 嵌套的子调用
	Error   string         `json:"error"`
	Gas     hexutil.Uint64 `json:"gas"` // 限制的gas
	GasUsed hexutil.Uint64 `json:"gasUsed"`
	SubGas  hexutil.Uint64 `json:"subGas"` // 子调用消耗的gas
}

// FlexUint64 支持前导零的uint64类型
type FlexUint64 uint64

type Header struct {
	ParentHash  common.Hash      `json:"parentHash"       gencodec:"required"`
	UncleHash   common.Hash      `json:"sha3Uncles"       gencodec:"required"`
	Coinbase    common.Address   `json:"miner"`
	Root        common.Hash      `json:"stateRoot"        gencodec:"required"`
	TxHash      common.Hash      `json:"transactionsRoot" gencodec:"required"`
	ReceiptHash common.Hash      `json:"receiptsRoot"     gencodec:"required"`
	Bloom       types.Bloom      `json:"logsBloom"        gencodec:"required"`
	Difficulty  *hexutil.Big     `json:"difficulty"       gencodec:"required"`
	Number      *hexutil.Big     `json:"number"           gencodec:"required"`
	GasLimit    hexutil.Uint64   `json:"gasLimit"         gencodec:"required"`
	GasUsed     hexutil.Uint64   `json:"gasUsed"          gencodec:"required"`
	Time        hexutil.Uint64   `json:"timestamp"        gencodec:"required"`
	Extra       hexutil.Bytes    `json:"extraData"        gencodec:"required"`
	MixDigest   common.Hash      `json:"mixHash"`
	Nonce       types.BlockNonce `json:"nonce"`

	// BaseFee was added by EIP-1559 and is ignored in legacy headers.
	BaseFee *hexutil.Big `json:"baseFeePerGas" rlp:"optional"`

	// WithdrawalsHash was added by EIP-4895 and is ignored in legacy headers.
	WithdrawalsHash *common.Hash `json:"withdrawalsRoot" rlp:"optional"`

	// BlobGasUsed was added by EIP-4844 and is ignored in legacy headers.
	BlobGasUsed *hexutil.Uint64 `json:"blobGasUsed" rlp:"optional"`

	// ExcessBlobGas was added by EIP-4844 and is ignored in legacy headers.
	ExcessBlobGas *hexutil.Uint64 `json:"excessBlobGas" rlp:"optional"`

	// ParentBeaconRoot was added by EIP-4788 and is ignored in legacy headers.
	ParentBeaconRoot *common.Hash `json:"parentBeaconBlockRoot" rlp:"optional"`

	// RequestsHash was added by EIP-7685 and is ignored in legacy headers.
	RequestsHash *common.Hash `json:"requestsHash" rlp:"optional"`
}
type Log struct {
	Address common.Address `json:"address"`
	Topics  []common.Hash  `json:"topics"`
	Data    hexutil.Bytes  `json:"data"`

	BlockNumber hexutil.Uint64 `json:"blockNumber"`
	// hash of the transaction
	TxHash common.Hash `json:"transactionHash"`
	// index of the transaction in the block
	TxIndex hexutil.Uint `json:"transactionIndex"`
	// hash of the block in which the transaction was included
	BlockHash common.Hash `json:"blockHash"`
	// timestamp of the block in which the transaction was included
	BlockTimestamp hexutil.Uint64 `json:"blockTimestamp"`
	// index of the log in the block
	Index hexutil.Uint `json:"logIndex"`

	// You must pay attention to this field if you receive logs through a filter query.
	Removed bool `json:"removed"`
}

var (
	ReceiptStatusFailed     = types.ReceiptStatusFailed
	ReceiptStatusSuccessful = types.ReceiptStatusSuccessful
)

// UnmarshalJSON 实现自定义JSON解析，支持前导零的hex字符串
func (f *FlexUint64) UnmarshalJSON(data []byte) error {
	// 去掉引号
	if len(data) >= 2 && data[0] == '"' && data[len(data)-1] == '"' {
		data = data[1 : len(data)-1]
	}

	if len(data) == 0 {
		*f = 0
		return nil
	}

	// 检查hex前缀
	if len(data) >= 2 && data[0] == '0' && (data[1] == 'x' || data[1] == 'X') {
		data = data[2:]
	}

	// 处理空hex
	if len(data) == 0 {
		*f = 0
		return nil
	}

	// 解析hex
	val, err := strconv.ParseUint(string(data), 16, 64)
	if err != nil {
		return err
	}
	*f = FlexUint64(val)
	return nil
}

type Transaction struct {
	Hash                 common.Hash         `json:"hash"`
	Nonce                FlexUint64          `json:"nonce"`
	BlockHash            *common.Hash        `json:"blockHash"`
	BlockNumber          *hexutil.Big        `json:"blockNumber"`
	TransactionIndex     *hexutil.Uint       `json:"transactionIndex"`
	From                 common.Address      `json:"from"`
	To                   *common.Address     `json:"to"`
	Value                *hexutil.Big        `json:"value"`
	Gas                  FlexUint64          `json:"gas"`
	GasPrice             *hexutil.Big        `json:"gasPrice"`
	MaxFeePerGas         *hexutil.Big        `json:"maxFeePerGas,omitempty"`
	MaxPriorityFeePerGas *hexutil.Big        `json:"maxPriorityFeePerGas,omitempty"`
	Input                hexutil.Bytes       `json:"input"`
	Type                 FlexUint64          `json:"type"`
	V                    *hexutil.Big        `json:"v"`
	R                    *hexutil.Big        `json:"r"`
	S                    *hexutil.Big        `json:"s"`
	ChainID              *hexutil.Big        `json:"chainId,omitempty"`
	AccessList           []types.AccessTuple `json:"accessList,omitempty"`
	BlobVersionedHashes  []common.Hash       `json:"blobVersionedHashes,omitempty"`
	Receipt              *Receipt            `json:"-"`
}

// ToLegacyTx 将Transaction转换为LegacyTx（用于兼容）
func (rt *Transaction) ToLegacyTx() *types.LegacyTx {
	gasPrice := big.NewInt(0)
	if rt.GasPrice != nil {
		gasPrice = rt.GasPrice.ToInt()
	}
	value := big.NewInt(0)
	if rt.Value != nil {
		value = rt.Value.ToInt()
	}
	return &types.LegacyTx{
		Nonce:    uint64(rt.Nonce),
		GasPrice: gasPrice,
		Gas:      uint64(rt.Gas),
		To:       rt.To,
		Value:    value,
		Data:     rt.Input,
	}
}

func (rt *Transaction) EffectiveGasPrice(baseFee *big.Int) *big.Int {
	// 情况 1: Legacy 交易 (Type 0 或 1)
	if rt.GasPrice != nil && rt.GasPrice.ToInt().Sign() > 0 {
		return rt.GasPrice.ToInt()
	}

	// 情况 2: EIP-1559 交易 (Type 2)
	if rt.MaxFeePerGas != nil {
		maxFee := rt.MaxFeePerGas.ToInt()

		// 如果没有提供 baseFee (比如传入 nil)，则只能返回上限 MaxFee
		if baseFee == nil {
			return maxFee
		}

		// 计算 baseFee + tip
		tip := big.NewInt(0)
		if rt.MaxPriorityFeePerGas != nil {
			tip = rt.MaxPriorityFeePerGas.ToInt()
		}

		realPrice := new(big.Int).Add(baseFee, tip)

		// 取 min(maxFee, baseFee + tip)
		if realPrice.Cmp(maxFee) > 0 {
			return maxFee
		}
		return realPrice
	}

	// 兜底方案
	return big.NewInt(0)
}

type Block struct {
	Number           *hexutil.Big   `json:"number"`
	L1BlockNumber    *hexutil.Big   `json:"l1BlockNumber,omitempty"`
	Hash             common.Hash    `json:"hash"`
	ParentHash       common.Hash    `json:"parentHash"`
	Nonce            FlexUint64     `json:"nonce"`
	Sha3Uncles       common.Hash    `json:"sha3Uncles"`
	LogsBloom        hexutil.Bytes  `json:"logsBloom"`
	TransactionsRoot common.Hash    `json:"transactionsRoot"`
	StateRoot        common.Hash    `json:"stateRoot"`
	ReceiptsRoot     common.Hash    `json:"receiptsRoot"`
	Miner            common.Address `json:"miner"`
	Difficulty       *hexutil.Big   `json:"difficulty"`
	ExtraData        hexutil.Bytes  `json:"extraData"`
	Size             FlexUint64     `json:"size"`
	GasLimit         FlexUint64     `json:"gasLimit"`
	GasUsed          FlexUint64     `json:"gasUsed"`
	Timestamp        FlexUint64     `json:"timestamp"`
	Transactions     []Transaction  `json:"transactions"`
	Uncles           []common.Hash  `json:"uncles"`
	BaseFeePerGas    *hexutil.Big   `json:"baseFeePerGas,omitempty"`
	WithdrawalsRoot  *common.Hash   `json:"withdrawalsRoot,omitempty"`
}

// Receipt represents the results of a transaction.
type Receipt struct {
	// Consensus fields: These fields are defined by the Yellow Paper
	Type              hexutil.Uint   `json:"type,omitempty"`
	PostState         hexutil.Bytes  `json:"root"`
	Status            hexutil.Uint64 `json:"status"`
	CumulativeGasUsed hexutil.Uint64 `json:"cumulativeGasUsed"`
	Bloom             types.Bloom    `json:"logsBloom"`
	Logs              []*Log         `json:"logs"`

	// Implementation fields: These fields are added by geth when processing a transaction.
	TxHash            common.Hash     `json:"transactionHash"`
	ContractAddress   *common.Address `json:"contractAddress,omitempty"`
	GasUsed           hexutil.Uint64  `json:"gasUsed"`
	EffectiveGasPrice *hexutil.Big    `json:"effectiveGasPrice"` // required, but tag omitted for backwards compatibility
	BlobGasUsed       hexutil.Uint64  `json:"blobGasUsed,omitempty"`
	BlobGasPrice      *hexutil.Big    `json:"blobGasPrice,omitempty"`

	// Inclusion information: These fields provide information about the inclusion of the
	// transaction corresponding to this receipt.
	BlockHash        common.Hash  `json:"blockHash,omitempty"`
	BlockNumber      *hexutil.Big `json:"blockNumber,omitempty"`
	L1BlockNumber    *hexutil.Big `json:"l1BlockNumber,omitempty"`
	TransactionIndex hexutil.Uint `json:"transactionIndex"`
}
