package main

import (
	"evm-scanner/common/rate"
	"fmt"
	"strings"
	"testing"
)

func TestFormatStats(t *testing.T) {
	stats := AllStats{
		"ETH": {
			"api.eth.com": {
				"eth_blockNumber": {
					"SubscribeBlock":   {Count: 1000000, Prev: 80, RPCTotalNS: 2_000_000_000, RPCMaxNS: 10_000_000, TotalTotalNS: 5_000_000_000, TotalMaxNS: 12_000_000},
					"getBlockByNumber": {Count: 50, Prev: 40, RPCTotalNS: 250_000_000, RPCMaxNS: 8_000_000, TotalTotalNS: 500_000_000, TotalMaxNS: 10_000_000},
				},
				"eth_getBalance": {
					"DiscoverTokenBalances": {Count: 30, Prev: 20, RPCTotalNS: 90_000_000, RPCMaxNS: 5_000_000, TotalTotalNS: 120_000_000, TotalMaxNS: 7_000_000},
				},
			},
			"rpc.eth.com": {
				"eth_blockNumber": {
					"SubscribeBlock": {Count: 200, Prev: 150, RPCTotalNS: 400_000_000, RPCMaxNS: 9_000_000, TotalTotalNS: 700_000_000, TotalMaxNS: 11_000_000},
				},
			},
		},
		"Polygon": {
			"rpc.polygon.abc": {
				"eth_blockNumber": {
					"SubscribeBlock": {Count: 80, Prev: 60, RPCTotalNS: 160_000_000, RPCMaxNS: 4_000_000, TotalTotalNS: 240_000_000, TotalMaxNS: 6_000_000},
				},
			},
		},
	}

	output := FormatStats(stats, "2024/1/1 10:00")
	t.Log("Output:\n" + output)
	fmt.Println("=== OUTPUT ===")
	fmt.Println(output)
	fmt.Println("=== END ===")
}

func TestAddStatCountAggregatesSameHost(t *testing.T) {
	stats := make(AllStats)
	prevStats := AllStats{
		"BSC": {
			"api.zan.top": {
				"eth_getTransactionReceipt": {
					"Parse Transaction": {Count: 20},
				},
			},
		},
	}
	nextPrevStats := make(AllStats)

	addStatCount(stats, prevStats, nextPrevStats, "BSC", "api.zan.top", "eth_getTransactionReceipt", "Parse Transaction", rate.Metric{Count: 30, RPCTotalNS: 90_000_000, RPCMaxNS: 7_000_000, TotalTotalNS: 120_000_000, TotalMaxNS: 9_000_000})
	addStatCount(stats, prevStats, nextPrevStats, "BSC", "api.zan.top", "eth_getTransactionReceipt", "Parse Transaction", rate.Metric{Count: 12, RPCTotalNS: 48_000_000, RPCMaxNS: 8_000_000, TotalTotalNS: 72_000_000, TotalMaxNS: 10_000_000})

	got := stats["BSC"]["api.zan.top"]["eth_getTransactionReceipt"]["Parse Transaction"]
	if got == nil {
		t.Fatalf("stat not created")
	}
	if got.Count != 42 {
		t.Fatalf("unexpected aggregated count: got=%d want=42", got.Count)
	}
	if got.Prev != 20 {
		t.Fatalf("unexpected prev count: got=%d want=20", got.Prev)
	}
	if got.RPCTotalNS != 138_000_000 {
		t.Fatalf("unexpected rpc total ns: got=%d want=138000000", got.RPCTotalNS)
	}
	if got.RPCMaxNS != 8_000_000 {
		t.Fatalf("unexpected rpc max ns: got=%d want=8000000", got.RPCMaxNS)
	}
	if got.TotalTotalNS != 192_000_000 {
		t.Fatalf("unexpected total total ns: got=%d want=192000000", got.TotalTotalNS)
	}
	if got.TotalMaxNS != 10_000_000 {
		t.Fatalf("unexpected total max ns: got=%d want=10000000", got.TotalMaxNS)
	}

	next := nextPrevStats["BSC"]["api.zan.top"]["eth_getTransactionReceipt"]["Parse Transaction"]
	if next == nil {
		t.Fatalf("next prev stat not created")
	}
	if next.Count != 42 {
		t.Fatalf("unexpected next prev aggregated count: got=%d want=42", next.Count)
	}
	if next.RPCTotalNS != 138_000_000 || next.TotalTotalNS != 192_000_000 {
		t.Fatalf("unexpected next prev durations: got_rpc=%d got_total=%d", next.RPCTotalNS, next.TotalTotalNS)
	}
}

func TestFormatStatsNegativeGrowthFormatting(t *testing.T) {
	stats := AllStats{
		"BSC": {
			"api.zan.top": {
				"eth_getTransactionReceipt": {
					"Parse Transaction": {Count: 42, Prev: 20, RPCTotalNS: 84_000_000, RPCMaxNS: 3_000_000, TotalTotalNS: 126_000_000, TotalMaxNS: 5_000_000},
				},
			},
		},
	}

	output := FormatStats(stats, "2024/1/1 10:00")
	if !strings.Contains(output, "42") {
		t.Fatalf("output missing total count: %s", output)
	}
	if !strings.Contains(output, "20") {
		t.Fatalf("output missing prev count: %s", output)
	}
	if !strings.Contains(output, "+22") {
		t.Fatalf("output missing positive growth: %s", output)
	}
	if !strings.Contains(output, "2.0ms") {
		t.Fatalf("output missing avg duration: %s", output)
	}
	if !strings.Contains(output, "5.0ms") {
		t.Fatalf("output missing max duration: %s", output)
	}
}

func TestCollectStatsAggregatesSameHostAcrossClients(t *testing.T) {
	prevStats := AllStats{
		"BSC": {
			"api.zan.top": {
				"eth_getBlockByNumber": {
					"Client.getBlock": {Count: 10},
				},
			},
		},
	}

	sources := []statSource{
		{
			chain:    "BSC",
			endpoint: "api.zan.top",
			metrics: map[string]map[string]rate.Metric{
				"eth_getBlockByNumber": {
					"Client.getBlock": {Count: 20, RPCTotalNS: 40_000_000, RPCMaxNS: 3_000_000, TotalTotalNS: 60_000_000, TotalMaxNS: 5_000_000},
				},
			},
		},
		{
			chain:    "BSC",
			endpoint: "api.zan.top",
			metrics: map[string]map[string]rate.Metric{
				"eth_getBlockByNumber": {
					"Client.getBlock": {Count: 22, RPCTotalNS: 66_000_000, RPCMaxNS: 4_000_000, TotalTotalNS: 88_000_000, TotalMaxNS: 6_000_000},
				},
			},
		},
	}

	stats, nextPrevStats := collectStatsFromSources(sources, prevStats)

	got := stats["BSC"]["api.zan.top"]["eth_getBlockByNumber"]["Client.getBlock"]
	if got == nil {
		t.Fatalf("stat not created")
	}
	if got.Count != 42 {
		t.Fatalf("unexpected aggregated count: got=%d want=42", got.Count)
	}
	if got.Prev != 10 {
		t.Fatalf("unexpected prev count: got=%d want=10", got.Prev)
	}
	if got.RPCTotalNS != 106_000_000 || got.TotalTotalNS != 148_000_000 {
		t.Fatalf("unexpected duration aggregation: got_rpc=%d got_total=%d", got.RPCTotalNS, got.TotalTotalNS)
	}
	if got.RPCMaxNS != 4_000_000 || got.TotalMaxNS != 6_000_000 {
		t.Fatalf("unexpected max duration aggregation: got_rpc=%d got_total=%d", got.RPCMaxNS, got.TotalMaxNS)
	}

	next := nextPrevStats["BSC"]["api.zan.top"]["eth_getBlockByNumber"]["Client.getBlock"]
	if next == nil {
		t.Fatalf("next prev stat not created")
	}
	if next.Count != 42 {
		t.Fatalf("unexpected next prev aggregated count: got=%d want=42", next.Count)
	}
	if next.RPCTotalNS != 106_000_000 || next.TotalTotalNS != 148_000_000 {
		t.Fatalf("unexpected next prev duration aggregation: got_rpc=%d got_total=%d", next.RPCTotalNS, next.TotalTotalNS)
	}
	if next.RPCMaxNS != 4_000_000 || next.TotalMaxNS != 6_000_000 {
		t.Fatalf("unexpected next prev max aggregation: got_rpc=%d got_total=%d", next.RPCMaxNS, next.TotalMaxNS)
	}
}
