-- Token 流动性池数据表
-- 用于构建多跳交易路由

CREATE TABLE IF NOT EXISTS token_liquidity_pools (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 流动性池基本信息
    pool_address TEXT NOT NULL,           -- 流动性池合约地址
    dex_name TEXT NOT NULL,               -- DEX 名称 (Uniswap, SushiSwap, PancakeSwap 等)
    dex_router TEXT NOT NULL,             -- DEX 路由合约地址
    chain_id INTEGER NOT NULL,            -- 链 ID (1=Ethereum, 56=BSC, 137=Polygon 等)
    
    -- Token 对信息
    token0_address TEXT NOT NULL,         -- Token0 地址
    token0_symbol TEXT,                   -- Token0 符号
    token0_decimals INTEGER,              -- Token0 精度
    token1_address TEXT NOT NULL,         -- Token1 地址
    token1_symbol TEXT,                   -- Token1 符号
    token1_decimals INTEGER,              -- Token1 精度
    
    -- 流动性信息
    reserve0 TEXT,                        -- Token0 储备量 (使用 TEXT 存储大数)
    reserve1 TEXT,                        -- Token1 储备量 (使用 TEXT 存储大数)
    liquidity_usd REAL,                   -- 流动性价值 (USD)
    
    -- 交易信息
    fee_rate REAL DEFAULT 0.003,          -- 手续费率 (0.003 = 0.3%)
    volume_24h REAL,                      -- 24小时交易量 (USD)
    
    -- 元数据
    is_active BOOLEAN DEFAULT 1,          -- 是否活跃
    last_updated INTEGER NOT NULL,        -- 最后更新时间戳
    created_at INTEGER NOT NULL,          -- 创建时间戳
    
    -- 唯一约束：同一个池子在同一条链上只记录一次
    UNIQUE(pool_address, chain_id)
);

-- 主要索引：用于快速查询从某个 token 出发的所有可能路径
CREATE INDEX IF NOT EXISTS idx_token0_chain ON token_liquidity_pools(token0_address, chain_id);
CREATE INDEX IF NOT EXISTS idx_token1_chain ON token_liquidity_pools(token1_address, chain_id);

-- 复合索引：优化多跳路由查询
CREATE INDEX IF NOT EXISTS idx_token0_token1_chain ON token_liquidity_pools(token0_address, token1_address, chain_id);

-- 流动性索引：按流动性排序，优先选择流动性高的池子
CREATE INDEX IF NOT EXISTS idx_liquidity ON token_liquidity_pools(chain_id, liquidity_usd DESC) WHERE is_active = 1;

-- DEX 索引：按 DEX 查询
CREATE INDEX IF NOT EXISTS idx_dex_chain ON token_liquidity_pools(dex_name, chain_id);

-- 活跃池子索引
CREATE INDEX IF NOT EXISTS idx_active_updated ON token_liquidity_pools(is_active, last_updated) WHERE is_active = 1;


-- Token 元数据表（可选，用于存储 token 的额外信息）
CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    symbol TEXT,
    name TEXT,
    decimals INTEGER,
    is_stable BOOLEAN DEFAULT 0,          -- 是否为稳定币
    is_weth BOOLEAN DEFAULT 0,            -- 是否为 wrapped native token
    coingecko_id TEXT,                    -- CoinGecko ID
    price_usd REAL,                       -- 当前价格 (USD)
    market_cap REAL,                      -- 市值
    last_updated INTEGER,
    
    UNIQUE(token_address, chain_id)
);

CREATE INDEX IF NOT EXISTS idx_token_chain ON tokens(token_address, chain_id);
CREATE INDEX IF NOT EXISTS idx_token_stable ON tokens(chain_id, is_stable) WHERE is_stable = 1;
CREATE INDEX IF NOT EXISTS idx_token_weth ON tokens(chain_id, is_weth) WHERE is_weth = 1;


-- 多跳路由缓存表（可选，用于缓存计算好的最优路径）
CREATE TABLE IF NOT EXISTS routing_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chain_id INTEGER NOT NULL,
    token_in TEXT NOT NULL,
    token_out TEXT NOT NULL,
    amount_in TEXT NOT NULL,
    
    -- 路由信息
    route_path TEXT NOT NULL,             -- JSON 数组，存储完整路径 ["token0", "token1", "token2"]
    pool_path TEXT NOT NULL,              -- JSON 数组，存储池子地址
    dex_path TEXT NOT NULL,               -- JSON 数组，存储使用的 DEX
    expected_amount_out TEXT,             -- 预期输出金额
    price_impact REAL,                    -- 价格影响
    
    -- 缓存元数据
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    
    -- 索引用于快速查询
    UNIQUE(chain_id, token_in, token_out, amount_in)
);

CREATE INDEX IF NOT EXISTS idx_routing_cache ON routing_cache(chain_id, token_in, token_out, expires_at);

