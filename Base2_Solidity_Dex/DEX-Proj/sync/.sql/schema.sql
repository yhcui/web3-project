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
