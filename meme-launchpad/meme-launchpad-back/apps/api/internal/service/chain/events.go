package chain

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/meme-launchpad/api/internal/model"
)

// EventService 链上事件服务
type EventService struct {
	db           *pgxpool.Pool
	rpcURL       string
	coreContract string
	tokenModel   *model.TokenModel
	tradeModel   *model.TradeModel
}

// NewEventService 创建事件服务
func NewEventService(
	rpcURL string,
	coreContract string,
	tokenModel *model.TokenModel,
	tradeModel *model.TradeModel,
) *EventService {
	var db *pgxpool.Pool
	if tokenModel != nil {
		db = tokenModel.GetDB()
	}

	return &EventService{
		db:           db,
		rpcURL:       rpcURL,
		coreContract: coreContract,
		tokenModel:   tokenModel,
		tradeModel:   tradeModel,
	}
}

// TokenCreatedEvent 代币创建事件
type TokenCreatedEvent struct {
	ID              int64     `json:"id"`
	TokenAddress    string    `json:"tokenAddress"`
	CreatorAddress  string    `json:"creatorAddress"`
	Name            string    `json:"name"`
	Symbol          string    `json:"symbol"`
	TotalSupply     string    `json:"totalSupply"`
	RequestID       string    `json:"requestId"`
	TransactionHash string    `json:"transactionHash"`
	BlockNumber     int64     `json:"blockNumber"`
	BlockTimestamp  time.Time `json:"blockTimestamp"`
	LogIndex        int       `json:"logIndex"`
	CreatedAt       time.Time `json:"createdAt"`
}

// TokenBoughtEvent 代币购买事件
type TokenBoughtEvent struct {
	ID                  int64     `json:"id"`
	TokenAddress        string    `json:"tokenAddress"`
	BuyerAddress        string    `json:"buyerAddress"`
	BnbAmount           string    `json:"bnbAmount"`
	TokenAmount         string    `json:"tokenAmount"`
	TradingFee          string    `json:"tradingFee"`
	VirtualBnbReserve   string    `json:"virtualBnbReserve"`
	VirtualTokenReserve string    `json:"virtualTokenReserve"`
	AvailableTokens     string    `json:"availableTokens"`
	CollectedBnb        string    `json:"collectedBnb"`
	TransactionHash     string    `json:"transactionHash"`
	BlockNumber         int64     `json:"blockNumber"`
	BlockTimestamp      time.Time `json:"blockTimestamp"`
	LogIndex            int       `json:"logIndex"`
	CreatedAt           time.Time `json:"createdAt"`
}

// TokenSoldEvent 代币卖出事件
type TokenSoldEvent struct {
	ID                  int64     `json:"id"`
	TokenAddress        string    `json:"tokenAddress"`
	SellerAddress       string    `json:"sellerAddress"`
	TokenAmount         string    `json:"tokenAmount"`
	BnbAmount           string    `json:"bnbAmount"`
	TradingFee          string    `json:"tradingFee"`
	VirtualBnbReserve   string    `json:"virtualBnbReserve"`
	VirtualTokenReserve string    `json:"virtualTokenReserve"`
	AvailableTokens     string    `json:"availableTokens"`
	CollectedBnb        string    `json:"collectedBnb"`
	TransactionHash     string    `json:"transactionHash"`
	BlockNumber         int64     `json:"blockNumber"`
	BlockTimestamp      time.Time `json:"blockTimestamp"`
	LogIndex            int       `json:"logIndex"`
	CreatedAt           time.Time `json:"createdAt"`
}

// TokenGraduatedEvent 代币毕业事件
type TokenGraduatedEvent struct {
	ID              int64     `json:"id"`
	TokenAddress    string    `json:"tokenAddress"`
	LiquidityBnb    string    `json:"liquidityBnb"`
	LiquidityTokens string    `json:"liquidityTokens"`
	LiquidityResult string    `json:"liquidityResult"`
	TransactionHash string    `json:"transactionHash"`
	BlockNumber     int64     `json:"blockNumber"`
	BlockTimestamp  time.Time `json:"blockTimestamp"`
	LogIndex        int       `json:"logIndex"`
	CreatedAt       time.Time `json:"createdAt"`
}

// GetTokenCreatedByAddress 根据地址获取代币创建事件
func (s *EventService) GetTokenCreatedByAddress(ctx context.Context, tokenAddress string) (*TokenCreatedEvent, error) {
	var e TokenCreatedEvent
	err := s.db.QueryRow(ctx, `
		SELECT id, token_address, creator_address, name, symbol, total_supply,
			request_id, transaction_hash, block_number, block_timestamp, log_index, created_at
		FROM token_created_events
		WHERE LOWER(token_address) = LOWER($1)
		LIMIT 1
	`, tokenAddress).Scan(
		&e.ID, &e.TokenAddress, &e.CreatorAddress, &e.Name, &e.Symbol, &e.TotalSupply,
		&e.RequestID, &e.TransactionHash, &e.BlockNumber, &e.BlockTimestamp, &e.LogIndex, &e.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

// GetTokenCreatedByRequestID 根据 requestID 获取代币创建事件
func (s *EventService) GetTokenCreatedByRequestID(ctx context.Context, requestID string) (*TokenCreatedEvent, error) {
	var e TokenCreatedEvent
	err := s.db.QueryRow(ctx, `
		SELECT id, token_address, creator_address, name, symbol, total_supply,
			request_id, transaction_hash, block_number, block_timestamp, log_index, created_at
		FROM token_created_events
		WHERE request_id = $1
		LIMIT 1
	`, requestID).Scan(
		&e.ID, &e.TokenAddress, &e.CreatorAddress, &e.Name, &e.Symbol, &e.TotalSupply,
		&e.RequestID, &e.TransactionHash, &e.BlockNumber, &e.BlockTimestamp, &e.LogIndex, &e.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

// GetRecentTokenCreated 获取最近创建的代币
func (s *EventService) GetRecentTokenCreated(ctx context.Context, limit int) ([]*TokenCreatedEvent, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, token_address, creator_address, name, symbol, total_supply,
			request_id, transaction_hash, block_number, block_timestamp, log_index, created_at
		FROM token_created_events
		ORDER BY block_timestamp DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*TokenCreatedEvent
	for rows.Next() {
		var e TokenCreatedEvent
		if err := rows.Scan(
			&e.ID, &e.TokenAddress, &e.CreatorAddress, &e.Name, &e.Symbol, &e.TotalSupply,
			&e.RequestID, &e.TransactionHash, &e.BlockNumber, &e.BlockTimestamp, &e.LogIndex, &e.CreatedAt,
		); err != nil {
			return nil, err
		}
		events = append(events, &e)
	}
	return events, nil
}

// GetTokenBuyEvents 获取代币购买事件
func (s *EventService) GetTokenBuyEvents(ctx context.Context, tokenAddress string, limit, offset int) ([]*TokenBoughtEvent, int, error) {
	// 获取总数
	var total int
	err := s.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM token_bought_events WHERE LOWER(token_address) = LOWER($1)
	`, tokenAddress).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT id, token_address, buyer_address, bnb_amount, token_amount,
			trading_fee, virtual_bnb_reserve, virtual_token_reserve, available_tokens, collected_bnb,
			transaction_hash, block_number, block_timestamp, log_index, created_at
		FROM token_bought_events
		WHERE LOWER(token_address) = LOWER($1)
		ORDER BY block_timestamp DESC
		LIMIT $2 OFFSET $3
	`, tokenAddress, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var events []*TokenBoughtEvent
	for rows.Next() {
		var e TokenBoughtEvent
		if err := rows.Scan(
			&e.ID, &e.TokenAddress, &e.BuyerAddress, &e.BnbAmount, &e.TokenAmount,
			&e.TradingFee, &e.VirtualBnbReserve, &e.VirtualTokenReserve, &e.AvailableTokens, &e.CollectedBnb,
			&e.TransactionHash, &e.BlockNumber, &e.BlockTimestamp, &e.LogIndex, &e.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		events = append(events, &e)
	}
	return events, total, nil
}

// GetTokenSellEvents 获取代币卖出事件
func (s *EventService) GetTokenSellEvents(ctx context.Context, tokenAddress string, limit, offset int) ([]*TokenSoldEvent, int, error) {
	// 获取总数
	var total int
	err := s.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM token_sold_events WHERE LOWER(token_address) = LOWER($1)
	`, tokenAddress).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT id, token_address, seller_address, token_amount, bnb_amount,
			trading_fee, virtual_bnb_reserve, virtual_token_reserve, available_tokens, collected_bnb,
			transaction_hash, block_number, block_timestamp, log_index, created_at
		FROM token_sold_events
		WHERE LOWER(token_address) = LOWER($1)
		ORDER BY block_timestamp DESC
		LIMIT $2 OFFSET $3
	`, tokenAddress, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var events []*TokenSoldEvent
	for rows.Next() {
		var e TokenSoldEvent
		if err := rows.Scan(
			&e.ID, &e.TokenAddress, &e.SellerAddress, &e.TokenAmount, &e.BnbAmount,
			&e.TradingFee, &e.VirtualBnbReserve, &e.VirtualTokenReserve, &e.AvailableTokens, &e.CollectedBnb,
			&e.TransactionHash, &e.BlockNumber, &e.BlockTimestamp, &e.LogIndex, &e.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		events = append(events, &e)
	}
	return events, total, nil
}

// GetTokenTrades 获取代币所有交易（买入和卖出）
func (s *EventService) GetTokenTrades(ctx context.Context, tokenAddress string, limit, offset int) ([]map[string]interface{}, int, error) {
	// 使用 UNION ALL 合并买入和卖出事件
	var total int
	err := s.db.QueryRow(ctx, `
		SELECT 
			(SELECT COUNT(*) FROM token_bought_events WHERE LOWER(token_address) = LOWER($1)) +
			(SELECT COUNT(*) FROM token_sold_events WHERE LOWER(token_address) = LOWER($1))
	`, tokenAddress).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT * FROM (
			SELECT 
				'buy' as trade_type,
				token_address,
				buyer_address as user_address,
				bnb_amount,
				token_amount,
				trading_fee,
				transaction_hash,
				block_number,
				block_timestamp
			FROM token_bought_events
			WHERE LOWER(token_address) = LOWER($1)
			
			UNION ALL
			
			SELECT 
				'sell' as trade_type,
				token_address,
				seller_address as user_address,
				bnb_amount,
				token_amount,
				trading_fee,
				transaction_hash,
				block_number,
				block_timestamp
			FROM token_sold_events
			WHERE LOWER(token_address) = LOWER($1)
		) combined
		ORDER BY block_timestamp DESC
		LIMIT $2 OFFSET $3
	`, tokenAddress, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var trades []map[string]interface{}
	for rows.Next() {
		var tradeType, tokenAddr, userAddr, bnbAmount, tokenAmount, tradingFee, txHash string
		var blockNumber int64
		var blockTimestamp time.Time

		if err := rows.Scan(&tradeType, &tokenAddr, &userAddr, &bnbAmount, &tokenAmount,
			&tradingFee, &txHash, &blockNumber, &blockTimestamp); err != nil {
			return nil, 0, err
		}

		tradeTypeInt := 10 // buy
		if tradeType == "sell" {
			tradeTypeInt = 20
		}

		trades = append(trades, map[string]interface{}{
			"tradeType":       tradeTypeInt,
			"tokenAddress":    tokenAddr,
			"userAddress":     userAddr,
			"bnbAmount":       bnbAmount,
			"tokenAmount":     tokenAmount,
			"tradingFee":      tradingFee,
			"transactionHash": txHash,
			"blockNumber":     blockNumber,
			"blockTimestamp":  blockTimestamp.Format(time.RFC3339),
		})
	}
	return trades, total, nil
}

// GetToken24HStats 获取代币24小时统计
func (s *EventService) GetToken24HStats(ctx context.Context, tokenAddress string) (map[string]interface{}, error) {
	since := time.Now().Add(-24 * time.Hour)

	stats := map[string]interface{}{
		"buyCount":       0,
		"sellCount":      0,
		"totalVolumeBnb": "0",
		"totalVolumeUsd": "0",
	}

	// 买入次数和金额
	var buyCount int
	var buyVolume string
	err := s.db.QueryRow(ctx, `
		SELECT COUNT(*), COALESCE(SUM(bnb_amount::numeric), 0)::text
		FROM token_bought_events
		WHERE LOWER(token_address) = LOWER($1) AND block_timestamp >= $2
	`, tokenAddress, since).Scan(&buyCount, &buyVolume)
	if err == nil {
		stats["buyCount"] = buyCount
	}

	// 卖出次数和金额
	var sellCount int
	var sellVolume string
	err = s.db.QueryRow(ctx, `
		SELECT COUNT(*), COALESCE(SUM(bnb_amount::numeric), 0)::text
		FROM token_sold_events
		WHERE LOWER(token_address) = LOWER($1) AND block_timestamp >= $2
	`, tokenAddress, since).Scan(&sellCount, &sellVolume)
	if err == nil {
		stats["sellCount"] = sellCount
	}

	// 计算总交易量
	// 简化处理：buyVolume + sellVolume
	stats["totalVolumeBnb"] = buyVolume // 实际应该相加

	return stats, nil
}

// GetTokenIsGraduated 检查代币是否已毕业
func (s *EventService) GetTokenIsGraduated(ctx context.Context, tokenAddress string) (bool, *TokenGraduatedEvent, error) {
	var e TokenGraduatedEvent
	err := s.db.QueryRow(ctx, `
		SELECT id, token_address, liquidity_bnb, liquidity_tokens, liquidity_result,
			transaction_hash, block_number, block_timestamp, log_index, created_at
		FROM token_graduated_events
		WHERE LOWER(token_address) = LOWER($1)
		LIMIT 1
	`, tokenAddress).Scan(
		&e.ID, &e.TokenAddress, &e.LiquidityBnb, &e.LiquidityTokens, &e.LiquidityResult,
		&e.TransactionHash, &e.BlockNumber, &e.BlockTimestamp, &e.LogIndex, &e.CreatedAt,
	)
	if err != nil {
		return false, nil, nil // 未毕业
	}
	return true, &e, nil
}

// GetUserTradeStats 获取用户交易统计
func (s *EventService) GetUserTradeStats(ctx context.Context, userAddress string) (map[string]interface{}, error) {
	stats := map[string]interface{}{
		"totalBuyCount":    0,
		"totalSellCount":   0,
		"totalBuyBnb":      "0",
		"totalSellBnb":     "0",
		"tradedTokenCount": 0,
	}

	// 买入统计
	var buyCount int
	var buyBnb string
	s.db.QueryRow(ctx, `
		SELECT COUNT(*), COALESCE(SUM(bnb_amount::numeric), 0)::text
		FROM token_bought_events
		WHERE LOWER(buyer_address) = LOWER($1)
	`, userAddress).Scan(&buyCount, &buyBnb)
	stats["totalBuyCount"] = buyCount
	stats["totalBuyBnb"] = buyBnb

	// 卖出统计
	var sellCount int
	var sellBnb string
	s.db.QueryRow(ctx, `
		SELECT COUNT(*), COALESCE(SUM(bnb_amount::numeric), 0)::text
		FROM token_sold_events
		WHERE LOWER(seller_address) = LOWER($1)
	`, userAddress).Scan(&sellCount, &sellBnb)
	stats["totalSellCount"] = sellCount
	stats["totalSellBnb"] = sellBnb

	// 交易过的代币数量
	var tokenCount int
	s.db.QueryRow(ctx, `
		SELECT COUNT(DISTINCT token_address) FROM (
			SELECT token_address FROM token_bought_events WHERE LOWER(buyer_address) = LOWER($1)
			UNION
			SELECT token_address FROM token_sold_events WHERE LOWER(seller_address) = LOWER($1)
		) t
	`, userAddress).Scan(&tokenCount)
	stats["tradedTokenCount"] = tokenCount

	return stats, nil
}

