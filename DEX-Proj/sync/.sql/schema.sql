-- Enable UUID extension if needed, though we use TEXT/Integers primarily
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
    address TEXT PRIMARY KEY,
    symbol TEXT,
    name TEXT,
    decimals INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pools table
CREATE TABLE IF NOT EXISTS pools (
    address TEXT PRIMARY KEY,
    token0 TEXT REFERENCES tokens(address),
    token1 TEXT REFERENCES tokens(address),
    fee INT NOT NULL,
    tick_lower INT NOT NULL,
    tick_upper INT NOT NULL,
    liquidity NUMERIC DEFAULT 0,
    sqrt_price_x96 NUMERIC DEFAULT 0,
    tick INT DEFAULT 0,
    reserve0 NUMERIC DEFAULT 0,
    reserve1 NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions table (NFTs)
CREATE TABLE IF NOT EXISTS positions (
    id NUMERIC PRIMARY KEY, -- Token ID from PositionManager
    owner TEXT NOT NULL,
    pool_address TEXT REFERENCES pools(address),
    token0 TEXT REFERENCES tokens(address),
    token1 TEXT REFERENCES tokens(address),
    tick_lower INT NOT NULL,
    tick_upper INT NOT NULL,
    liquidity NUMERIC DEFAULT 0,
    fee_growth_inside0_last_x128 NUMERIC DEFAULT 0,
    fee_growth_inside1_last_x128 NUMERIC DEFAULT 0,
    tokens_owed0 NUMERIC DEFAULT 0,
    tokens_owed1 NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Swaps table
CREATE TABLE IF NOT EXISTS swaps (
    transaction_hash TEXT NOT NULL,
    log_index INT NOT NULL,
    pool_address TEXT REFERENCES pools(address),
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    amount0 NUMERIC NOT NULL,
    amount1 NUMERIC NOT NULL,
    sqrt_price_x96 NUMERIC NOT NULL,
    liquidity NUMERIC NOT NULL,
    tick INT NOT NULL,
    block_number NUMERIC NOT NULL,
    block_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (transaction_hash, log_index)
);

-- Ticks table (For liquidity depth)
CREATE TABLE IF NOT EXISTS ticks (
    pool_address TEXT REFERENCES pools(address),
    tick_index INT NOT NULL,
    liquidity_gross NUMERIC DEFAULT 0,
    liquidity_net NUMERIC DEFAULT 0,
    fee_growth_outside0_x128 NUMERIC DEFAULT 0,
    fee_growth_outside1_x128 NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (pool_address, tick_index)
);

-- Liquidity Mint/Burn events (optional but useful for history)
CREATE TABLE IF NOT EXISTS liquidity_events (
    transaction_hash TEXT NOT NULL,
    log_index INT NOT NULL,
    pool_address TEXT REFERENCES pools(address),
    type TEXT NOT NULL, -- 'MINT' or 'BURN'
    owner TEXT NOT NULL,
    amount NUMERIC NOT NULL, -- Liquidity amount
    amount0 NUMERIC NOT NULL,
    amount1 NUMERIC NOT NULL,
    tick_lower INT,
    tick_upper INT,
    block_number NUMERIC NOT NULL,
    block_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (transaction_hash, log_index)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_swaps_pool_timestamp ON swaps(pool_address, block_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_positions_owner ON positions(owner);
CREATE INDEX IF NOT EXISTS idx_positions_pool ON positions(pool_address);

-- Indexed status table: 记录各网络的扫描高度
CREATE TABLE IF NOT EXISTS indexed_status (
    network TEXT PRIMARY KEY,           -- 网络标识，如 mainnet、sepolia、local
    last_block NUMERIC NOT NULL,        -- 已处理的最高区块号
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE indexed_status IS '扫描状态表：记录各区块链网络的已索引最高区块';
COMMENT ON COLUMN indexed_status.network IS '网络标识，例如 mainnet、sepolia 或 local';
COMMENT ON COLUMN indexed_status.last_block IS '该网络已处理的最高区块号';
COMMENT ON COLUMN indexed_status.updated_at IS '记录更新时间';

-- ============================================
-- Table Comments (业务注释说明)
-- ============================================

-- Tokens table: 代币信息表
-- 存储所有在DEX中使用的ERC20代币的基本信息，包括代币地址、符号、名称和小数位数
COMMENT ON TABLE tokens IS '代币信息表：存储ERC20代币的基本信息，包括地址、符号、名称和小数位数';
COMMENT ON COLUMN tokens.address IS '代币合约地址，作为主键';
COMMENT ON COLUMN tokens.symbol IS '代币符号，如USDT、ETH等';
COMMENT ON COLUMN tokens.name IS '代币全称';
COMMENT ON COLUMN tokens.decimals IS '代币精度，通常为18';

-- Pools table: 流动性池表
-- 存储交易对的流动性池信息，包括两个代币、手续费率、价格区间、当前价格和流动性等
COMMENT ON TABLE pools IS '流动性池表：存储交易对的流动性池信息，包括代币对、手续费率、价格区间、当前价格和总流动性';
COMMENT ON COLUMN pools.address IS '流动性池合约地址，作为主键';
COMMENT ON COLUMN pools.token0 IS '交易对中的第一个代币地址（按地址排序）';
COMMENT ON COLUMN pools.token1 IS '交易对中的第二个代币地址（按地址排序）';
COMMENT ON COLUMN pools.fee IS '手续费率，以基点为单位（如3000表示0.3%）';
COMMENT ON COLUMN pools.tick_lower IS '价格区间下限对应的tick值';
COMMENT ON COLUMN pools.tick_upper IS '价格区间上限对应的tick值';
COMMENT ON COLUMN pools.liquidity IS '池子当前的总流动性';
COMMENT ON COLUMN pools.sqrt_price_x96 IS '当前价格的平方根，以Q96格式存储（用于精确计算）';
COMMENT ON COLUMN pools.tick IS '当前价格对应的tick值';
COMMENT ON COLUMN pools.reserve0 IS '池子中token0的余额（通过调用token0.balanceOf(pool)获取）';
COMMENT ON COLUMN pools.reserve1 IS '池子中token1的余额（通过调用token1.balanceOf(pool)获取）';

-- Positions table: 流动性持仓表（NFT）
-- 存储用户通过PositionManager创建的流动性持仓，每个持仓对应一个NFT token ID
COMMENT ON TABLE positions IS '流动性持仓表：存储用户的流动性持仓信息，每个持仓对应一个NFT token ID，记录持仓的代币对、价格区间、流动性数量等';
COMMENT ON COLUMN positions.id IS 'NFT token ID，由PositionManager合约分配，作为主键';
COMMENT ON COLUMN positions.owner IS '持仓所有者地址';
COMMENT ON COLUMN positions.pool_address IS '所属的流动性池地址';
COMMENT ON COLUMN positions.token0 IS '持仓中的第一个代币地址';
COMMENT ON COLUMN positions.token1 IS '持仓中的第二个代币地址';
COMMENT ON COLUMN positions.tick_lower IS '持仓价格区间下限对应的tick值';
COMMENT ON COLUMN positions.tick_upper IS '持仓价格区间上限对应的tick值';
COMMENT ON COLUMN positions.liquidity IS '该持仓提供的流动性数量';
COMMENT ON COLUMN positions.fee_growth_inside0_last_x128 IS '上次更新时token0的手续费增长率（Q128格式），用于计算应得手续费';
COMMENT ON COLUMN positions.fee_growth_inside1_last_x128 IS '上次更新时token1的手续费增长率（Q128格式），用于计算应得手续费';
COMMENT ON COLUMN positions.tokens_owed0 IS '该持仓应得的token0手续费数量';
COMMENT ON COLUMN positions.tokens_owed1 IS '该持仓应得的token1手续费数量';

-- Swaps table: 交换记录表
-- 记录所有在DEX中发生的代币交换交易，用于交易历史查询和价格分析
COMMENT ON TABLE swaps IS '交换记录表：记录所有代币交换交易的历史数据，包括交易双方、交换数量、价格变化等信息，用于交易历史查询和价格分析';
COMMENT ON COLUMN swaps.transaction_hash IS '交易哈希值，与log_index一起构成主键';
COMMENT ON COLUMN swaps.log_index IS '日志索引，用于区分同一交易中的多个事件';
COMMENT ON COLUMN swaps.pool_address IS '发生交换的流动性池地址';
COMMENT ON COLUMN swaps.sender IS '交换发起者地址';
COMMENT ON COLUMN swaps.recipient IS '交换接收者地址';
COMMENT ON COLUMN swaps.amount0 IS 'token0的交换数量（正数表示增加，负数表示减少）';
COMMENT ON COLUMN swaps.amount1 IS 'token1的交换数量（正数表示增加，负数表示减少）';
COMMENT ON COLUMN swaps.sqrt_price_x96 IS '交换后的价格平方根（Q96格式）';
COMMENT ON COLUMN swaps.liquidity IS '交换后池子的流动性';
COMMENT ON COLUMN swaps.tick IS '交换后的价格tick值';
COMMENT ON COLUMN swaps.block_number IS '交易所在区块号';
COMMENT ON COLUMN swaps.block_timestamp IS '交易所在区块的时间戳';

-- Ticks table: 价格刻度表
-- 存储每个价格刻度（tick）的流动性信息，用于计算流动性深度和价格影响
COMMENT ON TABLE ticks IS '价格刻度表：存储每个价格刻度（tick）的流动性信息，用于计算流动性深度、价格影响和滑点分析';
COMMENT ON COLUMN ticks.pool_address IS '所属的流动性池地址，与tick_index一起构成主键';
COMMENT ON COLUMN ticks.tick_index IS '价格刻度索引值，每个tick对应一个价格点';
COMMENT ON COLUMN ticks.liquidity_gross IS '该tick点的总流动性（包括所有经过此tick的持仓）';
COMMENT ON COLUMN ticks.liquidity_net IS '该tick点的净流动性变化（向上为正，向下为负）';
COMMENT ON COLUMN ticks.fee_growth_outside0_x128 IS 'tick外部区域token0的手续费增长率（Q128格式）';
COMMENT ON COLUMN ticks.fee_growth_outside1_x128 IS 'tick外部区域token1的手续费增长率（Q128格式）';

-- Liquidity events table: 流动性事件表
-- 记录所有添加和移除流动性的历史事件，用于流动性变化分析和审计
COMMENT ON TABLE liquidity_events IS '流动性事件表：记录所有添加（MINT）和移除（BURN）流动性的历史事件，用于流动性变化分析、用户行为追踪和审计';
COMMENT ON COLUMN liquidity_events.transaction_hash IS '交易哈希值，与log_index一起构成主键';
COMMENT ON COLUMN liquidity_events.log_index IS '日志索引，用于区分同一交易中的多个事件';
COMMENT ON COLUMN liquidity_events.pool_address IS '发生流动性变化的池子地址';
COMMENT ON COLUMN liquidity_events.type IS '事件类型：MINT（添加流动性）或BURN（移除流动性）';
COMMENT ON COLUMN liquidity_events.owner IS '流动性操作者地址';
COMMENT ON COLUMN liquidity_events.amount IS '流动性数量变化（LP token数量）';
COMMENT ON COLUMN liquidity_events.amount0 IS 'token0的数量变化';
COMMENT ON COLUMN liquidity_events.amount1 IS 'token1的数量变化';
COMMENT ON COLUMN liquidity_events.tick_lower IS '流动性价格区间下限对应的tick值';
COMMENT ON COLUMN liquidity_events.tick_upper IS '流动性价格区间上限对应的tick值';
COMMENT ON COLUMN liquidity_events.block_number IS '事件所在区块号';
COMMENT ON COLUMN liquidity_events.block_timestamp IS '事件所在区块的时间戳';
