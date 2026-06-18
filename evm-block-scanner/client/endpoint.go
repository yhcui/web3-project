package client

import (
	"context"
	"errors"
	clientpool "evm-scanner/common/client-pool"
	"evm-scanner/common/rate"
	"evm-scanner/config"
	"evm-scanner/types"
	"fmt"
	"math/big"
	"net/url"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"golang.org/x/sync/errgroup"
)

type ClientType int

var (
	ClientTypeWSS ClientType = 0
	ClientTypeRPC ClientType = 1
)

type Wrapped struct {
	*rate.Limiter
	*ethclient.Client
	URL      string
	isClosed bool
}

// Init implements [IClient].
func (w *Wrapped) Init() (err error) {
	if w.Client != nil && !w.isClosed {
		return nil
	}
	w.isClosed = false
	w.Client, err = ethclient.Dial(w.URL)
	return
}

// Shutdown implements [IClient].
func (w *Wrapped) Shutdown() {
	if w.Client != nil {
		w.Client.Close()
		w.isClosed = true
	}
}

// HealthCheck implements [IClient].
func (w *Wrapped) HealthCheck() error {
	c, err := ethclient.Dial(w.URL)
	if err != nil {
		return err
	}
	defer c.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_, err = c.ChainID(ctx)
	return err
}

func NewWrapped(cfg config.URL) *Wrapped {
	return &Wrapped{
		Limiter: rate.NewLimiter(cfg.PRS, 1),
		URL:     cfg.URL,
	}
}

func (w *Wrapped) String() string {
	url_, err := url.Parse(w.URL)
	if err != nil {
		return ""
	}
	return url_.Host
}

func (w *Wrapped) Type() ClientType {
	if strings.HasPrefix(w.URL, "wss://") {
		return ClientTypeWSS
	}
	return ClientTypeRPC
}

var _ clientpool.IClient = (*Wrapped)(nil)

type Endpoint struct {
	clientpool.Pool[*Wrapped]
}

func observeCall(c *Wrapped, why string, method string, totalStart time.Time, rpcStart time.Time) {
	if c == nil || c.Limiter == nil {
		return
	}
	c.Observe(why, method, time.Since(rpcStart), time.Since(totalStart))
}

func NewEndpoint(cfgs []config.URL, name string) Endpoint {
	var clients []*Wrapped
	for _, cfg := range cfgs {
		clients = append(clients, NewWrapped(cfg))
	}
	return Endpoint{
		Pool: clientpool.NewPool(clients, 3, name),
	}
}

func (e *Endpoint) ChainId(why string, ctx context.Context) (chainId *big.Int, err error) {
	err = e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if err := c.WaitLimit(ctx, why, "eth_chainId"); err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "eth_chainId", totalStart, rpcStart)
		chainId, *e = c.ChainID(ctx)
	})
	return
}

func (e *Endpoint) SubscribeBlock(why string, ctx context.Context, ch chan<- *types.Header) error {
	var sub *rpc.ClientSubscription
	err := e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if c.Type() != ClientTypeWSS {
			*e = clientpool.ErrNextClient
			return
		}
		if err := c.WaitLimit(ctx, why, "subscribe_newHeads"); err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "subscribe_newHeads", totalStart, rpcStart)
		sub, *e = c.Client.Client().EthSubscribe(ctx, ch, "newHeads")
	})
	if err != nil {
		return err
	}
	defer sub.Unsubscribe()

	select {
	case <-ctx.Done():
		sub.Unsubscribe()
		return nil
	case err := <-sub.Err():
		return err
	}
}

func (e *Endpoint) SubscribeNewPendingTransactions(why string, ctx context.Context, ch chan<- common.Hash) error {
	var sub *rpc.ClientSubscription
	err := e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if c.Type() != ClientTypeWSS {
			*e = clientpool.ErrNextClient
			return
		}
		if err := c.WaitLimit(ctx, why, "subscribe_newPendingTransactions"); err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "subscribe_newPendingTransactions", totalStart, rpcStart)
		sub, *e = c.Client.Client().EthSubscribe(ctx, ch, "newPendingTransactions")
	})
	if err != nil {
		return err
	}
	defer sub.Unsubscribe()

	select {
	case <-ctx.Done():
		sub.Unsubscribe()
		return nil
	case err := <-sub.Err():
		return err
	}
}

func (e *Endpoint) HeaderByNumber(why string, ctx context.Context, number *big.Int) (*types.Header, error) {
	var head *types.Header
	err := e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if err := c.WaitLimit(ctx, why, "eth_getBlockByNumber"); err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "eth_getBlockByNumber", totalStart, rpcStart)
		*e = c.Client.Client().CallContext(ctx, &head, "eth_getBlockByNumber", toBlockNumArg(number), false)
		if *e == nil && head == nil {
			*e = ethereum.NotFound
		}
	})
	return head, err
}

func (e *Endpoint) BlockNumber(why string, ctx context.Context) (uint64, error) {
	var num uint64
	err := e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if err := c.WaitLimit(ctx, why, "eth_blockNumber"); err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "eth_blockNumber", totalStart, rpcStart)
		num, *e = c.Client.BlockNumber(ctx)
	})
	return num, err
}

func (e *Endpoint) BlockByNumber(why string, ctx context.Context, number *big.Int) (*types.Block, error) {
	var block *types.Block
	err := e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if err := c.WaitLimit(ctx, why, "eth_getBlockByNumber"); err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "eth_getBlockByNumber", totalStart, rpcStart)
		var numStr string
		if number == nil {
			numStr = "latest"
		} else {
			numStr = fmt.Sprintf("0x%x", number)
		}
		var rawBlock types.Block
		*e = c.Client.Client().CallContext(ctx, &rawBlock, "eth_getBlockByNumber", numStr, true)
		if *e != nil {
			return
		}
		if rawBlock.Number == nil {
			*e = errors.New("block not found")
			return
		}
		block = &rawBlock
	})
	return block, err
}

func (e *Endpoint) GetToken(ctx context.Context, sigName, sigSymbol, sigDecimals []byte, addr common.Address) (name, symbol string, decimals uint8, err error) {
	err = e.Call(func(c *Wrapped, e *error) {
		g, ctx := errgroup.WithContext(ctx)
		why := "GetToken"
		if sigName != nil {
			g.Go(func() error {
				totalStart := time.Now()
				if err := c.WaitLimit(ctx, why, "eth_call"); err != nil {
					return err
				}
				rpcStart := time.Now()
				defer observeCall(c, why, "eth_call", totalStart, rpcStart)
				name, err = c.callString(ctx, addr, sigName)
				return err
			})
		}
		if sigSymbol != nil {
			g.Go(func() error {
				totalStart := time.Now()
				if err := c.WaitLimit(ctx, why, "eth_call"); err != nil {
					return err
				}
				rpcStart := time.Now()
				defer observeCall(c, why, "eth_call", totalStart, rpcStart)
				symbol, err = c.callString(ctx, addr, sigSymbol)
				return err
			})
		}
		if sigDecimals != nil {
			g.Go(func() error {
				totalStart := time.Now()
				if err := c.WaitLimit(ctx, why, "eth_call"); err != nil {
					return err
				}
				rpcStart := time.Now()
				defer observeCall(c, why, "eth_call", totalStart, rpcStart)
				decimals, err = c.callUint8(ctx, addr, sigDecimals)
				return err
			})
		}
		*e = g.Wait()
	})
	return
}

func (e *Endpoint) TransactionReceipt(why string, ctx context.Context, txHash common.Hash) (*types.Receipt, error) {
	var r *types.Receipt
	err := e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if err := c.WaitLimit(ctx, why, "eth_getTransactionReceipt"); err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "eth_getTransactionReceipt", totalStart, rpcStart)
		*e = c.Client.Client().CallContext(ctx, &r, "eth_getTransactionReceipt", txHash)
		if *e == nil && r == nil {
			*e = ethereum.NotFound
		}
	})
	return r, err
}

func (e *Endpoint) BlockReceipts(why string, ctx context.Context, number *big.Int) ([]*types.Receipt, error) {
	var receipts []*types.Receipt
	err := e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if err := c.WaitLimit(ctx, why, "eth_getBlockReceipts"); err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "eth_getBlockReceipts", totalStart, rpcStart)
		*e = c.Client.Client().CallContext(ctx, &receipts, "eth_getBlockReceipts", toBlockNumArg(number))
	})
	return receipts, err
}

func (e *Endpoint) TransactionByHash(why string, ctx context.Context, txHash common.Hash) (*types.Transaction, bool, error) {
	var rawTx *types.Transaction
	err := e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if err := c.WaitLimit(ctx, why, "eth_getTransactionByHash"); err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "eth_getTransactionByHash", totalStart, rpcStart)
		*e = c.Client.Client().CallContext(ctx, &rawTx, "eth_getTransactionByHash", txHash)
		if *e != nil {
			return
		}
		if rawTx == nil {
			return
		}
		if rawTx.BlockHash == nil {
			return
		}
	})
	if err != nil {
		return nil, false, err
	}
	if rawTx == nil {
		return nil, false, nil
	}
	if rawTx.BlockHash == nil {
		return rawTx, true, nil
	}
	return rawTx, false, nil
}

func (e *Endpoint) TraceTransaction(why string, ctx context.Context, txHash common.Hash) (*types.TraceFrame, error) {
	var trace *types.TraceFrame
	err := e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if err := c.WaitLimit(ctx, why, "debug_traceTransaction"); err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "debug_traceTransaction", totalStart, rpcStart)
		tracerConfig := map[string]any{
			"tracer": "callTracer",
			"tracerConfig": map[string]any{
				"onlyTopCall": false,
			},
		}
		var result types.TraceFrame
		*e = c.Client.Client().CallContext(ctx, &result, "debug_traceTransaction", txHash, tracerConfig)
		if *e != nil {
			*e = fmt.Errorf("debug_traceTransaction call failed: %v", *e)
			return
		}
		trace = &result
	})
	return trace, err
}

func (e *Endpoint) FilterLogs(why string, ctx context.Context, filter ethereum.FilterQuery) ([]types.Log, error) {
	var logs []types.Log
	err := e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if err := c.WaitLimit(ctx, why, "eth_getLogs"); err != nil {
			*e = err
			return
		}
		arg, err := toFilterArg(filter)
		if err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "eth_getLogs", totalStart, rpcStart)
		*e = c.Client.Client().CallContext(ctx, &logs, "eth_getLogs", arg)
	})
	return logs, err
}

func (e *Endpoint) NonceAt(why string, ctx context.Context, account common.Address, blockNumber *big.Int) (uint64, error) {
	var nonce uint64
	err := e.Call(func(c *Wrapped, e *error) {
		totalStart := time.Now()
		if err := c.WaitLimit(ctx, why, "eth_getTransactionCount"); err != nil {
			*e = err
			return
		}
		rpcStart := time.Now()
		defer observeCall(c, why, "eth_getTransactionCount", totalStart, rpcStart)
		nonce, *e = c.Client.NonceAt(ctx, account, blockNumber)
	})
	return nonce, err
}

func (c *Wrapped) callString(ctx context.Context, to common.Address, data []byte) (string, error) {
	msg := ethereum.CallMsg{To: &to, Data: data}
	res, err := c.Client.CallContract(ctx, msg, nil)
	if err != nil {
		return "", err
	}
	if len(res) < 64 {
		return "", errors.New("invalid response length")
	}
	strLen := new(big.Int).SetBytes(res[32:64]).Uint64()
	if uint64(len(res)) < 64+strLen {
		return "", errors.New("invalid string length in response")
	}
	return strings.Trim(string(res[64:64+strLen]), "\x00"), nil
}

func (c *Wrapped) callUint8(ctx context.Context, to common.Address, data []byte) (uint8, error) {
	msg := ethereum.CallMsg{To: &to, Data: data}
	res, err := c.Client.CallContract(ctx, msg, nil)
	if err != nil {
		return 0, err
	}
	if len(res) == 0 {
		return 0, errors.New("empty response")
	}
	return uint8(res[len(res)-1]), nil
}
