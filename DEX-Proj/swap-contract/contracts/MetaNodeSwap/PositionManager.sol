// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./libraries/LiquidityAmounts.sol";
import "./libraries/TickMath.sol";
import "./libraries/FixedPoint128.sol";

import "./interfaces/IPositionManager.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IPoolManager.sol";

/// @title PositionManager
/// @notice 头寸管理合约：将「流动性头寸」铸成 ERC721 NFT，LP 通过 mint 注入流动性获得 NFT，通过 burn 撤出流动性、通过 collect 领取手续费与退出代币。
/// @dev 实际流动性在 Pool 中，本合约以 NFT 持有者为 owner 代理与 Pool 交互；实现 IMintCallback，在 Pool.mint 回调中从 payer 转入 token0/token1。
contract PositionManager is IPositionManager, ERC721 {
    /// @notice PoolManager 地址，用于根据 (token0, token1, index) 解析池子并执行 mint/burn/collect。
    IPoolManager public poolManager;

    /// @dev The ID of the next token that will be minted. Skips 0
    uint176 private _nextId = 1;

    constructor(address _poolManger) ERC721("MetaNodeSwapPosition", "MNSP") {
        poolManager = IPoolManager(_poolManger);
    }

    // 用一个 mapping 来存放所有 Position 的信息
    mapping(uint256 => PositionInfo) public positions;

    /// @notice 返回当前合约内所有已铸造头寸的元数据（id、owner、代币对、区间、流动性、待领手续费等），用于前端展示或批量查询。
    function getAllPositions()
        external
        view
        override
        returns (PositionInfo[] memory positionInfo)
    {
        positionInfo = new PositionInfo[](_nextId - 1);
        for (uint32 i = 0; i < _nextId - 1; i++) {
            positionInfo[i] = positions[i + 1];
        }
        return positionInfo;
    }

    function getSender() public view returns (address) {
        return msg.sender;
    }

    function _blockTimestamp() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    modifier checkDeadline(uint256 deadline) {
        require(_blockTimestamp() <= deadline, "Transaction too old");
        _;
    }

    /// @notice 在指定池子中按期望的 amount0/amount1 计算并注入流动性，铸造一枚 NFT 给 recipient，代表该头寸；调用前需对 token0、token1 授权足够额度。
    /// @param params 包含 token0、token1、index、数量期望、recipient、deadline 等
    /// @return positionId 新铸造的 NFT tokenId（即头寸 ID）
    /// @return liquidity 本次注入的流动性数量
    /// @return amount0 实际使用的 token0 数量
    /// @return amount1 实际使用的 token1 数量
    function mint(
        MintParams calldata params
    )
        external
        payable
        override
        checkDeadline(params.deadline)
        returns (
            uint256 positionId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        // mint 一个 NFT 作为 position 发给 LP
        // NFT 的 tokenId 就是 positionId
        // 通过 MintParams 里面的 token0 和 token1 以及 index 获取对应的 Pool
        // 调用 poolManager 的 getPool 方法获取 Pool 地址
        address _pool = poolManager.getPool(
            params.token0,
            params.token1,
            params.index
        );
        IPool pool = IPool(_pool);

        // 通过获取 pool 相关信息，结合 params.amount0Desired 和 params.amount1Desired 计算这次要注入的流动性

        uint160 sqrtPriceX96 = pool.sqrtPriceX96();
        uint160 sqrtRatioAX96 = TickMath.getSqrtPriceAtTick(pool.tickLower());
        uint160 sqrtRatioBX96 = TickMath.getSqrtPriceAtTick(pool.tickUpper());

        liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            sqrtRatioAX96,
            sqrtRatioBX96,
            params.amount0Desired,
            params.amount1Desired
        );

        // data 是 mint 后回调 PositionManager 会额外带的数据
        // 需要 PoistionManger 实现回调，在回调中给 Pool 打钱
        bytes memory data = abi.encode(
            params.token0,
            params.token1,
            params.index,
            msg.sender
        );

        (amount0, amount1) = pool.mint(address(this), liquidity, data);

        _mint(params.recipient, (positionId = _nextId++));

        (
            ,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            ,

        ) = pool.getPosition(address(this));

        positions[positionId] = PositionInfo({
            id: positionId,
            owner: params.recipient,
            token0: params.token0,
            token1: params.token1,
            index: params.index,
            fee: pool.fee(),
            liquidity: liquidity,
            tickLower: pool.tickLower(),
            tickUpper: pool.tickUpper(),
            tokensOwed0: 0,
            tokensOwed1: 0,
            feeGrowthInside0LastX128: feeGrowthInside0LastX128,
            feeGrowthInside1LastX128: feeGrowthInside1LastX128
        });
    }

    modifier isAuthorizedForToken(uint256 tokenId) {
        address owner = ERC721.ownerOf(tokenId);
        require(_isAuthorized(owner, msg.sender, tokenId), "Not approved");
        _;
    }

    /// @notice 撤销指定头寸的全部流动性：从池子 burn 对应 liquidity，应得 token0/token1 与未领手续费一并记入该头寸的 tokensOwed，需后续调用 collect 取回；若流动性为 0 且已领完，collect 时会销毁 NFT。
    /// @param positionId NFT tokenId（头寸 ID）
    /// @return amount0 本次撤出对应的 token0 数量（已累加到 tokensOwed，未实际转出）
    /// @return amount1 本次撤出对应的 token1 数量（已累加到 tokensOwed，未实际转出）
    function burn(
        uint256 positionId
    )
        external
        override
        isAuthorizedForToken(positionId)
        returns (uint256 amount0, uint256 amount1)
    {
        PositionInfo storage position = positions[positionId];
        // 通过 isAuthorizedForToken 检查 positionId 是否有权限
        // 移除流动性，但是 token 还是保留在 pool 中，需要再调用 collect 方法才能取回 token
        // 通过 positionId 获取对应 LP 的流动性
        uint128 _liquidity = position.liquidity;
        // 调用 Pool 的方法给 LP 退流动性
        address _pool = poolManager.getPool(
            position.token0,
            position.token1,
            position.index
        );
        IPool pool = IPool(_pool);
        (amount0, amount1) = pool.burn(_liquidity);

        // 计算这部分流动性产生的手续费
        (
            ,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            ,

        ) = pool.getPosition(address(this));

        position.tokensOwed0 +=
            uint128(amount0) +
            uint128(
                FullMath.mulDiv(
                    feeGrowthInside0LastX128 -
                        position.feeGrowthInside0LastX128,
                    position.liquidity,
                    FixedPoint128.Q128
                )
            );

        position.tokensOwed1 +=
            uint128(amount1) +
            uint128(
                FullMath.mulDiv(
                    feeGrowthInside1LastX128 -
                        position.feeGrowthInside1LastX128,
                    position.liquidity,
                    FixedPoint128.Q128
                )
            );

        // 更新 position 的信息
        position.feeGrowthInside0LastX128 = feeGrowthInside0LastX128;
        position.feeGrowthInside1LastX128 = feeGrowthInside1LastX128;
        position.liquidity = 0;
    }

    /// @notice 领取指定头寸的 tokensOwed0/tokensOwed1（手续费 + burn 应退代币）到 recipient；若该头寸流动性已为 0 且领完则销毁对应 NFT。
    /// @param positionId 头寸 NFT 的 tokenId
    /// @param recipient 接收代币的地址
    /// @return amount0 实际转出的 token0 数量
    /// @return amount1 实际转出的 token1 数量
    function collect(
        uint256 positionId,
        address recipient
    )
        external
        override
        isAuthorizedForToken(positionId)
        returns (uint256 amount0, uint256 amount1)
    {
        // 通过 isAuthorizedForToken 检查 positionId 是否有权限
        // 调用 Pool 的方法给 LP 退流动性
        PositionInfo storage position = positions[positionId];
        address _pool = poolManager.getPool(
            position.token0,
            position.token1,
            position.index
        );
        IPool pool = IPool(_pool);
        (amount0, amount1) = pool.collect(
            recipient,
            position.tokensOwed0,
            position.tokensOwed1
        );

        // position 已经彻底没用了，销毁
        position.tokensOwed0 = 0;
        position.tokensOwed1 = 0;

        if (position.liquidity == 0) {
            _burn(positionId);
        }
    }

    /// @notice Pool.mint 的回调：从 data 解码出 token0、token1、index、payer，校验调用方为合法池子后，从 payer 向 Pool 转入 amount0/amount1；用户须已对 PositionManager 授权。
    function mintCallback(
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external override {
        // 检查 callback 的合约地址是否是 Pool
        (address token0, address token1, uint32 index, address payer) = abi
            .decode(data, (address, address, uint32, address));
        address _pool = poolManager.getPool(token0, token1, index);
        require(_pool == msg.sender, "Invalid callback caller");

        // 在这里给 Pool 打钱，需要用户先 approve 足够的金额，这里才会成功
        if (amount0 > 0) {
            IERC20(token0).transferFrom(payer, msg.sender, amount0);
        }
        if (amount1 > 0) {
            IERC20(token1).transferFrom(payer, msg.sender, amount1);
        }
    }
}
