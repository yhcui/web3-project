package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadFailoverBackoffDefaultsAndClamp(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	cfgPath := filepath.Join(dir, "config.yaml")
	yaml := `
server_address: ":7788"
etherscan_api_key: ""
etherscan_api_prs: 2
endpoints:
  - name: "ETH"
    chain: "eth"
    interval: 5000
    failover_backoff_ms: 0
    urls:
      - url: "https://rpc.example/eth"
        prs: 10
  - name: "BSC"
    chain: "bsc"
    interval: 3000
    failover_backoff_ms: 20
    urls:
      - url: "https://rpc.example/bsc"
        prs: 10
  - name: "ARB"
    chain: "arb"
    interval: 3000
    failover_backoff_ms: 60000
    urls:
      - url: "https://rpc.example/arb"
        prs: 10
gateway:
  enabled: false
  url: ""
  reconnect_interval_ms: 5000
  ping_interval_ms: 30000
`
	if err := os.WriteFile(cfgPath, []byte(yaml), 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}

	cfg, err := Load(cfgPath)
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if len(cfg.Endpoints) != 3 {
		t.Fatalf("unexpected endpoint count: %d", len(cfg.Endpoints))
	}

	if got := cfg.Endpoints[0].FailoverBackoffMS; got != 750 {
		t.Fatalf("default failover_backoff_ms mismatch: got=%d want=750", got)
	}
	if got := cfg.Endpoints[1].FailoverBackoffMS; got != 100 {
		t.Fatalf("min-clamped failover_backoff_ms mismatch: got=%d want=100", got)
	}
	if got := cfg.Endpoints[2].FailoverBackoffMS; got != 10000 {
		t.Fatalf("max-clamped failover_backoff_ms mismatch: got=%d want=10000", got)
	}
}
