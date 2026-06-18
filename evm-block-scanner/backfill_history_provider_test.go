package main

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"testing"

	"evm-scanner/service"
)

type mockHistoryProvider struct {
	name string
	get  func(ctx context.Context, chainID uint64, args url.Values, v any) error
}

func (m mockHistoryProvider) Name() string { return m.name }

func (m mockHistoryProvider) Get(ctx context.Context, chainID uint64, args url.Values, v any) error {
	return m.get(ctx, chainID, args, v)
}

func TestFetchHistoryTxPageFallbackToSecondProvider(t *testing.T) {
	t.Parallel()

	first := mockHistoryProvider{
		name: "etherscan-v2",
		get: func(ctx context.Context, chainID uint64, args url.Values, v any) error {
			return service.ErrEtherscanChainNotSupported
		},
	}
	second := mockHistoryProvider{
		name: "blockscout-v1",
		get: func(ctx context.Context, chainID uint64, args url.Values, v any) error {
			out, ok := v.(*[]etherscanNormalTx)
			if !ok {
				t.Fatalf("unexpected target type: %T", v)
			}
			*out = []etherscanNormalTx{{Hash: "0xabc"}}
			return nil
		},
	}

	out, providerName, err := fetchHistoryTxPage[etherscanNormalTx](
		context.Background(),
		[]service.HistoryProvider{first, second},
		8453,
		"txlist",
		"0xabc",
		0,
		99999999,
		1,
		100,
	)
	if err != nil {
		t.Fatalf("fetchHistoryTxPage failed: %v", err)
	}
	if providerName != "blockscout-v1" {
		t.Fatalf("provider mismatch: got=%s", providerName)
	}
	if len(out) != 1 || out[0].Hash != "0xabc" {
		t.Fatalf("unexpected result: %+v", out)
	}
}

func TestFetchHistoryTxPageNoTransactionsFound(t *testing.T) {
	t.Parallel()

	first := mockHistoryProvider{
		name: "etherscan-v2",
		get: func(ctx context.Context, chainID uint64, args url.Values, v any) error {
			return service.ErrEtherscanNoTransactionsFound
		},
	}
	second := mockHistoryProvider{
		name: "blockscout-v1",
		get: func(ctx context.Context, chainID uint64, args url.Values, v any) error {
			t.Fatalf("second provider should not be called on no-transactions")
			return nil
		},
	}

	out, providerName, err := fetchHistoryTxPage[etherscanNormalTx](
		context.Background(),
		[]service.HistoryProvider{first, second},
		1,
		"txlist",
		"0xabc",
		0,
		99999999,
		1,
		100,
	)
	if err != nil {
		t.Fatalf("fetchHistoryTxPage failed: %v", err)
	}
	if providerName != "etherscan-v2" {
		t.Fatalf("provider mismatch: got=%s", providerName)
	}
	if out != nil {
		t.Fatalf("expected nil result on no transactions, got=%+v", out)
	}
}

func TestFetchHistoryTxPageKeepPreviousErrorWhenNextUnavailable(t *testing.T) {
	t.Parallel()

	first := mockHistoryProvider{
		name: "etherscan-v2",
		get: func(ctx context.Context, chainID uint64, args url.Values, v any) error {
			return errors.New("rate limit")
		},
	}
	second := mockHistoryProvider{
		name: "blockscout-v1",
		get: func(ctx context.Context, chainID uint64, args url.Values, v any) error {
			return service.ErrHistoryProviderUnavailable
		},
	}

	_, _, err := fetchHistoryTxPage[etherscanNormalTx](
		context.Background(),
		[]service.HistoryProvider{first, second},
		8453,
		"txlist",
		"0xabc",
		0,
		99999999,
		1,
		100,
	)
	if err == nil {
		t.Fatalf("expected error")
	}
	if got := err.Error(); got == "" || !strings.Contains(got, "provider=etherscan-v2") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestFetchHistoryTxPageEmptyProviders(t *testing.T) {
	t.Parallel()

	_, _, err := fetchHistoryTxPage[etherscanNormalTx](
		context.Background(),
		nil,
		1,
		"txlist",
		"0xabc",
		0,
		99999999,
		1,
		100,
	)
	if err == nil {
		t.Fatalf("expected error")
	}
}
