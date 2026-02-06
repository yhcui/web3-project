package api

import (
	"database/sql"
	"fmt"
	"log"
	"math"
	"math/big"
	"strings"
)

// Quote Quote 计算器
type Quote struct {
	db *sql.DB
}

// NewQuote 创建新的 Quote 实例
func NewQuote(db *sql.DB) *Quote {
	return &Quote{db: db}
}

// TickInfo tick 信息
type TickInfo struct {
	TickIndex      int64
	LiquidityGross *big.Int
	LiquidityNet   *big.Int
}

// QuoteResult Quote 计算结果
type QuoteResult struct {
	AmountOut       string  `json:"amountOut"`       // 输出金额
	AmountIn        string  `json:"amountIn"`        // 输入金额
	PriceImpact     float64 `json:"priceImpact"`     // 价格影响百分比
	NewSqrtPriceX96 string  `json:"newSqrtPriceX96"` // 交易后的价格
	NewTick         int64   `json:"newTick"`         // 交易后的tick
	InitialPrice    string  `json:"initialPrice"`    // 初始价格
	FinalPrice      string  `json:"finalPrice"`      // 最终价格
	CrossedTicks    int     `json:"crossedTicks"`    // 跨越的tick数量
}

// PoolState 池子状态
type PoolState struct {
	Address      string
	Token0       string
	Token1       string
	Fee          int64
	Liquidity    *big.Int
	SqrtPriceX96 *big.Int
	Tick         int64
	Reserve0     *big.Int
	Reserve1     *big.Int
}

// GetPoolState 从数据库获取池子状态
func (q *Quote) GetPoolState(poolAddress string) (*PoolState, error) {
	query := `
		SELECT address, token0, token1, fee, liquidity, sqrt_price_x96, tick, reserve0, reserve1
		FROM pools
		WHERE address = $1
	`

	var state PoolState
	var token0, token1 string
	var liquidity, sqrtPriceX96, reserve0, reserve1 sql.NullString
	var tick sql.NullInt64

	err := q.db.QueryRow(query, poolAddress).Scan(
		&state.Address, &token0, &token1, &state.Fee,
		&liquidity, &sqrtPriceX96, &tick, &reserve0, &reserve1,
	)
	if err != nil {
		return nil, err
	}

	state.Token0 = token0
	state.Token1 = token1

	// 解析流动性
	if liquidity.Valid && liquidity.String != "" {
		state.Liquidity, _ = new(big.Int).SetString(liquidity.String, 10)
	} else {
		state.Liquidity = big.NewInt(0)
	}

	// 解析价格
	if sqrtPriceX96.Valid && sqrtPriceX96.String != "" {
		state.SqrtPriceX96, _ = new(big.Int).SetString(sqrtPriceX96.String, 10)
	} else {
		return nil, fmt.Errorf("池子价格未初始化")
	}

	// 解析tick
	if tick.Valid {
		state.Tick = tick.Int64
	}

	// 解析储备
	if reserve0.Valid && reserve0.String != "" {
		state.Reserve0, _ = new(big.Int).SetString(reserve0.String, 10)
	} else {
		state.Reserve0 = big.NewInt(0)
	}
	if reserve1.Valid && reserve1.String != "" {
		state.Reserve1, _ = new(big.Int).SetString(reserve1.String, 10)
	} else {
		state.Reserve1 = big.NewInt(0)
	}

	return &state, nil
}

// GetTicksInRange 获取指定tick范围内的所有tick信息
func (q *Quote) GetTicksInRange(poolAddress string, tickLower, tickUpper int64) ([]TickInfo, error) {
	query := `
		SELECT tick_index, liquidity_gross, liquidity_net
		FROM ticks
		WHERE pool_address = $1 AND tick_index >= $2 AND tick_index <= $3
		ORDER BY tick_index ASC
	`

	rows, err := q.db.Query(query, poolAddress, tickLower, tickUpper)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ticks []TickInfo
	for rows.Next() {
		var tick TickInfo
		var liquidityGross, liquidityNet sql.NullString

		err := rows.Scan(&tick.TickIndex, &liquidityGross, &liquidityNet)
		if err != nil {
			continue
		}

		if liquidityGross.Valid && liquidityGross.String != "" {
			tick.LiquidityGross, _ = new(big.Int).SetString(liquidityGross.String, 10)
		} else {
			tick.LiquidityGross = big.NewInt(0)
		}

		if liquidityNet.Valid && liquidityNet.String != "" {
			tick.LiquidityNet, _ = new(big.Int).SetString(liquidityNet.String, 10)
		} else {
			tick.LiquidityNet = big.NewInt(0)
		}

		ticks = append(ticks, tick)
	}

	return ticks, nil
}

// CalculateQuoteV3 使用Uniswap V3模型计算Quote（支持跨多个tick区间）
func (q *Quote) CalculateQuoteV3(poolAddress, tokenIn, amountIn string) (*QuoteResult, error) {
	// 获取池子状态
	poolState, err := q.GetPoolState(poolAddress)
	if err != nil {
		return nil, fmt.Errorf("获取池子状态失败: %w", err)
	}

	// 检查池子状态
	if poolState.Liquidity.Cmp(big.NewInt(0)) == 0 {
		return nil, fmt.Errorf("池子流动性为0，无法进行交易")
	}
	if poolState.SqrtPriceX96.Cmp(big.NewInt(0)) == 0 {
		return nil, fmt.Errorf("池子价格为0，无法进行交易")
	}

	log.Printf("[Quote] Pool State: Address=%s, Token0=%s, Token1=%s, Fee=%d, Liquidity=%s, SqrtPriceX96=%s, Tick=%d",
		poolState.Address, poolState.Token0, poolState.Token1, poolState.Fee,
		poolState.Liquidity.String(), poolState.SqrtPriceX96.String(), poolState.Tick)

	// 解析输入金额
	amountInBig, ok := new(big.Int).SetString(amountIn, 10)
	if !ok {
		return nil, fmt.Errorf("无效的输入金额: %s", amountIn)
	}

	if amountInBig.Cmp(big.NewInt(0)) <= 0 {
		return nil, fmt.Errorf("输入金额必须大于0")
	}

	log.Printf("[Quote] Input: tokenIn=%s, amountIn=%s", tokenIn, amountIn)

	// 判断交易方向
	tokenInLower := strings.ToLower(tokenIn)
	token0Lower := strings.ToLower(poolState.Token0)
	isToken0 := tokenInLower == token0Lower

	log.Printf("[Quote] Trade Direction: isToken0=%v (tokenIn=%s, poolState.Token0=%s)", isToken0, tokenIn, poolState.Token0)

	// 计算手续费后的输入金额
	// fee 是基点，例如 3000 表示 0.3% = 3000/1000000
	feeMultiplier := new(big.Int).Sub(big.NewInt(1000000), big.NewInt(poolState.Fee))
	amountInAfterFee := new(big.Int).Mul(amountInBig, feeMultiplier)
	amountInAfterFee.Div(amountInAfterFee, big.NewInt(1000000))

	if amountInAfterFee.Cmp(big.NewInt(0)) <= 0 {
		return nil, fmt.Errorf("手续费扣除后输入金额为0或负数: amountIn=%s, fee=%d, amountInAfterFee=%s",
			amountIn, poolState.Fee, amountInAfterFee.String())
	}

	log.Printf("[Quote] After Fee: amountInAfterFee=%s (fee=%d)", amountInAfterFee.String(), poolState.Fee)

	// 计算初始价格（用于计算价格影响）
	initialPrice := q.sqrtPriceX96ToPrice(poolState.SqrtPriceX96, isToken0)

	// 执行swap计算
	result, err := q.swapExactInput(
		poolState,
		amountInAfterFee,
		isToken0,
	)
	if err != nil {
		return nil, fmt.Errorf("swap计算失败: %w", err)
	}

	log.Printf("[Quote] Swap Result: amountOut=%s, newTick=%d, crossedTicks=%d",
		result.AmountOut.String(), result.NewTick, result.CrossedTicks)

	if result.AmountOut.Cmp(big.NewInt(0)) == 0 {
		log.Printf("[Quote] WARNING: amountOut is 0! Pool liquidity might be insufficient or calculation error.")
	}

	// 计算最终价格
	finalPrice := q.sqrtPriceX96ToPrice(result.NewSqrtPriceX96, isToken0)

	// 计算价格影响
	priceImpact := 0.0
	if initialPrice.Cmp(big.NewInt(0)) > 0 {
		priceDiff := new(big.Int).Sub(finalPrice, initialPrice)
		priceImpactFloat := new(big.Float).SetInt(priceDiff)
		initialPriceFloat := new(big.Float).SetInt(initialPrice)
		priceImpactFloat.Quo(priceImpactFloat, initialPriceFloat)
		priceImpactFloat.Mul(priceImpactFloat, big.NewFloat(100))
		priceImpact, _ = priceImpactFloat.Float64()
	}

	return &QuoteResult{
		AmountOut:       result.AmountOut.String(),
		AmountIn:        amountIn,
		PriceImpact:     priceImpact,
		NewSqrtPriceX96: result.NewSqrtPriceX96.String(),
		NewTick:         result.NewTick,
		InitialPrice:    initialPrice.String(),
		FinalPrice:      finalPrice.String(),
		CrossedTicks:    result.CrossedTicks,
	}, nil
}

// SwapResult swap计算结果
type SwapResult struct {
	AmountOut       *big.Int
	NewSqrtPriceX96 *big.Int
	NewTick         int64
	CrossedTicks    int
}

// swapExactInput 执行精确输入的swap计算
// Uniswap V3 的核心机制：将一笔交易拆分成多个步骤，每个步骤在一个tick区间内完成
//
// 工作流程：
// 1. 确定当前价格所在的tick区间
// 2. 计算在当前流动性下，能消耗多少输入（或能到达哪个tick）
// 3. 如果输入量足以跨越到下一个tick：
//   - 消耗部分输入，到达下一个tick
//   - 更新流动性（根据liquidity_net）
//   - 继续下一个tick区间的计算
//
// 4. 如果输入量不足以跨越tick：
//   - 在当前tick区间内完成交易
//   - 计算实际到达的价格和输出量
//
// 5. 累积所有tick区间的输出量，得到最终结果
//
// 重要说明：
// - amountOut（最终报价）是多个tick区间累加的结果：amountOut = sum(amountOutFromTick_i)
// - 价格不是累加的，而是逐步更新的：
//   - 跨tick时：price = 1.0001^nextTick（固定价格点）
//   - 不跨tick时：price = 根据公式计算出的中间价格
//
// - 每个tick区间内的计算是独立的，使用该区间的流动性
func (q *Quote) swapExactInput(
	poolState *PoolState,
	amountInAfterFee *big.Int,
	zeroForOne bool, // true: token0 -> token1, false: token1 -> token0
) (*SwapResult, error) {
	Q96 := new(big.Int).Exp(big.NewInt(2), big.NewInt(96), nil)

	currentSqrtPriceX96 := new(big.Int).Set(poolState.SqrtPriceX96)
	currentLiquidity := new(big.Int).Set(poolState.Liquidity)
	currentTick := poolState.Tick

	amountOut := big.NewInt(0)
	amountRemaining := new(big.Int).Set(amountInAfterFee)
	crossedTicks := 0

	log.Printf("[Swap] Start: currentSqrtPriceX96=%s, currentLiquidity=%s, currentTick=%d, amountInAfterFee=%s, zeroForOne=%v",
		currentSqrtPriceX96.String(), currentLiquidity.String(), currentTick, amountInAfterFee.String(), zeroForOne)

	// 确定价格移动方向
	// zeroForOne: 价格下降，tick减小
	// oneForZero: 价格上升，tick增大
	tickDirection := int64(1)
	if zeroForOne {
		tickDirection = -1
	}

	// 计算tick spacing（根据手续费等级）
	// Tick spacing决定了哪些tick可以初始化流动性
	tickSpacing := int64(1)
	if poolState.Fee == 100 { // 0.01%
		tickSpacing = 1
	} else if poolState.Fee == 500 { // 0.05%
		tickSpacing = 10
	} else if poolState.Fee == 3000 { // 0.3%
		tickSpacing = 60
	} else if poolState.Fee == 10000 { // 1%
		tickSpacing = 200
	}

	// 循环处理：将交易拆分成多个tick区间的步骤
	// 每个迭代处理一个tick区间，直到消耗完所有输入
	maxIterations := 1000 // 防止无限循环
	iterations := 0

	for amountRemaining.Cmp(big.NewInt(0)) > 0 && iterations < maxIterations {
		iterations++

		// 步骤1：找到下一个有流动性的tick（这是tick区间的边界）
		// 如果当前tick区间内没有更多流动性，会找到下一个已初始化的tick
		nextTick := q.getNextInitializedTick(
			poolState.Address,
			currentTick,
			tickDirection,
			tickSpacing,
		)

		// 步骤2：计算下一个tick对应的价格（这是当前区间的目标价格）
		var sqrtPriceNextX96 *big.Int
		if zeroForOne {
			// 价格下降：下一个tick的价格更低
			sqrtPriceNextX96 = q.getSqrtPriceAtTick(nextTick)
		} else {
			// 价格上升：下一个tick的价格更高
			sqrtPriceNextX96 = q.getSqrtPriceAtTick(nextTick + tickSpacing)
		}

		// 计算跨 tick 所需的最小输入金额（阈值）
		// 注意：这不是流动性阈值，而是输入金额阈值
		// 跨 tick 的条件：amountRemaining >= minAmountInToCrossTick
		//
		// 影响因素：
		// 1. 流动性越大，需要的输入金额越大（流动性大 = 价格变化慢）
		// 2. 价格差越小（tick 越接近），需要的输入金额越大（需要更精确的价格移动）
		// 3. 当前价格越高，需要的输入金额越大（因为公式中有 sqrt(P_current) * sqrt(P_target)）
		minAmountInToCrossTick := q.calculateMinAmountInToCrossTick(
			currentSqrtPriceX96,
			sqrtPriceNextX96,
			currentLiquidity,
			zeroForOne,
		)

		log.Printf("[Swap] Step %d: currentTick=%d, nextTick=%d, currentSqrtPriceX96=%s, sqrtPriceNextX96=%s, currentLiquidity=%s, amountRemaining=%s",
			iterations, currentTick, nextTick, currentSqrtPriceX96.String(), sqrtPriceNextX96.String(), currentLiquidity.String(), amountRemaining.String())
		log.Printf("[Swap] Step %d: Minimum amountIn to cross tick: %s (current remaining: %s, willCrossTick=%v)",
			iterations, minAmountInToCrossTick.String(), amountRemaining.String(), amountRemaining.Cmp(minAmountInToCrossTick) >= 0)

		// 步骤3：在当前tick区间内计算swap步骤
		// computeSwapStep 会计算：
		// - 在当前流动性下，能消耗多少输入（amountInConsumed）
		// - 能产生多少输出（amountOutFromTick）
		// - 是否能到达下一个tick（reachedNextTick）
		var amountInConsumed, amountOutFromTick *big.Int
		var reachedNextTick bool

		amountInConsumed, amountOutFromTick, reachedNextTick = q.computeSwapStep(
			currentSqrtPriceX96,
			sqrtPriceNextX96,
			currentLiquidity,
			amountRemaining,
			zeroForOne,
		)

		log.Printf("[Swap] Step %d result: amountInConsumed=%s, amountOutFromTick=%s, reachedNextTick=%v",
			iterations, amountInConsumed.String(), amountOutFromTick.String(), reachedNextTick)

		// 步骤4：累积输出量，更新剩余输入量
		// 重要：最终的 amountOut 是多个 tick 区间累加的结果
		// 每个 tick 区间产生的 amountOutFromTick 都会被累加到总输出量中
		amountOut.Add(amountOut, amountOutFromTick)
		amountRemaining.Sub(amountRemaining, amountInConsumed)

		log.Printf("[Swap] Step %d accumulated: totalAmountOut=%s (added %s from this tick), remainingInput=%s",
			iterations, amountOut.String(), amountOutFromTick.String(), amountRemaining.String())

		if reachedNextTick {
			// 情况A：成功跨越到下一个tick
			// 这意味着当前tick区间的流动性已经全部消耗，价格移动到了下一个tick
			//
			// 价格更新机制：
			// - 当跨 tick 时，价格直接设置为下一个 tick 的价格（不是累加！）
			// - 这是因为每个 tick 代表一个固定的价格点：price = 1.0001^tick
			// - 跨 tick 意味着价格已经移动到了这个固定的价格点
			oldSqrtPriceX96 := new(big.Int).Set(currentSqrtPriceX96)
			currentTick = nextTick
			currentSqrtPriceX96 = new(big.Int).Set(sqrtPriceNextX96)
			crossedTicks++

			log.Printf("[Swap] Crossed tick: price updated from %s to %s (tick %d -> %d)",
				oldSqrtPriceX96.String(), currentSqrtPriceX96.String(), currentTick-tickDirection, currentTick)

			log.Printf("[Swap] Crossed tick %d, new liquidity will be updated", currentTick)

			// 步骤5：更新流动性（这是V3的关键机制）
			//
			// 重要概念澄清：
			// 1. 定价区间（tick range）是固定的，由LP设置，不会因为交易而改变
			//    - LP在 [tick_lower, tick_upper] 区间提供流动性
			//    - 这个区间存储在 positions 表中，是固定的
			// 2. 当前活跃的流动性（active liquidity）会变化
			//    - 当价格跨过某个tick时，流动性会"激活"或"停用"
			//    - 这是通过 liquidity_net 实现的，不是改变定价区间
			// 3. 当前价格所在的区间会变化
			//    - 交易前：价格在 tick = 91713
			//    - 交易后：价格在 tick = 91711
			//    - 但定价区间本身没变，只是价格移动了
			//
			// liquidity_net 的含义：
			// - 当价格向上移动（tick增大）时，流动性的变化量
			// - 正值：表示有新的流动性区间被激活（价格进入该区间）
			// - 负值：表示有流动性区间被停用（价格离开该区间）
			tickInfo, err := q.getTickInfo(poolState.Address, currentTick)
			if err == nil && tickInfo != nil {
				// 更新流动性：liquidity_net表示价格向上移动时的变化
				oldLiquidity := new(big.Int).Set(currentLiquidity)
				if zeroForOne {
					// 价格下降（tick减小）：流动性减少
					// 原因：价格向下移动，离开了一些流动性区间
					// liquidity_net 是负数，所以减去它实际上是减少流动性
					currentLiquidity.Sub(currentLiquidity, tickInfo.LiquidityNet)
				} else {
					// 价格上升（tick增大）：流动性增加
					// 原因：价格向上移动，进入了一些新的流动性区间
					// liquidity_net 是正数，所以加上它
					currentLiquidity.Add(currentLiquidity, tickInfo.LiquidityNet)
				}

				// 确保流动性不为负
				if currentLiquidity.Cmp(big.NewInt(0)) < 0 {
					currentLiquidity.SetInt64(0)
				}

				log.Printf("[Swap] Updated liquidity: %s -> %s (liquidity_net=%s, tick=%d)",
					oldLiquidity.String(), currentLiquidity.String(), tickInfo.LiquidityNet.String(), currentTick)
				log.Printf("[Swap] Note: Pricing intervals (tick ranges) are fixed by LPs, only active liquidity changes")
			} else {
				log.Printf("[Swap] No tick info found for tick %d, liquidity unchanged", currentTick)
			}

			// 继续下一个tick区间的计算（循环继续）
		} else {
			// 情况B：在当前tick区间内完成交易
			// 这意味着剩余输入量不足以跨越到下一个tick
			// 需要计算实际到达的价格（在currentSqrtPriceX96和sqrtPriceNextX96之间）
			//
			// 价格更新机制：
			// - 不能跨 tick 时，价格会移动到一个中间值（在 current 和 next 之间）
			// - 这个中间价格是根据实际消耗的输入量计算的
			// - 价格不是累加的，而是根据公式计算出的新价格
			oldSqrtPriceX96 := new(big.Int).Set(currentSqrtPriceX96)

			// computeSwapStep 已经计算了实际到达的价格（在函数内部）
			// 但我们需要从amountOut反推新价格，或者让computeSwapStep返回新价格
			// 这里使用简化的方法：根据amountOut计算价格变化
			if zeroForOne {
				// 价格下降：sqrt(P_new) = sqrt(P_current) - amountOut * Q96 / L
				if currentLiquidity.Cmp(big.NewInt(0)) > 0 {
					priceDiff := new(big.Int).Mul(amountOutFromTick, Q96)
					priceDiff.Div(priceDiff, currentLiquidity)
					currentSqrtPriceX96.Sub(currentSqrtPriceX96, priceDiff)
				}
			} else {
				// 价格上升：sqrt(P_new) = sqrt(P_current) + amountIn * Q96 / L
				if currentLiquidity.Cmp(big.NewInt(0)) > 0 {
					priceDiff := new(big.Int).Mul(amountInConsumed, Q96)
					priceDiff.Div(priceDiff, currentLiquidity)
					currentSqrtPriceX96.Add(currentSqrtPriceX96, priceDiff)
				}
			}

			log.Printf("[Swap] Completed within tick range: price updated from %s to %s (did not cross tick)",
				oldSqrtPriceX96.String(), currentSqrtPriceX96.String())
			break // 交易完成，退出循环
		}
	}

	// 计算新的tick（从新的价格反推）
	newTick := q.getTickAtSqrtPrice(currentSqrtPriceX96)

	log.Printf("[Swap] Final result: totalAmountOut=%s, finalSqrtPriceX96=%s, finalTick=%d, crossedTicks=%d",
		amountOut.String(), currentSqrtPriceX96.String(), newTick, crossedTicks)

	return &SwapResult{
		AmountOut:       amountOut,
		NewSqrtPriceX96: currentSqrtPriceX96,
		NewTick:         newTick,
		CrossedTicks:    crossedTicks,
	}, nil
}

// computeSwapStep 计算单个tick区间内的swap步骤
//
// 这是Uniswap V3交易拆分的核心函数：每个tick区间内的计算都在这里完成
//
// 输入参数：
//   - sqrtPriceCurrentX96: 当前价格的平方根（Q96格式）
//   - sqrtPriceTargetX96: 目标价格的平方根（通常是下一个tick的价格）
//   - liquidity: 当前tick区间的流动性
//   - amountRemaining: 剩余的输入量
//   - zeroForOne: 交易方向（true=token0->token1，价格下降）
//
// 返回值：
//   - amountInConsumed: 消耗的输入量
//   - amountOut: 产生的输出量
//   - reachedTarget: 是否到达目标价格（即是否跨越了tick）
//
// 基于Uniswap V3的公式：
// zeroForOne (token0 -> token1, 价格下降):
//
//	amountOut = L * (sqrt(P_current) - sqrt(P_target)) / Q96
//	amountIn = L * (sqrt(P_current) - sqrt(P_target)) / (sqrt(P_current) * sqrt(P_target)) * Q96
//
// oneForZero (token1 -> token0, 价格上升):
//
//	amountIn = L * (sqrt(P_target) - sqrt(P_current)) / Q96
//	amountOut = L * (sqrt(P_target) - sqrt(P_current)) / (sqrt(P_current) * sqrt(P_target)) * Q96
func (q *Quote) computeSwapStep(
	sqrtPriceCurrentX96 *big.Int,
	sqrtPriceTargetX96 *big.Int,
	liquidity *big.Int,
	amountRemaining *big.Int,
	zeroForOne bool,
) (amountInConsumed, amountOut *big.Int, reachedTarget bool) {
	Q96 := new(big.Int).Exp(big.NewInt(2), big.NewInt(96), nil)

	if liquidity.Cmp(big.NewInt(0)) == 0 {
		log.Printf("[ComputeSwapStep] Liquidity is 0, returning 0")
		return big.NewInt(0), big.NewInt(0), false
	}

	if zeroForOne {
		// token0 -> token1: 价格下降，sqrtPriceCurrent > sqrtPriceTarget
		if sqrtPriceCurrentX96.Cmp(sqrtPriceTargetX96) <= 0 {
			log.Printf("[ComputeSwapStep] zeroForOne: sqrtPriceCurrent (%s) <= sqrtPriceTarget (%s), returning 0",
				sqrtPriceCurrentX96.String(), sqrtPriceTargetX96.String())
			return big.NewInt(0), big.NewInt(0), false
		}

		sqrtPriceDiff := new(big.Int).Sub(sqrtPriceCurrentX96, sqrtPriceTargetX96)
		log.Printf("[ComputeSwapStep] zeroForOne: sqrtPriceDiff=%s, liquidity=%s", sqrtPriceDiff.String(), liquidity.String())

		// amountOut = L * (sqrt(P_current) - sqrt(P_target)) / Q96
		amountOut = new(big.Int).Mul(liquidity, sqrtPriceDiff)
		amountOut.Div(amountOut, Q96)

		// amountIn = L * (sqrt(P_current) - sqrt(P_target)) / (sqrt(P_current) * sqrt(P_target)) * Q96
		// 这是跨 tick 所需的最小输入金额（阈值）
		amountInDenominator := new(big.Int).Mul(sqrtPriceCurrentX96, sqrtPriceTargetX96)
		amountInDenominator.Div(amountInDenominator, Q96)
		amountInConsumed = new(big.Int).Mul(liquidity, sqrtPriceDiff)
		amountInConsumed.Mul(amountInConsumed, Q96)
		amountInConsumed.Div(amountInConsumed, amountInDenominator)

		// 判断是否跨 tick：如果消耗的输入量 <= 剩余输入量，则可以跨 tick
		// 否则，在当前 tick 区间内完成交易
		reachedTarget = amountInConsumed.Cmp(amountRemaining) <= 0

		log.Printf("[ComputeSwapStep] Cross-tick threshold: amountInNeeded=%s, amountRemaining=%s, willCrossTick=%v",
			amountInConsumed.String(), amountRemaining.String(), reachedTarget)
		if reachedTarget {
			// 可以到达目标价格
			return amountInConsumed, amountOut, true
		}

		// 无法到达目标价格，从amountRemaining反推能到达的价格
		// amountIn = L * (sqrt(P_current) - sqrt(P_new)) / (sqrt(P_current) * sqrt(P_new)) * Q96
		// 重新整理：L * (sqrt(P_current) - sqrt(P_new)) * Q96 = amountIn * sqrt(P_current) * sqrt(P_new)
		// L * sqrt(P_current) * Q96 = sqrt(P_new) * (L * Q96 + amountIn * sqrt(P_current))
		// sqrt(P_new) = L * sqrt(P_current) * Q96 / (L * Q96 + amountIn * sqrt(P_current))

		// 计算分母：L * Q96 + amountIn * sqrt(P_current)
		denomPart1 := new(big.Int).Mul(liquidity, Q96)
		denomPart2 := new(big.Int).Mul(amountRemaining, sqrtPriceCurrentX96)
		denominator := new(big.Int).Add(denomPart1, denomPart2)

		// 计算分子：L * sqrt(P_current) * Q96
		numerator := new(big.Int).Mul(liquidity, sqrtPriceCurrentX96)
		numerator.Mul(numerator, Q96)

		// sqrt(P_new) = numerator / denominator
		sqrtPriceNewX96 := new(big.Int).Div(numerator, denominator)

		// 确保新价格不超过目标价格
		if sqrtPriceNewX96.Cmp(sqrtPriceTargetX96) < 0 {
			sqrtPriceNewX96 = new(big.Int).Set(sqrtPriceTargetX96)
		}

		// 计算实际的 sqrtPriceDiff
		sqrtPriceDiffActual := new(big.Int).Sub(sqrtPriceCurrentX96, sqrtPriceNewX96)
		if sqrtPriceDiffActual.Sign() < 0 {
			sqrtPriceDiffActual.SetInt64(0)
		}

		// 重新计算amountOut: amountOut = L * (sqrt(P_current) - sqrt(P_new)) / Q96
		amountOut = new(big.Int).Mul(liquidity, sqrtPriceDiffActual)
		amountOut.Div(amountOut, Q96)
		amountInConsumed = amountRemaining

		log.Printf("[ComputeSwapStep] Cannot reach target, calculated: sqrtPriceNewX96=%s, sqrtPriceDiffActual=%s, amountOut=%s",
			sqrtPriceNewX96.String(), sqrtPriceDiffActual.String(), amountOut.String())

		return amountInConsumed, amountOut, false
	} else {
		// token1 -> token0: 价格上升，sqrtPriceTarget > sqrtPriceCurrent
		if sqrtPriceTargetX96.Cmp(sqrtPriceCurrentX96) <= 0 {
			log.Printf("[ComputeSwapStep] oneForZero: sqrtPriceTarget (%s) <= sqrtPriceCurrent (%s), returning 0",
				sqrtPriceTargetX96.String(), sqrtPriceCurrentX96.String())
			return big.NewInt(0), big.NewInt(0), false
		}

		sqrtPriceDiff := new(big.Int).Sub(sqrtPriceTargetX96, sqrtPriceCurrentX96)

		// amountIn = L * (sqrt(P_target) - sqrt(P_current)) / Q96
		amountInConsumed = new(big.Int).Mul(liquidity, sqrtPriceDiff)
		amountInConsumed.Div(amountInConsumed, Q96)

		reachedTarget = amountInConsumed.Cmp(amountRemaining) <= 0
		if reachedTarget {
			// 可以到达目标价格
			// amountOut = L * (sqrt(P_target) - sqrt(P_current)) / (sqrt(P_current) * sqrt(P_target)) * Q96
			denominator := new(big.Int).Mul(sqrtPriceCurrentX96, sqrtPriceTargetX96)
			denominator.Div(denominator, Q96)
			amountOut = new(big.Int).Mul(liquidity, sqrtPriceDiff)
			amountOut.Mul(amountOut, Q96)
			amountOut.Div(amountOut, denominator)
			return amountInConsumed, amountOut, true
		}

		// 无法到达目标价格，从amountRemaining反推能到达的价格
		// amountIn = L * (sqrt(P_new) - sqrt(P_current)) / Q96
		// sqrt(P_new) = sqrt(P_current) + amountRemaining * Q96 / L
		sqrtPriceDiffActual := new(big.Int).Mul(amountRemaining, Q96)
		sqrtPriceDiffActual.Div(sqrtPriceDiffActual, liquidity)

		if sqrtPriceDiffActual.Cmp(sqrtPriceDiff) > 0 {
			sqrtPriceDiffActual = sqrtPriceDiff
		}

		// 重新计算amountOut
		sqrtPriceNewX96 := new(big.Int).Add(sqrtPriceCurrentX96, sqrtPriceDiffActual)
		denominator := new(big.Int).Mul(sqrtPriceCurrentX96, sqrtPriceNewX96)
		denominator.Div(denominator, Q96)
		amountOut = new(big.Int).Mul(liquidity, sqrtPriceDiffActual)
		amountOut.Mul(amountOut, Q96)
		amountOut.Div(amountOut, denominator)
		amountInConsumed = amountRemaining

		return amountInConsumed, amountOut, false
	}
}

// getNextInitializedTick 获取下一个已初始化的tick
func (q *Quote) getNextInitializedTick(
	poolAddress string,
	currentTick int64,
	direction int64, // -1: 向下, 1: 向上
	tickSpacing int64,
) int64 {
	// 尝试从数据库查找下一个有流动性的tick
	var query string
	if direction < 0 {
		query = `
			SELECT tick_index
			FROM ticks
			WHERE pool_address = $1 
			  AND tick_index < $2
			  AND liquidity_gross > 0
			ORDER BY tick_index DESC
			LIMIT 1
		`
	} else {
		query = `
			SELECT tick_index
			FROM ticks
			WHERE pool_address = $1 
			  AND tick_index > $2
			  AND liquidity_gross > 0
			ORDER BY tick_index ASC
			LIMIT 1
		`
	}

	var foundTick sql.NullInt64
	err := q.db.QueryRow(query, poolAddress, currentTick).Scan(&foundTick)

	if err == nil && foundTick.Valid {
		return foundTick.Int64
	}

	// 如果没有找到，返回当前tick的下一个tick（考虑tick spacing）
	nextTick := currentTick + (direction * tickSpacing)
	return nextTick
}

// getTickInfo 获取tick信息
func (q *Quote) getTickInfo(poolAddress string, tick int64) (*TickInfo, error) {
	query := `
		SELECT tick_index, liquidity_gross, liquidity_net
		FROM ticks
		WHERE pool_address = $1 AND tick_index = $2
	`

	var tickInfo TickInfo
	var liquidityGross, liquidityNet sql.NullString

	err := q.db.QueryRow(query, poolAddress, tick).Scan(
		&tickInfo.TickIndex, &liquidityGross, &liquidityNet,
	)
	if err != nil {
		return nil, err
	}

	if liquidityGross.Valid && liquidityGross.String != "" {
		tickInfo.LiquidityGross, _ = new(big.Int).SetString(liquidityGross.String, 10)
	} else {
		tickInfo.LiquidityGross = big.NewInt(0)
	}

	if liquidityNet.Valid && liquidityNet.String != "" {
		tickInfo.LiquidityNet, _ = new(big.Int).SetString(liquidityNet.String, 10)
	} else {
		tickInfo.LiquidityNet = big.NewInt(0)
	}

	return &tickInfo, nil
}

// calculateMinAmountInToCrossTick 计算跨 tick 所需的最小输入金额（阈值）
//
// 这个函数回答的问题是："需要多少输入金额才能将价格从当前价格推到下一个 tick？"
//
// 参数：
//   - sqrtPriceCurrentX96: 当前价格的平方根（Q96格式）
//   - sqrtPriceNextX96: 下一个 tick 的价格平方根（Q96格式）
//   - liquidity: 当前 tick 区间的流动性
//   - zeroForOne: 交易方向（true=token0->token1，价格下降）
//
// 返回值：跨 tick 所需的最小输入金额
//
// 重要说明：
// - 这不是流动性阈值，而是输入金额阈值
// - 流动性越大，需要的输入金额越大（因为流动性大意味着价格变化慢）
// - 价格差越小，需要的输入金额越大（因为需要更精确的价格移动）
// - 当前价格越高，需要的输入金额越大
//
// 公式：
// zeroForOne: amountIn = L * (sqrt(P_current) - sqrt(P_target)) / (sqrt(P_current) * sqrt(P_target)) * Q96
// oneForZero: amountIn = L * (sqrt(P_target) - sqrt(P_current)) / Q96
func (q *Quote) calculateMinAmountInToCrossTick(
	sqrtPriceCurrentX96 *big.Int,
	sqrtPriceNextX96 *big.Int,
	liquidity *big.Int,
	zeroForOne bool,
) *big.Int {
	Q96 := new(big.Int).Exp(big.NewInt(2), big.NewInt(96), nil)

	if liquidity.Cmp(big.NewInt(0)) == 0 {
		return big.NewInt(0)
	}

	if zeroForOne {
		// token0 -> token1: 价格下降
		if sqrtPriceCurrentX96.Cmp(sqrtPriceNextX96) <= 0 {
			return big.NewInt(0)
		}

		sqrtPriceDiff := new(big.Int).Sub(sqrtPriceCurrentX96, sqrtPriceNextX96)

		// amountIn = L * (sqrt(P_current) - sqrt(P_target)) / (sqrt(P_current) * sqrt(P_target)) * Q96
		denominator := new(big.Int).Mul(sqrtPriceCurrentX96, sqrtPriceNextX96)
		denominator.Div(denominator, Q96)
		amountIn := new(big.Int).Mul(liquidity, sqrtPriceDiff)
		amountIn.Mul(amountIn, Q96)
		amountIn.Div(amountIn, denominator)

		return amountIn
	} else {
		// token1 -> token0: 价格上升
		if sqrtPriceNextX96.Cmp(sqrtPriceCurrentX96) <= 0 {
			return big.NewInt(0)
		}

		sqrtPriceDiff := new(big.Int).Sub(sqrtPriceNextX96, sqrtPriceCurrentX96)

		// amountIn = L * (sqrt(P_target) - sqrt(P_current)) / Q96
		amountIn := new(big.Int).Mul(liquidity, sqrtPriceDiff)
		amountIn.Div(amountIn, Q96)

		return amountIn
	}
}

// getSqrtPriceAtTick 根据tick计算sqrtPriceX96
// 公式：price = 1.0001^tick, sqrtPrice = 1.0001^(tick/2)
func (q *Quote) getSqrtPriceAtTick(tick int64) *big.Int {
	Q96 := new(big.Int).Exp(big.NewInt(2), big.NewInt(96), nil)

	// 使用数学库计算：sqrtPrice = 1.0001^(tick/2)
	tickFloat := float64(tick) / 2.0
	sqrtPriceFloat := math.Pow(1.0001, tickFloat)

	// 转换为Q96格式
	sqrtPriceBigFloat := big.NewFloat(sqrtPriceFloat)
	sqrtPriceBigFloat.Mul(sqrtPriceBigFloat, new(big.Float).SetInt(Q96))

	sqrtPriceX96, _ := sqrtPriceBigFloat.Int(nil)
	return sqrtPriceX96
}

// getTickAtSqrtPrice 根据sqrtPriceX96计算tick
func (q *Quote) getTickAtSqrtPrice(sqrtPriceX96 *big.Int) int64 {
	Q96 := new(big.Int).Exp(big.NewInt(2), big.NewInt(96), nil)

	// price = (sqrtPriceX96 / Q96)^2
	// tick = log(price) / log(1.0001)
	// 简化计算
	sqrtPriceFloat := new(big.Float).SetInt(sqrtPriceX96)
	q96Float := new(big.Float).SetInt(Q96)
	sqrtPriceFloat.Quo(sqrtPriceFloat, q96Float)

	priceFloat := new(big.Float).Mul(sqrtPriceFloat, sqrtPriceFloat)
	priceFloat64, _ := priceFloat.Float64()

	// tick = log(price) / log(1.0001)
	tickFloat := 0.0
	if priceFloat64 > 0 {
		// 使用自然对数计算
		tickFloat = math.Log(priceFloat64) / math.Log(1.0001)
	}

	return int64(tickFloat)
}

// sqrtPriceX96ToPrice 将sqrtPriceX96转换为价格（考虑代币精度）
func (q *Quote) sqrtPriceX96ToPrice(sqrtPriceX96 *big.Int, isToken0 bool) *big.Int {
	Q96 := new(big.Int).Exp(big.NewInt(2), big.NewInt(96), nil)

	// price = (sqrtPriceX96 / Q96)^2
	sqrtPriceFloat := new(big.Float).SetInt(sqrtPriceX96)
	q96Float := new(big.Float).SetInt(Q96)
	sqrtPriceFloat.Quo(sqrtPriceFloat, q96Float)

	priceFloat := new(big.Float).Mul(sqrtPriceFloat, sqrtPriceFloat)
	price, _ := priceFloat.Int(nil)

	if !isToken0 {
		// 如果是token1的价格，需要取倒数
		// price_token1 = 1 / price_token0
		// 这里简化处理，返回原始值
	}

	return price
}

// PoolInfo 池子信息（用于查找最佳池子）
type PoolInfo struct {
	Address      string
	Token0       string
	Token1       string
	Fee          int64
	Liquidity    string
	SqrtPriceX96 string
	Tick         int64
	Reserve0     string
	Reserve1     string
}

// FindBestPool 查找最佳池子（从 PostgreSQL pools 表）
func (q *Quote) FindBestPool(tokenIn, tokenOut string) (*PoolInfo, error) {
	// 使用 LOWER 进行大小写不敏感匹配
	query := `
		SELECT address, token0, token1, fee, liquidity, sqrt_price_x96, tick, reserve0, reserve1
		FROM pools
		WHERE (LOWER(token0) = LOWER($1) AND LOWER(token1) = LOWER($2)) 
		   OR (LOWER(token0) = LOWER($2) AND LOWER(token1) = LOWER($1))
		ORDER BY liquidity DESC
		LIMIT 1
	`

	var pool PoolInfo
	var token0, token1 string
	var liquidity, sqrtPriceX96 sql.NullString
	var tick sql.NullInt64
	var reserve0, reserve1 sql.NullString

	err := q.db.QueryRow(query, tokenIn, tokenOut).Scan(
		&pool.Address, &token0, &token1, &pool.Fee,
		&liquidity, &sqrtPriceX96, &tick, &reserve0, &reserve1,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("未找到交易对池子")
		}
		return nil, err
	}

	pool.Token0 = token0
	pool.Token1 = token1

	// 设置流动性
	if liquidity.Valid {
		pool.Liquidity = liquidity.String
	} else {
		pool.Liquidity = "0"
	}

	// 设置价格
	if sqrtPriceX96.Valid {
		pool.SqrtPriceX96 = sqrtPriceX96.String
	} else {
		pool.SqrtPriceX96 = "0"
	}

	// 设置tick
	if tick.Valid {
		pool.Tick = tick.Int64
	}

	// 设置 reserve0 和 reserve1
	if reserve0.Valid {
		pool.Reserve0 = reserve0.String
	} else {
		pool.Reserve0 = "0"
	}
	if reserve1.Valid {
		pool.Reserve1 = reserve1.String
	} else {
		pool.Reserve1 = "0"
	}

	return &pool, nil
}
