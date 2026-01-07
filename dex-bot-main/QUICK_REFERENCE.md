# DEX 路由算法快速参考卡片

## 🔑 核心公式

### 恒定乘积公式 (Uniswap V2)
```
输出 = (储备Y × 输入 × (1 - 手续费)) / (储备X + 输入 × (1 - 手续费))

示例:
- 池子: 75,000 WETH / 180,000,000 USDC
- 输入: 10 WETH
- 手续费: 0.3%
- 输出 = (180,000,000 × 10 × 0.997) / (75,000 + 10 × 0.997)
       ≈ 23,925 USDC
```

### 多跳总手续费
```
两跳: fee_total = 1 - (1 - fee₁) × (1 - fee₂)
            = 1 - (1 - 0.003) × (1 - 0.003)
            ≈ 0.5991% (约 0.6%)

三跳: fee_total = 1 - (1 - 0.003)³
            ≈ 0.8973% (约 0.9%)
```

---

## 📊 路径类型对比

| 类型 | 跳数 | 手续费 | Gas费 | 适用场景 |
|------|------|--------|-------|---------|
| 直接路由 | 1 | 0.3% | ~150k | 小额交易，有直接池子 |
| 两跳路由 | 2 | 0.6% | ~300k | 没有直接池子，中等金额 |
| 三跳路由 | 3 | 0.9% | ~450k | 稀有交易对，复杂路径 |
| 多路径拆分 | 混合 | 混合 | 最高 | 大额交易，降低滑点 |

---

## 🎯 最优路径选择标准

### 评分权重
```
综合得分 = 流动性得分 × 40% 
         + 手续费得分 × 30% 
         + 价格得分 × 30%
```

### 优先级规则
1. **小额交易** (< 1 ETH): 手续费 > 流动性 > 价格
2. **中额交易** (1-100 ETH): 流动性 = 手续费 = 价格
3. **大额交易** (> 100 ETH): 流动性 > 价格 > 手续费

---

## 💰 价格滑点参考

| 交易占比 | 预期滑点 | 建议策略 |
|----------|----------|----------|
| < 0.01% | < 0.1% | ✅ 直接交易 |
| 0.01-0.1% | 0.1-0.5% | ✅ 可接受 |
| 0.1-1% | 0.5-2% | ⚠️ 考虑拆分 |
| > 1% | > 2% | ❌ 必须拆分 |

*交易占比 = 交易金额 / 池子流动性*

---

## 🔍 SQL 查询模式

### 查找直接路由
```sql
SELECT pool_address, liquidity_usd, fee_rate
FROM token_liquidity_pools
WHERE chain_id = ? 
  AND (token0_address = ? AND token1_address = ?)
  AND is_active = 1
ORDER BY liquidity_usd DESC;
```

### 查找两跳路由
```sql
WITH first_hop AS (
  SELECT intermediate_token, pool1, liquidity1
  FROM pools WHERE token = 'A'
)
SELECT * FROM first_hop
JOIN pools ON token = intermediate_token
WHERE target_token = 'B'
ORDER BY avg_liquidity DESC;
```

---

## ⚡ 性能优化技巧

### 1. 数据库索引
```sql
CREATE INDEX idx_token0_chain ON pools(token0, chain_id);
CREATE INDEX idx_token1_chain ON pools(token1, chain_id);
CREATE INDEX idx_liquidity ON pools(liquidity DESC);
```

### 2. 查询剪枝
```
最小流动性阈值:
- 以太坊: $10,000
- BSC: $5,000
- 测试网: $1,000

最大返回数量:
- 直接路由: 10 条
- 两跳路由: 20 条
- 三跳路由: 30 条
```

### 3. 缓存策略
```
缓存层级:
1. 热门交易对: 5秒
2. 普通交易对: 30秒
3. 冷门交易对: 5分钟
```

---

## 🛡️ 风险控制

### 滑点保护
```go
minOutput := expectedOutput * (1 - maxSlippage)

if actualOutput < minOutput {
    return error("滑点超过限制")
}
```

### 流动性检查
```go
if poolLiquidity < minLiquidity {
    return error("流动性不足")
}

if tradeAmount / poolLiquidity > 0.01 {
    warning("交易量过大，建议拆分")
}
```

---

## 📈 实战案例

### 案例 1: WETH → USDC (有直接池)
```
✅ 选择: 直接路由
原因: 流动性充足($360M)，手续费最低(0.3%)
结果: 10 WETH → 23,925 USDC
```

### 案例 2: WETH → DAI (无直接池)
```
✅ 选择: WETH → USDT → DAI
原因: 
- 路径流动性: $432M → $136M (瓶颈$136M)
- 总手续费: 0.6%
- 比其他路径输出多 0.5%
```

### 案例 3: 大额交易 1000 ETH → USDC
```
✅ 选择: 多路径拆分
- 路径1: 400 ETH (直接)
- 路径2: 350 ETH (通过USDT)
- 路径3: 250 ETH (通过DAI)
结果: 总滑点从 1.5% 降到 0.6%
```

---

## 🔧 常用代码片段

### 计算输出金额
```go
func CalcOutput(amountIn, reserveIn, reserveOut *big.Int, fee float64) *big.Int {
    amountInWithFee := amountIn * (1 - fee)
    numerator := amountInWithFee * reserveOut
    denominator := reserveIn + amountInWithFee
    return numerator / denominator
}
```

### 计算总手续费
```go
func CalcTotalFee(fees []float64) float64 {
    totalFee := 1.0
    for _, fee := range fees {
        totalFee *= (1 - fee)
    }
    return 1 - totalFee
}
```

### 选择最优路径
```go
func SelectBestRoute(routes []Route, amount *big.Int) Route {
    bestScore := 0.0
    var bestRoute Route
    
    for _, route := range routes {
        score := EvaluateRoute(route, amount)
        if score > bestScore {
            bestScore = score
            bestRoute = route
        }
    }
    
    return bestRoute
}
```

---

## 📚 文档导航

- 📖 **详细原理**: `ROUTING_ALGORITHM.md`
- 🎨 **可视化指南**: `ROUTING_VISUAL_GUIDE.md`
- 💻 **代码示例**: `examples/routing_example.go`
- 🔧 **API 实现**: `api/bot.go`

---

## ⚠️ 注意事项

1. ✅ 始终设置滑点保护
2. ✅ 大额交易前先模拟计算
3. ✅ 监控池子流动性变化
4. ✅ 考虑 Gas 费用成本
5. ⚠️ 注意 MEV（矿工可提取价值）攻击
6. ⚠️ 警惕闪电贷攻击风险
7. ❌ 不要在流动性不足时强行交易
8. ❌ 不要忽略手续费累积效应

---

**最后更新**: 2025-12-03
**适用版本**: Uniswap V2, PancakeSwap V2

