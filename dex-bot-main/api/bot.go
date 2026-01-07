package api

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

// DexBot DEX 机器人
type DexBot struct {
	db *sql.DB
}

// NewDexBot 创建新的 DexBot 实例
func NewDexBot(dbPath string) (*DexBot, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("打开数据库失败: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("连接数据库失败: %w", err)
	}

	return &DexBot{db: db}, nil
}

// InitDB 初始化数据库表
func (bot *DexBot) InitDB() error {
	schema := `
	CREATE TABLE IF NOT EXISTS token_liquidity_pools (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		pool_address TEXT NOT NULL,
		dex_name TEXT NOT NULL,
		dex_router TEXT NOT NULL,
		chain_id INTEGER NOT NULL,
		token0_address TEXT NOT NULL,
		token0_symbol TEXT,
		token0_decimals INTEGER,
		token1_address TEXT NOT NULL,
		token1_symbol TEXT,
		token1_decimals INTEGER,
		reserve0 TEXT,
		reserve1 TEXT,
		liquidity_usd REAL,
		fee_rate REAL DEFAULT 0.003,
		volume_24h REAL,
		is_active BOOLEAN DEFAULT 1,
		last_updated INTEGER NOT NULL,
		created_at INTEGER NOT NULL,
		UNIQUE(pool_address, chain_id)
	);
	
	CREATE INDEX IF NOT EXISTS idx_token0_chain ON token_liquidity_pools(token0_address, chain_id);
	CREATE INDEX IF NOT EXISTS idx_token1_chain ON token_liquidity_pools(token1_address, chain_id);
	CREATE INDEX IF NOT EXISTS idx_token0_token1_chain ON token_liquidity_pools(token0_address, token1_address, chain_id);
	CREATE INDEX IF NOT EXISTS idx_liquidity ON token_liquidity_pools(chain_id, liquidity_usd DESC) WHERE is_active = 1;
	`

	_, err := bot.db.Exec(schema)
	return err
}

// ListPools 获取流动性池列表
func (bot *DexBot) ListPools(chainID, dexName string, limit int) ([]Pool, error) {
	query := `
		SELECT 
			id, pool_address, dex_name, dex_router, chain_id,
			token0_address, token0_symbol, token1_address, token1_symbol,
			reserve0, reserve1, liquidity_usd, fee_rate, is_active
		FROM token_liquidity_pools
		WHERE 1=1
	`
	args := []interface{}{}

	if chainID != "" {
		query += " AND chain_id = ?"
		args = append(args, chainID)
	}

	if dexName != "" {
		query += " AND dex_name = ?"
		args = append(args, dexName)
	}

	query += " ORDER BY liquidity_usd DESC LIMIT ?"
	args = append(args, limit)

	rows, err := bot.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pools []Pool
	for rows.Next() {
		var pool Pool
		err := rows.Scan(
			&pool.ID, &pool.PoolAddress, &pool.DexName, &pool.DexRouter, &pool.ChainID,
			&pool.Token0Address, &pool.Token0Symbol, &pool.Token1Address, &pool.Token1Symbol,
			&pool.Reserve0, &pool.Reserve1, &pool.LiquidityUSD, &pool.FeeRate, &pool.IsActive,
		)
		if err != nil {
			return nil, err
		}
		pools = append(pools, pool)
	}

	return pools, nil
}

// GetPoolByAddress 根据地址获取池子
func (bot *DexBot) GetPoolByAddress(poolAddress string, chainID int) (*Pool, error) {
	query := `
		SELECT 
			id, pool_address, dex_name, dex_router, chain_id,
			token0_address, token0_symbol, token1_address, token1_symbol,
			reserve0, reserve1, liquidity_usd, fee_rate, is_active
		FROM token_liquidity_pools
		WHERE pool_address = ? AND chain_id = ?
	`

	var pool Pool
	err := bot.db.QueryRow(query, poolAddress, chainID).Scan(
		&pool.ID, &pool.PoolAddress, &pool.DexName, &pool.DexRouter, &pool.ChainID,
		&pool.Token0Address, &pool.Token0Symbol, &pool.Token1Address, &pool.Token1Symbol,
		&pool.Reserve0, &pool.Reserve1, &pool.LiquidityUSD, &pool.FeeRate, &pool.IsActive,
	)

	if err != nil {
		return nil, err
	}

	return &pool, nil
}

// FindDirectRoute 查找直接交易路由
func (bot *DexBot) FindDirectRoute(chainID int, tokenIn, tokenOut string) ([]Pool, error) {
	query := `
		SELECT 
			id, pool_address, dex_name, dex_router, chain_id,
			token0_address, token0_symbol, token1_address, token1_symbol,
			reserve0, reserve1, liquidity_usd, fee_rate, is_active
		FROM token_liquidity_pools
		WHERE chain_id = ? 
			AND is_active = 1
			AND (
				(token0_address = ? AND token1_address = ?)
				OR (token0_address = ? AND token1_address = ?)
			)
		ORDER BY liquidity_usd DESC
		LIMIT 10
	`

	rows, err := bot.db.Query(query, chainID, tokenIn, tokenOut, tokenOut, tokenIn)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pools []Pool
	for rows.Next() {
		var pool Pool
		err := rows.Scan(
			&pool.ID, &pool.PoolAddress, &pool.DexName, &pool.DexRouter, &pool.ChainID,
			&pool.Token0Address, &pool.Token0Symbol, &pool.Token1Address, &pool.Token1Symbol,
			&pool.Reserve0, &pool.Reserve1, &pool.LiquidityUSD, &pool.FeeRate, &pool.IsActive,
		)
		if err != nil {
			return nil, err
		}
		pools = append(pools, pool)
	}

	return pools, nil
}

// FindTwoHopRoute 查找两跳交易路由
func (bot *DexBot) FindTwoHopRoute(chainID int, tokenIn, tokenOut string, minLiquidity float64) ([]Route, error) {
	query := `
		WITH first_hop AS (
			SELECT 
				id, pool_address, dex_name, dex_router,
				token0_address, token0_symbol, token1_address, token1_symbol,
				reserve0, reserve1, liquidity_usd, fee_rate,
				CASE 
					WHEN token0_address = ? THEN token1_address
					ELSE token0_address 
				END as intermediate_token,
				CASE 
					WHEN token0_address = ? THEN token1_symbol
					ELSE token0_symbol 
				END as intermediate_symbol
			FROM token_liquidity_pools
			WHERE chain_id = ?
				AND is_active = 1
				AND (token0_address = ? OR token1_address = ?)
				AND liquidity_usd > ?
		)
		SELECT 
			fh.id, fh.pool_address, fh.dex_name, fh.dex_router,
			fh.token0_address, fh.token0_symbol, fh.token1_address, fh.token1_symbol,
			fh.reserve0, fh.reserve1, fh.liquidity_usd, fh.fee_rate,
			fh.intermediate_token,
			tlp.id, tlp.pool_address, tlp.dex_name, tlp.dex_router,
			tlp.token0_address, tlp.token0_symbol, tlp.token1_address, tlp.token1_symbol,
			tlp.reserve0, tlp.reserve1, tlp.liquidity_usd, tlp.fee_rate,
			(fh.liquidity_usd + tlp.liquidity_usd) / 2 as avg_liquidity
		FROM first_hop fh
		JOIN token_liquidity_pools tlp 
			ON tlp.chain_id = ?
			AND tlp.is_active = 1
			AND (
				(tlp.token0_address = fh.intermediate_token AND tlp.token1_address = ?)
				OR (tlp.token1_address = fh.intermediate_token AND tlp.token0_address = ?)
			)
			AND tlp.liquidity_usd > ?
		ORDER BY avg_liquidity DESC
		LIMIT 20
	`

	rows, err := bot.db.Query(query,
		tokenIn, tokenIn, chainID, tokenIn, tokenIn, minLiquidity,
		chainID, tokenOut, tokenOut, minLiquidity,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var routes []Route
	for rows.Next() {
		var (
			pool1             Pool
			pool2             Pool
			intermediateToken string
			avgLiquidity      float64
		)

		err := rows.Scan(
			&pool1.ID, &pool1.PoolAddress, &pool1.DexName, &pool1.DexRouter,
			&pool1.Token0Address, &pool1.Token0Symbol, &pool1.Token1Address, &pool1.Token1Symbol,
			&pool1.Reserve0, &pool1.Reserve1, &pool1.LiquidityUSD, &pool1.FeeRate,
			&intermediateToken,
			&pool2.ID, &pool2.PoolAddress, &pool2.DexName, &pool2.DexRouter,
			&pool2.Token0Address, &pool2.Token0Symbol, &pool2.Token1Address, &pool2.Token1Symbol,
			&pool2.Reserve0, &pool2.Reserve1, &pool2.LiquidityUSD, &pool2.FeeRate,
			&avgLiquidity,
		)
		if err != nil {
			return nil, err
		}

		pool1.IsActive = true
		pool2.IsActive = true

		route := Route{
			Pools:        []Pool{pool1, pool2},
			TokenPath:    []string{tokenIn, intermediateToken, tokenOut},
			TotalFee:     1 - (1-pool1.FeeRate)*(1-pool2.FeeRate),
			AvgLiquidity: avgLiquidity,
		}

		routes = append(routes, route)
	}

	return routes, nil
}

// GetTokenPools 获取某个代币的所有池子
func (bot *DexBot) GetTokenPools(chainID int, tokenAddress string) ([]Pool, error) {
	query := `
		SELECT 
			id, pool_address, dex_name, dex_router, chain_id,
			token0_address, token0_symbol, token1_address, token1_symbol,
			reserve0, reserve1, liquidity_usd, fee_rate, is_active
		FROM token_liquidity_pools
		WHERE chain_id = ?
			AND is_active = 1
			AND (token0_address = ? OR token1_address = ?)
		ORDER BY liquidity_usd DESC
		LIMIT 50
	`

	rows, err := bot.db.Query(query, chainID, tokenAddress, tokenAddress)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pools []Pool
	for rows.Next() {
		var pool Pool
		err := rows.Scan(
			&pool.ID, &pool.PoolAddress, &pool.DexName, &pool.DexRouter, &pool.ChainID,
			&pool.Token0Address, &pool.Token0Symbol, &pool.Token1Address, &pool.Token1Symbol,
			&pool.Reserve0, &pool.Reserve1, &pool.LiquidityUSD, &pool.FeeRate, &pool.IsActive,
		)
		if err != nil {
			return nil, err
		}
		pools = append(pools, pool)
	}

	return pools, nil
}

// GetStats 获取统计信息
func (bot *DexBot) GetStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// 总池子数
	var totalPools int
	err := bot.db.QueryRow("SELECT COUNT(*) FROM token_liquidity_pools WHERE is_active = 1").Scan(&totalPools)
	if err != nil {
		return nil, err
	}
	stats["total_pools"] = totalPools

	// 总流动性
	var totalLiquidity float64
	err = bot.db.QueryRow("SELECT COALESCE(SUM(liquidity_usd), 0) FROM token_liquidity_pools WHERE is_active = 1").Scan(&totalLiquidity)
	if err != nil {
		return nil, err
	}
	stats["total_liquidity_usd"] = totalLiquidity

	// 按链统计
	chainQuery := `
		SELECT chain_id, COUNT(*) as pool_count, COALESCE(SUM(liquidity_usd), 0) as total_liquidity
		FROM token_liquidity_pools
		WHERE is_active = 1
		GROUP BY chain_id
	`
	rows, err := bot.db.Query(chainQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	chainStats := make([]map[string]interface{}, 0)
	for rows.Next() {
		var chainID, poolCount int
		var liquidity float64
		if err := rows.Scan(&chainID, &poolCount, &liquidity); err != nil {
			continue
		}
		chainStats = append(chainStats, map[string]interface{}{
			"chain_id":        chainID,
			"pool_count":      poolCount,
			"total_liquidity": liquidity,
		})
	}
	stats["chains"] = chainStats

	// 按 DEX 统计
	dexQuery := `
		SELECT dex_name, COUNT(*) as pool_count, COALESCE(SUM(liquidity_usd), 0) as total_liquidity
		FROM token_liquidity_pools
		WHERE is_active = 1
		GROUP BY dex_name
	`
	rows2, err := bot.db.Query(dexQuery)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	dexStats := make([]map[string]interface{}, 0)
	for rows2.Next() {
		var dexName string
		var poolCount int
		var liquidity float64
		if err := rows2.Scan(&dexName, &poolCount, &liquidity); err != nil {
			continue
		}
		dexStats = append(dexStats, map[string]interface{}{
			"dex_name":        dexName,
			"pool_count":      poolCount,
			"total_liquidity": liquidity,
		})
	}
	stats["dexes"] = dexStats

	return stats, nil
}

// Close 关闭数据库连接
func (bot *DexBot) Close() error {
	return bot.db.Close()
}
