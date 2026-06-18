package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"gopkg.in/yaml.v3"
)

// ── chain_id → chain name 映射 ──

var chainNames = map[string]string{
	"1":      "eth",
	"56":     "bsc",
	"137":    "polygon",
	"10":     "optimism",
	"42161":  "arb",
	"43114":  "avalanche",
	"8453":   "base",
	"324":    "zksync",
	"59144":  "linea",
	"534352": "scroll",
}

// ── config.yaml 结构 ──

type Config struct {
	Gateway struct {
		URL string `yaml:"url"`
	} `yaml:"gateway"`
}

// ── WebSocket 消息结构 ──

type Message struct {
	Type    string          `json:"type"`
	Chain   string          `json:"chain,omitempty"`
	VM      string          `json:"vm,omitempty"`
	Version string          `json:"version,omitempty"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type ActivityPayload struct {
	Chain         string      `json:"chain"`
	TxID          string      `json:"tx_id"`
	BlockNumber   interface{} `json:"block_number"`
	Status        string      `json:"status"`
	EventType     string      `json:"event_type"`
	From          string      `json:"from"`
	To            string      `json:"to"`
	AssetType     string      `json:"asset_type"`
	TokenSymbol   string      `json:"token_symbol"`
	Amount        string      `json:"amount"`
	AmountFmt     string      `json:"amount_formatted"`
	TokenContract string      `json:"token_contract"`
	Timestamp     int64       `json:"timestamp"`
	Transfers     []Transfer  `json:"transfers"`
	RawData       *RawData    `json:"raw_data"`
}

type Transfer struct {
	AssetType   string `json:"asset_type"`
	TokenSymbol string `json:"token_symbol"`
	Amount      string `json:"amount"`
	From        string `json:"from"`
	To          string `json:"to"`
}

type RawData struct {
	Swap         *Swap  `json:"swap"`
	FeeFormatted string `json:"fee_formatted"`
}

type Swap struct {
	Protocols []string  `json:"protocols"`
	In        []SwapLeg `json:"in"`
	Out       []SwapLeg `json:"out"`
}

type SwapLeg struct {
	AssetType   string `json:"asset_type"`
	TokenSymbol string `json:"token_symbol"`
	Amount      string `json:"amount"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	// ── 参数解析 ──
	args := os.Args[1:]
	if len(args) < 1 {
		fmt.Fprintln(os.Stderr, "用法: go run test-subscribe.go <chain_id> [-from <address>] [-to <address>]")
		os.Exit(1)
	}

	chainID := args[0]
	var fromAddr, toAddr string

	for i := 1; i < len(args); i++ {
		if args[i] == "-from" && i+1 < len(args) {
			i++
			fromAddr = strings.ToLower(args[i])
		} else if args[i] == "-to" && i+1 < len(args) {
			i++
			toAddr = strings.ToLower(args[i])
		}
	}

	if fromAddr == "" && toAddr == "" {
		fmt.Fprintln(os.Stderr, "至少需要指定 -from 或 -to 其中一个")
		os.Exit(1)
	}

	chainName := chainNames[chainID]
	if chainName == "" {
		chainName = fmt.Sprintf("chain-%s", chainID)
	}

	// ── 读取 config.yaml ──
	port := "9000"
	wsPath := "/ws/upstream"

	data, err := os.ReadFile("config.yaml")
	if err != nil {
		fmt.Println("未找到 config.yaml，使用默认端口 9000")
	} else {
		var cfg Config
		if err := yaml.Unmarshal(data, &cfg); err == nil && cfg.Gateway.URL != "" {
			if u, err := url.Parse(cfg.Gateway.URL); err == nil {
				if u.Port() != "" {
					port = u.Port()
				}
				if u.Path != "" {
					wsPath = u.Path
				}
			}
		}
	}

	// ── 收集要订阅的地址 ──
	var subscribeAddresses []string
	if fromAddr != "" {
		subscribeAddresses = append(subscribeAddresses, fromAddr)
	}
	if toAddr != "" && toAddr != fromAddr {
		subscribeAddresses = append(subscribeAddresses, toAddr)
	}

	fmt.Printf("chain_id: %s (%s)\n", chainID, chainName)
	if fromAddr != "" {
		fmt.Printf("from: %s\n", fromAddr)
	}
	if toAddr != "" {
		fmt.Printf("to:   %s\n", toAddr)
	}
	fmt.Printf("监听地址: ws://localhost:%s%s\n", port, wsPath)
	fmt.Println("等待 scanner 连接...\n")

	var (
		activityCount int
		mu            sync.Mutex
	)

	sep := strings.Repeat("═", 60)

	// ── WebSocket handler ──
	http.HandleFunc(wsPath, func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("升级失败:", err)
			return
		}
		defer conn.Close()
		fmt.Println("[连接] scanner 已连接")

		for {
			_, raw, err := conn.ReadMessage()
			if err != nil {
				fmt.Println("[断开] scanner 已断开连接")
				return
			}

			var msg Message
			if err := json.Unmarshal(raw, &msg); err != nil {
				fmt.Println("[收到] 无法解析:", string(raw))
				continue
			}

			switch msg.Type {
			case "register":
				fmt.Printf("[注册] chain=%s vm=%s version=%s\n", msg.Chain, msg.VM, msg.Version)
				resp, _ := json.Marshal(map[string]string{"type": "registered", "chain": msg.Chain})
				conn.WriteMessage(websocket.TextMessage, resp)

				fmt.Printf("[订阅] 地址: %s\n", strings.Join(subscribeAddresses, ", "))
				sub, _ := json.Marshal(map[string]interface{}{
					"type":      "subscribe",
					"chain":     msg.Chain,
					"addresses": subscribeAddresses,
				})
				conn.WriteMessage(websocket.TextMessage, sub)

			case "activity":
				mu.Lock()
				activityCount++
				count := activityCount
				mu.Unlock()

				if len(msg.Payload) == 0 || string(msg.Payload) == "null" {
					fmt.Printf("[活动 #%d] (空 payload)\n", count)
					continue
				}

				var p ActivityPayload
				if err := json.Unmarshal(msg.Payload, &p); err != nil {
					fmt.Printf("[活动 #%d] payload 解析失败: %v\n", count, err)
					continue
				}

				// 按 chain 过滤
				if strings.ToLower(p.Chain) != chainName {
					continue
				}

				// 按 from/to 过滤
				actFrom := strings.ToLower(p.From)
				actTo := strings.ToLower(p.To)
				matched := false
				if fromAddr != "" && actFrom == fromAddr {
					matched = true
				}
				if toAddr != "" && actTo == toAddr {
					matched = true
				}
				if !matched {
					for _, t := range p.Transfers {
						if fromAddr != "" && strings.ToLower(t.From) == fromAddr {
							matched = true
							break
						}
						if toAddr != "" && strings.ToLower(t.To) == toAddr {
							matched = true
							break
						}
					}
				}
				if !matched {
					continue
				}

				eventType := strings.ToUpper(p.EventType)
				if eventType == "" {
					eventType = "UNKNOWN"
				}

				fmt.Printf("\n%s\n", sep)
				fmt.Printf("[活动 #%d] %s\n", count, eventType)
				fmt.Printf("  链:     %s\n", p.Chain)
				fmt.Printf("  TxHash: %s\n", p.TxID)
				fmt.Printf("  区块:   %v\n", p.BlockNumber)
				fmt.Printf("  状态:   %s\n", p.Status)
				fmt.Printf("  From:   %s\n", p.From)
				fmt.Printf("  To:     %s\n", p.To)
				fmt.Printf("  资产:   %s %s\n", p.AssetType, p.TokenSymbol)
				fmt.Printf("  金额:   %s (raw: %s)\n", p.AmountFmt, p.Amount)
				if p.TokenContract != "" {
					fmt.Printf("  合约:   %s\n", p.TokenContract)
				}
				ts := time.Unix(p.Timestamp, 0)
				fmt.Printf("  时间:   %s\n", ts.Format("2006/1/2 15:04:05"))

				if len(p.Transfers) > 0 {
					fmt.Printf("  Transfers (%d):\n", len(p.Transfers))
					for _, t := range p.Transfers {
						sym := t.TokenSymbol
						if sym == "" {
							sym = "?"
						}
						fmt.Printf("    [%s] %s %s | %s → %s\n", t.AssetType, sym, t.Amount, t.From, t.To)
					}
				}

				if p.RawData != nil && p.RawData.Swap != nil {
					sw := p.RawData.Swap
					fmt.Println("  Swap:")
					if len(sw.Protocols) > 0 {
						fmt.Printf("    协议: %s\n", strings.Join(sw.Protocols, ", "))
					}
					for _, leg := range sw.In {
						sym := leg.TokenSymbol
						if sym == "" {
							sym = leg.AssetType
						}
						fmt.Printf("    IN:  %s %s\n", sym, leg.Amount)
					}
					for _, leg := range sw.Out {
						sym := leg.TokenSymbol
						if sym == "" {
							sym = leg.AssetType
						}
						fmt.Printf("    OUT: %s %s\n", sym, leg.Amount)
					}
				}

				if p.RawData != nil && p.RawData.FeeFormatted != "" {
					fmt.Printf("  Fee:    %s\n", p.RawData.FeeFormatted)
				}

				fmt.Println(sep)

			case "ping":
				pong, _ := json.Marshal(map[string]string{"type": "pong"})
				conn.WriteMessage(websocket.TextMessage, pong)

			default:
				raw, _ := json.Marshal(msg)
				s := string(raw)
				if len(s) > 200 {
					s = s[:200]
				}
				fmt.Printf("[消息] type=%s %s\n", msg.Type, s)
			}
		}
	})

	// ── 启动 HTTP 服务 ──
	fmt.Printf("WebSocket 服务端已启动: ws://localhost:%s%s\n", port, wsPath)

	// 优雅退出
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt)
	go func() {
		<-sigCh
		mu.Lock()
		c := activityCount
		mu.Unlock()
		fmt.Printf("\n\n共收到 %d 条活动消息\n", c)
		os.Exit(0)
	}()

	log.Fatal(http.ListenAndServe(":"+port, nil))
}
