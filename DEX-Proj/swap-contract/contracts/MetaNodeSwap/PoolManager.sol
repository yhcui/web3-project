// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;
pragma abicoder v2;

import "./interfaces/IPoolManager.sol";
import "./Factory.sol";
import "./interfaces/IPool.sol";

/// @title PoolManager
/// @notice 池子管理合约：继承 Factory，在创建池子能力之上增加「交易对列表」与「全量池子信息查询」，并支持一键创建并初始化池子（若不存在则创建并设初始价格）。
/// @dev 前端/聚合器通过 getPairs/getAllPools 拉取所有交易对与池子状态；createAndInitializePoolIfNecessary 便于首次为某交易对建池并设价。
contract PoolManager is Factory, IPoolManager {
    /// @notice 已存在的交易对列表（每个 Pair 仅记录一次，与 pools[token0][token1] 的多个池子对应）。
    Pair[] public pairs;

    /// @notice 返回所有已登记的交易对（token0, token1），用于前端展示或路径发现。
    function getPairs() external view override returns (Pair[] memory) {
        return pairs;
    }

    /// @notice 返回所有池子的汇总信息（地址、代币、费率、tick、价格、流动性等），用于看板或路由计算。
    function getAllPools()
        external
        view
        override
        returns (PoolInfo[] memory poolsInfo)
    {
        uint32 length = 0;
        // 先算一下大小
        for (uint32 i = 0; i < pairs.length; i++) {
            length += uint32(pools[pairs[i].token0][pairs[i].token1].length);
        }

        // 再填充数据
        poolsInfo = new PoolInfo[](length);
        uint256 index;
        for (uint32 i = 0; i < pairs.length; i++) {
            address[] memory addresses = pools[pairs[i].token0][
                pairs[i].token1
            ];
            for (uint32 j = 0; j < addresses.length; j++) {
                IPool pool = IPool(addresses[j]);
                poolsInfo[index] = PoolInfo({
                    pool: addresses[j],
                    token0: pool.token0(),
                    token1: pool.token1(),
                    index: j,
                    fee: pool.fee(),
                    feeProtocol: 0,
                    tickLower: pool.tickLower(),
                    tickUpper: pool.tickUpper(),
                    tick: pool.tick(),
                    sqrtPriceX96: pool.sqrtPriceX96(),
                    liquidity: pool.liquidity()
                });
                index++;
            }
        }
        return poolsInfo;
    }

    /// @notice 若该 (token0, token1, tickLower, tickUpper, fee) 的池子不存在则创建，若池子未初始化价格则用 sqrtPriceX96 初始化；首次为该交易对建池时会将 (token0, token1) 加入 pairs。
    /// @param params 创建/初始化参数：token0、token1、tickLower、tickUpper、fee、sqrtPriceX96（初始价格）
    /// @return poolAddress 池子地址（新建或已存在）
    function createAndInitializePoolIfNecessary(
        CreateAndInitializeParams calldata params
    ) external payable override returns (address poolAddress) {
        require(
            params.token0 < params.token1,
            "token0 must be less than token1"
        );

        poolAddress = this.createPool(
            params.token0,
            params.token1,
            params.tickLower,
            params.tickUpper,
            params.fee
        );

        IPool pool = IPool(poolAddress);

        uint256 index = pools[pool.token0()][pool.token1()].length;

        // 新创建的池子，没有初始化价格，需要初始化价格
        if (pool.sqrtPriceX96() == 0) {
            pool.initialize(params.sqrtPriceX96);

            if (index == 1) {
                // 如果是第一次添加该交易对，需要记录
                pairs.push(
                    Pair({token0: pool.token0(), token1: pool.token1()})
                );
            }
        }
    }
}
