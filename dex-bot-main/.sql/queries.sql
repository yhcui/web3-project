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
/*
  CASE WHEN 语句用于动态判断和返回对应的代币信息
  如果 token0_address 等于传入的参数（用户查询的代币地址）则返回 token1_address（另一个代币的地址） 否则返回 token0_address
  如果 token0_address 等于传入的参数 则返回 token1_symbol（另一个代币的符号） 否则返回 token0_symbol

 */
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
/*
 WITH first_hop AS 是 SQL 中的 CTE（Common Table Expression，公共表表达式） 语法,定义临时结果集
 first_hop 就是一个临时表，可以在后续的主查询中像普通表一样使用它。


*/
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
-- 4. 通过常见中间 token 的多跳路由 自动发现最优的两跳交易路径，帮助用户在复杂的 DEX 网络中找到最划算的交易路线！
-- ============================================
-- 查找通过 WETH/USDC/USDT 等常见中间 token 的路径
-- 第一步：找到所有可用的桥接代币bridge_tokens  筛选出 WETH、稳定币等常用桥接代币 这些代币流动性好，交易对多，适合做中间媒介
WITH bridge_tokens AS (
    SELECT token_address, symbol
    FROM tokens
    WHERE chain_id = ?
        AND (is_weth = 1 OR is_stable = 1)
),
-- 找到从代币 A 到桥接代币的路径 找到所有从代币A可以兑换的桥接代币 记录池子信息、流动性、手续费
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
--  找到从桥接代币到目标代币 B 的路径 基于上一步的结果，继续找到能兑换到代币 B 的池子
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
    -- 计算总手续费 总手续费 = 第一跳手续费 + 第二跳手续费（复利计算）
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
/*
在这个 SQL 中，reserve0 和 reserve1 代表交易对池子中两种代币的储备量。
具体含义：
在 DEX（去中心化交易所）中，每个流动性池都包含两种代币的储备：
    reserve0 = token0_address 对应代币的储备量
    reserve1 = token1_address 对应代币的储备量
实际例子：
假设有一个 USDT-ETH 交易对：
    token0_address = USDT
    token1_address = ETH
    reserve0 = 1,000,000 USDT
    reserve1 = 500 ETH
SQL
CAST(reserve0 AS REAL) / CAST(reserve1 AS REAL) as price_ratio

这行代码计算价格比率：
    price_ratio = reserve0 / reserve1
    = 1,000,000 / 500
    = 2000 USDT/ETH（1 ETH = 2000 USDT）

在整个查询中的作用：
这个查询用于发现套利机会：
    找到相同的交易对（比如都是 USDT-ETH）
    比较不同 DEX 的价格比率（price_ratio）
    如果价格差异超过 1%，就存在套利机会
示例：
    Uniswap 上：1 ETH = 2000 USDT
    SushiSwap 上：1 ETH = 2050 USDT
    价格差：2.5% → 可以低买高卖套利
这就是为什么查询最后要按价格差异百分比（price_diff_percent）降序排列，找出最大的套利机会。

 */
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

