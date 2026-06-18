package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"evm-scanner/adapter"
	"evm-scanner/gateway"
	"evm-scanner/service"
	"evm-scanner/token"
	"fmt"
	"log"
	"math/big"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	backfillDefaultOffset     = 100
	backfillMaxOffset         = 200
	backfillMaxDuration       = 30 * time.Minute
	backfillMaxConcurrentTask = 4
)

var (
	backfillTaskSem      = make(chan struct{}, backfillMaxConcurrentTask)
	backfillTaskInFlight sync.Map
)

type etherscanNormalTx struct {
	BlockNumber     string `mapstructure:"blockNumber"`
	TimeStamp       string `mapstructure:"timeStamp"`
	Hash            string `mapstructure:"hash"`
	BlockHash       string `mapstructure:"blockHash"`
	From            string `mapstructure:"from"`
	To              string `mapstructure:"to"`
	Value           string `mapstructure:"value"`
	IsError         string `mapstructure:"isError"`
	TxReceiptStatus string `mapstructure:"txreceipt_status"`
}

type etherscanTokenTx struct {
	BlockNumber     string `mapstructure:"blockNumber"`
	TimeStamp       string `mapstructure:"timeStamp"`
	Hash            string `mapstructure:"hash"`
	BlockHash       string `mapstructure:"blockHash"`
	From            string `mapstructure:"from"`
	To              string `mapstructure:"to"`
	Value           string `mapstructure:"value"`
	ContractAddress string `mapstructure:"contractAddress"`
	TokenSymbol     string `mapstructure:"tokenSymbol"`
	TokenDecimal    string `mapstructure:"tokenDecimal"`
	IsError         string `mapstructure:"isError"`
	TxReceiptStatus string `mapstructure:"txreceipt_status"`
}

type backfillEvent struct {
	kind            string
	hash            string
	blockHash       string
	blockNumber     int64
	timestamp       int64
	from            string
	to              string
	amount          string
	tokenContract   string
	tokenSymbol     string
	tokenDecimals   int
	isError         string
	txReceiptStatus string
}

func (s *App) BackfillAddressHistory(ctx context.Context, chain, address string, task gateway.BackfillTask, providers []service.HistoryProvider, gatewayClient *gateway.Client) error {
	if s == nil {
		return fmt.Errorf("app is nil")
	}
	if len(providers) == 0 {
		return fmt.Errorf("history providers are empty")
	}
	if gatewayClient == nil {
		return fmt.Errorf("gateway client is nil")
	}

	chain = normalizeDiscoveryChain(chain)
	address = strings.ToLower(strings.TrimSpace(address))
	if chain == "" || address == "" {
		return fmt.Errorf("invalid backfill input")
	}

	sc := s.pickScanner(chain)
	if sc == nil || sc.ChainId() == nil {
		return fmt.Errorf("scanner not found for chain=%s", chain)
	}

	startBlock := task.StartBlock
	endBlock := task.EndBlock
	if startBlock < 0 {
		startBlock = 0
	}
	if endBlock <= 0 {
		endBlock = 99999999
	}
	if endBlock < startBlock {
		return fmt.Errorf("invalid block range: start=%d end=%d", startBlock, endBlock)
	}

	chainID := sc.ChainId().Uint64()
	state, err := s.backfillDB.LoadBackfillCursor(chainID, address)
	if err != nil {
		return err
	}
	if state.NormalDone && state.TokenDone {
		return nil
	}

	offset := resolveBackfillOffset(task.ChunkSize)

	var normalTxs []etherscanNormalTx
	if !state.NormalDone {
		var providerName string
		normalTxs, providerName, err = fetchHistoryTxPage[etherscanNormalTx](ctx, providers, chainID, "txlist", address, startBlock, endBlock, state.NormalPage, offset)
		if err != nil {
			return err
		}
		log.Printf("[Backfill] normal source: chain=%s address=%s provider=%s page=%d size=%d",
			chain, address, providerName, state.NormalPage, len(normalTxs))
		advanceBackfillPage(len(normalTxs), offset, &state.NormalPage, &state.NormalDone)
	}

	var tokenTxs []etherscanTokenTx
	if !state.TokenDone {
		var providerName string
		tokenTxs, providerName, err = fetchHistoryTxPage[etherscanTokenTx](ctx, providers, chainID, "tokentx", address, startBlock, endBlock, state.TokenPage, offset)
		if err != nil {
			return err
		}
		log.Printf("[Backfill] token source: chain=%s address=%s provider=%s page=%d size=%d",
			chain, address, providerName, state.TokenPage, len(tokenTxs))
		advanceBackfillPage(len(tokenTxs), offset, &state.TokenPage, &state.TokenDone)
	}

	events := mergeBackfillEvents(chain, chainID, address, normalTxs, tokenTxs)
	sort.Slice(events, func(i, j int) bool {
		if events[i].timestamp != events[j].timestamp {
			return events[i].timestamp > events[j].timestamp
		}
		if events[i].blockNumber != events[j].blockNumber {
			return events[i].blockNumber > events[j].blockNumber
		}
		return events[i].hash > events[j].hash
	})

	for _, ev := range events {
		activity := toBackfillActivity(chain, address, ev)
		payload, marshalErr := json.Marshal(activity)
		if marshalErr != nil {
			return marshalErr
		}
		if sendErr := gatewayClient.SendActivity(chain, payload); sendErr != nil {
			return sendErr
		}
	}
	if err := s.backfillDB.SaveBackfillCursor(chainID, address, state); err != nil {
		return err
	}
	log.Printf("[Backfill] page processed: chain=%s address=%s normal_page=%d token_page=%d normal_done=%v token_done=%v emitted=%d",
		chain, address, state.NormalPage, state.TokenPage, state.NormalDone, state.TokenDone, len(events))
	return nil
}

func launchBackfillTask(ctx context.Context, app *App, gatewayClient *gateway.Client, providers []service.HistoryProvider, task gateway.BackfillTask) {
	chain := normalizeDiscoveryChain(task.Chain)
	address := strings.ToLower(strings.TrimSpace(task.Address))
	if chain == "" || address == "" {
		_ = gatewayClient.SendBackfillResult(gateway.BackfillResult{
			Chain:      chain,
			Address:    address,
			Status:     "failed",
			Error:      "invalid backfill task",
			StartBlock: task.StartBlock,
			EndBlock:   task.EndBlock,
			ChunkSize:  task.ChunkSize,
		})
		return
	}
	key := chain + ":" + address
	if _, loaded := backfillTaskInFlight.LoadOrStore(key, struct{}{}); loaded {
		return
	}

	go func() {
		defer backfillTaskInFlight.Delete(key)
		select {
		case backfillTaskSem <- struct{}{}:
		case <-ctx.Done():
			return
		}
		defer func() { <-backfillTaskSem }()

		taskCtx, cancel := context.WithTimeout(ctx, backfillMaxDuration)
		defer cancel()

		err := app.BackfillAddressHistory(taskCtx, chain, address, task, providers, gatewayClient)
		result := gateway.BackfillResult{
			Chain:      chain,
			Address:    address,
			StartBlock: task.StartBlock,
			EndBlock:   task.EndBlock,
			ChunkSize:  task.ChunkSize,
		}
		if err != nil {
			result.Status = "failed"
			result.Error = err.Error()
		} else {
			result.Status = "done"
		}
		_ = gatewayClient.SendBackfillResult(result)
	}()
}

func fetchHistoryTxPage[T any](
	ctx context.Context,
	providers []service.HistoryProvider,
	chainID uint64,
	action string,
	address string,
	startBlock int64,
	endBlock int64,
	page uint64,
	offset int,
) ([]T, string, error) {
	if len(providers) == 0 {
		return nil, "", fmt.Errorf("history providers are empty")
	}
	base := url.Values{}
	base.Set("module", "account")
	base.Set("action", action)
	base.Set("address", address)
	base.Set("startblock", strconv.FormatInt(startBlock, 10))
	base.Set("endblock", strconv.FormatInt(endBlock, 10))
	base.Set("sort", "desc")
	base.Set("chainid", strconv.FormatUint(chainID, 10))
	base.Set("page", strconv.FormatUint(page, 10))
	base.Set("offset", strconv.Itoa(offset))
	var (
		lastErr          error
		lastProviderName string
	)
	for _, provider := range providers {
		if provider == nil {
			continue
		}
		lastProviderName = provider.Name()
		var out []T
		err := provider.Get(ctx, chainID, base, &out)
		if err == nil {
			return out, lastProviderName, nil
		}
		if errors.Is(err, service.ErrEtherscanNoTransactionsFound) {
			return nil, lastProviderName, nil
		}
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			return nil, lastProviderName, err
		}
		if errors.Is(err, service.ErrHistoryProviderUnavailable) {
			log.Printf("[Backfill] history provider unavailable, skip: provider=%s action=%s chain_id=%d page=%d error=%v",
				lastProviderName, action, chainID, page, err)
			continue
		}
		lastErr = fmt.Errorf("provider=%s action=%s chain_id=%d page=%d: %w", lastProviderName, action, chainID, page, err)
		log.Printf("[Backfill] history provider failed, trying next: provider=%s action=%s chain_id=%d page=%d error=%v",
			lastProviderName, action, chainID, page, err)
	}
	if lastErr != nil {
		return nil, lastProviderName, lastErr
	}
	return nil, "", fmt.Errorf("no available history provider")
}

func resolveBackfillOffset(chunkSize int64) int {
	if chunkSize <= 0 {
		return backfillDefaultOffset
	}
	if chunkSize > backfillMaxOffset {
		return backfillMaxOffset
	}
	return int(chunkSize)
}

func advanceBackfillPage(size int, offset int, page *uint64, done *bool) {
	if size < offset {
		*done = true
		return
	}
	*page++
}

func mergeBackfillEvents(chain string, chainID uint64, address string, normalTxs []etherscanNormalTx, tokenTxs []etherscanTokenTx) []backfillEvent {
	byHash := make(map[string]backfillEvent, len(tokenTxs)+len(normalTxs))

	for _, tx := range tokenTxs {
		hash := strings.ToLower(strings.TrimSpace(tx.Hash))
		if hash == "" {
			continue
		}
		ev := backfillEvent{
			kind:            "erc20",
			hash:            hash,
			blockHash:       strings.TrimSpace(tx.BlockHash),
			blockNumber:     parseInt64(tx.BlockNumber),
			timestamp:       parseInt64(tx.TimeStamp),
			from:            strings.ToLower(strings.TrimSpace(tx.From)),
			to:              strings.ToLower(strings.TrimSpace(tx.To)),
			amount:          strings.TrimSpace(tx.Value),
			tokenContract:   strings.ToLower(strings.TrimSpace(tx.ContractAddress)),
			tokenSymbol:     strings.ToUpper(strings.TrimSpace(tx.TokenSymbol)),
			tokenDecimals:   parseInt(tx.TokenDecimal),
			isError:         strings.TrimSpace(tx.IsError),
			txReceiptStatus: strings.TrimSpace(tx.TxReceiptStatus),
		}
		byHash[hash] = ev
	}

	nativeInfo := token.NativeCurrencys[chainID]
	nativeSymbol := "ETH"
	nativeDecimals := 18
	if nativeInfo != nil {
		if strings.TrimSpace(nativeInfo.Symbol) != "" {
			nativeSymbol = strings.ToUpper(strings.TrimSpace(nativeInfo.Symbol))
		}
		if nativeInfo.Decimals > 0 {
			nativeDecimals = int(nativeInfo.Decimals)
		}
	}

	for _, tx := range normalTxs {
		hash := strings.ToLower(strings.TrimSpace(tx.Hash))
		if hash == "" {
			continue
		}
		if _, exists := byHash[hash]; exists {
			continue
		}
		ev := backfillEvent{
			kind:            "native",
			hash:            hash,
			blockHash:       strings.TrimSpace(tx.BlockHash),
			blockNumber:     parseInt64(tx.BlockNumber),
			timestamp:       parseInt64(tx.TimeStamp),
			from:            strings.ToLower(strings.TrimSpace(tx.From)),
			to:              strings.ToLower(strings.TrimSpace(tx.To)),
			amount:          strings.TrimSpace(tx.Value),
			tokenSymbol:     nativeSymbol,
			tokenDecimals:   nativeDecimals,
			isError:         strings.TrimSpace(tx.IsError),
			txReceiptStatus: strings.TrimSpace(tx.TxReceiptStatus),
		}
		// keep only txs that involve target address
		if ev.from != address && ev.to != address {
			continue
		}
		byHash[hash] = ev
	}

	out := make([]backfillEvent, 0, len(byHash))
	for _, ev := range byHash {
		if ev.from == "" && ev.to == "" {
			continue
		}
		out = append(out, ev)
	}
	return out
}

func toBackfillActivity(chain, address string, ev backfillEvent) *adapter.StandardActivity {
	eventType := "transfer"
	assetType := strings.ToUpper(strings.TrimSpace(ev.tokenSymbol))
	if ev.kind == "erc20" {
		switch chain {
		case "bsc":
			assetType = "BEP20"
		default:
			assetType = "ERC20"
		}
	}
	if assetType == "" {
		assetType = "ERC20"
	}

	status := "SUCCESS"
	if ev.isError == "1" {
		status = "FAILED"
	} else if ev.txReceiptStatus != "" && ev.txReceiptStatus != "1" {
		status = "FAILED"
	}

	amount := ev.amount
	if amount == "" {
		amount = "0"
	}
	amountFormatted := formatTokenAmount(amount, ev.tokenDecimals)

	return &adapter.StandardActivity{
		ID:              makeBackfillActivityID(ev.hash, address),
		SchemaVersion:   "v1",
		Chain:           chain,
		Address:         address,
		IsBackfill:      true,
		EventType:       eventType,
		AssetType:       assetType,
		TokenSymbol:     ev.tokenSymbol,
		TokenContract:   ev.tokenContract,
		TokenDecimals:   ev.tokenDecimals,
		Amount:          amount,
		AmountFormatted: amountFormatted,
		TxID:            ev.hash,
		BlockNumber:     ev.blockNumber,
		BlockHash:       ev.blockHash,
		Timestamp:       ev.timestamp,
		From:            ev.from,
		To:              ev.to,
		Status:          status,
		Transfers: []adapter.TransferItem{
			{
				AssetType:     assetType,
				TokenContract: ev.tokenContract,
				TokenSymbol:   ev.tokenSymbol,
				TokenDecimals: ev.tokenDecimals,
				Amount:        amount,
				From:          ev.from,
				To:            ev.to,
				LogIndex:      0,
			},
		},
		RawData: map[string]any{
			"source": "etherscan_backfill",
			"type":   ev.kind,
		},
	}
}

func makeBackfillActivityID(txHash, address string) string {
	raw := fmt.Sprintf("%s:%s", strings.ToLower(strings.TrimSpace(txHash)), strings.ToLower(strings.TrimSpace(address)))
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:16])
}

func parseInt64(v string) int64 {
	n, _ := strconv.ParseInt(strings.TrimSpace(v), 10, 64)
	return n
}

func parseInt(v string) int {
	n, _ := strconv.Atoi(strings.TrimSpace(v))
	return n
}

func formatTokenAmount(raw string, decimals int) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "0"
	}
	n := new(big.Int)
	if _, ok := n.SetString(raw, 10); !ok {
		return raw
	}
	if decimals <= 0 {
		return n.String()
	}
	scale := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil)
	r := new(big.Rat).SetFrac(n, scale)
	return r.FloatString(6)
}
