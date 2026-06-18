package clientpool

import (
	"errors"
	"fmt"
	"log"
	"sync"
	"time"
)

type IClient interface {
	fmt.Stringer
	// 每一次 Call 调用前都会调用 Init，确保 Init 的实现管理好资源，避免重复初始化
	Init() error
	// 当 Call 调用失败时，会调用 Shutdown，释放资源
	Shutdown()
	// 健康检查，返回 nil 表示健康，否则表示不健康
	HealthCheck() error
}

type Pool[T IClient] struct {
	Clients      []Wrapper[T]
	MaxFailCount int
	Name         string
	stopCh       chan struct{}
}

func NewPool[T IClient](endpoints []T, maxFailCount int, name string) Pool[T] {
	endpoints_ := make([]Wrapper[T], len(endpoints))
	for i, endpoint := range endpoints {
		endpoints_[i] = Wrapper[T]{
			Inner:     endpoint,
			healthy:   true,
			failCount: 0,
		}
	}
	return Pool[T]{
		Clients:      endpoints_,
		Name:         name,
		MaxFailCount: maxFailCount,
	}
}

var ErrNextClient = errors.New("next client")
var ErrUnprocessed = errors.New("unprocessed")

func (g *Pool[T]) Call(fn func(c T, e *error)) error {
	if len(g.Clients) == 0 {
		return fmt.Errorf("no endpoints available")
	}

	var isProcessed bool
	var err error
OuterLoop:
	for i := range g.Clients {
		if !g.Clients[i].IsHealthy() {
			continue
		}

		err = g.Clients[i].Inner.Init()
		if err != nil {
			g.Clients[i].SetHealth(false)
			log.Printf("[%s] Endpoint [%s] init error: %v", g.Name, g.Clients[i].Inner, err)
			continue
		}

		for {
			fn(g.Clients[i].Inner, &err)
			if errors.Is(err, ErrNextClient) {
				continue OuterLoop
			}
			isProcessed = true

			if err == nil {
				g.Clients[i].ResetFailCount()
				return nil
			}

			log.Printf("[%s] Endpoint [%s] call error: %v", g.Name, g.Clients[i].Inner, err)

			failCount := g.Clients[i].AddFailCount()
			if failCount >= g.MaxFailCount {
				if ok := g.Clients[i].SetHealth(false); ok {
					g.Clients[i].Inner.Shutdown()
					log.Printf("[%s] Endpoint [%s] marked as unhealthy", g.Name, g.Clients[i].Inner)
				}
				break
			} else {
				time.Sleep(300 * time.Millisecond * time.Duration(failCount))
			}
		}
	}

	if !isProcessed {
		return ErrUnprocessed
	}

	return err
}

func (g *Pool[T]) StartHealthCheck(interval time.Duration) {
	if g.stopCh != nil {
		return
	}
	g.stopCh = make(chan struct{})
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				for i := range g.Clients {
					if g.Clients[i].IsHealthy() {
						continue
					}
					inner := g.Clients[i].Inner

					if inner.HealthCheck() == nil {
						g.Clients[i].SetHealth(true)
						g.Clients[i].ResetFailCount()
						log.Printf("[%s] Endpoint [%s] recovered via health check", g.Name, g.Clients[i].Inner)
					}
				}
			case <-g.stopCh:
				return
			}
		}
	}()
}

func (g *Pool[T]) StopHealthCheck() {
	if g.stopCh != nil {
		close(g.stopCh)
		g.stopCh = nil
	}
}

type Wrapper[T IClient] struct {
	Inner     T
	mu        sync.RWMutex
	healthy   bool
	failCount int // 连续失败次数
}

func (w *Wrapper[T]) IsHealthy() bool {
	w.mu.RLock()
	defer w.mu.RUnlock()
	return w.healthy
}
func (w *Wrapper[T]) SetHealth(healthy bool) (ok bool) {
	w.mu.Lock()
	defer w.mu.Unlock()
	ok = w.healthy != healthy
	w.healthy = healthy
	return
}

func (w *Wrapper[T]) AddFailCount() int {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.failCount++
	return w.failCount
}

func (w *Wrapper[T]) ResetFailCount() {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.failCount = 0
}
