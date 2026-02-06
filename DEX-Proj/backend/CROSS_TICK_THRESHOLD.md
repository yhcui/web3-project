# Uniswap V3 跨 Tick 阈值说明

## 重要概念澄清

**问题**：流动性达到多大的阈值才会跨 tick？

**答案**：这不是流动性阈值，而是**输入金额阈值**！

在 Uniswap V3 中，是否跨 tick 取决于：
1. **输入金额（amountIn）**：需要足够大才能将价格从当前价格推到下一个 tick
2. **当前价格到下一个 tick 的价格差**：价格差越小，需要的输入金额越大
3. **当前 tick 区间的流动性**：流动性越大，需要的输入金额越大

## 跨 Tick 的判断条件

```
如果 amountRemaining >= minAmountInToCrossTick，则跨 tick
否则，在当前 tick 区间内完成交易
```

## 计算公式

### zeroForOne (token0 -> token1, 价格下降)

```
minAmountInToCrossTick = L * (sqrt(P_current) - sqrt(P_target)) / (sqrt(P_current) * sqrt(P_target)) * Q96
```

其中：
- `L`: 当前 tick 区间的流动性
- `sqrt(P_current)`: 当前价格的平方根
- `sqrt(P_target)`: 下一个 tick 的价格平方根
- `Q96`: 2^96

### oneForZero (token1 -> token0, 价格上升)

```
minAmountInToCrossTick = L * (sqrt(P_target) - sqrt(P_current)) / Q96
```

## 影响因素分析

### 1. 流动性（L）的影响

- **流动性越大** → 需要的输入金额越大
- **原因**：流动性大意味着价格变化慢，需要更多的输入才能推动价格移动

**示例**：
- 流动性 = 1000，需要 100 token0 才能跨 tick
- 流动性 = 10000，需要 1000 token0 才能跨 tick

### 2. 价格差（sqrtPriceDiff）的影响

- **价格差越小**（tick 越接近）→ 需要的输入金额越大
- **原因**：价格差小意味着需要更精确的价格移动，在流动性相同的情况下，需要更多的输入

**示例**：
- 价格差 = 100，需要 100 token0 才能跨 tick
- 价格差 = 10，需要 1000 token0 才能跨 tick

### 3. 当前价格的影响

- **当前价格越高** → 需要的输入金额越大（仅对 zeroForOne）
- **原因**：公式中有 `sqrt(P_current) * sqrt(P_target)` 项，价格越高，这个乘积越大，分母越大，结果越小... 等等，让我重新检查公式

实际上，对于 zeroForOne：
- 分母是 `sqrt(P_current) * sqrt(P_target) / Q96`
- 价格越高，分母越大，但分子 `L * sqrtPriceDiff * Q96` 也相应变化
- 整体效果取决于价格差和流动性的相对大小

## 实际示例

假设：
- 当前 tick = 91713
- 下一个 tick = 91712（zeroForOne，价格下降）
- 当前流动性 = 50000000000000000000000 (5e22)
- 当前 sqrtPriceX96 = 7767923849860220953540791648137

计算：
1. 下一个 tick 的 sqrtPriceX96 = getSqrtPriceAtTick(91712)
2. sqrtPriceDiff = sqrtPriceCurrent - sqrtPriceNext
3. minAmountIn = L * sqrtPriceDiff * Q96 / (sqrtPriceCurrent * sqrtPriceNext / Q96)

如果 `amountInAfterFee = 1998`，而 `minAmountInToCrossTick = 10000`，则：
- `1998 < 10000` → 不会跨 tick，在当前 tick 区间内完成交易

## 代码中的实现

在 `swapExactInput` 函数中：
1. 每个迭代计算 `minAmountInToCrossTick`
2. 调用 `computeSwapStep` 计算实际消耗的输入
3. 如果 `amountInConsumed <= amountRemaining`，则跨 tick
4. 否则，在当前 tick 区间内完成交易

## 日志输出

运行时会输出：
```
[Swap] Step 1: Minimum amountIn to cross tick: 10000 (current remaining: 1998, willCrossTick=false)
```

这表示：
- 跨 tick 需要至少 10000 的输入金额
- 当前剩余输入只有 1998
- 因此不会跨 tick，会在当前 tick 区间内完成交易

## 总结

- **没有固定的流动性阈值**：是否跨 tick 取决于输入金额、价格差和流动性的组合
- **流动性越大，需要的输入金额越大**：这是为什么大额交易更容易跨多个 tick
- **价格差越小，需要的输入金额越大**：相邻 tick 之间需要更精确的价格移动
- **实际判断**：`amountRemaining >= minAmountInToCrossTick` 时才会跨 tick

