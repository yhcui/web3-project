-- 多跳交易路由查询示例

-- ============================================
-- 1. 查找从 TokenA 到 TokenB 的直接交易对
-- ============================================
-- 单跳交易：TokenA -> TokenB
SELECT 
    pool_address,
    dex_name,
    token0_address,
    token1_address,
    reserve0,
    reserve1,
    liquidity_usd,
    fee_rate
FROM token_liquidity_pools
WHERE chain_id = ? 
    AND is_active = 1
    AND (
        (token0_address = ? AND token1_address = ?)  -- TokenA -> TokenB
        OR (token0_address = ? AND token1_address = ?)  -- TokenB -> TokenA
    )
ORDER BY liquidity_usd DESC
LIMIT 10;


-- ============================================
-- 2. 查找从 TokenA 出发的所有可能路径（一跳）
-- ============================================
-- 找出所有可以从 TokenA 交易的 token
SELECT 
    CASE 
        WHEN token0_address = ? THEN token1_address
        ELSE token0_address 
    END as next_token,
    CASE 
        WHEN token0_address = ? THEN token1_symbol
        ELSE token0_symbol 
    END as next_token_symbol,
    pool_address,
    dex_name,
    liquidity_usd,
    fee_rate
FROM token_liquidity_pools
WHERE chain_id = ?
    AND is_active = 1
    AND (token0_address = ? OR token1_address = ?)
ORDER BY liquidity_usd DESC;


-- ============================================
-- 3. 两跳路由：TokenA -> TokenB -> TokenC
-- ============================================
-- 找出通过中间 token 的两跳路径
WITH first_hop AS (
    SELECT 
        pool_address as pool1,
        dex_name as dex1,
        CASE 
            WHEN token0_address = ? THEN token1_address
            ELSE token0_address 
        END as intermediate_token,
        liquidity_usd as liquidity1,
        fee_rate as fee1
    FROM token_liquidity_pools
    WHERE chain_id = ?
        AND is_active = 1
        AND (token0_address = ? OR token1_address = ?)
        AND liquidity_usd > 10000  -- 只考虑流动性 > 1万美元的池子
)
SELECT 
    fh.pool1,
    fh.dex1,
    fh.intermediate_token,
    fh.liquidity1,
    fh.fee1,
    tlp.pool_address as pool2,
    tlp.dex_name as dex2,
    tlp.liquidity_usd as liquidity2,
    tlp.fee_rate as fee2,
    (fh.liquidity1 + tlp.liquidity_usd) / 2 as avg_liquidity
FROM first_hop fh
JOIN token_liquidity_pools tlp 
    ON tlp.chain_id = ?
    AND tlp.is_active = 1
    AND (
        (tlp.token0_address = fh.intermediate_token AND tlp.token1_address = ?)
        OR (tlp.token1_address = fh.intermediate_token AND tlp.token0_address = ?)
    )
    AND tlp.liquidity_usd > 10000
ORDER BY avg_liquidity DESC
LIMIT 20;


-- ============================================
-- 4. 通过常见中间 token 的多跳路由
-- ============================================
-- 查找通过 WETH/USDC/USDT 等常见中间 token 的路径
WITH bridge_tokens AS (
    SELECT token_address, symbol
    FROM tokens
    WHERE chain_id = ?
        AND (is_weth = 1 OR is_stable = 1)
),
token_a_to_bridge AS (
    SELECT 
        bt.token_address as bridge_token,
        bt.symbol as bridge_symbol,
        tlp.pool_address as pool1,
        tlp.dex_name as dex1,
        tlp.liquidity_usd as liquidity1,
        tlp.fee_rate as fee1
    FROM bridge_tokens bt
    JOIN token_liquidity_pools tlp
        ON tlp.chain_id = ?
        AND tlp.is_active = 1
        AND (
            (tlp.token0_address = ? AND tlp.token1_address = bt.token_address)
            OR (tlp.token1_address = ? AND tlp.token0_address = bt.token_address)
        )
        AND tlp.liquidity_usd > 50000
)
SELECT 
    tab.bridge_token,
    tab.bridge_symbol,
    tab.pool1,
    tab.dex1,
    tab.liquidity1,
    tab.fee1,
    tlp.pool_address as pool2,
    tlp.dex_name as dex2,
    tlp.liquidity_usd as liquidity2,
    tlp.fee_rate as fee2,
    -- 计算总手续费
    (1 - (1 - tab.fee1) * (1 - tlp.fee_rate)) as total_fee_rate,
    -- 使用较小的流动性作为瓶颈指标
    MIN(tab.liquidity1, tlp.liquidity_usd) as bottleneck_liquidity
FROM token_a_to_bridge tab
JOIN token_liquidity_pools tlp
    ON tlp.chain_id = ?
    AND tlp.is_active = 1
    AND (
        (tlp.token0_address = tab.bridge_token AND tlp.token1_address = ?)
        OR (tlp.token1_address = tab.bridge_token AND tlp.token0_address = ?)
    )
    AND tlp.liquidity_usd > 50000
ORDER BY bottleneck_liquidity DESC
LIMIT 10;


-- ============================================
-- 5. 查询某个 token 在所有 DEX 上的流动性分布
-- ============================================
SELECT 
    dex_name,
    COUNT(*) as pool_count,
    SUM(liquidity_usd) as total_liquidity,
    AVG(liquidity_usd) as avg_liquidity,
    SUM(volume_24h) as total_volume_24h
FROM token_liquidity_pools
WHERE chain_id = ?
    AND is_active = 1
    AND (token0_address = ? OR token1_address = ?)
GROUP BY dex_name
ORDER BY total_liquidity DESC;


-- ============================================
-- 6. 查找最优流动性的交易对（按链）
-- ============================================
SELECT 
    token0_address,
    token0_symbol,
    token1_address,
    token1_symbol,
    pool_address,
    dex_name,
    liquidity_usd,
    volume_24h,
    fee_rate,
    CASE 
        WHEN volume_24h > 0 THEN liquidity_usd / volume_24h
        ELSE 0 
    END as liquidity_depth_ratio
FROM token_liquidity_pools
WHERE chain_id = ?
    AND is_active = 1
    AND liquidity_usd > 100000  -- 流动性 > 10万美元
ORDER BY liquidity_usd DESC
LIMIT 50;


-- ============================================
-- 7. 更新流动性数据
-- ============================================
INSERT OR REPLACE INTO token_liquidity_pools (
    pool_address, dex_name, dex_router, chain_id,
    token0_address, token0_symbol, token0_decimals,
    token1_address, token1_symbol, token1_decimals,
    reserve0, reserve1, liquidity_usd,
    fee_rate, volume_24h, is_active,
    last_updated, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?);


-- ============================================
-- 8. 查找可能的套利机会（同一交易对在不同 DEX 的价格差）
-- ============================================
WITH token_pairs AS (
    SELECT 
        CASE 
            WHEN token0_address < token1_address 
            THEN token0_address || '-' || token1_address
            ELSE token1_address || '-' || token0_address
        END as pair_id,
        token0_address,
        token1_address,
        pool_address,
        dex_name,
        CAST(reserve0 AS REAL) / CAST(reserve1 AS REAL) as price_ratio,
        liquidity_usd
    FROM token_liquidity_pools
    WHERE chain_id = ?
        AND is_active = 1
        AND liquidity_usd > 50000
)
SELECT 
    tp1.token0_address,
    tp1.token1_address,
    tp1.dex_name as dex1,
    tp1.pool_address as pool1,
    tp1.price_ratio as price1,
    tp2.dex_name as dex2,
    tp2.pool_address as pool2,
    tp2.price_ratio as price2,
    ABS(tp1.price_ratio - tp2.price_ratio) / tp1.price_ratio * 100 as price_diff_percent,
    MIN(tp1.liquidity_usd, tp2.liquidity_usd) as min_liquidity
FROM token_pairs tp1
JOIN token_pairs tp2 
    ON tp1.pair_id = tp2.pair_id
    AND tp1.pool_address < tp2.pool_address  -- 避免重复
WHERE ABS(tp1.price_ratio - tp2.price_ratio) / tp1.price_ratio > 0.01  -- 价格差 > 1%
ORDER BY price_diff_percent DESC
LIMIT 20;

