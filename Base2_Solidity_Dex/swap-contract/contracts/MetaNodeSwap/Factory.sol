// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "./interfaces/IFactory.sol";
import "./Pool.sol";

contract Factory is IFactory {
    mapping(address => mapping(address => address[])) public pools;

    Parameters public override parameters;

    function sortToken(
        address tokenA,
        address tokenB
    ) private pure returns (address, address) {
        return tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    function getPool(
        address tokenA,
        address tokenB,
        uint32 index
    ) external view override returns (address) {
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");
        require(tokenA != address(0) && tokenB != address(0), "ZERO_ADDRESS");

        // Declare token0 and token1
        address token0;
        address token1;

        (token0, token1) = sortToken(tokenA, tokenB);

        return pools[token0][token1][index];
    }

    /*
    调用方通常在前端或部署脚本中，根据期望的价格范围（Price Range）计算出对应的 tickLower 和 tickUpper。
    使用数学公式将价格转换为 tick：$tick = \log_{1.0001}(price)$。
    常见工具库如 @uniswap/v3-sdk 或项目自研的工具函数会提供 priceToTick 类似的方法。

    在 Uniswap V3 中，token1 / token0 就是 token1 的价格（以 token0 计价）。
    更准确地说：
    Uniswap V3 协议内部统一使用 P = token1 / token0 作为价格定义。
    这意味着：
        P 表示 1 个 token0 能换多少个 token1。
        或者说：token1 的价格 = P（单位：token0）。
        token0 的价格 = 1 / P（单位：token1）。

    Uniswap V3 中，tick 是价格的离散化表示，每个 tick 对应一个价格点，核心关系式是：
    价格 P = 1.0001^tick
    （这里的 P 通常指 token1 / token0 的价格，即多少 token1 换 1 token0）
    更精确地说，合约里用的是 sqrtPriceX96（√P × 2⁹⁶ 的定点数表示），而 tick 与 sqrtPrice 的关系是：
    √P = (1.0001)^(tick / 2)
    或写成：
    √P = 1.0001^(tick/2)

    从给定价格 → 计算 tickUpper 和 tickLower 的公式
    假设你输入的是 价格 P（token1/token0，即 quote/base），通常是 token1 相对 token0 的价格。

    1、先计算 sqrtPrice（浮点数形式）
    sqrtP = √P

    2、tick 的理论值（连续值）
    
    tick = log(sqrtP) / log(1.0001) × 2
    或等价写法（最常用、最推荐的形式）：tick = log(P) / log(1.0001)因为 log(P) = 2 × log(√P)，所以两种写法等价。
    3、实际 tickUpper 和 tickLower 的取值规则（最重要的一步）
    
    tickLower：对应价格区间的下界（更低的价格），一般用 floor（向下取整）
    tickLower = floor( log(P_lower) / log(1.0001) )
    tickUpper：对应价格区间的上界（更高的价格），一般用 ceil（向上取整）
    tickUpper = ceil( log(P_upper) / log(1.0001) )
    大多数前端/脚本库的常见做法是：
    下边界价格 → floor
    上边界价格 → ceil
    这样可以确保范围覆盖用户指定的 [P_lower, P_upper]。
    
    4、还要考虑 tickSpacing（池子的 tick 间隔，通常 10/60/200/等）最终提交到合约的 tick 必须是 tickSpacing 的倍数：tickLower = floor(理论 tickLower / tickSpacing) × tickSpacing
    tickUpper = ceil(理论 tickUpper / tickSpacing) × tickSpacing
    */
    function createPool(
        address tokenA,
        address tokenB,
        int24 tickLower,
        int24 tickUpper,
        uint24 fee // fee是向交易者收取的手续费率
    ) external override returns (address pool) {
        // validate token's individuality
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");

        // Declare token0 and token1
        address token0;
        address token1;

        // sort token, avoid the mistake of the order
        (token0, token1) = sortToken(tokenA, tokenB);

        // get current all pools
        address[] memory existingPools = pools[token0][token1];

        // check if the pool already exists
        for (uint256 i = 0; i < existingPools.length; i++) {
            IPool currentPool = IPool(existingPools[i]);

            if (
                currentPool.tickLower() == tickLower &&
                currentPool.tickUpper() == tickUpper &&
                currentPool.fee() == fee
            ) {
                return existingPools[i];
            }
        }

        // save pool info
        parameters = Parameters(
            address(this),
            token0,
            token1,
            tickLower,
            tickUpper,
            fee
        );

        // generate create2 salt
        bytes32 salt = keccak256(
            abi.encode(token0, token1, tickLower, tickUpper, fee)
        );

        // create pool
        // 通过 new Pool{salt: salt}() 实时部署的，而非预先部署好所有可能的交易对。
        // 代码中使用 CREATE2 操作码（{salt: salt}）是为了确保池子地址的确定性
        pool = address(new Pool{salt: salt}());

        // save created pool
        pools[token0][token1].push(pool);

        // delete pool info
        delete parameters;

        emit PoolCreated(
            token0,
            token1,
            uint32(existingPools.length),
            tickLower,
            tickUpper,
            fee,
            pool
        );
    }
}
