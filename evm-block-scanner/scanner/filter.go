package scanner

import (
	"errors"
	"evm-scanner/parse"
	"strings"
	"sync"

	"github.com/ethereum/go-ethereum/common"
	ethtypes "github.com/ethereum/go-ethereum/core/types"
)

var ErrDuplicateFilter = errors.New("filter already exists")

type FilterArgs struct {
	From string `schema:"from"`
	To   string `schema:"to"`
}

// a 是用来匹配的数据，b 是匹配的条件
// 匹配成功返回 true
func CompareFilterArgs(a, b FilterArgs) bool {
	if b.From != "" && b.From != a.From {
		return false
	}
	if b.To != "" && b.To != a.To {
		return false
	}
	return true
}

func CompareFilterArgsWithTx(tx *parse.Transaction, b FilterArgs) bool {
	if b.From != "" && b.From != strings.ToLower(tx.From.Hex()) {
		return false
	}
	if b.To != "" && b.To != strings.ToLower(tx.To.Hex()) {
		return false
	}
	return true
}

func ResolveSubscribedAddress(tx *parse.Transaction, args FilterArgs) string {
	if tx == nil {
		return ""
	}
	from := strings.ToLower(tx.From.Hex())
	to := ""
	if tx.To != nil {
		to = strings.ToLower(tx.To.Hex())
	}
	if args.From != "" {
		if args.From == from {
			return from
		}
		return ""
	}
	if args.To != "" {
		if to != "" && args.To == to {
			return to
		}
		return ""
	}
	return ""
}

func ResolveSubscribedAddressFromFilter(tx *parse.Transaction, filter *Filter) string {
	if tx == nil || filter == nil {
		return ""
	}
	from := strings.ToLower(tx.From.Hex())
	if filter.ShouldProcess(FilterArgs{From: from, To: ""}) {
		return from
	}
	if tx.To == nil {
		return ""
	}
	to := strings.ToLower(tx.To.Hex())
	if to != "" && filter.ShouldProcess(FilterArgs{From: "", To: to}) {
		return to
	}
	return ""
}

type Filter struct {
	m sync.Map
}

// Clear removes all filter entries.
func (f *Filter) Clear() {
	f.m.Range(func(key, value any) bool {
		f.m.Delete(key)
		return true
	})
}

func (f *Filter) Add(key any, args FilterArgs) error {
	if _, loaded := f.m.LoadOrStore(key, args); loaded {
		return ErrDuplicateFilter
	}
	return nil
}

func (f *Filter) Remove(key any) {
	f.m.Delete(key)
}

func (f *Filter) ShouldProcess(data FilterArgs) bool {
	var matched bool
	f.m.Range(func(key, value any) bool {
		args := value.(FilterArgs)
		ok := CompareFilterArgs(data, args)
		if ok {
			matched = true
			return false // 停止遍历
		}
		return true // 继续遍历
	})
	return matched
}

// ShouldProcessParsedTx 检查解析后的交易是否应该被处理
// 会检查交易中所有涉及的地址，包括：
// 1. tx.From / tx.To (原生代币转账)
// 2. ERC20TransferEvent 中的 From/To (代币转账)
// 3. ERC20ApprovalEvent 中的 Owner/Spender (代币授权)
// 注意：不检查 InternalTransactions，因为默认不解析（需要 trace API，性能开销大）
func (f *Filter) ShouldProcessParsedTx(tx *parse.Transaction) bool {
	if tx == nil {
		return false
	}

	// 检查交易的 From
	from := strings.ToLower(tx.From.Hex())
	if f.ShouldProcess(FilterArgs{From: from}) {
		return true
	}

	// 检查交易的 To
	if tx.To != nil {
		to := strings.ToLower(tx.To.Hex())
		if f.ShouldProcess(FilterArgs{To: to}) {
			return true
		}
	}

	// 检查 Logs 中的地址
	for _, log := range tx.Logs {
		switch v := log.(type) {
		case *parse.ERC20TransferEvent:
			// 检查 ERC20 转账的 From 和 To
			transferFrom := strings.ToLower(v.From.Hex())
			transferTo := strings.ToLower(v.To.Hex())
			if f.ShouldProcess(FilterArgs{From: transferFrom}) ||
				f.ShouldProcess(FilterArgs{To: transferTo}) {
				return true
			}

		case *parse.ERC20ApprovalEvent:
			// 检查 ERC20 授权的 Owner 和 Spender
			owner := strings.ToLower(v.Owner.Hex())
			spender := strings.ToLower(v.Spender.Hex())
			if f.ShouldProcess(FilterArgs{From: owner}) ||
				f.ShouldProcess(FilterArgs{To: spender}) {
				return true
			}
		}
	}

	return false
}

// WatchedAddresses collects all unique addresses from the filter entries.
func (f *Filter) WatchedAddresses() []common.Address {
	var addrs []common.Address
	seen := make(map[common.Address]bool)
	f.m.Range(func(key, value any) bool {
		args := value.(FilterArgs)
		if args.From != "" {
			addr := common.HexToAddress(args.From)
			if !seen[addr] {
				seen[addr] = true
				addrs = append(addrs, addr)
			}
		}
		if args.To != "" {
			addr := common.HexToAddress(args.To)
			if !seen[addr] {
				seen[addr] = true
				addrs = append(addrs, addr)
			}
		}
		return true
	})
	return addrs
}

// ReceiptMayContainWatchedAddress uses the receipt bloom filter to quickly check
// if any watched address might appear in the receipt's logs.
// False positives are possible; false negatives are not.
func (f *Filter) ReceiptMayContainWatchedAddress(bloom ethtypes.Bloom, watchedAddrs []common.Address) bool {
	for _, addr := range watchedAddrs {
		// 检查地址是否作为日志发射者（20 字节）
		if ethtypes.BloomLookup(bloom, addr) {
			return true
		}
		// 检查地址是否出现在事件 topic 中（32 字节，左填充零）
		// ERC20 Transfer/Approval 事件的 from/to 地址存储在 topic 中，
		// bloom filter 中以 32 字节哈希形式存在，需要额外检查
		if ethtypes.BloomLookup(bloom, common.BytesToHash(addr.Bytes())) {
			return true
		}
	}
	return false
}
