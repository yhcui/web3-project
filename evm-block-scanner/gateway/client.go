package gateway

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	MsgTypeRegister       = "register"
	MsgTypeRegistered     = "registered"
	MsgTypeSubscribe      = "subscribe"
	MsgTypeUnsubscribe    = "unsubscribe"
	MsgTypeSync           = "sync"
	MsgTypeBackfill       = "backfill"
	MsgTypeBackfillResult = "backfill_result"
	MsgTypeActivity       = "activity"
	MsgTypeTokenTask      = "token_discovery"
	MsgTypeTokenResult    = "token_discovery_result"
	MsgTypePing           = "ping"
	MsgTypePong           = "pong"
)

type BackfillTask struct {
	Chain      string `json:"chain,omitempty"`
	Address    string `json:"address"`
	StartBlock int64  `json:"start_block"`
	EndBlock   int64  `json:"end_block"`
	ChunkSize  int64  `json:"chunk_size,omitempty"`
}

type BackfillResult struct {
	Chain      string `json:"chain,omitempty"`
	Address    string `json:"address"`
	Status     string `json:"status"`
	Error      string `json:"error,omitempty"`
	StartBlock int64  `json:"start_block,omitempty"`
	EndBlock   int64  `json:"end_block,omitempty"`
	ChunkSize  int64  `json:"chunk_size,omitempty"`
}

type TokenDiscoveryCandidate struct {
	ContractAddress string `json:"contract_address"`
	Symbol          string `json:"symbol"`
	MarketCapRank   int64  `json:"market_cap_rank"`
}

type TokenDiscoveryTask struct {
	RequestID  string                    `json:"request_id"`
	Chain      string                    `json:"chain,omitempty"`
	Address    string                    `json:"address"`
	Candidates []TokenDiscoveryCandidate `json:"candidates"`
}

type TokenDiscoveryToken struct {
	TokenContract string `json:"token_contract"`
	TokenSymbol   string `json:"token_symbol"`
	TokenDecimals int    `json:"token_decimals"`
	Balance       string `json:"balance,omitempty"`
	MarketCapRank int64  `json:"market_cap_rank,omitempty"`
}

type TokenDiscoveryResult struct {
	RequestID         string                `json:"request_id"`
	Backend           string                `json:"backend"`
	CheckedCandidates int64                 `json:"checked_candidates"`
	RPCRequests       int64                 `json:"rpc_requests"`
	Tokens            []TokenDiscoveryToken `json:"tokens"`
	Error             string                `json:"error,omitempty"`
}

type Config struct {
	Enabled           bool          `yaml:"enabled"`
	URL               string        `yaml:"url"`
	ReconnectInterval time.Duration `yaml:"reconnect_interval"`
	PingInterval      time.Duration `yaml:"ping_interval"`
}

type Client struct {
	config  Config
	chain   string
	chains  []string // 实际的链名列表，用于 register
	version string
	conn    *websocket.Conn
	mu      sync.RWMutex
	sendCh  chan []byte

	onSubscribe   func(addresses []string)
	onUnsubscribe func(addresses []string)
	onSync        func(addresses []string)
	onBackfill    func(task BackfillTask)
	onTokenTask   func(task TokenDiscoveryTask)

	closed bool
	stopCh chan struct{}
}

func NewClient(config Config, chain, version string) *Client {
	if config.ReconnectInterval == 0 {
		config.ReconnectInterval = 5 * time.Second
	}
	if config.PingInterval == 0 {
		config.PingInterval = 30 * time.Second
	}
	if chain == "" {
		chain = "evm"
	}
	if version == "" {
		version = "1.0.0"
	}

	return &Client{
		config:  config,
		chain:   chain,
		version: version,
		sendCh:  make(chan []byte, 256),
		stopCh:  make(chan struct{}),
	}
}

func (c *Client) SetSubscribeHandler(onSub, onUnsub func(addresses []string)) {
	c.onSubscribe = onSub
	c.onUnsubscribe = onUnsub
}

func (c *Client) SetSyncHandler(onSync func(addresses []string)) {
	c.onSync = onSync
}

func (c *Client) SetBackfillHandler(onBackfill func(task BackfillTask)) {
	c.onBackfill = onBackfill
}

func (c *Client) SetTokenDiscoveryHandler(onTask func(task TokenDiscoveryTask)) {
	c.onTokenTask = onTask
}

// SetChains 设置实际的链名列表，用于 register 消息
func (c *Client) SetChains(chains []string) {
	c.chains = chains
}

func (c *Client) Start(ctx context.Context) {
	if !c.config.Enabled {
		log.Printf("[Gateway] disabled, skip connect")
		return
	}

	go c.run(ctx)
}

func (c *Client) Stop() {
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		return
	}
	c.closed = true
	close(c.stopCh)
	if c.conn != nil {
		c.conn.Close()
	}
	c.mu.Unlock()
}

func (c *Client) SendActivity(chain string, payload []byte) error {
	if !c.IsConnected() {
		return ErrNotConnected
	}
	if chain == "" {
		chain = c.chain
	}
	msg := map[string]interface{}{
		"type":    MsgTypeActivity,
		"chain":   chain,
		"payload": json.RawMessage(payload),
	}
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	select {
	case c.sendCh <- data:
		return nil
	default:
		return ErrSendQueueFull
	}
}

func (c *Client) SendTokenDiscoveryResult(result TokenDiscoveryResult) error {
	if !c.IsConnected() {
		return ErrNotConnected
	}
	msg := map[string]interface{}{
		"type":    MsgTypeTokenResult,
		"chain":   c.chain,
		"payload": result,
	}
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	select {
	case c.sendCh <- data:
		return nil
	default:
		return ErrSendQueueFull
	}
}

func (c *Client) SendBackfillResult(result BackfillResult) error {
	if !c.IsConnected() {
		return ErrNotConnected
	}
	chain := strings.ToLower(strings.TrimSpace(result.Chain))
	if chain == "" {
		chain = c.chain
	}
	msg := map[string]interface{}{
		"type":    MsgTypeBackfillResult,
		"chain":   chain,
		"payload": result,
	}
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	select {
	case c.sendCh <- data:
		return nil
	default:
		return ErrSendQueueFull
	}
}

func (c *Client) IsConnected() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.conn != nil
}

func (c *Client) GetChain() string {
	return c.chain
}

func (c *Client) run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case <-c.stopCh:
			return
		default:
		}

		if err := c.connect(ctx); err != nil {
			log.Printf("[Gateway] connect failed: %v", err)
		}

		select {
		case <-ctx.Done():
			return
		case <-c.stopCh:
			return
		case <-time.After(c.config.ReconnectInterval):
			log.Printf("[Gateway] reconnecting...")
		}
	}
}

func (c *Client) connect(ctx context.Context) error {
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	conn, _, err := dialer.DialContext(ctx, c.config.URL, nil)
	if err != nil {
		return err
	}

	c.mu.Lock()
	c.conn = conn
	c.mu.Unlock()

	log.Printf("[Gateway] connected: %s", c.config.URL)

	defer func() {
		c.mu.Lock()
		c.conn = nil
		c.mu.Unlock()
		conn.Close()
		log.Printf("[Gateway] disconnected")
	}()

	if err := c.sendRegister(conn); err != nil {
		return err
	}

	go c.writePump(ctx, conn)

	return c.readPump(ctx, conn)
}

func (c *Client) sendRegister(conn *websocket.Conn) error {
	chains := c.chains
	if len(chains) == 0 {
		chains = []string{c.chain}
	}
	for _, chain := range chains {
		vm := registerVM(chain)
		msg := map[string]string{
			"type":    MsgTypeRegister,
			"chain":   chain,
			"vm":      vm,
			"version": c.version,
		}
		if err := conn.WriteJSON(msg); err != nil {
			return err
		}
		log.Printf("[Gateway] register: chain=%s vm=%s", chain, vm)
	}
	return nil
}

func registerVM(chain string) string {
	chain = strings.ToLower(strings.TrimSpace(chain))
	if chain == "tron" || chain == "solana" {
		return chain
	}
	return "evm"
}

func (c *Client) writePump(ctx context.Context, conn *websocket.Conn) {
	ticker := time.NewTicker(c.config.PingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-c.stopCh:
			return
		case msg := <-c.sendCh:
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			ping := map[string]string{"type": MsgTypePing}
			if err := conn.WriteJSON(ping); err != nil {
				return
			}
		}
	}
}

func (c *Client) readPump(ctx context.Context, conn *websocket.Conn) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-c.stopCh:
			return nil
		default:
		}

		_, message, err := conn.ReadMessage()
		if err != nil {
			return err
		}

		c.handleMessage(message)
	}
}

func (c *Client) handleMessage(message []byte) {
	var msg struct {
		Type      string          `json:"type"`
		Chain     string          `json:"chain"`
		Addresses []string        `json:"addresses"`
		Task      json.RawMessage `json:"task"`
	}

	if err := json.Unmarshal(message, &msg); err != nil {
		log.Printf("[Gateway] parse message failed: %v", err)
		return
	}

	switch msg.Type {
	case MsgTypeRegistered:
		log.Printf("[Gateway] registered: chain=%s", msg.Chain)

	case MsgTypeSubscribe:
		log.Printf("[Gateway] subscribe: %d addresses", len(msg.Addresses))
		if c.onSubscribe != nil {
			c.onSubscribe(msg.Addresses)
		}

	case MsgTypeUnsubscribe:
		log.Printf("[Gateway] unsubscribe: %d addresses", len(msg.Addresses))
		if c.onUnsubscribe != nil {
			c.onUnsubscribe(msg.Addresses)
		}

	case MsgTypeSync:
		log.Printf("[Gateway] sync: %d addresses", len(msg.Addresses))
		if c.onSync != nil {
			c.onSync(msg.Addresses)
		}

	case MsgTypeBackfill:
		if len(msg.Task) == 0 {
			log.Printf("[Gateway] backfill message without task")
			return
		}
		var task BackfillTask
		if err := json.Unmarshal(msg.Task, &task); err != nil {
			log.Printf("[Gateway] parse backfill task failed: %v", err)
			return
		}
		if strings.TrimSpace(task.Chain) == "" {
			task.Chain = strings.ToLower(strings.TrimSpace(msg.Chain))
		}
		log.Printf("[Gateway] backfill task received: chain=%s address=%s start=%d end=%d chunk=%d",
			task.Chain, task.Address, task.StartBlock, task.EndBlock, task.ChunkSize)
		if c.onBackfill != nil {
			c.onBackfill(task)
		}

	case MsgTypeTokenTask:
		if c.onTokenTask == nil {
			return
		}
		var task TokenDiscoveryTask
		if err := json.Unmarshal(msg.Task, &task); err != nil {
			log.Printf("[Gateway] parse token discovery task failed: %v", err)
			return
		}
		if strings.TrimSpace(task.Chain) == "" {
			task.Chain = strings.ToLower(strings.TrimSpace(msg.Chain))
		}
		log.Printf("[Gateway] token discovery task received: request_id=%s chain=%s address=%s candidates=%d",
			task.RequestID, task.Chain, task.Address, len(task.Candidates))
		c.onTokenTask(task)

	case MsgTypePong:
	}
}
