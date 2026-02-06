package model

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Kline struct {
	ID         int64     `json:"id"`
	TokenAddress string  `json:"tokenAddress"`
	Interval   string    `json:"interval"`
	OpenTime   time.Time `json:"openTime"`
	OpenPrice  string    `json:"openPrice"`
	HighPrice  string    `json:"highPrice"`
	LowPrice   string    `json:"lowPrice"`
	ClosePrice string    `json:"closePrice"`
	Volume     string    `json:"volume"`
	CreatedAt  time.Time `json:"createdAt"`
}

type KlineModel struct {
	db *pgxpool.Pool
}

func NewKlineModel(db *pgxpool.Pool) *KlineModel {
	return &KlineModel{db: db}
}

// GetDB 获取数据库连接池
func (m *KlineModel) GetDB() *pgxpool.Pool {
	return m.db
}

// FindByTokenAndInterval 根据代币地址和间隔查询K线数据（带游标分页）
func (m *KlineModel) FindByTokenAndInterval(ctx context.Context, tokenAddress, interval string, cursorTime *time.Time, limit int) ([]*Kline, error) {
	if limit <= 0 {
		limit = 300 // 默认300条
	}
	if limit > 1000 {
		limit = 1000 // 最大1000条
	}

	query := `
		SELECT id, token_address, interval, open_time, 
			open_price::text, high_price::text, low_price::text, close_price::text, 
			volume::text, created_at
		FROM klines
		WHERE LOWER(token_address) = LOWER($1) AND interval = $2
	`
	args := []interface{}{tokenAddress, interval}
	argIdx := 3

	// 如果有游标（时间戳），则查询该时间之前的数据
	if cursorTime != nil {
		query += ` AND open_time < $` + string(rune('0'+argIdx))
		args = append(args, *cursorTime)
		argIdx++
	}

	query += ` ORDER BY open_time DESC LIMIT $` + string(rune('0'+argIdx))
	args = append(args, limit)

	rows, err := m.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var klines []*Kline
	for rows.Next() {
		var k Kline
		err := rows.Scan(
			&k.ID, &k.TokenAddress, &k.Interval, &k.OpenTime,
			&k.OpenPrice, &k.HighPrice, &k.LowPrice, &k.ClosePrice,
			&k.Volume, &k.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		klines = append(klines, &k)
	}

	return klines, nil
}

// FindByTokenAndIntervalRange 根据代币地址、间隔和时间范围查询K线数据
func (m *KlineModel) FindByTokenAndIntervalRange(ctx context.Context, tokenAddress, interval string, from, to int64) ([]*Kline, error) {
	fromTime := time.Unix(from, 0)
	toTime := time.Unix(to, 0)

	rows, err := m.db.Query(ctx, `
		SELECT id, token_address, interval, open_time, 
			open_price::text, high_price::text, low_price::text, close_price::text, 
			volume::text, created_at
		FROM klines
		WHERE LOWER(token_address) = LOWER($1) 
		AND interval = $2
		AND open_time >= $3
		AND open_time <= $4
		ORDER BY open_time ASC
	`, tokenAddress, interval, fromTime, toTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var klines []*Kline
	for rows.Next() {
		var k Kline
		err := rows.Scan(
			&k.ID, &k.TokenAddress, &k.Interval, &k.OpenTime,
			&k.OpenPrice, &k.HighPrice, &k.LowPrice, &k.ClosePrice,
			&k.Volume, &k.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		klines = append(klines, &k)
	}

	return klines, nil
}

