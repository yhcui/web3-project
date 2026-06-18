package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"golang.org/x/time/rate"
)

var ErrHistoryProviderUnavailable = fmt.Errorf("history provider unavailable")

// BlockscoutClient calls Etherscan-compatible Blockscout v1 account APIs.
// hosts key is chain id string (e.g. "8453"), value is base API url
// (e.g. "https://base.blockscout.com/api").
type BlockscoutClient struct {
	*rate.Limiter
	hostsByChain map[uint64]string
	httpClient   *http.Client
}

func NewBlockscoutClient(hosts map[string]string, rateLimit int) *BlockscoutClient {
	if rateLimit <= 0 {
		rateLimit = 2
	}
	resolved := make(map[uint64]string, len(hosts))
	for chainIDText, host := range hosts {
		chainIDText = strings.TrimSpace(chainIDText)
		host = normalizeBlockscoutHost(host)
		if chainIDText == "" || host == "" {
			continue
		}
		chainID, err := strconv.ParseUint(chainIDText, 10, 64)
		if err != nil {
			continue
		}
		resolved[chainID] = host
	}
	return &BlockscoutClient{
		Limiter:      rate.NewLimiter(rate.Limit(rateLimit), 1),
		hostsByChain: resolved,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (c *BlockscoutClient) Name() string {
	return "blockscout-v1"
}

func (c *BlockscoutClient) Get(ctx context.Context, chainID uint64, args url.Values, v any) error {
	host, ok := c.hostsByChain[chainID]
	if !ok || strings.TrimSpace(host) == "" {
		return fmt.Errorf("%w: chain_id=%d provider=%s", ErrHistoryProviderUnavailable, chainID, c.Name())
	}
	if err := c.Limiter.Wait(ctx); err != nil {
		return err
	}

	query := cloneValues(args)
	query.Del("chainid")
	fullURL := host + "?" + query.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fullURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("http request failed: %s", resp.Status)
	}

	var data struct {
		Status  string `json:"status"`
		Message string `json:"message"`
		Result  any    `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return fmt.Errorf("failed to decode response: %w", err)
	}

	if data.Status != "1" {
		message := strings.ToLower(strings.TrimSpace(data.Message))
		if message == "no transactions found" {
			return ErrEtherscanNoTransactionsFound
		}
		if resultText, ok := data.Result.(string); ok {
			lowerResult := strings.ToLower(strings.TrimSpace(resultText))
			if lowerResult == "no transactions found" {
				return ErrEtherscanNoTransactionsFound
			}
			if strings.Contains(lowerResult, "max rate limit reached") {
				return ErrEtherscanMaxRateLimitReached
			}
		}
		if strings.Contains(message, "max rate limit reached") {
			return ErrEtherscanMaxRateLimitReached
		}
		return fmt.Errorf("blockscout error: status=%s message=%s", data.Status, data.Message)
	}

	raw, err := json.Marshal(data.Result)
	if err != nil {
		return fmt.Errorf("failed to marshal result: %w", err)
	}
	if err := json.Unmarshal(raw, v); err != nil {
		return fmt.Errorf("failed to decode result: %w", err)
	}
	return nil
}

func normalizeBlockscoutHost(host string) string {
	host = strings.TrimSpace(host)
	host = strings.TrimSuffix(host, "/")
	if host == "" {
		return ""
	}
	if strings.HasSuffix(host, "/api") {
		return host
	}
	return host + "/api"
}

func cloneValues(v url.Values) url.Values {
	out := make(url.Values, len(v))
	for key, list := range v {
		dup := make([]string, len(list))
		copy(dup, list)
		out[key] = dup
	}
	return out
}
