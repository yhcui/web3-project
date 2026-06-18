package main

import (
	"evm-scanner/common/rate"
	"fmt"
	"sort"
	"time"

	"github.com/jedib0t/go-pretty/v6/table"
	"github.com/jedib0t/go-pretty/v6/text"
)

type StatData struct {
	Count        int64
	Prev         int64
	RPCTotalNS   int64
	PrevRPCTotal int64
	RPCMaxNS     int64
	PrevRPCMax   int64
	TotalTotalNS int64
	PrevTotalNS  int64
	TotalMaxNS   int64
	PrevTotalMax int64
}

type MethodStats map[string]*StatData

type EndpointStats map[string]MethodStats

type ChainStats map[string]EndpointStats

type AllStats map[string]ChainStats

func addStatCount(stats AllStats, prevStats AllStats, nextPrevStats AllStats, chain string, endpoint string, method string, caller string, metric rate.Metric) {
	if stats[chain] == nil {
		stats[chain] = make(ChainStats)
	}
	if stats[chain][endpoint] == nil {
		stats[chain][endpoint] = make(EndpointStats)
	}
	if stats[chain][endpoint][method] == nil {
		stats[chain][endpoint][method] = make(MethodStats)
	}

	if nextPrevStats[chain] == nil {
		nextPrevStats[chain] = make(ChainStats)
	}
	if nextPrevStats[chain][endpoint] == nil {
		nextPrevStats[chain][endpoint] = make(EndpointStats)
	}
	if nextPrevStats[chain][endpoint][method] == nil {
		nextPrevStats[chain][endpoint][method] = make(MethodStats)
	}

	var prevCount int64
	var prevRPCTotal int64
	var prevRPCMax int64
	var prevTotalNS int64
	var prevTotalMax int64
	if prevStats[chain] != nil && prevStats[chain][endpoint] != nil && prevStats[chain][endpoint][method] != nil {
		if prevData := prevStats[chain][endpoint][method][caller]; prevData != nil {
			prevCount = prevData.Count
			prevRPCTotal = prevData.RPCTotalNS
			prevRPCMax = prevData.RPCMaxNS
			prevTotalNS = prevData.TotalTotalNS
			prevTotalMax = prevData.TotalMaxNS
		}
	}

	if current := stats[chain][endpoint][method][caller]; current != nil {
		current.Count += metric.Count
		current.RPCTotalNS += metric.RPCTotalNS
		if metric.RPCMaxNS > current.RPCMaxNS {
			current.RPCMaxNS = metric.RPCMaxNS
		}
		current.TotalTotalNS += metric.TotalTotalNS
		if metric.TotalMaxNS > current.TotalMaxNS {
			current.TotalMaxNS = metric.TotalMaxNS
		}
	} else {
		stats[chain][endpoint][method][caller] = &StatData{
			Count:        metric.Count,
			Prev:         prevCount,
			RPCTotalNS:   metric.RPCTotalNS,
			PrevRPCTotal: prevRPCTotal,
			RPCMaxNS:     metric.RPCMaxNS,
			PrevRPCMax:   prevRPCMax,
			TotalTotalNS: metric.TotalTotalNS,
			PrevTotalNS:  prevTotalNS,
			TotalMaxNS:   metric.TotalMaxNS,
			PrevTotalMax: prevTotalMax,
		}
	}

	if next := nextPrevStats[chain][endpoint][method][caller]; next != nil {
		next.Count += metric.Count
		next.RPCTotalNS += metric.RPCTotalNS
		if metric.RPCMaxNS > next.RPCMaxNS {
			next.RPCMaxNS = metric.RPCMaxNS
		}
		next.TotalTotalNS += metric.TotalTotalNS
		if metric.TotalMaxNS > next.TotalMaxNS {
			next.TotalMaxNS = metric.TotalMaxNS
		}
	} else {
		nextPrevStats[chain][endpoint][method][caller] = &StatData{
			Count:        metric.Count,
			RPCTotalNS:   metric.RPCTotalNS,
			RPCMaxNS:     metric.RPCMaxNS,
			TotalTotalNS: metric.TotalTotalNS,
			TotalMaxNS:   metric.TotalMaxNS,
		}
	}
}

func FormatStats(stats AllStats, startTime string) string {
	t := table.NewWriter()

	// 1. 设置表格风格 (StyleLight 很干净，适合日志输出)
	t.SetStyle(table.StyleLight)
	t.Style().Options.SeparateRows = true //在此风格下，加分割线会让层级更清晰

	// 2. 设置标题
	currentTime := time.Now().Format("2006-01-02 15:04:05")
	t.SetTitle("RPC Monitor Report | Start: %s | Now: %s", startTime, currentTime)

	// 3. 设置表头
	t.AppendHeader(table.Row{"Chain", "Endpoint", "Method", "Caller", "Total", "Prev", "Growth", "RPC Avg", "RPC Max", "Total Avg", "Total Max"})

	// 4. 配置列属性 (核心步骤：合并相同内容的单元格，使表格整洁)
	t.SetColumnConfigs([]table.ColumnConfig{
		{Number: 1, AutoMerge: true, Align: text.AlignLeft}, // Chain
		{Number: 2, AutoMerge: true, Align: text.AlignLeft}, // Endpoint
		{Number: 3, AutoMerge: true, Align: text.AlignLeft}, // Method
		{Number: 4, Align: text.AlignLeft},                  // Caller
		{Number: 5, Align: text.AlignRight},                 // Total
		{Number: 6, Align: text.AlignRight},                 // Prev
		{Number: 7, Align: text.AlignRight},                 // Growth
		{Number: 8, Align: text.AlignRight},                 // RPC Avg
		{Number: 9, Align: text.AlignRight},                 // RPC Max
		{Number: 10, Align: text.AlignRight},                // Total Avg
		{Number: 11, Align: text.AlignRight},                // Total Max
	})

	// 5. 遍历数据并填充行 (注意：必须对 Map Key 排序，否则表格每次顺序都会乱)

	// 获取并排序 Chain Keys
	var chains []string
	for k := range stats {
		chains = append(chains, k)
	}
	sort.Strings(chains)

	var totalGrowth int64 = 0

	for _, chain := range chains {
		endpointsMap := stats[chain]
		// 获取并排序 Endpoint Keys
		var endpoints []string
		for k := range endpointsMap {
			endpoints = append(endpoints, k)
		}
		sort.Strings(endpoints)

		for _, endpoint := range endpoints {
			methodsMap := endpointsMap[endpoint]
			// 获取并排序 Method Keys
			var methods []string
			for k := range methodsMap {
				methods = append(methods, k)
			}
			sort.Strings(methods)

			for _, method := range methods {
				callersMap := methodsMap[method]
				// 获取并排序 Caller Keys
				var callers []string
				for k := range callersMap {
					callers = append(callers, k)
				}
				sort.Strings(callers)

				for _, caller := range callers {
					data := callersMap[caller]

					rpcAvg := formatAvgDuration(data.RPCTotalNS, data.Count)
					rpcMax := formatDurationNS(data.RPCMaxNS)
					totalAvg := formatAvgDuration(data.TotalTotalNS, data.Count)
					totalMax := formatDurationNS(data.TotalMaxNS)

					// 计算增长量
					delta := data.Count - data.Prev
					totalGrowth += delta

					// 格式化增长量：如果有增长，标绿并加粗
					var deltaStr string
					if delta > 0 {
						deltaStr = text.Colors{text.FgGreen, text.Bold}.Sprintf("+%s", formatCount(delta))
					} else if delta == 0 {
						deltaStr = text.FgHiBlack.Sprint("0") // 灰色显示0
					} else {
						deltaStr = formatCount(delta)
					}

					t.AppendRow(table.Row{
						chain,
						endpoint,
						method,
						caller,
						formatCount(data.Count),
						formatCount(data.Prev),
						deltaStr,
						rpcAvg,
						rpcMax,
						totalAvg,
						totalMax,
					})
				}
			}
		}
	}

	// 添加页脚统计
	t.AppendFooter(table.Row{"", "", "", "TOTAL GROWTH", "", "", formatCount(totalGrowth), "", "", "", ""})

	return t.Render()
}

func formatCount(n int64) string {
	if n < 0 {
		return "-" + formatCount(-n)
	}
	if n < 1000 {
		return fmt.Sprintf("%d", n)
	}
	if n < 1000000 {
		return fmt.Sprintf("%.1fk", float64(n)/1000)
	}
	return fmt.Sprintf("%.1fm", float64(n)/1000000)
}

func formatAvgDuration(totalNS int64, count int64) string {
	if count <= 0 {
		return "0"
	}
	return formatDurationNS(totalNS / count)
}

func formatDurationNS(ns int64) string {
	if ns <= 0 {
		return "0"
	}
	d := time.Duration(ns)
	if d < time.Millisecond {
		return fmt.Sprintf("%dus", d.Microseconds())
	}
	if d < time.Second {
		return fmt.Sprintf("%.1fms", float64(ns)/float64(time.Millisecond))
	}
	return fmt.Sprintf("%.2fs", d.Seconds())
}
