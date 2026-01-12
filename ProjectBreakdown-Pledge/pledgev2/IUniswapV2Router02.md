# 负责流动性管理（添加/移除资金池份额）和资产兑换（代币交易）。

## 流动性管理方法 (Liquidity Management)
这些方法用于向流动性池中存入或取出代币。

|方法名|作用说明|
|----------|--------|
|addLiquidity|向两个 ERC20 代币组成的池子添加流动性。|
|addLiquidityETH|向“代币 + ETH”池子添加流动性。你转入 ETH，合约自动帮你换成 WETH 处理。|
|removeLiquidity|移除流动性。销毁 LP Token，取回池子里的两种 ERC20 代币。|
|removeLiquidityETH|移除“代币 + ETH”池子的流动性，直接取回 ERC20 和 ETH。|
|removeLiquidityWithPermit|带有 EIP-712 签名授权的移除方法。优点： 用户不需要先调用 approve，一步到位。|

## 核心代币兑换方法 (Swap Functions)

以“输入”为中心 (指定想卖出多少)
- swapExactTokensForTokens: 指定卖出 $X$ 个 A 代币，最少要换回 $Y$ 个 B 代币。
- swapExactETHForTokens: 用精确数量的 ETH 买入代币。
- swapExactTokensForETH: 用精确数量的代币换取 ETH。

以“输出”为中心 (指定想买入多少)
- swapTokensForExactTokens: 为了正好买到 Y 个 B 代币，最多愿意支付 $X$ 个 A 代币。
- swapETHForExactTokens: 为了买到精确数量的代币，愿意支付一定数量以内的 ETH。
- swapTokensForExactETH: 为了正好换回 Y 数量的 ETH，愿意支付一定数量以内的代币。

## 价格计算与查询 (Price & Quoting)

这些是 pure 或 view 函数，不消耗 Gas（在链下调用时），用于计算交易滑点和预期结果。
- quote: 给定代币数量和池子储备量，计算等值的另一种代币数量（不考虑交易费）。
- getAmountOut: 最常用。计算输入 X 数量代币，扣除 0.3% 手续费后，实际能换出多少。
- getAmountIn: 计算想要得到 Y 数量代币，实际需要输入多少。
- getAmountsOut / getAmountsIn: 针对多级路径（如 A -> B -> C）计算最终结果。