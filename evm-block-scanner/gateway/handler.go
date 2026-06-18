package gateway

import (
	"encoding/json"
	"log"
	"strings"

	"evm-scanner/adapter"
	"evm-scanner/parse"
	"evm-scanner/scanner"
)

func (c *Client) NewHandler(filter *scanner.Filter) func(*parse.Transaction) {
	return func(tx *parse.Transaction) {
		if c == nil || !c.IsConnected() {
			log.Printf("[Gateway] handler skip: not connected, tx=%s", tx.Hash.Hex())
			return
		}

		subscribedAddrs := resolveSubscribedAddresses(tx, filter)
		if len(subscribedAddrs) == 0 {
			log.Printf("[Gateway] handler skip: no subscribed address resolved, tx=%s", tx.Hash.Hex())
			return
		}

		for _, subscribedAddr := range subscribedAddrs {
			normalized, err := adapter.Normalize(tx, subscribedAddr)
			if err != nil || normalized == nil {
				log.Printf("[Gateway] handler skip: normalize failed, tx=%s addr=%s err=%v", tx.Hash.Hex(), subscribedAddr, err)
				continue
			}

			payload, err := json.Marshal(normalized)
			if err != nil {
				log.Printf("[Gateway] handler skip: marshal failed, tx=%s addr=%s err=%v", tx.Hash.Hex(), subscribedAddr, err)
				continue
			}

			if err := c.SendActivity(normalized.Chain, payload); err != nil {
				log.Printf("[Gateway] handler send failed: tx=%s addr=%s err=%v", tx.Hash.Hex(), subscribedAddr, err)
			}
		}
	}
}

func resolveSubscribedAddresses(tx *parse.Transaction, filter *scanner.Filter) []string {
	if tx == nil || filter == nil {
		return nil
	}

	addrs := make([]string, 0, 2)
	seen := make(map[string]struct{})
	add := func(addr string) {
		addr = strings.ToLower(strings.TrimSpace(addr))
		if addr == "" {
			return
		}
		if !isSubscribedAddress(filter, addr) {
			return
		}
		if _, ok := seen[addr]; ok {
			return
		}
		seen[addr] = struct{}{}
		addrs = append(addrs, addr)
	}

	add(tx.From.Hex())
	if tx.To != nil {
		add(tx.To.Hex())
	}

	for _, lg := range tx.Logs {
		switch ev := lg.(type) {
		case *parse.ERC20TransferEvent:
			add(ev.From.Hex())
			add(ev.To.Hex())
		case *parse.ERC20ApprovalEvent:
			add(ev.Owner.Hex())
		}
	}
	for _, itx := range tx.InternalTxs {
		add(itx.From.Hex())
		add(itx.To.Hex())
	}

	return addrs
}

func isSubscribedAddress(filter *scanner.Filter, addr string) bool {
	return filter.ShouldProcess(scanner.FilterArgs{From: addr, To: ""}) ||
		filter.ShouldProcess(scanner.FilterArgs{From: "", To: addr})
}
