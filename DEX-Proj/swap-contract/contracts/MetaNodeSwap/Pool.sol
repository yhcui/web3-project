// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./libraries/SqrtPriceMath.sol";
import "./libraries/TickMath.sol";
import "./libraries/LiquidityMath.sol";
import "./libraries/LowGasSafeMath.sol";
import "./libraries/SafeCast.sol";
import "./libraries/TransferHelper.sol";
import "./libraries/SwapMath.sol";
import "./libraries/FixedPoint128.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IFactory.sol";

/// @title Pool
/// @notice 单一流动性池：对应一个代币对在一个固定价格区间 [tickLower, tickUpper] 内的流动性，支持在该区间内做市与兑换。
/// @dev 采用集中流动性（Concentrated Liquidity）：当前价格必须在区间内才有有效流动性；提供 mint/burn/swap/collect 等核心操作。
contract Pool is IPool {
    using SafeCast for uint256;
    using LowGasSafeMath for int256;
    using LowGasSafeMath for uint256;

    /// @inheritdoc IPool
    address public immutable override factory;
    /// @inheritdoc IPool
    address public immutable override token0;
    /// @inheritdoc IPool
    address public immutable override token1;
    /// @inheritdoc IPool
    uint24 public immutable override fee;
    /// @inheritdoc IPool
    int24 public immutable override tickLower;
    /// @inheritdoc IPool
    int24 public immutable override tickUpper;

    /// @inheritdoc IPool
    uint160 public override sqrtPriceX96;
    /// @inheritdoc IPool
    int24 public override tick;
    /// @inheritdoc IPool
    uint128 public override liquidity;

    /// @inheritdoc IPool
    uint256 public override feeGrowthGlobal0X128;
    /// @inheritdoc IPool
    uint256 public override feeGrowthGlobal1X128;

    struct Position {
        // 该 Position 拥有的流动性
        uint128 liquidity;
        // 可提取的 token0 数量
        uint128 tokensOwed0;
        // 可提取的 token1 数量
        uint128 tokensOwed1;
        // 上次提取手续费时的 feeGrowthGlobal0X128
        uint256 feeGrowthInside0LastX128;
        // 上次提取手续费是的 feeGrowthGlobal1X128
        uint256 feeGrowthInside1LastX128;
    }

    // 用一个 mapping 来存放所有 Position 的信息
    mapping(address => Position) public positions;

    function getPosition(
        address owner
    )
        external
        view
        override
        returns (
            uint128 _liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        )
    {
        return (
            positions[owner].liquidity,
            positions[owner].feeGrowthInside0LastX128,
            positions[owner].feeGrowthInside1LastX128,
            positions[owner].tokensOwed0,
            positions[owner].tokensOwed1
        );
    }

    constructor() {
        // constructor 中初始化 immutable 的常量
        // Factory 创建 Pool 时会通 new Pool{salt: salt}() 的方式创建 Pool 合约，通过 salt 指定 Pool 的地址，这样其他地方也可以推算出 Pool 的地址
        // 参数通过读取 Factory 合约的 parameters 获取
        // 不通过构造函数传入，因为 CREATE2 会根据 initcode 计算出新地址（new_address = hash(0xFF, sender, salt, bytecode)），带上参数就不能计算出稳定的地址了
        (factory, token0, token1, tickLower, tickUpper, fee) = IFactory(
            msg.sender
        ).parameters();
    }

    /// @notice 初始化池子当前价格（仅可调用一次）。价格必须落在 [tickLower, tickUpper) 内，否则无法激活流动性。
    /// @param sqrtPriceX96_ 当前价格的平方根，Q64.96 格式
    function initialize(uint160 sqrtPriceX96_) external override {
        require(sqrtPriceX96 == 0, "INITIALIZED");
        // 通过价格获取 tick，判断 tick 是否在 tickLower 和 tickUpper 之间
        tick = TickMath.getTickAtSqrtPrice(sqrtPriceX96_);
        require(
            tick >= tickLower && tick < tickUpper,
            "sqrtPriceX96 should be within the range of [tickLower, tickUpper)"
        );
        // 初始化 Pool 的 sqrtPriceX96
        sqrtPriceX96 = sqrtPriceX96_;
    }

    struct ModifyPositionParams {
        // the address that owns the position
        address owner;
        // any change in liquidity
        int128 liquidityDelta;
    }

    function _modifyPosition(
        ModifyPositionParams memory params
    ) private returns (int256 amount0, int256 amount1) {
        // 通过新增的流动性计算 amount0 和 amount1
        // 参考 UniswapV3 的代码

        amount0 = SqrtPriceMath.getAmount0Delta(
            sqrtPriceX96,
            TickMath.getSqrtPriceAtTick(tickUpper),
            params.liquidityDelta
        );

        amount1 = SqrtPriceMath.getAmount1Delta(
            TickMath.getSqrtPriceAtTick(tickLower),
            sqrtPriceX96,
            params.liquidityDelta
        );
        Position storage position = positions[params.owner];

        // 提取手续费，计算从上一次提取到当前的手续费
        uint128 tokensOwed0 = uint128(
            FullMath.mulDiv(
                feeGrowthGlobal0X128 - position.feeGrowthInside0LastX128,
                position.liquidity,
                FixedPoint128.Q128
            )
        );
        uint128 tokensOwed1 = uint128(
            FullMath.mulDiv(
                feeGrowthGlobal1X128 - position.feeGrowthInside1LastX128,
                position.liquidity,
                FixedPoint128.Q128
            )
        );

        // 更新提取手续费的记录，同步到当前最新的 feeGrowthGlobal0X128，代表都提取完了
        position.feeGrowthInside0LastX128 = feeGrowthGlobal0X128;
        position.feeGrowthInside1LastX128 = feeGrowthGlobal1X128;
        // 把可以提取的手续费记录到 tokensOwed0 和 tokensOwed1 中
        // LP 可以通过 collect 来最终提取到用户自己账户上
        if (tokensOwed0 > 0 || tokensOwed1 > 0) {
            position.tokensOwed0 += tokensOwed0;
            position.tokensOwed1 += tokensOwed1;
        }

        // 修改 liquidity
        liquidity = LiquidityMath.addDelta(liquidity, params.liquidityDelta);
        position.liquidity = LiquidityMath.addDelta(
            position.liquidity,
            params.liquidityDelta
        );
    }

    /// @dev Get the pool's balance of token0
    /// @dev This function is gas optimized to avoid a redundant extcodesize check in addition to the returndatasize
    /// check
    function balance0() private view returns (uint256) {
        (bool success, bytes memory data) = token0.staticcall(
            abi.encodeWithSelector(IERC20.balanceOf.selector, address(this))
        );
        require(success && data.length >= 32);
        return abi.decode(data, (uint256));
    }

    /// @dev Get the pool's balance of token1
    /// @dev This function is gas optimized to avoid a redundant extcodesize check in addition to the returndatasize
    /// check
    function balance1() private view returns (uint256) {
        (bool success, bytes memory data) = token1.staticcall(
            abi.encodeWithSelector(IERC20.balanceOf.selector, address(this))
        );
        require(success && data.length >= 32);
        return abi.decode(data, (uint256));
    }

    /// @notice 增加流动性：按给定 liquidity 数量向池子注入 token0/token1，并结算至调用前的手续费；由 PositionManager 等外围合约调用，通过 data 回调完成代币转入。
    /// @param recipient 流动性归属地址（position 的 owner）
    /// @param amount 增加的流动性数量
    /// @param data 回调用数据（如 token0/token1/index/payer），用于 mintCallback 中从用户转入代币
    /// @return amount0 本次需要转入的 token0 数量
    /// @return amount1 本次需要转入的 token1 数量
    function mint(
        address recipient,
        uint128 amount,
        bytes calldata data
    ) external override returns (uint256 amount0, uint256 amount1) {
        require(amount > 0, "Mint amount must be greater than 0");
        // 基于 amount 计算出当前需要多少 amount0 和 amount1
        (int256 amount0Int, int256 amount1Int) = _modifyPosition(
            ModifyPositionParams({
                owner: recipient,
                liquidityDelta: int128(amount)
            })
        );
        amount0 = uint256(amount0Int);
        amount1 = uint256(amount1Int);

        uint256 balance0Before;
        uint256 balance1Before;
        if (amount0 > 0) balance0Before = balance0();
        if (amount1 > 0) balance1Before = balance1();
        // 回调 mintCallback
        IMintCallback(msg.sender).mintCallback(amount0, amount1, data);

        if (amount0 > 0)
            require(balance0Before.add(amount0) <= balance0(), "M0");
        if (amount1 > 0)
            require(balance1Before.add(amount1) <= balance1(), "M1");

        emit Mint(msg.sender, recipient, amount, amount0, amount1);
    }

    /// @notice 领取已积累的手续费或 burn 时退出的代币；从 position 的 tokensOwed0/tokensOwed1 中转出至 recipient。
    /// @param recipient 接收代币的地址
    /// @param amount0Requested 希望领取的 token0 数量（实际不超过 tokensOwed0）
    /// @param amount1Requested 希望领取的 token1 数量（实际不超过 tokensOwed1）
    /// @return amount0 实际转出的 token0 数量
    /// @return amount1 实际转出的 token1 数量
    function collect(
        address recipient,
        uint128 amount0Requested,
        uint128 amount1Requested
    ) external override returns (uint128 amount0, uint128 amount1) {
        // 获取当前用户的 position
        Position storage position = positions[msg.sender];

        // 把钱退给用户 recipient
        amount0 = amount0Requested > position.tokensOwed0
            ? position.tokensOwed0
            : amount0Requested;
        amount1 = amount1Requested > position.tokensOwed1
            ? position.tokensOwed1
            : amount1Requested;

        if (amount0 > 0) {
            position.tokensOwed0 -= amount0;
            TransferHelper.safeTransfer(token0, recipient, amount0);
        }
        if (amount1 > 0) {
            position.tokensOwed1 -= amount1;
            TransferHelper.safeTransfer(token1, recipient, amount1);
        }

        emit Collect(msg.sender, recipient, amount0, amount1);
    }

    /// @notice 减少流动性：销毁指定数量的 liquidity，并按当前价格计算应退的 token0/token1，记入 position 的 tokensOwed，需后续通过 collect 提取。
    /// @param amount 要销毁的流动性数量
    /// @return amount0 本次应退的 token0 数量（已加入 tokensOwed）
    /// @return amount1 本次应退的 token1 数量（已加入 tokensOwed）
    function burn(
        uint128 amount
    ) external override returns (uint256 amount0, uint256 amount1) {
        require(amount > 0, "Burn amount must be greater than 0");
        require(
            amount <= positions[msg.sender].liquidity,
            "Burn amount exceeds liquidity"
        );
        // 修改 positions 中的信息
        (int256 amount0Int, int256 amount1Int) = _modifyPosition(
            ModifyPositionParams({
                owner: msg.sender,
                liquidityDelta: -int128(amount)
            })
        );
        // 获取燃烧后的 amount0 和 amount1
        amount0 = uint256(-amount0Int);
        amount1 = uint256(-amount1Int);

        if (amount0 > 0 || amount1 > 0) {
            (
                positions[msg.sender].tokensOwed0,
                positions[msg.sender].tokensOwed1
            ) = (
                positions[msg.sender].tokensOwed0 + uint128(amount0),
                positions[msg.sender].tokensOwed1 + uint128(amount1)
            );
        }

        emit Burn(msg.sender, amount, amount0, amount1);
    }

    // 交易中需要临时存储的变量
    struct SwapState {
        // the amount remaining to be swapped in/out of the input/output asset
        int256 amountSpecifiedRemaining;
        // the amount already swapped out/in of the output/input asset
        int256 amountCalculated;
        // current sqrt(price)
        uint160 sqrtPriceX96;
        // the global fee growth of the input token
        uint256 feeGrowthGlobalX128;
        // 该交易中用户转入的 token0 的数量
        uint256 amountIn;
        // 该交易中用户转出的 token1 的数量
        uint256 amountOut;
        // 该交易中的手续费，如果 zeroForOne 是 ture，则是用户转入 token0，单位是 token0 的数量，反正是 token1 的数量
        uint256 feeAmount;
    }

    /// @notice 在池子内执行一次兑换：按指定输入/输出数量与价格限制更新池子价格并收取手续费，通过回调转入输入代币、向 recipient 转出输出代币。
    /// @param recipient 接收输出代币的地址
    /// @param zeroForOne true 表示用 token0 换 token1，false 表示用 token1 换 token0
    /// @param amountSpecified 指定数量：>0 表示精确输入（输入 token 数量），<0 表示精确输出（输出 token 数量）
    /// @param sqrtPriceLimitX96 价格边界，防止滑点过大
    /// @param data 回调数据，供 SwapRouter 等识别 payer 并执行 transferFrom
    /// @return amount0 本次兑换导致的 token0 变化（正为流入、负为流出）
    /// @return amount1 本次兑换导致的 token1 变化（正为流入、负为流出）
    function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes calldata data
    ) external override returns (int256 amount0, int256 amount1) {
        require(amountSpecified != 0, "AS");

        // zeroForOne: 如果从 token0 交换 token1 则为 true，从 token1 交换 token0 则为 false
        // 判断当前价格是否满足交易的条件
        require(
            zeroForOne
                ? sqrtPriceLimitX96 < sqrtPriceX96 &&
                    sqrtPriceLimitX96 > TickMath.MIN_SQRT_PRICE
                : sqrtPriceLimitX96 > sqrtPriceX96 &&
                    sqrtPriceLimitX96 < TickMath.MAX_SQRT_PRICE,
            "SPL"
        );

        // amountSpecified 大于 0 代表用户指定了 token0 的数量，小于 0 代表用户指定了 token1 的数量
        bool exactInput = amountSpecified > 0;

        SwapState memory state = SwapState({
            amountSpecifiedRemaining: amountSpecified,
            amountCalculated: 0,
            sqrtPriceX96: sqrtPriceX96,
            feeGrowthGlobalX128: zeroForOne
                ? feeGrowthGlobal0X128
                : feeGrowthGlobal1X128,
            amountIn: 0,
            amountOut: 0,
            feeAmount: 0
        });

        // 计算交易的上下限，基于 tick 计算价格
        uint160 sqrtPriceX96Lower = TickMath.getSqrtPriceAtTick(tickLower);
        uint160 sqrtPriceX96Upper = TickMath.getSqrtPriceAtTick(tickUpper);
        // 计算用户交易价格的限制，如果是 zeroForOne 是 true，说明用户会换入 token0，会压低 token0 的价格（也就是池子的价格），所以要限制最低价格不能超过 sqrtPriceX96Lower
        uint160 sqrtPriceX96PoolLimit = zeroForOne
            ? sqrtPriceX96Lower
            : sqrtPriceX96Upper;

        // 计算交易的具体数值
        (
            state.sqrtPriceX96,
            state.amountIn,
            state.amountOut,
            state.feeAmount
        ) = SwapMath.computeSwapStep(
            sqrtPriceX96,
            (
                zeroForOne
                    ? sqrtPriceX96PoolLimit < sqrtPriceLimitX96
                    : sqrtPriceX96PoolLimit > sqrtPriceLimitX96
            )
                ? sqrtPriceLimitX96
                : sqrtPriceX96PoolLimit,
            liquidity,
            amountSpecified,
            fee
        );

        // 更新新的价格
        sqrtPriceX96 = state.sqrtPriceX96;
        tick = TickMath.getTickAtSqrtPrice(state.sqrtPriceX96);

        // 计算手续费
        state.feeGrowthGlobalX128 += FullMath.mulDiv(
            state.feeAmount,
            FixedPoint128.Q128,
            liquidity
        );

        // 更新手续费相关信息
        if (zeroForOne) {
            feeGrowthGlobal0X128 = state.feeGrowthGlobalX128;
        } else {
            feeGrowthGlobal1X128 = state.feeGrowthGlobalX128;
        }

        // 计算交易后用户手里的 token0 和 token1 的数量
        if (exactInput) {
            state.amountSpecifiedRemaining -= (state.amountIn + state.feeAmount)
                .toInt256();
            state.amountCalculated = state.amountCalculated.sub(
                state.amountOut.toInt256()
            );
        } else {
            state.amountSpecifiedRemaining += state.amountOut.toInt256();
            state.amountCalculated = state.amountCalculated.add(
                (state.amountIn + state.feeAmount).toInt256()
            );
        }

        (amount0, amount1) = zeroForOne == exactInput
            ? (
                amountSpecified - state.amountSpecifiedRemaining,
                state.amountCalculated
            )
            : (
                state.amountCalculated,
                amountSpecified - state.amountSpecifiedRemaining
            );

        if (zeroForOne) {
            // callback 中需要给 Pool 转入 token
            uint256 balance0Before = balance0();
            ISwapCallback(msg.sender).swapCallback(amount0, amount1, data);
            require(balance0Before.add(uint256(amount0)) <= balance0(), "IIA");

            // 转 Token 给用户
            if (amount1 < 0)
                TransferHelper.safeTransfer(
                    token1,
                    recipient,
                    uint256(-amount1)
                );
        } else {
            // callback 中需要给 Pool 转入 token
            uint256 balance1Before = balance1();
            ISwapCallback(msg.sender).swapCallback(amount0, amount1, data);
            require(balance1Before.add(uint256(amount1)) <= balance1(), "IIA");

            // 转 Token 给用户
            if (amount0 < 0)
                TransferHelper.safeTransfer(
                    token0,
                    recipient,
                    uint256(-amount0)
                );
        }

        emit Swap(
            msg.sender,
            recipient,
            amount0,
            amount1,
            sqrtPriceX96,
            liquidity,
            tick
        );
    }
}
