package model

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Trade struct {
	ID              int64     `json:"id"`
	TokenAddress    string    `json:"tokenAddress"`
	UserAddress     string    `json:"userAddress"`
	TradeType       int       `json:"tradeType"` // 10=买入, 20=卖出
	BnbAmount       string    `json:"bnbAmount"`
	TokenAmount     string    `json:"tokenAmount"`
	Price           string    `json:"price"`
	UsdAmount       string    `json:"usdAmount"`
	TransactionHash string    `json:"transactionHash"`
	BlockNumber     int64     `json:"blockNumber"`
	BlockTimestamp  time.Time `json:"blockTimestamp"`
	CreatedAt       time.Time `json:"createdAt"`
}

type TradeModel struct {
	db *pgxpool.Pool
}

func NewTradeModel(db *pgxpool.Pool) *TradeModel {
	return &TradeModel{db: db}
}

// GetDB 获取数据库连接池
func (m *TradeModel) GetDB() *pgxpool.Pool {
	return m.db
}

// FindList 获取交易列表
func (m *TradeModel) FindList(ctx context.Context, params map[string]interface{}) ([]*Trade, int, error) {
	tokenAddress := params["tokenAddress"].(string)

	// 获取总数
	var total int
	err := m.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM trades 
		WHERE LOWER(token_address) = LOWER($1)
	`, tokenAddress).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 构建排序
	orderBy := "block_timestamp DESC"
	if ob, ok := params["orderBy"].(string); ok && ob != "" {
		switch ob {
		case "usd_amount":
			orderBy = "usd_amount"
		case "token_amount":
			orderBy = "token_amount"
		case "bnb_amount":
			orderBy = "bnb_amount"
		}
		if desc, ok := params["orderDesc"].(bool); ok && desc {
			orderBy += " DESC"
		}
	}

	// 分页
	pageNo := 1
	pageSize := 10
	if pn, ok := params["pageNo"].(int); ok && pn > 0 {
		pageNo = pn
	}
	if ps, ok := params["pageSize"].(int); ok && ps > 0 {
		pageSize = ps
	}
	offset := (pageNo - 1) * pageSize

	rows, err := m.db.Query(ctx, `
		SELECT id, token_address, user_address, trade_type,
			bnb_amount, token_amount, price, usd_amount,
			transaction_hash, block_number, block_timestamp, created_at
		FROM trades
		WHERE LOWER(token_address) = LOWER($1)
		ORDER BY `+orderBy+`
		LIMIT $2 OFFSET $3
	`, tokenAddress, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var trades []*Trade
	for rows.Next() {
		var t Trade
		err := rows.Scan(
			&t.ID, &t.TokenAddress, &t.UserAddress, &t.TradeType,
			&t.BnbAmount, &t.TokenAmount, &t.Price, &t.UsdAmount,
			&t.TransactionHash, &t.BlockNumber, &t.BlockTimestamp, &t.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		trades = append(trades, &t)
	}

	return trades, total, nil
}

// Get24HStats 获取24小时统计
func (m *TradeModel) Get24HStats(ctx context.Context, tokenAddress string) (map[string]interface{}, error) {
	stats := map[string]interface{}{
		"buyCount":    0,
		"sellCount":   0,
		"totalVolume": "0",
	}

	// 24小时前的时间
	since := time.Now().Add(-24 * time.Hour)

	// 买入次数
	var buyCount int
	m.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM trades 
		WHERE LOWER(token_address) = LOWER($1) 
		AND trade_type = 10 
		AND block_timestamp >= $2
	`, tokenAddress, since).Scan(&buyCount)
	stats["buyCount"] = buyCount

	// 卖出次数
	var sellCount int
	m.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM trades 
		WHERE LOWER(token_address) = LOWER($1) 
		AND trade_type = 20 
		AND block_timestamp >= $2
	`, tokenAddress, since).Scan(&sellCount)
	stats["sellCount"] = sellCount

	// 总交易量
	var totalVolume string
	m.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(bnb_amount::numeric), 0)::text FROM trades 
		WHERE LOWER(token_address) = LOWER($1) 
		AND block_timestamp >= $2
	`, tokenAddress, since).Scan(&totalVolume)
	stats["totalVolume"] = totalVolume

	return stats, nil
}

