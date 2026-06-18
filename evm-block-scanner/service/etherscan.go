package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/go-viper/mapstructure/v2"
	"golang.org/x/time/rate"
)

var ErrEtherscanNoTransactionsFound = fmt.Errorf("no transactions found")
var ErrEtherscanMaxRateLimitReached = fmt.Errorf("max rate limit reached")
var ErrEtherscanChainNotSupported = fmt.Errorf("chain not supported by etherscan api key")

type EtherscanClient struct {
	*rate.Limiter
	apiKey string
}

func NewEtherscanClient(apiKey string, rateLimit int) *EtherscanClient {
	return &EtherscanClient{
		Limiter: rate.NewLimiter(rate.Limit(rateLimit), 1),
		apiKey:  apiKey,
	}
}

func (c *EtherscanClient) Name() string {
	return "etherscan-v2"
}

func (c *EtherscanClient) Get(ctx context.Context, chainId uint64, args url.Values, v any) error {
	// 0. 限流
	if err := c.Limiter.Wait(ctx); err != nil {
		return err
	}
	// 1. 定义 API Host
	var apiHost string = "api.etherscan.io/v2"

	// 2. 插入 API Key
	args.Set("apiKey", c.apiKey)

	// 3. 构造完整的 URL
	fullURL := fmt.Sprintf("https://%s/api?%s", apiHost, args.Encode())

	// 4. 发起请求
	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("http request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("http request failed: %s", resp.Status)
	}

	// 5. 定义内部结构解析 JSON
	var data struct {
		Status  string `json:"status"`
		Message string `json:"message"`
		Result  any    `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return fmt.Errorf("failed to decode response: %v", err)
	}

	// 6. 逻辑判断
	// Status "0" 配合 "No transactions found" 属于正常业务逻辑，表示该地址没发过交易
	if data.Status != "1" {
		if data.Message == "No transactions found" {
			return fmt.Errorf("etherscan error: %s (message: %w)", data.Status, ErrEtherscanNoTransactionsFound)
		}
		if r, ok := data.Result.(string); ok {
			if strings.Contains(strings.ToLower(r), "not supported for this chain") {
				return fmt.Errorf("etherscan error: %s (message: %w)", data.Status, ErrEtherscanChainNotSupported)
			}
		}
		if data.Message == "NOTOK" {
			if r, ok := data.Result.(string); ok {
				if r == "Max rate limit reached" || strings.HasPrefix(r, "Max calls per sec rate limit reached") {
					return fmt.Errorf("etherscan error: %s (NOTOK: %w)", data.Status, ErrEtherscanMaxRateLimitReached)
				} else {
					return fmt.Errorf("etherscan error: %s (NOTOK: %s)", data.Status, r)
				}
			}
		}
		return fmt.Errorf("etherscan error: %s (message: %s)", data.Status, data.Message)
	}

	if err := mapstructure.Decode(data.Result, v); err != nil {
		return fmt.Errorf("failed to decode result: %v", err)
	}
	return nil
}
