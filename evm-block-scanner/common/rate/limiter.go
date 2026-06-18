package rate

import (
	"context"
	"errors"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

var ErrQuit = errors.New("limiter wait failed, program quit")

type Limiter struct {
	limiter *rate.Limiter
	mu      sync.Mutex
	stats   map[string]map[string]*Metric
}

type Metric struct {
	Count        int64
	RPCTotalNS   int64
	RPCMaxNS     int64
	TotalTotalNS int64
	TotalMaxNS   int64
}

func (l *Limiter) Count() map[string]map[string]Metric {
	l.mu.Lock()
	defer l.mu.Unlock()

	ret := make(map[string]map[string]Metric, len(l.stats))
	for method, byCaller := range l.stats {
		ret[method] = make(map[string]Metric, len(byCaller))
		for caller, metric := range byCaller {
			if metric == nil {
				continue
			}
			ret[method][caller] = *metric
		}
	}
	return ret
}

func (l *Limiter) WaitLimit(ctx context.Context, why string, method string) error {
	if err := l.limiter.Wait(ctx); err != nil {
		return ErrQuit
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	l.getMetricLocked(method, why).Count++
	return nil
}

func (l *Limiter) Observe(why string, method string, rpcDuration time.Duration, totalDuration time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()
	metric := l.getMetricLocked(method, why)
	rpcNS := rpcDuration.Nanoseconds()
	totalNS := totalDuration.Nanoseconds()
	metric.RPCTotalNS += rpcNS
	metric.TotalTotalNS += totalNS
	if rpcNS > metric.RPCMaxNS {
		metric.RPCMaxNS = rpcNS
	}
	if totalNS > metric.TotalMaxNS {
		metric.TotalMaxNS = totalNS
	}
}

func (l *Limiter) getMetricLocked(method string, why string) *Metric {
	if _, ok := l.stats[method]; !ok {
		l.stats[method] = make(map[string]*Metric)
	}
	if l.stats[method][why] == nil {
		l.stats[method][why] = &Metric{}
	}
	return l.stats[method][why]
}

func NewLimiter(rps float64, b int) *Limiter {
	return &Limiter{
		limiter: rate.NewLimiter(rate.Limit(rps), b),
		stats:   make(map[string]map[string]*Metric),
		mu:      sync.Mutex{},
	}
}
