package database

import (
	"context"
	"fmt"
	"math/big"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/meme-launchpad/indexer/internal/types"
	"go.uber.org/zap"
)

// InsertTokenCreatedEvent 插入代币创建事件，并同步到 tokens 业务表
func (db *DB) InsertTokenCreatedEvent(ctx context.Context, event *types.TokenCreatedEvent) error {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	blockTime := time.Unix(int64(event.BlockTimestamp), 0)

	// 1. 插入事件表
	_, err = tx.Exec(ctx, `
		INSERT INTO token_created_events (
			token_address, creator_address, name, symbol, total_supply, 
			request_id, transaction_hash, block_number, block_timestamp, log_index
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (transaction_hash, log_index) DO NOTHING
	`,
		event.TokenAddress,
		event.CreatorAddress,
		event.Name,
		event.Symbol,
		event.TotalSupply,
		event.RequestID,
		event.TransactionHash,
		event.BlockNumber,
		blockTime,
		event.LogIndex,
	)
	if err != nil {
		return err
	}

	// 2. 从 token_creation_requests 表获取 logo
	var logo string
	err = tx.QueryRow(ctx, `
		SELECT COALESCE(logo, '') FROM token_creation_requests WHERE request_id = $1
	`, event.RequestID).Scan(&logo)
	if err != nil {
		// 如果查询失败，使用空字符串作为默认值
		logo = ""
	}

	// 3. 同步到 tokens 业务表
	_, err = tx.Exec(ctx, `
		INSERT INTO tokens (
			name, symbol, logo, token_contract_address, creator_address,
			launch_mode, launch_time, bnb_target, total_supply, status,
			request_id, nonce, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, 1, $6, '24000000000000000000', $7, 1, $8, 0, $9, $9)
		ON CONFLICT (token_contract_address) DO UPDATE SET
			name = EXCLUDED.name,
			symbol = EXCLUDED.symbol,
			logo = COALESCE(NULLIF(EXCLUDED.logo, ''), tokens.logo),
			updated_at = EXCLUDED.updated_at
	`,
		event.Name,
		event.Symbol,
		logo,
		event.TokenAddress,
		event.CreatorAddress,
		event.BlockTimestamp,
		event.TotalSupply,
		event.RequestID,
		blockTime,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// InsertTokenBoughtEvent 插入代币购买事件，并同步到 trades 和 tokens 表
func (db *DB) InsertTokenBoughtEvent(ctx context.Context, event *types.TokenBoughtEvent) error {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	blockTime := time.Unix(int64(event.BlockTimestamp), 0)

	// 1. 插入事件表
	_, err = tx.Exec(ctx, `
		INSERT INTO token_bought_events (
			token_address, buyer_address, bnb_amount, token_amount,
			trading_fee, virtual_bnb_reserve, virtual_token_reserve,
			available_tokens, collected_bnb,
			transaction_hash, block_number, block_timestamp, log_index
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		ON CONFLICT (transaction_hash, log_index) DO NOTHING
	`,
		event.TokenAddress,
		event.BuyerAddress,
		event.BnbAmount,
		event.TokenAmount,
		event.TradingFee,
		event.VirtualBNBReserve,
		event.VirtualTokenReserve,
		event.AvailableTokens,
		event.CollectedBNB,
		event.TransactionHash,
		event.BlockNumber,
		blockTime,
		event.LogIndex,
	)
	if err != nil {
		return err
	}

	// 2. 同步到 trades 业务表 (trade_type=10 表示买入)
	_, err = tx.Exec(ctx, `
		INSERT INTO trades (
			token_address, user_address, trade_type, bnb_amount, token_amount,
			price, transaction_hash, block_number, block_timestamp
		) VALUES ($1, $2, 10, $3, $4, 0, $5, $6, $7)
		ON CONFLICT (transaction_hash, trade_type) DO NOTHING
	`,
		event.TokenAddress,
		event.BuyerAddress,
		event.BnbAmount,
		event.TokenAmount,
		event.TransactionHash,
		event.BlockNumber,
		blockTime,
	)
	if err != nil {
		return err
	}

	// 3. 更新 tokens 表的 bnb_current（累计 BNB）和 available_tokens（内盘代币数量）
	_, err = tx.Exec(ctx, `
			UPDATE tokens SET 
				bnb_current = $1::numeric,
				available_tokens = $2::numeric,
				updated_at = $3
			WHERE LOWER(token_contract_address) = LOWER($4)
		`,
		event.CollectedBNB,
		event.AvailableTokens,
		blockTime,
		event.TokenAddress,
	)
	if err != nil {
		return err
	}

	// 4. 更新K线数据（使用 SAVEPOINT 隔离错误，避免影响主事务）
	if err := db.updateKlineDataWithSavepoint(ctx, tx, event.TokenAddress, blockTime, event.BnbAmount, event.TokenAmount, nil); err != nil {
		// K线更新失败不影响主流程，只记录警告
		db.logger.Warn("Failed to update kline data",
			zap.String("token", event.TokenAddress),
			zap.Error(err))
	}

	return tx.Commit(ctx)
}

// InsertTokenSoldEvent 插入代币卖出事件，并同步到 trades 表
func (db *DB) InsertTokenSoldEvent(ctx context.Context, event *types.TokenSoldEvent) error {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	blockTime := time.Unix(int64(event.BlockTimestamp), 0)

	// 1. 插入事件表
	_, err = tx.Exec(ctx, `
		INSERT INTO token_sold_events (
			token_address, seller_address, token_amount, bnb_amount,
			trading_fee, virtual_bnb_reserve, virtual_token_reserve,
			available_tokens, collected_bnb,
			transaction_hash, block_number, block_timestamp, log_index
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		ON CONFLICT (transaction_hash, log_index) DO NOTHING
	`,
		event.TokenAddress,
		event.SellerAddress,
		event.TokenAmount,
		event.BnbAmount,
		event.TradingFee,
		event.VirtualBNBReserve,
		event.VirtualTokenReserve,
		event.AvailableTokens,
		event.CollectedBNB,
		event.TransactionHash,
		event.BlockNumber,
		blockTime,
		event.LogIndex,
	)
	if err != nil {
		return err
	}

	// 2. 同步到 trades 业务表 (trade_type=20 表示卖出)
	_, err = tx.Exec(ctx, `
		INSERT INTO trades (
			token_address, user_address, trade_type, bnb_amount, token_amount,
			price, transaction_hash, block_number, block_timestamp
		) VALUES ($1, $2, 20, $3, $4, 0, $5, $6, $7)
		ON CONFLICT (transaction_hash, trade_type) DO NOTHING
	`,
		event.TokenAddress,
		event.SellerAddress,
		event.BnbAmount,
		event.TokenAmount,
		event.TransactionHash,
		event.BlockNumber,
		blockTime,
	)
	if err != nil {
		return err
	}

	// 3. 更新 tokens 表的 bnb_current（累计 BNB）和 available_tokens（内盘代币数量）
	_, err = tx.Exec(ctx, `
			UPDATE tokens SET 
				bnb_current = $1::numeric,
				available_tokens = $2::numeric,
				updated_at = $3
			WHERE LOWER(token_contract_address) = LOWER($4)
		`,
		event.CollectedBNB,
		event.AvailableTokens,
		blockTime,
		event.TokenAddress,
	)
	if err != nil {
		return err
	}

	// 4. 更新K线数据（使用 SAVEPOINT 隔离错误，避免影响主事务）
	if err := db.updateKlineDataWithSavepoint(ctx, tx, event.TokenAddress, blockTime, event.BnbAmount, event.TokenAmount, nil); err != nil {
		// K线更新失败不影响主流程，只记录警告
		db.logger.Warn("Failed to update kline data",
			zap.String("token", event.TokenAddress),
			zap.Error(err))
	}

	return tx.Commit(ctx)
}

// InsertTokenGraduatedEvent 插入代币毕业事件，并更新 tokens 状态
func (db *DB) InsertTokenGraduatedEvent(ctx context.Context, event *types.TokenGraduatedEvent) error {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	blockTime := time.Unix(int64(event.BlockTimestamp), 0)

	// 1. 插入事件表
	_, err = tx.Exec(ctx, `
		INSERT INTO token_graduated_events (
			token_address, liquidity_bnb, liquidity_tokens, liquidity_result,
			transaction_hash, block_number, block_timestamp, log_index
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (transaction_hash, log_index) DO NOTHING
	`,
		event.TokenAddress,
		event.LiquidityBNB,
		event.LiquidityTokens,
		event.LiquidityResult,
		event.TransactionHash,
		event.BlockNumber,
		blockTime,
		event.LogIndex,
	)
	if err != nil {
		return err
	}

	// 2. 更新 tokens 表状态为已毕业 (status=3)
	_, err = tx.Exec(ctx, `
		UPDATE tokens SET 
			status = 3,
			updated_at = $1
		WHERE LOWER(token_contract_address) = LOWER($2)
	`,
		blockTime,
		event.TokenAddress,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// BatchInsertTokenCreatedEvents 批量插入代币创建事件，并同步到 tokens 表
func (db *DB) BatchInsertTokenCreatedEvents(ctx context.Context, events []*types.TokenCreatedEvent) error {
	if len(events) == 0 {
		return nil
	}

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, event := range events {
		blockTime := time.Unix(int64(event.BlockTimestamp), 0)

		// 1. 插入事件表
		_, err := tx.Exec(ctx, `
			INSERT INTO token_created_events (
				token_address, creator_address, name, symbol, total_supply, 
				request_id, transaction_hash, block_number, block_timestamp, log_index
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			ON CONFLICT (transaction_hash, log_index) DO NOTHING
		`,
			event.TokenAddress,
			event.CreatorAddress,
			event.Name,
			event.Symbol,
			event.TotalSupply,
			event.RequestID,
			event.TransactionHash,
			event.BlockNumber,
			blockTime,
			event.LogIndex,
		)
		if err != nil {
			return err
		}

		// 2. 从 token_creation_requests 表获取 logo
		var logo string
		err = tx.QueryRow(ctx, `
			SELECT COALESCE(logo, '') FROM token_creation_requests WHERE request_id = $1
		`, event.RequestID).Scan(&logo)
		if err != nil {
			// 如果查询失败，使用空字符串作为默认值
			logo = ""
		}

		// 3. 同步到 tokens 业务表
		_, err = tx.Exec(ctx, `
			INSERT INTO tokens (
				name, symbol, logo, token_contract_address, creator_address,
				launch_mode, launch_time, bnb_target, total_supply, status,
				request_id, nonce, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, 1, $6, '24000000000000000000', $7, 1, $8, 0, $9, $9)
			ON CONFLICT (token_contract_address) DO UPDATE SET
				name = EXCLUDED.name,
				symbol = EXCLUDED.symbol,
				logo = COALESCE(NULLIF(EXCLUDED.logo, ''), tokens.logo),
				updated_at = EXCLUDED.updated_at
		`,
			event.Name,
			event.Symbol,
			logo,
			event.TokenAddress,
			event.CreatorAddress,
			event.BlockTimestamp,
			event.TotalSupply,
			event.RequestID,
			blockTime,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// BatchInsertTokenBoughtEvents 批量插入代币购买事件，并更新 tokens 表
func (db *DB) BatchInsertTokenBoughtEvents(ctx context.Context, events []*types.TokenBoughtEvent) error {
	if len(events) == 0 {
		return nil
	}

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, event := range events {
		// 1. 插入事件表
		_, err := tx.Exec(ctx, `
			INSERT INTO token_bought_events (
				token_address, buyer_address, bnb_amount, token_amount,
				trading_fee, virtual_bnb_reserve, virtual_token_reserve,
				available_tokens, collected_bnb,
				transaction_hash, block_number, block_timestamp, log_index
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			ON CONFLICT (transaction_hash, log_index) DO NOTHING
		`,
			event.TokenAddress,
			event.BuyerAddress,
			event.BnbAmount,
			event.TokenAmount,
			event.TradingFee,
			event.VirtualBNBReserve,
			event.VirtualTokenReserve,
			event.AvailableTokens,
			event.CollectedBNB,
			event.TransactionHash,
			event.BlockNumber,
			time.Unix(int64(event.BlockTimestamp), 0),
			event.LogIndex,
		)
		if err != nil {
			return err
		}

		// 2. 同步到 trades 业务表 (trade_type=10 表示买入)
		_, err = tx.Exec(ctx, `
			INSERT INTO trades (
				token_address, user_address, trade_type, bnb_amount, token_amount,
				price, transaction_hash, block_number, block_timestamp
			) VALUES ($1, $2, 10, $3, $4, 0, $5, $6, $7)
			ON CONFLICT (transaction_hash, trade_type) DO NOTHING
		`,
			event.TokenAddress,
			event.BuyerAddress,
			event.BnbAmount,
			event.TokenAmount,
			event.TransactionHash,
			event.BlockNumber,
			time.Unix(int64(event.BlockTimestamp), 0),
		)
		if err != nil {
			return err
		}

		// 3. 更新 tokens 表的 bnb_current 和 available_tokens
		_, err = tx.Exec(ctx, `
			UPDATE tokens SET 
				bnb_current = $1::numeric,
				available_tokens = $2::numeric,
				updated_at = $3
			WHERE LOWER(token_contract_address) = LOWER($4)
		`,
			event.CollectedBNB,
			event.AvailableTokens,
			time.Unix(int64(event.BlockTimestamp), 0),
			event.TokenAddress,
		)
		if err != nil {
			return err
		}

		// 4. 更新K线数据（使用 SAVEPOINT 隔离错误，避免影响主事务）
		blockTime := time.Unix(int64(event.BlockTimestamp), 0)
		if err := db.updateKlineDataWithSavepoint(ctx, tx, event.TokenAddress, blockTime, event.BnbAmount, event.TokenAmount, nil); err != nil {
			// K线更新失败不影响主流程，只记录警告
			db.logger.Warn("Failed to update kline data",
				zap.String("token", event.TokenAddress),
				zap.Error(err))
		}
	}

	return tx.Commit(ctx)
}

// BatchInsertTokenSoldEvents 批量插入代币卖出事件，并更新 tokens 表
func (db *DB) BatchInsertTokenSoldEvents(ctx context.Context, events []*types.TokenSoldEvent) error {
	if len(events) == 0 {
		return nil
	}

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, event := range events {
		// 1. 插入事件表
		_, err := tx.Exec(ctx, `
			INSERT INTO token_sold_events (
				token_address, seller_address, token_amount, bnb_amount,
				trading_fee, virtual_bnb_reserve, virtual_token_reserve,
				available_tokens, collected_bnb,
				transaction_hash, block_number, block_timestamp, log_index
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			ON CONFLICT (transaction_hash, log_index) DO NOTHING
		`,
			event.TokenAddress,
			event.SellerAddress,
			event.TokenAmount,
			event.BnbAmount,
			event.TradingFee,
			event.VirtualBNBReserve,
			event.VirtualTokenReserve,
			event.AvailableTokens,
			event.CollectedBNB,
			event.TransactionHash,
			event.BlockNumber,
			time.Unix(int64(event.BlockTimestamp), 0),
			event.LogIndex,
		)
		if err != nil {
			return err
		}

		// 2. 同步到 trades 业务表 (trade_type=20 表示卖出)
		_, err = tx.Exec(ctx, `
			INSERT INTO trades (
				token_address, user_address, trade_type, bnb_amount, token_amount,
				price, transaction_hash, block_number, block_timestamp
			) VALUES ($1, $2, 20, $3, $4, 0, $5, $6, $7)
			ON CONFLICT (transaction_hash, trade_type) DO NOTHING
		`,
			event.TokenAddress,
			event.SellerAddress,
			event.BnbAmount,
			event.TokenAmount,
			event.TransactionHash,
			event.BlockNumber,
			time.Unix(int64(event.BlockTimestamp), 0),
		)
		if err != nil {
			return err
		}

		// 3. 更新 tokens 表的 bnb_current 和 available_tokens
		_, err = tx.Exec(ctx, `
			UPDATE tokens SET 
				bnb_current = $1::numeric,
				available_tokens = $2::numeric,
				updated_at = $3
			WHERE LOWER(token_contract_address) = LOWER($4)
		`,
			event.CollectedBNB,
			event.AvailableTokens,
			time.Unix(int64(event.BlockTimestamp), 0),
			event.TokenAddress,
		)
		if err != nil {
			return err
		}

		// 4. 更新K线数据（使用 SAVEPOINT 隔离错误，避免影响主事务）
		blockTime := time.Unix(int64(event.BlockTimestamp), 0)
		if err := db.updateKlineDataWithSavepoint(ctx, tx, event.TokenAddress, blockTime, event.BnbAmount, event.TokenAmount, nil); err != nil {
			// K线更新失败不影响主流程，只记录警告
			db.logger.Warn("Failed to update kline data",
				zap.String("token", event.TokenAddress),
				zap.Error(err))
		}
	}

	return tx.Commit(ctx)
}

// updateKlineDataWithSavepoint 使用 SAVEPOINT 更新K线数据，避免错误影响主事务
func (db *DB) updateKlineDataWithSavepoint(ctx context.Context, tx pgx.Tx, tokenAddress string, blockTime time.Time, bnbAmount, tokenAmount *big.Int, intervals []string) error {
	// 创建 SAVEPOINT
	savepointID := fmt.Sprintf("kline_update_%d", time.Now().UnixNano())
	_, err := tx.Exec(ctx, "SAVEPOINT "+savepointID)
	if err != nil {
		return fmt.Errorf("failed to create savepoint: %w", err)
	}

	// 尝试更新K线数据
	err = db.updateKlineData(ctx, tx, tokenAddress, blockTime, bnbAmount, tokenAmount, intervals)
	if err != nil {
		// 回滚到 SAVEPOINT，不影响主事务
		_, rollbackErr := tx.Exec(ctx, "ROLLBACK TO SAVEPOINT "+savepointID)
		if rollbackErr != nil {
			return fmt.Errorf("failed to rollback savepoint: %w (original error: %v)", rollbackErr, err)
		}
		return err
	}

	// 释放 SAVEPOINT
	_, err = tx.Exec(ctx, "RELEASE SAVEPOINT "+savepointID)
	if err != nil {
		return fmt.Errorf("failed to release savepoint: %w", err)
	}

	return nil
}

// updateKlineData 更新K线数据
// 根据交易事件计算价格并更新对应时间间隔的K线数据
func (db *DB) updateKlineData(ctx context.Context, tx pgx.Tx, tokenAddress string, blockTime time.Time, bnbAmount, tokenAmount *big.Int, intervals []string) error {
	if bnbAmount == nil || tokenAmount == nil || tokenAmount.Sign() == 0 {
		return nil // 跳过无效数据
	}

	// 计算价格：BNB金额 / Token数量
	// 使用高精度计算，保留18位小数
	price := new(big.Float).Quo(
		new(big.Float).SetInt(bnbAmount),
		new(big.Float).SetInt(tokenAmount),
	)
	priceStr := price.Text('f', 18)

	// 支持的K线间隔
	validIntervals := map[string]bool{
		"1m": true, "5m": true, "15m": true, "30m": true,
		"1h": true, "4h": true, "1d": true, "1w": true,
	}

	// 如果没有指定intervals，使用所有支持的间隔
	if len(intervals) == 0 {
		intervals = []string{"1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"}
	}

	// 为每个时间间隔更新K线数据
	for _, interval := range intervals {
		if !validIntervals[interval] {
			continue
		}

		// 计算该时间间隔的开始时间
		openTime := alignTimeToInterval(blockTime, interval)

		// 使用UPSERT更新或插入K线数据
		var err error
		if tx != nil {
			_, err = tx.Exec(ctx, `
				INSERT INTO klines (
					token_address, interval, open_time, 
					open_price, high_price, low_price, close_price, volume
				) VALUES ($1, $2, $3, $4::numeric, $5::numeric, $6::numeric, $7::numeric, $8::numeric)
				ON CONFLICT (token_address, interval, open_time) 
				DO UPDATE SET
					high_price = GREATEST(klines.high_price, EXCLUDED.high_price),
					low_price = LEAST(klines.low_price, EXCLUDED.low_price),
					close_price = EXCLUDED.close_price,
					volume = klines.volume + EXCLUDED.volume
			`,
				tokenAddress,
				interval,
				openTime,
				priceStr,             // open_price (如果是新记录)
				priceStr,             // high_price
				priceStr,             // low_price
				priceStr,             // close_price
				tokenAmount.String(), // volume
			)
		} else {
			_, err = db.pool.Exec(ctx, `
				INSERT INTO klines (
					token_address, interval, open_time, 
					open_price, high_price, low_price, close_price, volume
				) VALUES ($1, $2, $3, $4::numeric, $5::numeric, $6::numeric, $7::numeric, $8::numeric)
				ON CONFLICT (token_address, interval, open_time) 
				DO UPDATE SET
					high_price = GREATEST(klines.high_price, EXCLUDED.high_price),
					low_price = LEAST(klines.low_price, EXCLUDED.low_price),
					close_price = EXCLUDED.close_price,
					volume = klines.volume + EXCLUDED.volume
			`,
				tokenAddress,
				interval,
				openTime,
				priceStr,
				priceStr,
				priceStr,
				priceStr,
				tokenAmount.String(),
			)
		}
		if err != nil {
			return err
		}
	}

	return nil
}

// alignTimeToInterval 将时间对齐到对应的时间间隔
func alignTimeToInterval(t time.Time, interval string) time.Time {
	switch interval {
	case "1m":
		// 对齐到分钟
		return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), 0, 0, t.Location())
	case "5m":
		// 对齐到5分钟
		minute := (t.Minute() / 5) * 5
		return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), minute, 0, 0, t.Location())
	case "15m":
		// 对齐到15分钟
		minute := (t.Minute() / 15) * 15
		return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), minute, 0, 0, t.Location())
	case "30m":
		// 对齐到30分钟
		minute := (t.Minute() / 30) * 30
		return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), minute, 0, 0, t.Location())
	case "1h":
		// 对齐到小时
		return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), 0, 0, 0, t.Location())
	case "4h":
		// 对齐到4小时
		hour := (t.Hour() / 4) * 4
		return time.Date(t.Year(), t.Month(), t.Day(), hour, 0, 0, 0, t.Location())
	case "1d":
		// 对齐到天
		return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
	case "1w":
		// 对齐到周（周一）
		weekday := int(t.Weekday())
		if weekday == 0 {
			weekday = 7 // 周日转换为7
		}
		daysToSubtract := weekday - 1
		return time.Date(t.Year(), t.Month(), t.Day()-daysToSubtract, 0, 0, 0, 0, t.Location())
	default:
		return t
	}
}
