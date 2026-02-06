// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "./interfaces/IFactory.sol";
import "./Pool.sol";

/// @title Factory
/// @notice 工厂合约：负责按「代币对 + 价格区间 + 手续费」创建并登记流动性池。
/// @dev 同一代币对可存在多个池子（不同 tickLower/tickUpper/fee），通过 index 区分；使用 CREATE2 保证池子地址可预测。
contract Factory is IFactory {
    /// @notice 代币对 -> 该交易对下所有池子地址列表。token0 < token1 为规范顺序。
    mapping(address => mapping(address => address[])) public pools;

    /// @notice 创建池子时临时存放参数，供 Pool 构造函数从工厂读取（因 CREATE2 需固定 initcode 才能定址）。
    Parameters public override parameters;

    /// @notice 将两代币按地址大小排序，保证 token0 < token1，避免同一交易对重复建池。
    function sortToken(
        address tokenA,
        address tokenB
    ) private pure returns (address, address) {
        return tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    /// @notice 根据代币对和池子索引查询池子地址。
    /// @param tokenA 代币 A
    /// @param tokenB 代币 B
    /// @param index 该交易对下第几个池子（从 0 起）
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

    /// @notice 创建或复用流动性池。同一 (token0, token1, tickLower, tickUpper, fee) 仅会有一个池子，重复创建返回已存在池子地址。
    /// @param tokenA 代币 A
    /// @param tokenB 代币 B
    /// @param tickLower 价格区间下界（tick）
    /// @param tickUpper 价格区间上界（tick）
    /// @param fee 手续费率（如 3000 表示 0.3%）
    /// @return pool 新创建或已存在的 Pool 合约地址
    function createPool(
        address tokenA,
        address tokenB,
        int24 tickLower,
        int24 tickUpper,
        uint24 fee
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
