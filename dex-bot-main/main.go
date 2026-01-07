package main

// import (
// 	"database/sql"
// 	"encoding/json"
// 	"fmt"
// 	"log"
// 	"math/big"
// 	"time"

// 	_ "github.com/mattn/go-sqlite3"
// )

// // Pool 流动性池结构
// type Pool struct {
// 	PoolAddress   string  `json:"pool_address"`
// 	DexName       string  `json:"dex_name"`
// 	DexRouter     string  `json:"dex_router"`
// 	ChainID       int     `json:"chain_id"`
// 	Token0Address string  `json:"token0_address"`
// 	Token0Symbol  string  `json:"token0_symbol"`
// 	Token1Address string  `json:"token1_address"`
// 	Token1Symbol  string  `json:"token1_symbol"`
// 	Reserve0      string  `json:"reserve0"`
// 	Reserve1      string  `json:"reserve1"`
// 	LiquidityUSD  float64 `json:"liquidity_usd"`
// 	FeeRate       float64 `json:"fee_rate"`
// }

// // Route 交易路由
// type Route struct {
// 	Pools          []Pool   `json:"pools"`
// 	TokenPath      []string `json:"token_path"`
// 	ExpectedOutput string   `json:"expected_output"`
// 	PriceImpact    float64  `json:"price_impact"`
// 	TotalFee       float64  `json:"total_fee"`
// }

// // DexBot DEX 机器人
// type DexBot struct {
// 	db *sql.DB
// }

// // NewDexBot 创建新的 DexBot 实例
// func NewDexBot(dbPath string) (*DexBot, error) {
// 	db, err := sql.Open("sqlite3", dbPath)
// 	if err != nil {
// 		return nil, fmt.Errorf("打开数据库失败: %w", err)
// 	}

// 	// 测试连接
// 	if err := db.Ping(); err != nil {
// 		return nil, fmt.Errorf("连接数据库失败: %w", err)
// 	}

// 	return &DexBot{db: db}, nil
// }

// // InitDB 初始化数据库表
// func (bot *DexBot) InitDB(schemaPath string) error {
// 	// 这里应该读取 schema.sql 并执行
// 	// 为了简化，这里直接执行 SQL
// 	schema := `
// 	CREATE TABLE IF NOT EXISTS token_liquidity_pools (
// 		id INTEGER PRIMARY KEY AUTOINCREMENT,
// 		pool_address TEXT NOT NULL,
// 		dex_name TEXT NOT NULL,
// 		dex_router TEXT NOT NULL,
// 		chain_id INTEGER NOT NULL,
// 		token0_address TEXT NOT NULL,
// 		token0_symbol TEXT,
// 		token0_decimals INTEGER,
// 		token1_address TEXT NOT NULL,
// 		token1_symbol TEXT,
// 		token1_decimals INTEGER,
// 		reserve0 TEXT,
// 		reserve1 TEXT,
// 		liquidity_usd REAL,
// 		fee_rate REAL DEFAULT 0.003,
// 		volume_24h REAL,
// 		is_active BOOLEAN DEFAULT 1,
// 		last_updated INTEGER NOT NULL,
// 		created_at INTEGER NOT NULL,
// 		UNIQUE(pool_address, chain_id)
// 	);

// 	CREATE INDEX IF NOT EXISTS idx_token0_chain ON token_liquidity_pools(token0_address, chain_id);
// 	CREATE INDEX IF NOT EXISTS idx_token1_chain ON token_liquidity_pools(token1_address, chain_id);
// 	CREATE INDEX IF NOT EXISTS idx_token0_token1_chain ON token_liquidity_pools(token0_address, token1_address, chain_id);
// 	CREATE INDEX IF NOT EXISTS idx_liquidity ON token_liquidity_pools(chain_id, liquidity_usd DESC) WHERE is_active = 1;
// 	`

// 	_, err := bot.db.Exec(schema)
// 	return err
// }

// // FindDirectRoute 查找直接交易路由（单跳）
// func (bot *DexBot) FindDirectRoute(chainID int, tokenIn, tokenOut string) ([]Pool, error) {
// 	query := `
// 		SELECT
// 			pool_address, dex_name, dex_router, chain_id,
// 			token0_address, token0_symbol, token1_address, token1_symbol,
// 			reserve0, reserve1, liquidity_usd, fee_rate
// 		FROM token_liquidity_pools
// 		WHERE chain_id = ?
// 			AND is_active = 1
// 			AND (
// 				(token0_address = ? AND token1_address = ?)
// 				OR (token0_address = ? AND token1_address = ?)
// 			)
// 		ORDER BY liquidity_usd DESC
// 		LIMIT 10
// 	`

// 	rows, err := bot.db.Query(query, chainID, tokenIn, tokenOut, tokenOut, tokenIn)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer rows.Close()

// 	var pools []Pool
// 	for rows.Next() {
// 		var pool Pool
// 		err := rows.Scan(
// 			&pool.PoolAddress, &pool.DexName, &pool.DexRouter, &pool.ChainID,
// 			&pool.Token0Address, &pool.Token0Symbol, &pool.Token1Address, &pool.Token1Symbol,
// 			&pool.Reserve0, &pool.Reserve1, &pool.LiquidityUSD, &pool.FeeRate,
// 		)
// 		if err != nil {
// 			return nil, err
// 		}
// 		pools = append(pools, pool)
// 	}

// 	return pools, nil
// }

// // FindTwoHopRoute 查找两跳交易路由
// func (bot *DexBot) FindTwoHopRoute(chainID int, tokenIn, tokenOut string, minLiquidity float64) ([]Route, error) {
// 	query := `
// 		WITH first_hop AS (
// 			SELECT
// 				pool_address as pool1,
// 				dex_name as dex1,
// 				dex_router as router1,
// 				CASE
// 					WHEN token0_address = ? THEN token1_address
// 					ELSE token0_address
// 				END as intermediate_token,
// 				CASE
// 					WHEN token0_address = ? THEN token1_symbol
// 					ELSE token0_symbol
// 				END as intermediate_symbol,
// 				reserve0 as reserve0_1,
// 				reserve1 as reserve1_1,
// 				liquidity_usd as liquidity1,
// 				fee_rate as fee1,
// 				token0_address as t0_1,
// 				token1_address as t1_1
// 			FROM token_liquidity_pools
// 			WHERE chain_id = ?
// 				AND is_active = 1
// 				AND (token0_address = ? OR token1_address = ?)
// 				AND liquidity_usd > ?
// 		)
// 		SELECT
// 			fh.pool1, fh.dex1, fh.router1,
// 			fh.t0_1, fh.t1_1,
// 			fh.reserve0_1, fh.reserve1_1,
// 			fh.intermediate_token, fh.intermediate_symbol,
// 			fh.liquidity1, fh.fee1,
// 			tlp.pool_address as pool2,
// 			tlp.dex_name as dex2,
// 			tlp.dex_router as router2,
// 			tlp.token0_address as t0_2,
// 			tlp.token1_address as t1_2,
// 			tlp.reserve0 as reserve0_2,
// 			tlp.reserve1 as reserve1_2,
// 			tlp.liquidity_usd as liquidity2,
// 			tlp.fee_rate as fee2,
// 			(fh.liquidity1 + tlp.liquidity_usd) / 2 as avg_liquidity
// 		FROM first_hop fh
// 		JOIN token_liquidity_pools tlp
// 			ON tlp.chain_id = ?
// 			AND tlp.is_active = 1
// 			AND (
// 				(tlp.token0_address = fh.intermediate_token AND tlp.token1_address = ?)
// 				OR (tlp.token1_address = fh.intermediate_token AND tlp.token0_address = ?)
// 			)
// 			AND tlp.liquidity_usd > ?
// 		ORDER BY avg_liquidity DESC
// 		LIMIT 20
// 	`

// 	rows, err := bot.db.Query(query,
// 		tokenIn, tokenIn, chainID, tokenIn, tokenIn, minLiquidity,
// 		chainID, tokenOut, tokenOut, minLiquidity,
// 	)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer rows.Close()

// 	var routes []Route
// 	for rows.Next() {
// 		var (
// 			pool1, dex1, router1, t0_1, t1_1, r0_1, r1_1 string
// 			intermediateToken, intermediateSymbol        string
// 			liquidity1, fee1                             float64
// 			pool2, dex2, router2, t0_2, t1_2, r0_2, r1_2 string
// 			liquidity2, fee2, avgLiquidity               float64
// 		)

// 		err := rows.Scan(
// 			&pool1, &dex1, &router1, &t0_1, &t1_1, &r0_1, &r1_1,
// 			&intermediateToken, &intermediateSymbol,
// 			&liquidity1, &fee1,
// 			&pool2, &dex2, &router2, &t0_2, &t1_2, &r0_2, &r1_2,
// 			&liquidity2, &fee2, &avgLiquidity,
// 		)
// 		if err != nil {
// 			return nil, err
// 		}

// 		// 构建路由
// 		route := Route{
// 			Pools: []Pool{
// 				{
// 					PoolAddress:   pool1,
// 					DexName:       dex1,
// 					DexRouter:     router1,
// 					Token0Address: t0_1,
// 					Token1Address: t1_1,
// 					Reserve0:      r0_1,
// 					Reserve1:      r1_1,
// 					LiquidityUSD:  liquidity1,
// 					FeeRate:       fee1,
// 				},
// 				{
// 					PoolAddress:   pool2,
// 					DexName:       dex2,
// 					DexRouter:     router2,
// 					Token0Address: t0_2,
// 					Token1Address: t1_2,
// 					Reserve0:      r0_2,
// 					Reserve1:      r1_2,
// 					LiquidityUSD:  liquidity2,
// 					FeeRate:       fee2,
// 				},
// 			},
// 			TokenPath: []string{tokenIn, intermediateToken, tokenOut},
// 			TotalFee:  1 - (1-fee1)*(1-fee2),
// 		}

// 		routes = append(routes, route)
// 	}

// 	return routes, nil
// }

// // UpsertPool 插入或更新流动性池数据
// func (bot *DexBot) UpsertPool(pool Pool) error {
// 	query := `
// 		INSERT OR REPLACE INTO token_liquidity_pools (
// 			pool_address, dex_name, dex_router, chain_id,
// 			token0_address, token0_symbol, token0_decimals,
// 			token1_address, token1_symbol, token1_decimals,
// 			reserve0, reserve1, liquidity_usd,
// 			fee_rate, volume_24h, is_active,
// 			last_updated, created_at
// 		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
// 	`

// 	now := time.Now().Unix()
// 	_, err := bot.db.Exec(query,
// 		pool.PoolAddress, pool.DexName, pool.DexRouter, pool.ChainID,
// 		pool.Token0Address, pool.Token0Symbol, 18, // 默认 decimals
// 		pool.Token1Address, pool.Token1Symbol, 18,
// 		pool.Reserve0, pool.Reserve1, pool.LiquidityUSD,
// 		pool.FeeRate, 0, // volume_24h
// 		now, now,
// 	)

// 	return err
// }

// // CalculateOutputAmount 计算输出金额（使用恒定乘积公式）
// func CalculateOutputAmount(amountIn, reserveIn, reserveOut *big.Int, feeRate float64) *big.Int {
// 	// amountOut = (amountIn * (1 - fee) * reserveOut) / (reserveIn + amountIn * (1 - fee))

// 	// 计算手续费后的输入金额
// 	feeMultiplier := big.NewInt(int64((1 - feeRate) * 10000))
// 	amountInWithFee := new(big.Int).Mul(amountIn, feeMultiplier)
// 	amountInWithFee.Div(amountInWithFee, big.NewInt(10000))

// 	// 分子: amountInWithFee * reserveOut
// 	numerator := new(big.Int).Mul(amountInWithFee, reserveOut)

// 	// 分母: reserveIn + amountInWithFee
// 	denominator := new(big.Int).Add(reserveIn, amountInWithFee)

// 	// 计算输出
// 	amountOut := new(big.Int).Div(numerator, denominator)
// 	return amountOut
// }

// // Close 关闭数据库连接
// func (bot *DexBot) Close() error {
// 	return bot.db.Close()
// }

// func main() {
// 	// 初始化 DexBot
// 	bot, err := NewDexBot("./db.db")
// 	if err != nil {
// 		log.Fatalf("初始化失败: %v", err)
// 	}
// 	defer bot.Close()

// 	// 初始化数据库
// 	if err := bot.InitDB("./schema.sql"); err != nil {
// 		log.Fatalf("初始化数据库失败: %v", err)
// 	}

// 	fmt.Println("✅ DEX Bot 初始化成功！")

// 	// 示例：插入一些测试数据
// 	examplePools := []Pool{
// 		// ========== Ethereum Mainnet - Uniswap V2 ==========
// 		{
// 			PoolAddress:   "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
// 			Token0Symbol:  "USDC",
// 			Token1Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token1Symbol:  "WETH",
// 			Reserve0:      "180000000000000",         // 180,000,000 USDC
// 			Reserve1:      "75000000000000000000000", // 75,000 WETH
// 			LiquidityUSD:  360000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
// 			Token0Symbol:  "DAI",
// 			Token1Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token1Symbol:  "WETH",
// 			Reserve0:      "120000000000000000000000000", // 120,000,000 DAI
// 			Reserve1:      "50000000000000000000000",     // 50,000 WETH
// 			LiquidityUSD:  240000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token0Symbol:  "WETH",
// 			Token1Address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
// 			Token1Symbol:  "USDT",
// 			Reserve0:      "90000000000000000000000", // 90,000 WETH
// 			Reserve1:      "216000000000000",         // 216,000,000 USDT
// 			LiquidityUSD:  432000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
// 			Token0Symbol:  "WBTC",
// 			Token1Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token1Symbol:  "WETH",
// 			Reserve0:      "280000000000",            // 2,800 WBTC
// 			Reserve1:      "42000000000000000000000", // 42,000 WETH
// 			LiquidityUSD:  252000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0xd3d2E2692501A5c9Ca623199D38826e513033a17",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI
// 			Token0Symbol:  "UNI",
// 			Token1Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token1Symbol:  "WETH",
// 			Reserve0:      "4500000000000000000000000", // 4,500,000 UNI
// 			Reserve1:      "15000000000000000000000",   // 15,000 WETH
// 			LiquidityUSD:  90000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
// 			Token0Symbol:  "USDC",
// 			Token1Address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
// 			Token1Symbol:  "USDT",
// 			Reserve0:      "85000000000000", // 85,000,000 USDC
// 			Reserve1:      "85000000000000", // 85,000,000 USDT
// 			LiquidityUSD:  170000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
// 			Token0Symbol:  "DAI",
// 			Token1Address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
// 			Token1Symbol:  "USDC",
// 			Reserve0:      "42000000000000000000000000", // 42,000,000 DAI
// 			Reserve1:      "42000000000000",             // 42,000,000 USDC
// 			LiquidityUSD:  84000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0x004375Dff511095CC5A197A54140a24eFEF3A416",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token0Symbol:  "WETH",
// 			Token1Address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", // LINK
// 			Token1Symbol:  "LINK",
// 			Reserve0:      "8000000000000000000000",    // 8,000 WETH
// 			Reserve1:      "1500000000000000000000000", // 1,500,000 LINK
// 			LiquidityUSD:  48000000.0,
// 			FeeRate:       0.003,
// 		},

// 		// ========== BSC (Binance Smart Chain) - PancakeSwap V2 ==========
// 		{
// 			PoolAddress:   "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token0Symbol:  "WBNB",
// 			Token1Address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
// 			Token1Symbol:  "BUSD",
// 			Reserve0:      "600000000000000000000000",    // 600,000 WBNB
// 			Reserve1:      "180000000000000000000000000", // 180,000,000 BUSD
// 			LiquidityUSD:  360000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token0Symbol:  "WBNB",
// 			Token1Address: "0x55d398326f99059fF775485246999027B3197955", // USDT
// 			Token1Symbol:  "USDT",
// 			Reserve0:      "420000000000000000000000",    // 420,000 WBNB
// 			Reserve1:      "126000000000000000000000000", // 126,000,000 USDT
// 			LiquidityUSD:  252000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x0eD7e52944161450477ee417DE9Cd3a859b14fD0",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", // CAKE
// 			Token0Symbol:  "CAKE",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "25000000000000000000000000", // 25,000,000 CAKE
// 			Reserve1:      "120000000000000000000000",   // 120,000 WBNB
// 			LiquidityUSD:  72000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0xEc6557348085Aa57C72514D67070dC863C0a5A8c",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
// 			Token0Symbol:  "BUSD",
// 			Token1Address: "0x55d398326f99059fF775485246999027B3197955", // USDT
// 			Token1Symbol:  "USDT",
// 			Reserve0:      "150000000000000000000000000", // 150,000,000 BUSD
// 			Reserve1:      "150000000000000000000000000", // 150,000,000 USDT
// 			LiquidityUSD:  300000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x61EB789d75A95CAa3fF50ed7E47b96c132fEc082",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB
// 			Token0Symbol:  "BTCB",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "180000000000",            // 1,800 BTCB
// 			Reserve1:      "27000000000000000000000", // 27,000 WBNB
// 			LiquidityUSD:  162000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x2354ef4DF11afacb85a5C7f98B624072ECcddbB1",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // ETH
// 			Token0Symbol:  "ETH",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "35000000000000000000000",  // 35,000 ETH
// 			Reserve1:      "105000000000000000000000", // 105,000 WBNB
// 			LiquidityUSD:  126000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x7EFaEf62fDdCCa950418312c6C91Aef321375A00",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
// 			Token0Symbol:  "USDC",
// 			Token1Address: "0x55d398326f99059fF775485246999027B3197955", // USDT
// 			Token1Symbol:  "USDT",
// 			Reserve0:      "68000000000000000000000000", // 68,000,000 USDC
// 			Reserve1:      "68000000000000000000000000", // 68,000,000 USDT
// 			LiquidityUSD:  136000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0xc7c3cCCE4FA25700fD5574DA7E200ae28BBd36A3",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
// 			Token0Symbol:  "BUSD",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "85000000000000000000000000", // 85,000,000 BUSD
// 			Reserve1:      "280000000000000000000000",   // 280,000 WBNB
// 			LiquidityUSD:  168000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0xF45cd219aEF8618A92BAa7aD848364a158a24F33",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", // CAKE
// 			Token0Symbol:  "CAKE",
// 			Token1Address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
// 			Token1Symbol:  "BUSD",
// 			Reserve0:      "18000000000000000000000000", // 18,000,000 CAKE
// 			Reserve1:      "36000000000000000000000000", // 36,000,000 BUSD
// 			LiquidityUSD:  72000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x51e6D27FA57373d8d4C256231241053a70Cb1d93",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", // DAI
// 			Token0Symbol:  "DAI",
// 			Token1Address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
// 			Token1Symbol:  "BUSD",
// 			Reserve0:      "28000000000000000000000000", // 28,000,000 DAI
// 			Reserve1:      "28000000000000000000000000", // 28,000,000 BUSD
// 			LiquidityUSD:  56000000.0,
// 			FeeRate:       0.0025,
// 		},

// 		// ========== Ethereum - Uniswap V2 更多流行代币池 ==========
// 		{
// 			PoolAddress:   "0xceff51756c56ceffca006cd410b03ffc46dd3a58",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token0Symbol:  "WETH",
// 			Token1Address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", // SHIB
// 			Token1Symbol:  "SHIB",
// 			Reserve0:      "12000000000000000000000",         // 12,000 WETH
// 			Reserve1:      "5200000000000000000000000000000", // 5.2T SHIB
// 			LiquidityUSD:  72000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0xa43fe16908251ee70ef74718545e4fe6c5ccec9f",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", // PEPE
// 			Token0Symbol:  "PEPE",
// 			Token1Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token1Symbol:  "WETH",
// 			Reserve0:      "8500000000000000000000000000000", // 8.5T PEPE
// 			Reserve1:      "5500000000000000000000",          // 5,500 WETH
// 			LiquidityUSD:  33000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0x795065dCc9f64b5614C407a6EFDC400DA6221FB0",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", // AAVE
// 			Token0Symbol:  "AAVE",
// 			Token1Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token1Symbol:  "WETH",
// 			Reserve0:      "180000000000000000000000", // 180,000 AAVE
// 			Reserve1:      "7200000000000000000000",   // 7,200 WETH
// 			LiquidityUSD:  43200000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", // MATIC
// 			Token0Symbol:  "MATIC",
// 			Token1Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token1Symbol:  "WETH",
// 			Reserve0:      "35000000000000000000000000", // 35,000,000 MATIC
// 			Reserve1:      "8000000000000000000000",     // 8,000 WETH
// 			LiquidityUSD:  48000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0x3da1313ae46132a397d90d95b1424a9a7e3e0fce",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0x853d955aCEf822Db058eb8505911ED77F175b99e", // FRAX
// 			Token0Symbol:  "FRAX",
// 			Token1Address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
// 			Token1Symbol:  "USDC",
// 			Reserve0:      "28000000000000000000000000", // 28,000,000 FRAX
// 			Reserve1:      "28000000000000",             // 28,000,000 USDC
// 			LiquidityUSD:  56000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0xDfc14d2Af169B0D36C4EFF567Ada9b2E0CAE044f",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F", // SNX
// 			Token0Symbol:  "SNX",
// 			Token1Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token1Symbol:  "WETH",
// 			Reserve0:      "2800000000000000000000000", // 2,800,000 SNX
// 			Reserve1:      "3200000000000000000000",    // 3,200 WETH
// 			LiquidityUSD:  19200000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0x69D91B94f0AaF8e8A2586909fA77A5c2c89818d5",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0x0D8775F648430679A709E98d2b0Cb6250d2887EF", // BAT
// 			Token0Symbol:  "BAT",
// 			Token1Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token1Symbol:  "WETH",
// 			Reserve0:      "22000000000000000000000000", // 22,000,000 BAT
// 			Reserve1:      "2400000000000000000000",     // 2,400 WETH
// 			LiquidityUSD:  14400000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0x231B7589426Ffe1b75405526fC32aC09D44364c4",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", // MKR
// 			Token0Symbol:  "MKR",
// 			Token1Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token1Symbol:  "WETH",
// 			Reserve0:      "18000000000000000000000", // 18,000 MKR
// 			Reserve1:      "8500000000000000000000",  // 8,500 WETH
// 			LiquidityUSD:  51000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0x60594a405d53811d3BC4766596EFD80fd545A270",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
// 			Token0Symbol:  "DAI",
// 			Token1Address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
// 			Token1Symbol:  "USDT",
// 			Reserve0:      "68000000000000000000000000", // 68,000,000 DAI
// 			Reserve1:      "68000000000000",             // 68,000,000 USDT
// 			LiquidityUSD:  136000000.0,
// 			FeeRate:       0.003,
// 		},
// 		{
// 			PoolAddress:   "0xCFfDdeD873554F362Ac02f8Fb1f02E5ada10516f",
// 			DexName:       "Uniswap V2",
// 			DexRouter:     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
// 			ChainID:       1,
// 			Token0Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 			Token0Symbol:  "WETH",
// 			Token1Address: "0xc00e94Cb662C3520282E6f5717214004A7f26888", // COMP
// 			Token1Symbol:  "COMP",
// 			Reserve0:      "4200000000000000000000",   // 4,200 WETH
// 			Reserve1:      "420000000000000000000000", // 420,000 COMP
// 			LiquidityUSD:  25200000.0,
// 			FeeRate:       0.003,
// 		},

// 		// ========== BSC - PancakeSwap V2 更多代币池 ==========
// 		{
// 			PoolAddress:   "0xbCD62661A6b1DEd703585d3aF7d7649Ef4dcDB5c",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47", // ADA
// 			Token0Symbol:  "ADA",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "125000000000000000000000000", // 125,000,000 ADA
// 			Reserve1:      "38000000000000000000000",     // 38,000 WBNB
// 			LiquidityUSD:  45600000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x1BdCebcA3b93af70b58C41272AEa2231754B23ca",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE", // XRP
// 			Token0Symbol:  "XRP",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "280000000000000000000000000", // 280,000,000 XRP
// 			Reserve1:      "85000000000000000000000",     // 85,000 WBNB
// 			LiquidityUSD:  102000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x7EFaEf62fDdCCa950418312c6C91Aef321375A00",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x4338665CBB7B2485A8855A139b75D5e34AB0DB94", // LTC
// 			Token0Symbol:  "LTC",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "420000000000000000000000", // 420,000 LTC
// 			Reserve1:      "28000000000000000000000",  // 28,000 WBNB
// 			LiquidityUSD:  33600000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x0eD7e52944161450477ee417DE9Cd3a859b14fD1",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43", // DOGE
// 			Token0Symbol:  "DOGE",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "950000000000000000000000000", // 950,000,000 DOGE
// 			Reserve1:      "68000000000000000000000",     // 68,000 WBNB
// 			LiquidityUSD:  81600000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x92b7807bF19b7DDdf89b706143896d05228f3121",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf", // BCH
// 			Token0Symbol:  "BCH",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "62000000000000000000000", // 62,000 BCH
// 			Reserve1:      "25000000000000000000000", // 25,000 WBNB
// 			LiquidityUSD:  30000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x74E4716E431f45807DCF19f284c7aA99F18a4fbc",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // ETH
// 			Token0Symbol:  "ETH",
// 			Token1Address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
// 			Token1Symbol:  "BUSD",
// 			Reserve0:      "52000000000000000000000",     // 52,000 ETH
// 			Reserve1:      "156000000000000000000000000", // 156,000,000 BUSD
// 			LiquidityUSD:  312000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x133ee93FE93320e1182923E1a640912eDE17C90C",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB
// 			Token0Symbol:  "BTCB",
// 			Token1Address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
// 			Token1Symbol:  "BUSD",
// 			Reserve0:      "2800000000000",                // 28,000 BTCB
// 			Reserve1:      "2520000000000000000000000000", // 2,520,000,000 BUSD
// 			LiquidityUSD:  504000000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0xaCAac9311b0096E04Dfe96b6D87dec867d3883Dc",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0xCC42724C6683B7E57334c4E856f4c9965ED682bD", // MATIC
// 			Token0Symbol:  "MATIC",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "88000000000000000000000000", // 88,000,000 MATIC
// 			Reserve1:      "22000000000000000000000",    // 22,000 WBNB
// 			LiquidityUSD:  26400000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0x804678fa97d91B974ec2af3c843270886528a9E6",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0xfb6115445Bff7b52FeB98650C87f44907E58f802", // AAVE
// 			Token0Symbol:  "AAVE",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "85000000000000000000000", // 85,000 AAVE
// 			Reserve1:      "5200000000000000000000",  // 5,200 WBNB
// 			LiquidityUSD:  12480000.0,
// 			FeeRate:       0.0025,
// 		},
// 		{
// 			PoolAddress:   "0xF3Bc6FC080ffCC30d93dF48BFA2aA14b869554bb",
// 			DexName:       "PancakeSwap V2",
// 			DexRouter:     "0x10ED43C718714eb63d5aA57B78B54704E256024E",
// 			ChainID:       56,
// 			Token0Address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
// 			Token0Symbol:  "USDC",
// 			Token1Address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
// 			Token1Symbol:  "WBNB",
// 			Reserve0:      "95000000000000000000000000", // 95,000,000 USDC
// 			Reserve1:      "315000000000000000000000",   // 315,000 WBNB
// 			LiquidityUSD:  189000000.0,
// 			FeeRate:       0.0025,
// 		},
// 	}

// 	for _, pool := range examplePools {
// 		if err := bot.UpsertPool(pool); err != nil {
// 			log.Printf("插入池子失败: %v", err)
// 		} else {
// 			fmt.Printf("✅ 插入池子: %s (%s)\n", pool.DexName, pool.PoolAddress[:10]+"...")
// 		}
// 	}

// 	// 示例：查找直接路由
// 	fmt.Println("\n🔍 查找 WETH -> USDC 的直接路由:")
// 	directPools, err := bot.FindDirectRoute(
// 		1,
// 		"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 		"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
// 	)
// 	if err != nil {
// 		log.Printf("查询失败: %v", err)
// 	} else {
// 		for i, pool := range directPools {
// 			fmt.Printf("  %d. %s - 流动性: $%.2f\n", i+1, pool.DexName, pool.LiquidityUSD)
// 		}
// 	}

// 	// 示例：查找两跳路由
// 	fmt.Println("\n🔍 查找 WETH -> DAI 的两跳路由:")
// 	twoHopRoutes, err := bot.FindTwoHopRoute(
// 		1,
// 		"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// 		"0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
// 		1000.0, // 最小流动性 $1000
// 	)
// 	if err != nil {
// 		log.Printf("查询失败: %v", err)
// 	} else {
// 		for i, route := range twoHopRoutes {
// 			fmt.Printf("  %d. 路径: %v\n", i+1, route.TokenPath)
// 			fmt.Printf("     总手续费: %.2f%%\n", route.TotalFee*100)
// 			routeJSON, _ := json.MarshalIndent(route, "     ", "  ")
// 			fmt.Printf("     详情: %s\n", string(routeJSON))
// 		}
// 	}

// 	fmt.Println("\n✅ 测试完成！")
// }
