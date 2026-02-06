# Quote API 使用说明

## 概述

Quote API 用于计算代币交换的报价，基于 Uniswap V3 的集中流动性模型，支持跨多个 tick 区间的精确计算。API 从 PostgreSQL 数据库读取池子信息和 tick 流动性分布，实现准确的报价计算。

## 数据库配置

API 会从 `../sync/config.yaml` 读取 PostgreSQL 数据库配置：

```yaml
Database:
  Host: localhost
  Port: 5432
  User: postgres
  Password: 233333@Zj
  Name: postgres
```

## 启动服务

```bash
# 使用 PostgreSQL（从配置文件读取）
go run main.go -config ../sync/config.yaml
```

## API 端点

### POST /api/v1/quote

获取交易报价（Uniswap V3 模型）。

**请求体：**
```json
{
  "tokenIn": "0x...",
  "tokenOut": "0x...",
  "amountIn": "1000000000000000000",
  "poolAddress": "0x..."  // 可选：指定池子地址
}
```

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "amountOut": "950000000000000000",
    "amountIn": "1000000000000000000",
    "poolAddress": "0x...",
    "priceImpact": 2.5,
    "newSqrtPriceX96": "2018382873588440326581633304624437",
    "newTick": 202919,
    "initialPrice": "1539300000000000000",
    "finalPrice": "1578000000000000000",
    "crossedTicks": 3,
    "success": true,
    "simulated": true
  }
}
```

## 计算逻辑

API 使用 Uniswap V3 的集中流动性模型进行计算：

1. **池子查找**：从 PostgreSQL `pools` 表查找最佳池子（按流动性排序），或使用指定的池子地址
2. **获取池子状态**：读取池子的当前价格（`sqrt_price_x96`）、流动性（`liquidity`）、当前 tick 等信息
3. **Tick 流动性查询**：从 `ticks` 表查询相关 tick 区间的流动性分布（`liquidity_net`）
4. **跨 Tick 计算**：
   - 模拟交易过程，逐 tick 区间计算
   - 在每个 tick 区间内使用该区间的流动性进行计算
   - 当价格跨越 tick 时，更新流动性（根据 `liquidity_net`）
   - 累积所有区间的输出量
5. **手续费处理**：从池子的 `fee` 字段读取手续费率（以基点为单位），在输入金额中扣除
6. **价格影响计算**：计算交易前后的价格变化，返回价格影响百分比

## 响应字段说明

- `amountOut`: 输出代币数量（字符串格式的大数）
- `amountIn`: 输入代币数量（与请求中的相同）
- `poolAddress`: 使用的池子地址
- `priceImpact`: 价格影响百分比（正数表示价格上涨，负数表示价格下跌）
- `newSqrtPriceX96`: 交易后的价格平方根（Q96 格式）
- `newTick`: 交易后的 tick 值
- `initialPrice`: 交易前的价格（考虑代币精度）
- `finalPrice`: 交易后的价格（考虑代币精度）
- `crossedTicks`: 交易过程中跨越的 tick 数量
- `success`: 计算是否成功
- `simulated`: 是否为模拟计算（始终为 true）

## 注意事项

- `amountIn` 应该是字符串格式的大数（wei 单位）
- `amountOut` 返回的也是字符串格式的大数
- 如果找不到交易对池子，返回 404 错误
- 如果池子没有流动性或价格为 0，返回 400 错误
- 如果交易量过大，可能跨越多个 tick 区间，计算时间会相应增加
- 价格影响超过 5% 的交易建议用户谨慎执行

## 技术细节

### Tick 和价格的关系

- 价格公式：`price = 1.0001^tick`
- sqrtPriceX96：`sqrtPriceX96 = sqrt(price) * 2^96`
- Tick spacing：根据手续费率确定
  - 0.01% fee → tick-spacing = 1
  - 0.05% fee → tick-spacing = 10
  - 0.3% fee → tick-spacing = 60
  - 1% fee → tick-spacing = 200

### 流动性计算

- 每个 tick 区间有独立的流动性值 L
- 当价格跨越 tick 时，流动性会根据 `liquidity_net` 更新
- `liquidity_net` 为正表示价格向上移动时流动性增加
- `liquidity_net` 为负表示价格向上移动时流动性减少

### 单 Tick 区间内的计算

在单个 tick 区间内，仍然使用类似 x*y=k 的公式：
- zeroForOne (token0 → token1): `amountOut = L * (sqrt(P_current) - sqrt(P_target)) / Q96`
- oneForZero (token1 → token0): `amountIn = L * (sqrt(P_target) - sqrt(P_current)) / Q96`

