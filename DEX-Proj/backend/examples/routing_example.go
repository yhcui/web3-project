package main

import (
	"fmt"
	"math/big"
)

// 这是一个教学示例，演示多跳交易路由的计算过程

// Pool 表示一个流动性池
type Pool struct {
	Name      string
	Token0    string
	Token1    string
	Reserve0  *big.Int
	Reserve1  *big.Int
	FeeRate   float64
}

// CalculateOutputAmount 使用恒定乘积公式计算输出金额
// 公式: Δy = (y × Δx × (1 - fee)) / (x + Δx × (1 - fee))
func CalculateOutputAmount(amountIn, reserveIn, reserveOut *big.Int, feeRate float64) *big.Int {
	// 计算手续费后的输入金额
	// (1 - feeRate) × 10000，例如 0.997 × 10000 = 9970
	feeMultiplier := int64((1 - feeRate) * 10000)
	amountInWithFee := new(big.Int).Mul(amountIn, big.NewInt(feeMultiplier))
	amountInWithFee.Div(amountInWithFee, big.NewInt(10000))

	// 分子: amountInWithFee × reserveOut
	numerator := new(big.Int).Mul(amountInWithFee, reserveOut)

	// 分母: reserveIn + amountInWithFee
	denominator := new(big.Int).Add(reserveIn, amountInWithFee)

	// 计算输出
	amountOut := new(big.Int).Div(numerator, denominator)
	return amountOut
}

// FormatAmount 格式化金额（考虑精度）
func FormatAmount(amount *big.Int, decimals int) string {
	divisor := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil)
	intPart := new(big.Int).Div(amount, divisor)
	remainder := new(big.Int).Mod(amount, divisor)
	
	// 保留 2 位小数
	decimalPart := new(big.Int).Mul(remainder, big.NewInt(100))
	decimalPart.Div(decimalPart, divisor)
	
	return fmt.Sprintf("%s.%02d", intPart.String(), decimalPart.Int64())
}

func main() {
	fmt.Println("=================================================")
	fmt.Println("     DEX 多跳交易路由计算示例")
	fmt.Println("=================================================")
	fmt.Println()

	// ============================================================
	// 示例 1: 单跳交易 (WETH → USDC)
	// ============================================================
	
	fmt.Println("【示例 1】单跳交易: WETH → USDC")
	fmt.Println("─────────────────────────────────────────────────")
	
	pool1 := Pool{
		Name:     "Uniswap V2 WETH/USDC",
		Token0:   "WETH",
		Token1:   "USDC",
		Reserve0: new(big.Int).Mul(big.NewInt(75000), big.NewInt(1e18)),    // 75,000 WETH
		Reserve1: new(big.Int).Mul(big.NewInt(180000000), big.NewInt(1e6)), // 180M USDC
		FeeRate:  0.003, // 0.3%
	}
	
	fmt.Printf("池子信息:\n")
	fmt.Printf("  - 名称: %s\n", pool1.Name)
	fmt.Printf("  - 储备: %s %s / %s %s\n", 
		FormatAmount(pool1.Reserve0, 18), pool1.Token0,
		FormatAmount(pool1.Reserve1, 6), pool1.Token1)
	fmt.Printf("  - 手续费: %.2f%%\n", pool1.FeeRate*100)
	fmt.Printf("  - 当前价格: 1 WETH ≈ %.2f USDC\n", 
		float64(pool1.Reserve1.Int64()/1e6) / float64(pool1.Reserve0.Int64()/1e18))
	fmt.Println()
	
	// 用户想用 10 WETH 兑换 USDC
	amountIn1 := new(big.Int).Mul(big.NewInt(10), big.NewInt(1e18)) // 10 WETH
	
	fmt.Printf("交易输入: %s WETH\n", FormatAmount(amountIn1, 18))
	
	amountOut1 := CalculateOutputAmount(amountIn1, pool1.Reserve0, pool1.Reserve1, pool1.FeeRate)
	
	fmt.Printf("交易输出: %s USDC\n", FormatAmount(amountOut1, 6))
	fmt.Printf("有效价格: 1 WETH = %.2f USDC\n", 
		float64(amountOut1.Int64()/1e6) / float64(amountIn1.Int64()/1e18))
	fmt.Println()
	fmt.Println()

	// ============================================================
	// 示例 2: 两跳交易 (WETH → USDC → DAI)
	// ============================================================
	
	fmt.Println("【示例 2】两跳交易: WETH → USDC → DAI")
	fmt.Println("─────────────────────────────────────────────────")
	
	// 第一跳池子
	pool2_hop1 := Pool{
		Name:     "Uniswap V2 WETH/USDC",
		Token0:   "WETH",
		Token1:   "USDC",
		Reserve0: new(big.Int).Mul(big.NewInt(75000), big.NewInt(1e18)),    // 75,000 WETH
		Reserve1: new(big.Int).Mul(big.NewInt(180000000), big.NewInt(1e6)), // 180M USDC
		FeeRate:  0.003,
	}
	
	// 第二跳池子
	pool2_hop2 := Pool{
		Name:     "Uniswap V2 USDC/DAI",
		Token0:   "USDC",
		Token1:   "DAI",
		Reserve0: new(big.Int).Mul(big.NewInt(42000000), big.NewInt(1e6)),  // 42M USDC
		Reserve1: new(big.Int).Mul(big.NewInt(42000000), big.NewInt(1e18)), // 42M DAI
		FeeRate:  0.003,
	}
	
	fmt.Println("第一跳池子:")
	fmt.Printf("  - 名称: %s\n", pool2_hop1.Name)
	fmt.Printf("  - 储备: %s %s / %s %s\n", 
		FormatAmount(pool2_hop1.Reserve0, 18), pool2_hop1.Token0,
		FormatAmount(pool2_hop1.Reserve1, 6), pool2_hop1.Token1)
	fmt.Printf("  - 流动性: $360,000,000\n")
	fmt.Println()
	
	fmt.Println("第二跳池子:")
	fmt.Printf("  - 名称: %s\n", pool2_hop2.Name)
	fmt.Printf("  - 储备: %s %s / %s %s\n", 
		FormatAmount(pool2_hop2.Reserve0, 6), pool2_hop2.Token0,
		FormatAmount(pool2_hop2.Reserve1, 18), pool2_hop2.Token1)
	fmt.Printf("  - 流动性: $84,000,000\n")
	fmt.Println()
	
	// 用户想用 10 WETH 兑换 DAI
	amountIn2 := new(big.Int).Mul(big.NewInt(10), big.NewInt(1e18)) // 10 WETH
	
	fmt.Printf("初始输入: %s WETH\n", FormatAmount(amountIn2, 18))
	fmt.Println()
	
	// 第一跳: WETH → USDC
	fmt.Println("【第一跳】WETH → USDC")
	intermediateAmount := CalculateOutputAmount(
		amountIn2, 
		pool2_hop1.Reserve0, 
		pool2_hop1.Reserve1, 
		pool2_hop1.FeeRate,
	)
	fmt.Printf("  输入: %s WETH\n", FormatAmount(amountIn2, 18))
	fmt.Printf("  输出: %s USDC\n", FormatAmount(intermediateAmount, 6))
	fmt.Printf("  价格: 1 WETH = %.2f USDC\n", 
		float64(intermediateAmount.Int64()/1e6) / float64(amountIn2.Int64()/1e18))
	fmt.Println()
	
	// 第二跳: USDC → DAI
	fmt.Println("【第二跳】USDC → DAI")
	finalAmount := CalculateOutputAmount(
		intermediateAmount, 
		pool2_hop2.Reserve0, 
		pool2_hop2.Reserve1, 
		pool2_hop2.FeeRate,
	)
	fmt.Printf("  输入: %s USDC\n", FormatAmount(intermediateAmount, 6))
	fmt.Printf("  输出: %s DAI\n", FormatAmount(finalAmount, 18))
	fmt.Printf("  价格: 1 USDC = %.4f DAI\n", 
		float64(finalAmount.Int64()/1e18) / float64(intermediateAmount.Int64()/1e6))
	fmt.Println()
	
	fmt.Println("【最终结果】")
	fmt.Printf("  总输入: %s WETH\n", FormatAmount(amountIn2, 18))
	fmt.Printf("  总输出: %s DAI\n", FormatAmount(finalAmount, 18))
	fmt.Printf("  有效价格: 1 WETH = %.2f DAI\n", 
		float64(finalAmount.Int64()/1e18) / float64(amountIn2.Int64()/1e18))
	
	// 计算总手续费
	totalFee := 1 - (1-pool2_hop1.FeeRate)*(1-pool2_hop2.FeeRate)
	fmt.Printf("  总手续费: %.4f%%\n", totalFee*100)
	fmt.Println()
	fmt.Println()

	// ============================================================
	// 示例 3: 比较不同路径
	// ============================================================
	
	fmt.Println("【示例 3】路径对比分析")
	fmt.Println("─────────────────────────────────────────────────")
	fmt.Println("目标: 用 10 WETH 兑换 DAI")
	fmt.Println()
	
	// 路径 1: WETH → USDC → DAI (已计算)
	path1Output := finalAmount
	path1Fee := 1 - (1-0.003)*(1-0.003)
	path1Liquidity := float64(84000000) // 瓶颈流动性
	
	fmt.Println("路径 1: WETH → USDC → DAI")
	fmt.Printf("  输出: %s DAI\n", FormatAmount(path1Output, 18))
	fmt.Printf("  手续费: %.4f%%\n", path1Fee*100)
	fmt.Printf("  瓶颈流动性: $%.0f\n", path1Liquidity)
	fmt.Println()
	
	// 路径 2: WETH → USDT → DAI
	pool3_hop1 := Pool{
		Reserve0: new(big.Int).Mul(big.NewInt(90000), big.NewInt(1e18)),    // 90,000 WETH
		Reserve1: new(big.Int).Mul(big.NewInt(216000000), big.NewInt(1e6)), // 216M USDT
		FeeRate:  0.003,
	}
	pool3_hop2 := Pool{
		Reserve0: new(big.Int).Mul(big.NewInt(68000000), big.NewInt(1e6)),  // 68M USDT
		Reserve1: new(big.Int).Mul(big.NewInt(68000000), big.NewInt(1e18)), // 68M DAI
		FeeRate:  0.003,
	}
	
	intermediate2 := CalculateOutputAmount(amountIn2, pool3_hop1.Reserve0, pool3_hop1.Reserve1, 0.003)
	path2Output := CalculateOutputAmount(intermediate2, pool3_hop2.Reserve0, pool3_hop2.Reserve1, 0.003)
	path2Fee := 1 - (1-0.003)*(1-0.003)
	path2Liquidity := float64(68000000)
	
	fmt.Println("路径 2: WETH → USDT → DAI")
	fmt.Printf("  输出: %s DAI\n", FormatAmount(path2Output, 18))
	fmt.Printf("  手续费: %.4f%%\n", path2Fee*100)
	fmt.Printf("  瓶颈流动性: $%.0f\n", path2Liquidity)
	fmt.Println()
	
	// 路径 3: 直接路径 WETH → DAI (假设存在但流动性低)
	pool4 := Pool{
		Reserve0: new(big.Int).Mul(big.NewInt(50000), big.NewInt(1e18)),    // 50,000 WETH
		Reserve1: new(big.Int).Mul(big.NewInt(120000000), big.NewInt(1e18)), // 120M DAI
		FeeRate:  0.003,
	}
	
	path3Output := CalculateOutputAmount(amountIn2, pool4.Reserve0, pool4.Reserve1, 0.003)
	path3Fee := 0.003
	path3Liquidity := float64(240000000)
	
	fmt.Println("路径 3: WETH → DAI (直接)")
	fmt.Printf("  输出: %s DAI\n", FormatAmount(path3Output, 18))
	fmt.Printf("  手续费: %.4f%%\n", path3Fee*100)
	fmt.Printf("  流动性: $%.0f\n", path3Liquidity)
	fmt.Println()
	
	// 比较结果
	fmt.Println("【结论】")
	
	// 比较输出
	if path1Output.Cmp(path2Output) > 0 && path1Output.Cmp(path3Output) > 0 {
		fmt.Println("✅ 路径 1 输出最多（推荐）")
	} else if path2Output.Cmp(path1Output) > 0 && path2Output.Cmp(path3Output) > 0 {
		fmt.Println("✅ 路径 2 输出最多（推荐）")
	} else {
		fmt.Println("✅ 路径 3 输出最多（推荐）")
	}
	
	fmt.Println()
	fmt.Println("综合评估因素:")
	fmt.Println("  1. 输出金额（越高越好）")
	fmt.Println("  2. 手续费（越低越好）")
	fmt.Println("  3. 流动性（越高越好，滑点越小）")
	fmt.Println("  4. Gas 费用（跳数越少越好）")
	fmt.Println()
	
	fmt.Println("=================================================")
	fmt.Println("     示例运行完成")
	fmt.Println("=================================================")
}

