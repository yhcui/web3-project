package clientpool

import (
	"errors"
	"sync"
	"testing"
	"time"
)

type mockClient struct {
	id             string
	initErr        error
	healthErr      error
	initCalled     int
	shutdownCalled int
	healthCalled   int
	mu             sync.Mutex
}

func (m *mockClient) String() string {
	return m.id
}

func (m *mockClient) Init() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.initCalled++
	return m.initErr
}

func (m *mockClient) Shutdown() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.shutdownCalled++
}

func (m *mockClient) HealthCheck() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.healthCalled++
	return m.healthErr
}

func newMockClient(id string) *mockClient {
	return &mockClient{id: id}
}

func TestNewPool(t *testing.T) {
	clients := []IClient{
		newMockClient("client1"),
		newMockClient("client2"),
	}
	pool := NewPool(clients, 3, "Test")

	if len(pool.Clients) != 2 {
		t.Fatalf("expected 2 clients, got %d", len(pool.Clients))
	}
	if pool.MaxFailCount != 3 {
		t.Fatalf("expected MaxFailCount 3, got %d", pool.MaxFailCount)
	}
	if !pool.Clients[0].IsHealthy() {
		t.Fatal("expected client1 to be healthy")
	}
	if !pool.Clients[1].IsHealthy() {
		t.Fatal("expected client2 to be healthy")
	}
}

func TestNewPoolEmpty(t *testing.T) {
	pool := NewPool([]IClient{}, 3, "Test")
	if len(pool.Clients) != 0 {
		t.Fatalf("expected 0 clients, got %d", len(pool.Clients))
	}
}

func TestPoolCallNoClients(t *testing.T) {
	pool := NewPool([]IClient{}, 3, "Test")
	err := pool.Call(func(c IClient, e *error) {})
	if err == nil {
		t.Fatal("expected error for empty pool")
	}
	if err.Error() != "no endpoints available" {
		t.Fatalf("expected 'no endpoints available' error, got: %v", err)
	}
}

func TestPoolCallSuccess(t *testing.T) {
	client := newMockClient("client1")
	pool := NewPool([]IClient{client}, 3, "Test")

	var called bool
	err := pool.Call(func(c IClient, e *error) {
		called = true
		*e = nil
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !called {
		t.Fatal("function was not called")
	}
	if client.initCalled != 1 {
		t.Fatalf("expected Init called once, got %d", client.initCalled)
	}
	if !pool.Clients[0].IsHealthy() {
		t.Fatal("expected client to remain healthy after success")
	}
}

func TestPoolCallWithNextClientError(t *testing.T) {
	client1 := newMockClient("client1")
	client2 := newMockClient("client2")
	pool := NewPool([]IClient{client1, client2}, 3, "Test")

	callCount := 0
	err := pool.Call(func(c IClient, e *error) {
		callCount++
		if callCount == 1 {
			*e = ErrNextClient
		}
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if callCount != 2 {
		t.Fatalf("expected 2 calls, got %d", callCount)
	}
	if client1.initCalled != 1 {
		t.Fatalf("expected client1 Init called once, got %d", client1.initCalled)
	}
	if client2.initCalled != 1 {
		t.Fatalf("expected client2 Init called once, got %d", client2.initCalled)
	}
}

func TestPoolCallFailureMarksUnhealthy(t *testing.T) {
	client := newMockClient("client1")
	pool := NewPool([]IClient{client}, 3, "Test")

	err := pool.Call(func(c IClient, e *error) {
		*e = errors.New("some error")
	})

	if err == nil {
		t.Fatal("expected error after failures")
	}
	if pool.Clients[0].IsHealthy() {
		t.Fatal("expected client to be marked unhealthy")
	}
	if client.shutdownCalled != 1 {
		t.Fatalf("expected Shutdown called once, got %d", client.shutdownCalled)
	}
}

func TestPoolCallAllClientsFail(t *testing.T) {
	client1 := newMockClient("client1")
	client2 := newMockClient("client2")

	pool := NewPool([]IClient{client1, client2}, 1, "Test")

	err := pool.Call(func(c IClient, e *error) {
		if c.String() == "client1" {
			*e = errors.New("error1")
		} else {
			*e = errors.New("error2")
		}
	})

	if err == nil {
		t.Fatal("expected error after all clients fail")
	}
	if errors.Is(err, ErrUnprocessed) {
		t.Log("got ErrUnprocessed as expected")
	}
}

func TestPoolCallInitError(t *testing.T) {
	client := newMockClient("client1")
	client.initErr = errors.New("init error")

	pool := NewPool([]IClient{client}, 3, "Test")

	err := pool.Call(func(c IClient, e *error) {
		*e = nil
	})

	if err == nil {
		t.Fatal("expected error after init error with no healthy clients")
	}
}

func TestWrapperIsHealthy(t *testing.T) {
	w := Wrapper[IClient]{healthy: true}
	if !w.IsHealthy() {
		t.Fatal("expected healthy")
	}

	w.SetHealth(false)
	if w.IsHealthy() {
		t.Fatal("expected unhealthy")
	}
}

func TestWrapperFailCount(t *testing.T) {
	w := Wrapper[IClient]{}

	count := w.AddFailCount()
	if count != 1 {
		t.Fatalf("expected fail count 1, got %d", count)
	}

	count = w.AddFailCount()
	if count != 2 {
		t.Fatalf("expected fail count 2, got %d", count)
	}

	w.ResetFailCount()
	if w.AddFailCount() != 1 {
		t.Fatal("expected fail count reset to 1 after ResetFailCount")
	}
}

func TestStartStopHealthCheck(t *testing.T) {
	client := newMockClient("client1")
	pool := NewPool([]IClient{client}, 3, "Test")
	pool.Clients[0].SetHealth(false)

	pool.StartHealthCheck(50 * time.Millisecond)
	time.Sleep(100 * time.Millisecond)
	pool.StopHealthCheck()

	client.mu.Lock()
	healthCalls := client.healthCalled
	client.mu.Unlock()

	if healthCalls == 0 {
		t.Fatal("expected HealthCheck to be called")
	}
}

func TestHealthCheckRecovery(t *testing.T) {
	client := newMockClient("client1")
	client.healthErr = errors.New("health check failed")
	pool := NewPool([]IClient{}, 3, "Test")
	pool.Clients[0].SetHealth(false)

	pool.StartHealthCheck(50 * time.Millisecond)
	time.Sleep(150 * time.Millisecond)
	pool.StopHealthCheck()

	if pool.Clients[0].IsHealthy() {
		t.Fatal("expected client to remain unhealthy when health check fails")
	}
}

func TestHealthCheckIdempotentStart(t *testing.T) {
	pool := NewPool([]IClient{newMockClient("client1")}, 3, "Test")

	pool.StartHealthCheck(time.Minute)
	pool.StartHealthCheck(time.Minute)
	pool.StopHealthCheck()
}

func TestPoolCallMultipleClientsFirstUnhealthy(t *testing.T) {
	client1 := newMockClient("client1")
	client2 := newMockClient("client2")

	pool := NewPool([]IClient{client1, client2}, 3, "Test")
	pool.Clients[0].SetHealth(false)

	var calledClient string
	err := pool.Call(func(c IClient, e *error) {
		calledClient = c.String()
		*e = nil
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if calledClient != "client2" {
		t.Fatalf("expected client2 to be called, got %s", calledClient)
	}
}

func TestPoolCallConcurrent(t *testing.T) {
	client := newMockClient("client1")
	pool := NewPool([]IClient{client}, 10, "Test")

	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			pool.Call(func(c IClient, e *error) {
				*e = nil
			})
		}()
	}
	wg.Wait()

	if client.initCalled == 0 {
		t.Fatal("expected Init to be called at least once")
	}
}

func TestPoolCallSuccessResetsFailCount(t *testing.T) {
	client := newMockClient("client1")
	pool := NewPool([]IClient{client}, 3, "Test")

	pool.Call(func(c IClient, e *error) {
		*e = errors.New("error")
	})

	if pool.Clients[0].IsHealthy() {
		t.Fatal("client should be unhealthy after failure")
	}

	pool.Call(func(c IClient, e *error) {
		*e = nil
	})
}

func TestHealthCheckOnlyChecksUnhealthy(t *testing.T) {
	client := newMockClient("client1")
	pool := NewPool([]IClient{}, 3, "Test")

	pool.StartHealthCheck(50 * time.Millisecond)
	time.Sleep(100 * time.Millisecond)
	pool.StopHealthCheck()

	client.mu.Lock()
	healthCalls := client.healthCalled
	client.mu.Unlock()

	if healthCalls != 0 {
		t.Fatalf("expected HealthCheck not to be called for healthy client, got %d", healthCalls)
	}
}
