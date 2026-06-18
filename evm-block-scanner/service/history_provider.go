package service

import (
	"context"
	"net/url"
)

// HistoryProvider fetches paged transaction history for a chain.
type HistoryProvider interface {
	Name() string
	Get(ctx context.Context, chainID uint64, args url.Values, v any) error
}
