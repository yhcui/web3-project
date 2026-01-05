// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Price} from "./RedBlackTreeLibrary.sol";

// 通过对订单参数进行哈希处理生成的唯一标识符（bytes32），用于在 OrderStorage 中检索订单
type OrderKey is bytes32;

library LibOrder {
    // 买卖方向 (Side)
    enum Side {
        List, // 挂单 (List)：卖家创建订单时，NFT 会直接转入 EasySwapVault 进行托管
        Bid // 报价 (Bid)：买家创建订单时，需要存入相应数额的 ETH 到 Vault
    }

    // 交易类型 (SaleKind)
    enum SaleKind {
        /*
        卖单 (List)：（较少见）表示卖家愿意以该价格出售该系列中的任意一个 NFT。
        买单 (Bid)：这是该模式最核心的用法。买家发布一个报价，表示：“只要是这个系列的 NFT，无论编号是多少，我都愿意以 X 价格买入一个”。
        撮合逻辑：在 OrderStorage.sol 的代码中可以看到，当交易类型为 FixedPriceForCollection 时，系统在搜索最优订单时会跳过对 tokenId 的严格匹配。只要卖家持有该系列中的任意一个 Token，就可以接受这个买单。
        */
        FixedPriceForCollection,  // 针对整个系列的固定价格 称为 “系列报价” (Collection Offer) 或 “扫地板” 模式。
        FixedPriceForItem // 针对特定物品的固定价格
    }

// 资产信息 (Asset)
    struct Asset {
        uint256 tokenId;
        // 在区块链上，区分两个 NFT 是否属于同一个系列，唯一的标准就是它们的 collection 地址是否相同。
        address collection; // NFT 所属的智能合约地址
        uint96 amount;
    }

    struct NFTInfo {
        address collection;
        uint256 tokenId;
    }

    struct Order {
        Side side; // 订单买卖方向 
        SaleKind saleKind; // 交易类型
        address maker; // 挂单者 / 创建者
        Asset nft;
        Price price; // unit price of nft
        uint64 expiry;
        uint64 salt; // 随机数，防止哈希碰撞,有了这个，order key 就可以唯一标识一个订单了
    }

    struct DBOrder {
        Order order;
        OrderKey next; // byte32
    }

    /// @dev Order queue: used to store orders of the same price
    struct OrderQueue {
        OrderKey head;
        OrderKey tail;
    }

    struct EditDetail {
        OrderKey oldOrderKey; // old order key which need to be edit
        LibOrder.Order newOrder; // new order struct which need to be add
    }

    struct MatchDetail {
        LibOrder.Order sellOrder;
        LibOrder.Order buyOrder;
    }

    OrderKey public constant ORDERKEY_SENTINEL = OrderKey.wrap(0x0);

    bytes32 public constant ASSET_TYPEHASH =
        keccak256("Asset(uint256 tokenId,address collection,uint96 amount)");

    bytes32 public constant ORDER_TYPEHASH =
        keccak256(
            "Order(uint8 side,uint8 saleKind,address maker,Asset nft,uint128 price,uint64 expiry,uint64 salt)Asset(uint256 tokenId,address collection,uint96 amount)"
        );

    function hash(Asset memory asset) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    ASSET_TYPEHASH,
                    asset.tokenId,
                    asset.collection,
                    asset.amount
                )
            );
    }

    function hash(Order memory order) internal pure returns (OrderKey) {
        return
            OrderKey.wrap(
                keccak256(
                    abi.encodePacked(
                        ORDER_TYPEHASH,
                        order.side,
                        order.saleKind,
                        order.maker,
                        hash(order.nft),
                        Price.unwrap(order.price),
                        order.expiry,
                        order.salt
                    )
                )
            );
    }

    function isSentinel(OrderKey orderKey) internal pure returns (bool) {
        return OrderKey.unwrap(orderKey) == OrderKey.unwrap(ORDERKEY_SENTINEL);
    }

    function isNotSentinel(OrderKey orderKey) internal pure returns (bool) {
        return OrderKey.unwrap(orderKey) != OrderKey.unwrap(ORDERKEY_SENTINEL);
    }
}
