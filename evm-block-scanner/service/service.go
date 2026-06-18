package service

import (
	"context"
	"errors"
	"evm-scanner/client"
	"evm-scanner/scanner"
	"log"
	"net/http"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type TxStatusServer struct {
	scanners []*scanner.Scanner
}

func NewTxStatusServer(prefix string, mux *http.ServeMux, scanners []*scanner.Scanner) *TxStatusServer {
	s := &TxStatusServer{scanners: scanners}
	mux.HandleFunc(prefix, s.handle)
	return s
}

func (s *TxStatusServer) handle(w http.ResponseWriter, r *http.Request) {
	chain := r.URL.Query().Get("chain")
	txHashStr := r.URL.Query().Get("tx_id")

	if txHashStr == "" {
		http.Error(w, "missing tx_id", http.StatusBadRequest)
		return
	}
	if len(txHashStr) != 66 {
		http.Error(w, "invalid hash length", http.StatusBadRequest)
		return
	}
	txHash := common.HexToHash(txHashStr)

	var cli *client.Client
	for _, scanner := range s.scanners {
		if strings.EqualFold(scanner.Chain, chain) {
			cli = scanner.GetRawClient()
			break
		}
	}
	if cli == nil {
		http.Error(w, "chain not found", http.StatusNotFound)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	statusCh := make(chan client.TransactionStatus, 10)
	if err := cli.SubscribeTransaction(r.Context(), txHash, statusCh); err != nil {
		conn.WriteJSON(map[string]string{"error": err.Error()})
		conn.Close()
		return
	}

	go func() {
		for status := range statusCh {
			if conn == nil {
				return
			}
			if err := conn.WriteJSON(status); err != nil {
				conn.Close()
				return
			}
		}
		conn.Close()
	}()
}

func Start(ctx context.Context, addr string, scanners []*scanner.Scanner, etherscanApiKey string, etherscanApiPRS int, provider Provider) {
	mux := http.NewServeMux()
	server := &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	NewTxStatusServer("/ws/tx-status", mux, scanners)
	HandleApprovalList("/approval-list", mux, etherscanApiKey, etherscanApiPRS, provider)
	HandleParseTransactions("/parse-transactions", mux, provider)

	log.Printf("服务启动在 %s", addr)
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("服务启动失败: %v", err)
		}
	}()
	go func() {
		<-ctx.Done()
		_ = server.Shutdown(context.Background())
	}()
}
