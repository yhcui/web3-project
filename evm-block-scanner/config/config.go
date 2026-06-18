package config

import (
	"evm-scanner/pkg/logger"
	"os"

	"gopkg.in/yaml.v3"
)

type URL struct {
	PRS float64 `yaml:"prs"`
	URL string  `yaml:"url"`
}

type Endpoint struct {
	Name                string `yaml:"name"`
	Chain               string `yaml:"chain"`
	Interval            int    `yaml:"interval"`
	Urls                []URL  `yaml:"urls"`
	L1                  string `yaml:"l1"`
	FailoverBackoffMS   int    `yaml:"failover_backoff_ms"`
	MulticallBatchSize  int    `yaml:"multicall_batch_size"`
	DiscoveryWorkers    int    `yaml:"discovery_workers"`
	MaxWorkers          int    `yaml:"max_workers"`
	BaseCooldown        int    `yaml:"base_cooldown"`
	HeightCheckInterval int    `yaml:"height_check_interval_sec"` // 定期高度检查间隔（秒）
}

// GatewayConfig gateway connection config.
type GatewayConfig struct {
	Enabled           bool   `yaml:"enabled"`
	URL               string `yaml:"url"`
	ReconnectInterval int    `yaml:"reconnect_interval_ms"`
	PingInterval      int    `yaml:"ping_interval_ms"`
}

type HistoryFallbackConfig struct {
	BlockscoutHosts map[string]string `yaml:"blockscout_hosts"`
	BlockscoutPRS   int               `yaml:"blockscout_prs"`
}

type Config struct {
	Log             logger.Config         `yaml:"log"`
	ServerAddress   string                `yaml:"server_address"`
	EtherscanApiKey string                `yaml:"etherscan_api_key"`
	EtherscanApiPRS int                   `yaml:"etherscan_api_prs"`
	SkipCatchUp     bool                  `yaml:"skip_catch_up"` // 重启时跳过追块，直接从最新区块开始
	Endpoints       []Endpoint            `yaml:"endpoints"`
	Gateway         GatewayConfig         `yaml:"gateway"`
	HistoryFallback HistoryFallbackConfig `yaml:"history_fallback"`
}

func Load(file string) (*Config, error) {
	data, err := os.ReadFile(file)
	if err != nil {
		return nil, err
	}

	var temp Config
	if err := yaml.Unmarshal(data, &temp); err != nil {
		return nil, err
	}

	for i := range temp.Endpoints {
		if temp.Endpoints[i].Interval == 0 {
			temp.Endpoints[i].Interval = 10_000
		}
		if temp.Endpoints[i].FailoverBackoffMS <= 0 {
			temp.Endpoints[i].FailoverBackoffMS = 750
		}
		if temp.Endpoints[i].FailoverBackoffMS < 100 {
			temp.Endpoints[i].FailoverBackoffMS = 100
		}
		if temp.Endpoints[i].FailoverBackoffMS > 10000 {
			temp.Endpoints[i].FailoverBackoffMS = 10000
		}
		if temp.Endpoints[i].MulticallBatchSize <= 0 {
			temp.Endpoints[i].MulticallBatchSize = 1000
		}
		if temp.Endpoints[i].MulticallBatchSize > 2000 {
			temp.Endpoints[i].MulticallBatchSize = 2000
		}
		if temp.Endpoints[i].DiscoveryWorkers <= 0 {
			temp.Endpoints[i].DiscoveryWorkers = 32
		}
		if temp.Endpoints[i].DiscoveryWorkers > 128 {
			temp.Endpoints[i].DiscoveryWorkers = 128
		}
		if temp.Endpoints[i].MaxWorkers <= 0 {
			temp.Endpoints[i].MaxWorkers = 10
		}
		if temp.Endpoints[i].BaseCooldown <= 0 {
			temp.Endpoints[i].BaseCooldown = 5
		}
		if temp.Endpoints[i].HeightCheckInterval <= 0 {
			// 默认 30 秒，快速出块链（interval < 10s）默认 15 秒
			if temp.Endpoints[i].Interval < 10_000 {
				temp.Endpoints[i].HeightCheckInterval = 15
			} else {
				temp.Endpoints[i].HeightCheckInterval = 30
			}
		}
		for t := range temp.Endpoints[i].Urls {
			if temp.Endpoints[i].Urls[t].PRS == 0 {
				temp.Endpoints[i].Urls[t].PRS = 10
			}
		}
	}

	if temp.HistoryFallback.BlockscoutPRS <= 0 {
		temp.HistoryFallback.BlockscoutPRS = 2
	}

	return &temp, nil
}
