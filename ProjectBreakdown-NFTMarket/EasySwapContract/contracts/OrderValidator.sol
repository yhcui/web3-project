// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

import {Price} from "./libraries/RedBlackTreeLibrary.sol";
import {LibOrder, OrderKey} from "./libraries/LibOrder.sol";

/**
 * 负责验证订单的有效性（如过期检查、签名验证等），并记录订单的成交状态 (filledAmount)
 * @title Verify the validity of the order parameters.
 */
abstract contract OrderValidator is
    Initializable,
    ContextUpgradeable,
    EIP712Upgradeable
{
    bytes4 private constant EIP_1271_MAGIC_VALUE = 0x1626ba7e;

    uint256 private constant CANCELLED = type(uint256).max;

    /*
    filledAmount 是一个非常关键的状态变量。它主要承担两个核心职责：防止订单重放（幂等性检查） 和 追踪成交进度
    1、防止重复挂单 (Replay Protection)
    这是在 makeOrders 阶段最直接的作用。

    逻辑：系统通过 LibOrder.hash(order) 计算出订单的唯一标识 OrderKey。

    检查：在创建新订单前，合约会检查 filledAmount[orderKey]。

    目的：如果这个位置已经有值（比如大于 0 或等于 CANCELLED 常量），说明一个完全相同的订单（相同的 maker、价格、salt 等）已经存在于系统中了。此时 _makeOrderTry 会返回 SENTINEL（零值），防止同一个订单被多次插入红黑树，从而导致账目混乱。
    
    2、追踪成交进度 (Fill Tracking)
    虽然名字叫 filledAmount（已成交数量），但它实际上记录了该订单已经“消耗”了多少额度。

    对于 ERC721（数量通常为 1）：

    0：代表订单全新，尚未成交。

    1：代表订单已完全成交，不能再被匹配。

    对于多数量资产（如 ERC1155 或类似逻辑）：它记录了已经买走/卖走了多少个。当 filledAmount 达到 order.nft.amount 时，该订单被视为“完成 (Closed)”。
        
    3、处理取消状态 (Cancellation)
    在 OrderValidator.sol 中，你可以看到一个特殊的常量： uint256 private constant CANCELLED = type(uint256).max;

    当用户手动取消订单时，合约会将 filledAmount[orderKey] 设置为这个最大值。

    在 _makeOrderTry 或 matchOrder 中，只要发现 filledAmount 是这个特殊值，系统就会知道该订单已失效，从而拒绝任何操作。
    */
    // fillsStat record orders filled status, key is the order hash,
    // and value is filled amount.
    // Value CANCELLED means the order has been canceled.
    mapping(OrderKey => uint256) public filledAmount;

    function __OrderValidator_init(
        string memory EIP712Name,
        string memory EIP712Version
    ) internal onlyInitializing {
        __Context_init();
        __EIP712_init(EIP712Name, EIP712Version);
        __OrderValidator_init_unchained();
    }

    function __OrderValidator_init_unchained() internal onlyInitializing {}

    /**
     * @notice Validate order parameters.
     * @param order  Order to validate.
     * @param isSkipExpiry  Skip expiry check if true.
     */
    function _validateOrder(
        LibOrder.Order memory order,
        bool isSkipExpiry
    ) internal view {
        // Order must have a maker.
        require(order.maker != address(0), "OVa: miss maker");
        // Order must be started and not be expired.

        if (!isSkipExpiry) { // Skip expiry check if true.
            require(
                order.expiry == 0 || order.expiry > block.timestamp,
                "OVa: expired"
            );
        }
        // Order salt cannot be 0.
        require(order.salt != 0, "OVa: zero salt");

        if (order.side == LibOrder.Side.List) {
            require(
                order.nft.collection != address(0),
                "OVa: unsupported nft asset"
            );
        } else if (order.side == LibOrder.Side.Bid) {
            require(Price.unwrap(order.price) > 0, "OVa: zero price");
        }
    }

    /**
     * @notice Get filled amount of orders.
     * @param orderKey  The hash of the order.
     * @return orderFilledAmount Has completed fill amount of sell order (0 if order is unfilled).
     */
    function _getFilledAmount(
        OrderKey orderKey
    ) internal view returns (uint256 orderFilledAmount) {
        // Get has completed fill amount.
        orderFilledAmount = filledAmount[orderKey];
        // Cancelled order cannot be matched.
        require(orderFilledAmount != CANCELLED, "OVa: canceled");
    }

    /**
     * @notice Update filled amount of orders.
     * @param newAmount  New fill amount of order.
     * @param orderKey  The hash of the order.
     */
    function _updateFilledAmount(
        uint256 newAmount,
        OrderKey orderKey
    ) internal {
        require(newAmount != CANCELLED, "OVa: canceled");
        filledAmount[orderKey] = newAmount;
    }

    /**
     * @notice Cancel order.
     * @dev Cancelled orders cannot be reopened.
     * @param orderKey  The hash of the order.
     */
    function _cancelOrder(OrderKey orderKey) internal {
        filledAmount[orderKey] = CANCELLED;
    }

    uint256[50] private __gap;
}
