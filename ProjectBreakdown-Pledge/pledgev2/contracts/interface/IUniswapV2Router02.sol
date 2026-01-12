// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IUniswapV2Router02 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    /*

    liquidity 返回的是你存入代币后，系统发给你的 LP Token（流动性池代币）的数量。
    在 Uniswap V2 这种恒定乘机做市商（AMM）机制中，它是你在这个资金池中所占份额的“收据”或“股权证明”。

    1. 它代表了什么？
    当你向 TokenA 和 TokenB 的池子添加流动性时：
    合约会根据你实际存入的代币数量，计算出你贡献了池子总容量的百分之几。
    合约会**铸造（Mint）**出对应数量的 LP Token 发送到你的 to 地址。
    这个返回的 liquidity 就是这些生成的 LP Token 的精度数值（通常是 18 位小数）。

    2. 这个数值是怎么计算的？
    根据 Uniswap V2 的公式，LP Token 的计算.如需详细可以阅读 Uniswap V2 的官方文档。

    这个 liquidity 有什么用？
    1、作为提取凭证： 当你以后想撤出流动性时（调用 removeLiquidity），你需要把这些 LP Token 归还（销毁）给合约，换回你应得的代币（A + B）以及这段时间累积的手续费收益。
    2、流动性挖矿： 很多 DeFi 项目会让你把这个 liquidity 数额（即 LP Token）质押到他们的“矿池”里，从而赚取额外的项目代币奖励。
    
    addLiquidity 的三个返回值
    amountA: 实际存入的 TokenA 数量（可能因为滑点比你填写的 desired 少一点）。
    amountB: 实际存入的 TokenB 数量。
    liquidity: 你获得的 LP Token 数量（即你的“股份”额度）。
    */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired, // 理想中想要存入的金额. 合约会尽量满足你的要求，但最终实际存入的量（返回值 amountA, amountB）通常会小于等于这两个值
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to, // 接收代币的地址
        uint deadline // 截止时间戳。如果交易在这个时间之后才被打包，则会自动失效，保护用户
    ) external returns (uint amountA, uint amountB, uint liquidity);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountToken, uint amountETH);
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);

    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);

    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountETH);
    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountETH);

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}
