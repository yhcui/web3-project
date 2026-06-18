package adapter

import (
	"math/big"
	"strings"
	"testing"

	"evm-scanner/parse"
	"evm-scanner/token"
	"github.com/ethereum/go-ethereum/common"
)

func TestNormalize_DoesNotMarkSelectorOnlyApproveAsApproval(t *testing.T) {
	from := common.HexToAddress("0x3508D90900f8dEB79ca19769F206E1C5b668FCe0")
	to := common.HexToAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")

	tx := &parse.Transaction{
		Hash:   common.HexToHash("0x8c1e390bb701fe57a1233ca45d680a63f2c3521dcadd04b52ff8e0d4d5ed9f12"),
		Origin: "bsc",
		From:   from,
		To:     &to,
		Value:  big.NewInt(0),
		InputData: &parse.InputData{
			Method: "approve",
		},
	}

	got, err := Normalize(tx, from.Hex())
	if err != nil {
		t.Fatalf("Normalize() error = %v", err)
	}

	if got.EventType == "approval" || got.EventType == "revoke" {
		t.Fatalf("selector-only approve tx should not be classified as approval, got %q", got.EventType)
	}
}

func TestNormalize_UsesRealApprovalEventForApproval(t *testing.T) {
	from := common.HexToAddress("0x3508D90900f8dEB79ca19769F206E1C5b668FCe0")
	spender := common.HexToAddress("0x1111111111111111111111111111111111111111")
	tokenAddr := common.HexToAddress("0x2222222222222222222222222222222222222222")

	tx := &parse.Transaction{
		Hash:   common.HexToHash("0x533f9c6f9008562d60e9b9b07da90fee451ad596d1284ad8305015649a79530b"),
		Origin: "bsc",
		From:   from,
		Value:  big.NewInt(0),
		Logs: []any{
			&parse.ERC20ApprovalEvent{
				Type:          "ERC-20",
				Method:        "Approval",
				Owner:         from,
				Spender:       spender,
				Value:         big.NewInt(123456),
				ValueFormated: "0.123456",
				TokenAddress:  tokenAddr,
				TokenInfo: &token.Info{
					Symbol:   "USDT",
					Decimals: 6,
					Name:     "Tether USD",
				},
			},
		},
	}

	got, err := Normalize(tx, from.Hex())
	if err != nil {
		t.Fatalf("Normalize() error = %v", err)
	}

	if got.EventType != "approval" {
		t.Fatalf("expected approval event type, got %q", got.EventType)
	}
	if got.TokenContract != strings.ToLower(tokenAddr.Hex()) {
		t.Fatalf("expected token contract %s, got %s", strings.ToLower(tokenAddr.Hex()), got.TokenContract)
	}
	if got.Amount != "123456" {
		t.Fatalf("expected approval amount 123456, got %s", got.Amount)
	}
	if got.AmountFormatted != "0.123456" {
		t.Fatalf("expected formatted approval amount 0.123456, got %s", got.AmountFormatted)
	}
}
