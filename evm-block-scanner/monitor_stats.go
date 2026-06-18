package main

import (
	"evm-scanner/common/rate"
	"evm-scanner/scanner"
)

type statSource struct {
	chain    string
	endpoint string
	metrics  map[string]map[string]rate.Metric
}

func collectStatsFromSources(sources []statSource, prevStats AllStats) (AllStats, AllStats) {
	stats := make(AllStats)
	if prevStats == nil {
		prevStats = make(AllStats)
	}
	nextPrevStats := make(AllStats)

	for _, source := range sources {
		for method, callerMap := range source.metrics {
			for caller, metric := range callerMap {
				addStatCount(stats, prevStats, nextPrevStats, source.chain, source.endpoint, method, caller, metric)
			}
		}
	}

	return stats, nextPrevStats
}

func CollectStats(scanners []*scanner.Scanner, prevStats AllStats) (AllStats, AllStats) {
	sources := make([]statSource, 0)

	for _, sc := range scanners {
		chainName := sc.Name

		for i := range sc.Client.Endpoint.Clients {
			clientWrapper := &sc.Client.Endpoint.Clients[i]
			sources = append(sources, statSource{
				chain:    chainName,
				endpoint: clientWrapper.Inner.String(),
				metrics:  clientWrapper.Inner.Count(),
			})
		}
	}

	return collectStatsFromSources(sources, prevStats)
}
