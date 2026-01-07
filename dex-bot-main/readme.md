# DEX 多跳交易路由算法原理详解

## 📚 目录

1. [基础概念](#基础概念)
2. [AMM 恒定乘积公式](#amm-恒定乘积公式)
3. [单跳交易原理](#单跳交易原理)
4. [多跳交易原理](#多跳交易原理)
5. [路径搜索算法](#路径搜索算法)
6. [最优路径选择](#最优路径选择)
7. [代码实现解析](#代码实现解析)
8. [实际案例分析](#实际案例分析)

---

## 基础概念

### 什么是流动性池？

流动性池是 DEX 中的核心概念，它是一个智能合约，包含两种代币的储备（Reserve）。

```
流动性池 = { Token A 储备量, Token B 储备量 }

示例：WETH/USDC 池
- WETH 储备：75,000 ETH
- USDC 储备：180,000,000 USDC
- 当前价格：1 ETH ≈ 2,400 USDC
```

### 为什么需要多跳交易？

**直接交易**（单跳）：
```
Token A → Token B  (如果存在 A/B 池)
```

**多跳交易**（通过中间代币）：
```
Token A → Token C → Token B  (通过中间代币 C)

优势：
1. 某些代币对可能没有直接的流动性池
2. 通过中间代币可能获得更好的价格
3. 分散滑点，降低价格影响
```

---

## AMM 恒定乘积公式

### Uniswap V2 核心公式

```
x × y = k (常数乘积)

其中：
- x = Token A 的储备量
- y = Token B 的储备量  
- k = 常数（交易前后保持不变）
```

### 输出金额计算

给定输入金额 `Δx`，计算输出金额 `Δy`：

```
(x + Δx × (1 - fee)) × (y - Δy) = x × y

解得：
Δy = (y × Δx × (1 - fee)) / (x + Δx × (1 - fee))

其中：
- Δx = 输入金额
- Δy = 输出金额
- fee = 手续费率（Uniswap V2 = 0.3%, PancakeSwap V2 = 0.25%）
```

### 代码实现

```go
func CalculateOutputAmount(amountIn, reserveIn, reserveOut *big.Int, feeRate float64) *big.Int {
    // 计算手续费后的输入金额
    feeMultiplier := big.NewInt(int64((1 - feeRate) * 10000))
    amountInWithFee := new(big.Int).Mul(amountIn, feeMultiplier)
    amountInWithFee.Div(amountInWithFee, big.NewInt(10000))

    // 分子: amountInWithFee × reserveOut
    numerator := new(big.Int).Mul(amountInWithFee, reserveOut)

    // 分母: reserveIn + amountInWithFee
    denominator := new(big.Int).Add(reserveIn, amountInWithFee)

    // 计算输出
    amountOut := new(big.Int).Div(numerator, denominator)
    return amountOut
}
```

---

## 单跳交易原理

### 场景：用户想用 ETH 兑换 USDC

```
步骤 1: 查找直接流动性池
┌─────────────────────────────────────┐
│   查询: WETH/USDC 池                │
│                                     │
│   结果:                             │
│   - Pool 1: 75,000 WETH / 180M USDC│
│   - Pool 2: 1,000 WETH / 2.4M USDC │
└─────────────────────────────────────┘

步骤 2: 选择最优池子
- 比较流动性（越高越好，滑点越小）
- 比较价格
- 选择 Pool 1（流动性更高）

步骤 3: 计算输出
输入: 10 WETH
使用公式:
  Δy = (180,000,000 × 10 × 0.997) / (75,000 + 10 × 0.997)
     ≈ 23,952 USDC
```

### SQL 查询实现

```sql
-- 查找直接交易对
SELECT 
    pool_address, dex_name, reserve0, reserve1, 
    liquidity_usd, fee_rate
FROM token_liquidity_pools
WHERE chain_id = 1 
    AND is_active = 1
    AND (
        (token0_address = '0xWETH' AND token1_address = '0xUSDC')
        OR (token0_address = '0xUSDC' AND token1_address = '0xWETH')
    )
ORDER BY liquidity_usd DESC  -- 按流动性排序
LIMIT 10;
```

---

## 多跳交易原理

### 场景：用户想用 WETH 兑换 DAI（没有直接池子或流动性不足）

```
方案 1: 直接交易（流动性较低）
WETH → DAI
流动性: $50M

方案 2: 通过 USDC 中转（流动性更高）
WETH → USDC → DAI
         ↓         ↓
    流动性$360M  流动性$84M

总流动性: min($360M, $84M) = $84M (瓶颈流动性)
```

### 两跳路由图示

```
           Pool 1                Pool 2
┌──────┐ ────────► ┌──────┐ ────────► ┌──────┐
│ WETH │  75k/180M │ USDC │  42M/42M  │ DAI  │
└──────┘           └──────┘           └──────┘
         $360M 流动性    $84M 流动性

交易过程:
1. 用户输入 10 WETH
2. 第一跳: 10 WETH → 23,952 USDC (Pool 1)
3. 第二跳: 23,952 USDC → 23,880 DAI (Pool 2)
4. 用户得到 23,880 DAI

总手续费:
- 第一跳: 0.3%
- 第二跳: 0.3%
- 总计: 1 - (1 - 0.003) × (1 - 0.003) ≈ 0.599%
```

### 计算步骤详解

#### 步骤 1: 第一跳计算

```
池子: WETH/USDC
储备: 75,000 WETH / 180,000,000 USDC
输入: 10 WETH
手续费: 0.3%

输出 = (180,000,000 × 10 × 0.997) / (75,000 + 10 × 0.997)
     = (1,794,600,000) / (75,009.97)
     ≈ 23,927 USDC
```

#### 步骤 2: 第二跳计算

```
池子: USDC/DAI
储备: 42,000,000 USDC / 42,000,000 DAI
输入: 23,927 USDC (来自第一跳的输出)
手续费: 0.3%

输出 = (42,000,000 × 23,927 × 0.997) / (42,000,000 + 23,927 × 0.997)
     ≈ 23,855 DAI
```

#### 总结

```
用户输入: 10 WETH
用户输出: 23,855 DAI
有效价格: 2,385.5 DAI/WETH
总手续费: ~0.6%
```

---

## 路径搜索算法

### 算法类型

#### 1. 广度优先搜索 (BFS)

```
从起始代币开始，逐层搜索所有可能的路径

Level 0:    [WETH]
               ↓
Level 1:    [USDC, USDT, DAI, WBTC, ...]
               ↓
Level 2:    [各种代币组合]

优点: 能找到所有路径
缺点: 计算量大，需要剪枝优化
```

#### 2. 深度优先搜索 (DFS)

```
沿着一条路径搜索到底，然后回溯

优点: 内存占用少
缺点: 可能错过最优路径
```

#### 3. 启发式搜索 (A*)

```
使用评估函数指导搜索方向

评估函数 = 已花费成本 + 预估剩余成本

优点: 效率高，优先搜索最有希望的路径
缺点: 需要好的启发函数
```

### 我们的实现（SQL + 应用层）

```sql
-- 使用 SQL CTE (Common Table Expression) 实现两跳搜索
WITH first_hop AS (
    -- 第一跳: 找出从 Token A 可以到达的所有中间代币
    SELECT 
        pool_address as pool1,
        dex_name as dex1,
        CASE 
            WHEN token0_address = 'TokenA' THEN token1_address
            ELSE token0_address 
        END as intermediate_token,
        reserve0, reserve1,
        liquidity_usd as liquidity1,
        fee_rate as fee1
    FROM token_liquidity_pools
    WHERE chain_id = 1
        AND is_active = 1
        AND (token0_address = 'TokenA' OR token1_address = 'TokenA')
        AND liquidity_usd > 10000  -- 剪枝：忽略低流动性池子
)
SELECT 
    fh.pool1,
    fh.intermediate_token,
    fh.liquidity1,
    tlp.pool_address as pool2,
    tlp.liquidity_usd as liquidity2,
    (fh.liquidity1 + tlp.liquidity_usd) / 2 as avg_liquidity
FROM first_hop fh
JOIN token_liquidity_pools tlp 
    ON tlp.chain_id = 1
    AND tlp.is_active = 1
    AND (
        (tlp.token0_address = fh.intermediate_token AND tlp.token1_address = 'TokenB')
        OR (tlp.token1_address = fh.intermediate_token AND tlp.token0_address = 'TokenB')
    )
    AND tlp.liquidity_usd > 10000
ORDER BY avg_liquidity DESC  -- 优先返回高流动性路径
LIMIT 20;
```

---

## 最优路径选择

### 评估指标

#### 1. 流动性深度

```
瓶颈流动性 = MIN(Pool1.liquidity, Pool2.liquidity, ...)

为什么重要：
- 流动性越高，滑点越小
- 避免价格剧烈变动
```

#### 2. 总手续费

```
单跳: fee = 0.3%
两跳: fee = 1 - (1 - 0.003) × (1 - 0.003) ≈ 0.599%
三跳: fee = 1 - (1 - 0.003)³ ≈ 0.897%

一般来说，跳数越多，手续费越高
```

#### 3. 价格影响（滑点）

```
价格影响 = (实际价格 - 理论价格) / 理论价格 × 100%

大额交易的价格影响更大
需要根据交易金额动态计算
```

#### 4. Gas 费用

```
单跳: ~150,000 gas
两跳: ~300,000 gas
三跳: ~450,000 gas

在以太坊主网，Gas 费用可能很高
需要在手续费和 Gas 费之间权衡
```

### 综合评分算法

```go
type RouteScore struct {
    Route           Route
    LiquidityScore  float64  // 流动性得分 (0-100)
    FeeScore        float64  // 手续费得分 (0-100)
    PriceScore      float64  // 价格得分 (0-100)
    TotalScore      float64  // 综合得分
}

func CalculateRouteScore(route Route, amountIn *big.Int) RouteScore {
    // 1. 流动性得分（越高越好）
    bottleneckLiquidity := GetBottleneckLiquidity(route)
    liquidityScore := NormalizeScore(bottleneckLiquidity, 1000000, 100000000)
    
    // 2. 手续费得分（越低越好）
    totalFee := route.TotalFee
    feeScore := 100 - (totalFee * 10000) // 转换为 0-100 分
    
    // 3. 价格得分（根据实际输出计算）
    expectedOutput := SimulateSwap(route, amountIn)
    priceScore := CalculatePriceScore(expectedOutput, amountIn)
    
    // 4. 综合得分（加权平均）
    totalScore := liquidityScore * 0.4 + 
                  feeScore * 0.3 + 
                  priceScore * 0.3
    
    return RouteScore{
        Route:          route,
        LiquidityScore: liquidityScore,
        FeeScore:       feeScore,
        PriceScore:     priceScore,
        TotalScore:     totalScore,
    }
}
```

---

## 代码实现解析

### 1. 查找直接路由（单跳）

```go
func (bot *DexBot) FindDirectRoute(chainID int, tokenIn, tokenOut string) ([]Pool, error) {
    query := `
        SELECT 
            id, pool_address, dex_name, dex_router, chain_id,
            token0_address, token0_symbol, 
            token1_address, token1_symbol,
            reserve0, reserve1, liquidity_usd, fee_rate, is_active
        FROM token_liquidity_pools
        WHERE chain_id = ? 
            AND is_active = 1
            AND (
                (token0_address = ? AND token1_address = ?)  -- A -> B
                OR (token0_address = ? AND token1_address = ?)  -- B -> A
            )
        ORDER BY liquidity_usd DESC  -- 关键：按流动性排序
        LIMIT 10
    `
    
    rows, err := bot.db.Query(query, chainID, tokenIn, tokenOut, tokenOut, tokenIn)
    // ... 处理结果
}
```

**关键点**：
1. 双向查询（A→B 和 B→A）
2. 只查询活跃的池子
3. 按流动性降序排序
4. 限制返回数量（避免过多结果）

### 2. 查找两跳路由

```go
func (bot *DexBot) FindTwoHopRoute(chainID int, tokenIn, tokenOut string, minLiquidity float64) ([]Route, error) {
    query := `
        WITH first_hop AS (
            -- 第一跳：找出所有从 tokenIn 可达的中间代币
            SELECT 
                pool_address, dex_name, dex_router,
                token0_address, token1_address,
                reserve0, reserve1, 
                liquidity_usd, fee_rate,
                CASE 
                    WHEN token0_address = ? THEN token1_address
                    ELSE token0_address 
                END as intermediate_token
            FROM token_liquidity_pools
            WHERE chain_id = ?
                AND is_active = 1
                AND (token0_address = ? OR token1_address = ?)
                AND liquidity_usd > ?  -- 剪枝
        )
        SELECT 
            -- 第一跳信息
            fh.pool_address, fh.dex_name, 
            fh.token0_address, fh.token1_address,
            fh.reserve0, fh.reserve1,
            fh.liquidity_usd, fh.fee_rate,
            fh.intermediate_token,
            -- 第二跳信息
            tlp.pool_address, tlp.dex_name,
            tlp.token0_address, tlp.token1_address,
            tlp.reserve0, tlp.reserve1,
            tlp.liquidity_usd, tlp.fee_rate,
            -- 评估指标
            (fh.liquidity_usd + tlp.liquidity_usd) / 2 as avg_liquidity
        FROM first_hop fh
        JOIN token_liquidity_pools tlp 
            ON tlp.chain_id = ?
            AND tlp.is_active = 1
            AND (
                -- 第二跳必须能到达 tokenOut
                (tlp.token0_address = fh.intermediate_token AND tlp.token1_address = ?)
                OR (tlp.token1_address = fh.intermediate_token AND tlp.token0_address = ?)
            )
            AND tlp.liquidity_usd > ?
        ORDER BY avg_liquidity DESC  -- 关键：按平均流动性排序
        LIMIT 20
    `
    
    rows, err := bot.db.Query(query,
        tokenIn, chainID, tokenIn, tokenIn, minLiquidity,  -- 第一跳参数
        chainID, tokenOut, tokenOut, minLiquidity,          -- 第二跳参数
    )
    
    // 构建路由对象
    for rows.Next() {
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
```

**关键点**：
1. 使用 CTE 分两步查询
2. 第一步找出所有可能的中间代币
3. 第二步 JOIN 找出能到达目标的第二跳
4. 计算平均流动性作为排序依据
5. 过滤低流动性池子（性能优化）

---

## 实际案例分析

### 案例 1: WETH → DAI

```
查询参数:
- Chain ID: 1 (Ethereum)
- Token In: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 (WETH)
- Token Out: 0x6B175474E89094C44Da98b954EedeAC495271d0F (DAI)
- Min Liquidity: $50,000

找到的路径:

路径 1: WETH → USDT → DAI ⭐ (推荐)
├─ 第一跳: WETH/USDT
│  ├─ 池子: 0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852
│  ├─ DEX: Uniswap V2
│  ├─ 流动性: $432,000,000
│  └─ 手续费: 0.3%
│
└─ 第二跳: USDT/DAI
   ├─ 池子: 0x60594a405d53811d3BC4766596EFD80fd545A270
   ├─ DEX: Uniswap V2
   ├─ 流动性: $136,000,000
   └─ 手续费: 0.3%

平均流动性: $284,000,000
总手续费: 0.599%
瓶颈流动性: $136,000,000

路径 2: WETH → USDC → DAI
├─ 第一跳: WETH/USDC  ($360,000,000)
└─ 第二跳: USDC/DAI   ($84,000,000)
平均流动性: $222,000,000
总手续费: 0.599%

路径 3: WETH → USDC → DAI (另一个池子)
├─ 第一跳: WETH/USDC  ($360,000,000)
└─ 第二跳: USDC/DAI   ($10,000,000)
平均流动性: $185,000,000
总手续费: 0.599%

选择路径 1 的原因:
✅ 平均流动性最高
✅ 瓶颈流动性也最高
✅ 价格滑点最小
```

### 案例 2: 为什么有时直接路由更好？

```
场景: WETH → USDC

选项 A: 直接路由 (WETH → USDC)
├─ 流动性: $360,000,000
├─ 手续费: 0.3%
└─ Gas: ~150,000

选项 B: 两跳路由 (WETH → USDT → USDC)
├─ 平均流动性: $284,000,000
├─ 手续费: 0.599%
└─ Gas: ~300,000

结论: 选择选项 A
原因:
✅ 手续费更低 (0.3% vs 0.599%)
✅ Gas 费用更低 (省 50%)
✅ 流动性足够高
✅ 滑点更小
```

---

## 高级优化技巧

### 1. 动态路由（根据交易金额）

```go
func FindBestRoute(tokenIn, tokenOut string, amountIn *big.Int) Route {
    // 小额交易：优先考虑手续费
    if amountIn.Cmp(big.NewInt(1e18)) < 0 {  // < 1 ETH
        return findLowestFeeRoute(tokenIn, tokenOut)
    }
    
    // 大额交易：优先考虑流动性深度
    if amountIn.Cmp(big.NewInt(100e18)) > 0 {  // > 100 ETH
        return findHighestLiquidityRoute(tokenIn, tokenOut)
    }
    
    // 中等交易：平衡考虑
    return findBalancedRoute(tokenIn, tokenOut, amountIn)
}
```

### 2. 智能聚合（Split Routing）

```
将大额订单拆分到多个路径:

输入: 100 ETH
路径分配:
├─ 路径 1 (WETH → USDC): 40 ETH (40%)
├─ 路径 2 (WETH → USDT → USDC): 35 ETH (35%)
└─ 路径 3 (WETH → DAI → USDC): 25 ETH (25%)

好处:
- 降低单一路径的滑点
- 获得更好的平均价格
- 分散风险
```

### 3. 考虑 DEX 特性

```
不同 DEX 的特点:

Uniswap V2:
- 手续费: 0.3%
- 流动性: 高
- Gas: 中等

Uniswap V3:
- 手续费: 0.05%, 0.3%, 1%（分档）
- 流动性: 集中流动性，资金效率高
- Gas: 较高

PancakeSwap V2:
- 手续费: 0.25%
- 流动性: 高（BSC 链）
- Gas: 低（BSC gas 便宜）
```

---

## 总结

### 核心要点

1. **AMM 公式是基础**
   - 恒定乘积公式决定了价格和输出
   - 手续费影响实际输出

2. **多跳路由解决流动性问题**
   - 通过中间代币连接不同市场
   - 权衡手续费和流动性

3. **路径搜索需要优化**
   - 使用数据库索引加速查询
   - 设置最小流动性阈值剪枝
   - 限制搜索深度（一般 2-3 跳）

4. **最优路径是多因素权衡**
   - 流动性深度
   - 手续费成本
   - Gas 费用
   - 价格滑点

5. **实际应用需要动态调整**
   - 根据交易金额选择策略
   - 考虑网络拥堵状况
   - 监控池子状态变化

### 下一步学习

1. 实现三跳及以上的路由
2. 添加 Uniswap V3 的集中流动性支持
3. 实现智能订单拆分（Split Routing）
4. 添加 MEV 保护机制
5. 实现实时价格预言机

---

## 参考资料

- [Uniswap V2 白皮书](https://uniswap.org/whitepaper.pdf)
- [恒定乘积做市商数学原理](https://docs.uniswap.org/contracts/v2/concepts/protocol-overview/how-uniswap-works)
- [最优路由算法研究](https://arxiv.org/abs/2106.00083)



