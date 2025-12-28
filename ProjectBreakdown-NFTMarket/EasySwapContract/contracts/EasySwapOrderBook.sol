// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import {LibTransferSafeUpgradeable, IERC721} from "./libraries/LibTransferSafeUpgradeable.sol";
import {Price} from "./libraries/RedBlackTreeLibrary.sol";
import {LibOrder, OrderKey} from "./libraries/LibOrder.sol";
import {LibPayInfo} from "./libraries/LibPayInfo.sol";

import {IEasySwapOrderBook} from "./interface/IEasySwapOrderBook.sol";
import {IEasySwapVault} from "./interface/IEasySwapVault.sol";

import {OrderStorage} from "./OrderStorage.sol";
import {OrderValidator} from "./OrderValidator.sol";
import {ProtocolManager} from "./ProtocolManager.sol";
/*
这是用户的主要入口。
它集成了订单存储、验证和协议管理功能。
主要负责订单的创建 (makeOrders)、取消 (cancelOrders)、编辑 (editOrders) 以及撮合交易 (matchOrder, matchOrders)。

*/
contract EasySwapOrderBook is
    IEasySwapOrderBook,
    Initializable,
    ContextUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    OrderStorage,
    ProtocolManager,
    OrderValidator
{
    using LibTransferSafeUpgradeable for address;
    using LibTransferSafeUpgradeable for IERC721;

    event LogMake(
        OrderKey orderKey,
        LibOrder.Side indexed side,
        LibOrder.SaleKind indexed saleKind,
        address indexed maker,
        LibOrder.Asset nft,
        Price price,
        uint64 expiry,
        uint64 salt
    );

    event LogCancel(OrderKey indexed orderKey, address indexed maker);

    event LogMatch(
        OrderKey indexed makeOrderKey,
        OrderKey indexed takeOrderKey,
        LibOrder.Order makeOrder,
        LibOrder.Order takeOrder,
        uint128 fillPrice
    );

    event LogWithdrawETH(address recipient, uint256 amount);
    event BatchMatchInnerError(uint256 offset, bytes msg);
    event LogSkipOrder(OrderKey orderKey, uint64 salt);

    modifier onlyDelegateCall() {
        _checkDelegateCall();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable state-variable-assignment
    address private immutable self = address(this);

    address private _vault;

    /**
     * @notice Initialize contracts.
     * @param newProtocolShare Default protocol fee.
     * @param newVault easy swap vault address.
     */
    function initialize(
        uint128 newProtocolShare,
        address newVault,
        string memory EIP712Name,
        string memory EIP712Version
    ) public initializer {
        __EasySwapOrderBook_init(
            newProtocolShare,
            newVault,
            EIP712Name,
            EIP712Version
        );
    }

    function __EasySwapOrderBook_init(
        uint128 newProtocolShare,
        address newVault,
        string memory EIP712Name,
        string memory EIP712Version
    ) internal onlyInitializing {
        __EasySwapOrderBook_init_unchained(
            newProtocolShare,
            newVault,
            EIP712Name,
            EIP712Version
        );
    }

    // 这四个参数共同完成了合约的资产路径设置（Vault）、盈利模式配置（ProtocolShare）以及交易安全校验体系（EIP712 的名称和版本）
    function __EasySwapOrderBook_init_unchained(
        uint128 newProtocolShare, // 协议手续费比例
        address newVault, // 金库地址

        // EIP-712 域名 用于结构化数据签名的项目名称（例如 "EasySwap"） 它是 OrderValidator 中签名校验逻辑的一部分。
        // 在用户签名订单时，该名称会包含在签名哈希中，防止签名在不同项目间被“重放攻击”。
        string memory EIP712Name, 

        // EIP-712 版本号
        // 配合 EIP712Name 使用，确保当合约逻辑发生重大升级或版本更迭时，旧版本的签名不会在当前新版本的合约中生效，增强安全性
        string memory EIP712Version
    ) internal onlyInitializing {
        __Context_init();
        __Ownable_init(_msgSender());
        __ReentrancyGuard_init();
        __Pausable_init();

        __OrderStorage_init();
        __ProtocolManager_init(newProtocolShare);
        __OrderValidator_init(EIP712Name, EIP712Version);

        setVault(newVault);
    }

    /**
     * @notice Create multiple orders and transfer related assets.
     * @dev If Side=List, you need to authorize the EasySwapVault contract first (creating a List order will transfer the NFT to the order pool).
     * @dev If Side=Bid, you need to pass {value}: the price of the bid (similarly, creating a Bid order will transfer ETH to the order pool).
     * @dev order.maker needs to be msg.sender.
     * @dev order.price cannot be 0.
     * @dev order.expiry needs to be greater than block.timestamp, or 0.
     * @dev order.salt cannot be 0.
     * @param newOrders Multiple order structure data.
     * @return newOrderKeys The unique id of the order is returned in order, if the id is empty, the corresponding order was not created correctly.
     */
    /*
        输入：一个 Order 结构体数组，允许用户一次性批量挂出多个订单（节省 Gas）。
        输出：返回一个 OrderKey 数组，这是每个订单在系统中的唯一 ID（由订单参数哈希而成）。
        修饰符：payable（因为创建买单需要发送 ETH），nonReentrant（防重入），whenNotPaused（暂停检查）。
    */
    function makeOrders(
        LibOrder.Order[] calldata newOrders
    )
        external
        payable
        override
        whenNotPaused
        nonReentrant
        returns (OrderKey[] memory newOrderKeys)
    {
        uint256 orderAmount = newOrders.length;
        newOrderKeys = new OrderKey[](orderAmount);

        // 计算买单总的价格
        uint128 ETHAmount; // total eth amount
        for (uint256 i = 0; i < orderAmount; ++i) {
            // 计算买单中一个订单的价格
            uint128 buyPrice; // the price of bid order
            if (newOrders[i].side == LibOrder.Side.Bid) {
                // 单价*数量
                buyPrice =
                    Price.unwrap(newOrders[i].price) *
                    newOrders[i].nft.amount;
            }

            OrderKey newOrderKey = _makeOrderTry(newOrders[i], buyPrice);
            newOrderKeys[i] = newOrderKey;
            if (
                // if the order is not created successfully, the eth will be returned
                OrderKey.unwrap(newOrderKey) !=
                OrderKey.unwrap(LibOrder.ORDERKEY_SENTINEL)
            ) {
                ETHAmount += buyPrice;
            }
        }
        // 多退机制
        // 这里没有少补机制，原因在 _makeOrderTry 中，内部会调用 Vault.depositETH，如果 msg.value 不足以支撑已尝试创建的买单，那里的底层调用会直接 revert
        if (msg.value > ETHAmount) {
            // return the remaining eth，if the eth is not enough, the transaction will be reverted
            _msgSender().safeTransferETH(msg.value - ETHAmount);
        }
    }

    /**
     * @dev Cancels multiple orders by their order keys.
     * @param orderKeys The array of order keys to cancel.
     */
    function cancelOrders(
        OrderKey[] calldata orderKeys
    )
        external
        override
        whenNotPaused
        nonReentrant
        returns (bool[] memory successes)
    {
        successes = new bool[](orderKeys.length);

        for (uint256 i = 0; i < orderKeys.length; ++i) {
            bool success = _cancelOrderTry(orderKeys[i]);
            successes[i] = success;
        }
    }

    /**
     * @notice Cancels multiple orders by their order keys.
     * @dev newOrder's saleKind, side, maker, and nft must match the corresponding order of oldOrderKey, otherwise it will be skipped; only the price can be modified.
     * @dev newOrder's expiry and salt can be regenerated.
     * @param editDetails The edit details of oldOrderKey and new order info
     * @return newOrderKeys The unique id of the order is returned in order, if the id is empty, the corresponding order was not edit correctly.
     */
    function editOrders(
        LibOrder.EditDetail[] calldata editDetails
    )
        external
        payable
        override
        whenNotPaused
        nonReentrant
        returns (OrderKey[] memory newOrderKeys)
    {
        newOrderKeys = new OrderKey[](editDetails.length);

        uint256 bidETHAmount;
        for (uint256 i = 0; i < editDetails.length; ++i) {
            (OrderKey newOrderKey, uint256 bidPrice) = _editOrderTry(
                editDetails[i].oldOrderKey,
                editDetails[i].newOrder
            );
            bidETHAmount += bidPrice;
            newOrderKeys[i] = newOrderKey;
        }

        if (msg.value > bidETHAmount) {
            _msgSender().safeTransferETH(msg.value - bidETHAmount);
        }
    }

    // 单笔撮合
    function matchOrder(
        LibOrder.Order calldata sellOrder,
        LibOrder.Order calldata buyOrder
    ) external payable override whenNotPaused nonReentrant {
        uint256 costValue = _matchOrder(sellOrder, buyOrder, msg.value);
        if (msg.value > costValue) {
            _msgSender().safeTransferETH(msg.value - costValue);
        }
    }

    /**
     * @dev Matches multiple orders atomically.
     * @dev If buying NFT, use the "valid sellOrder order" and construct a matching buyOrder order for order matching:
     * @dev    buyOrder.side = Bid, buyOrder.saleKind = FixedPriceForItem, buyOrder.maker = msg.sender,
     * @dev    nft and price values are the same as sellOrder, buyOrder.expiry > block.timestamp, buyOrder.salt != 0;
     * @dev If selling NFT, use the "valid buyOrder order" and construct a matching sellOrder order for order matching:
     * @dev    sellOrder.side = List, sellOrder.saleKind = FixedPriceForItem, sellOrder.maker = msg.sender,
     * @dev    nft and price values are the same as buyOrder, sellOrder.expiry > block.timestamp, sellOrder.salt != 0;
     * @param matchDetails Array of `MatchDetail` structs containing the details of sell and buy order to be matched.
     */
    // 批量撮合
    /// @custom:oz-upgrades-unsafe-allow delegatecall
    function matchOrders(
        LibOrder.MatchDetail[] calldata matchDetails
    )
        external
        payable
        override
        whenNotPaused
        nonReentrant
        returns (bool[] memory successes)
    {
        successes = new bool[](matchDetails.length);

        uint128 buyETHAmount;

        for (uint256 i = 0; i < matchDetails.length; ++i) {
            LibOrder.MatchDetail calldata matchDetail = matchDetails[i];
            (bool success, bytes memory data) = address(this).delegatecall(
                abi.encodeWithSignature(
                    "matchOrderWithoutPayback((uint8,uint8,address,(uint256,address,uint96),uint128,uint64,uint64),(uint8,uint8,address,(uint256,address,uint96),uint128,uint64,uint64),uint256)",
                    matchDetail.sellOrder,
                    matchDetail.buyOrder,
                    msg.value - buyETHAmount
                )
            );

            if (success) {
                successes[i] = success;
                if (matchDetail.buyOrder.maker == _msgSender()) {
                    // buy order
                    uint128 buyPrice;
                    buyPrice = abi.decode(data, (uint128));
                    // Calculate ETH the buyer has spent
                    buyETHAmount += buyPrice;
                }
            } else {
                emit BatchMatchInnerError(i, data);
            }
        }

        if (msg.value > buyETHAmount) {
            // return the remaining eth
            _msgSender().safeTransferETH(msg.value - buyETHAmount);
        }
    }

    function matchOrderWithoutPayback(
        LibOrder.Order calldata sellOrder,
        LibOrder.Order calldata buyOrder,
        uint256 msgValue
    )
        external
        payable
        whenNotPaused
        onlyDelegateCall
        returns (uint128 costValue)
    {
        costValue = _matchOrder(sellOrder, buyOrder, msgValue);
    }
    /*
    在 _makeOrderTry 的执行路径中，filledAmount 并不是主要的拦截防线，真正的“大闸”是 OrderStorage 中的订单内容检查（即你提到的 maker != address(0)）。
    1、 为什么 filledAmount 在创建时没有被修改？
        在你的合约架构中：
        OrderValidator (定义了 filledAmount)：它的职责是校验订单的有效性（是否被取消、是否成交过、签名是否正确）。在 makeOrders 阶段，它只负责读，不负责写。
        OrderStorage (定义了 orders)：它的职责是负责订单的存储与持久化。
        对于一个从未出现过的 orderKey，其 filledAmount 默认为 0 是正确的。如果你连续调用两次 makeOrders 传入完全相同的订单，第一次调用时该值为 0，第二次调用时由于代码没有去写它，它依然是 0。
        所以，单纯靠 filledAmount == 0 确实拦不住重复挂单。
    2、真正的拦截：OrderStorage.sol
      当你调用 _makeOrderTry 时，它最终会尝试将订单写入存储。

    3、filledAmount 的真正作用是什么？
        既然创建时不改它，为什么要检查它？它的作用在于**“全生命周期覆盖”**：

        防重开：如果一个订单曾经成交了（filledAmount > 0）或者被取消了（filledAmount = MAX），即便该订单后来因为某种原因从红黑树中剔除了，filledAmount 也会永久记录该 ID 已失效。

        防篡改：它主要配合 matchOrder 使用。
    */
    function _makeOrderTry(
        LibOrder.Order calldata order,
        uint128 ETHAmount
    ) internal returns (OrderKey newOrderKey) {
        if (
            order.maker == _msgSender() && // only maker can make order
            Price.unwrap(order.price) != 0 && // price cannot be zero
            order.salt != 0 && // salt cannot be zero
            (order.expiry > block.timestamp || order.expiry == 0) && // expiry must be greater than current block timestamp or no expiry
            filledAmount[LibOrder.hash(order)] == 0 // order cannot be canceled or filled。防止重复挂单 (Replay Protection)
            
        ) {
            // 计算出订单的唯一标识 OrderKey
            newOrderKey = LibOrder.hash(order);

            // deposit asset to vault
            if (order.side == LibOrder.Side.List) {
                // 如果是 List (卖单)：调用 Vault.depositNFT，把 NFT 从用户手里存入金库
                if (order.nft.amount != 1) {
                    // limit list order amount to 1
                    return LibOrder.ORDERKEY_SENTINEL;
                }
                IEasySwapVault(_vault).depositNFT(
                    newOrderKey,
                    order.maker,
                    order.nft.collection,
                    order.nft.tokenId
                );
            } else if (order.side == LibOrder.Side.Bid) {
                if (order.nft.amount == 0) {
                    return LibOrder.ORDERKEY_SENTINEL;
                }
                // 如果是 Bid (买单)：调用 Vault.depositETH，把 ETH 锁定在金库中对应的 orderKey 下。
                IEasySwapVault(_vault).depositETH{value: uint256(ETHAmount)}(
                    newOrderKey,
                    ETHAmount
                );
            }

            // 将订单存入 OrderStorage 的红黑树和队列中。
            _addOrder(order);

            emit LogMake(
                newOrderKey,
                order.side,
                order.saleKind,
                order.maker,
                order.nft,
                order.price,
                order.expiry,
                order.salt
            );
        } else {
            emit LogSkipOrder(LibOrder.hash(order), order.salt);
        }
    }

    function _cancelOrderTry(
        OrderKey orderKey
    ) internal returns (bool success) {
        LibOrder.Order memory order = orders[orderKey].order;

        if (
            order.maker == _msgSender() &&
            filledAmount[orderKey] < order.nft.amount // only unfilled order can be canceled
        ) {
            OrderKey orderHash = LibOrder.hash(order);
            _removeOrder(order);
            // withdraw asset from vault
            if (order.side == LibOrder.Side.List) {
                IEasySwapVault(_vault).withdrawNFT(
                    orderHash,
                    order.maker,
                    order.nft.collection,
                    order.nft.tokenId
                );
            } else if (order.side == LibOrder.Side.Bid) {
                uint256 availNFTAmount = order.nft.amount -
                    filledAmount[orderKey];
                IEasySwapVault(_vault).withdrawETH(
                    orderHash,
                    Price.unwrap(order.price) * availNFTAmount, // the withdraw amount of eth
                    order.maker
                );
            }
            _cancelOrder(orderKey);
            success = true;
            emit LogCancel(orderKey, order.maker);
        } else {
            emit LogSkipOrder(orderKey, order.salt);
        }
    }

    function _editOrderTry(
        OrderKey oldOrderKey,
        LibOrder.Order calldata newOrder
    ) internal returns (OrderKey newOrderKey, uint256 deltaBidPrice) {
        LibOrder.Order memory oldOrder = orders[oldOrderKey].order;

        // check order, only the price and amount can be modified
        // 校验旧订单：确保旧订单的 maker 是当前的调用者，且该订单目前处于活跃状态（未成交、未取消）。
        if (
            (oldOrder.saleKind != newOrder.saleKind) ||
            (oldOrder.side != newOrder.side) ||
            (oldOrder.maker != newOrder.maker) ||
            (oldOrder.nft.collection != newOrder.nft.collection) ||
            (oldOrder.nft.tokenId != newOrder.nft.tokenId) ||
            filledAmount[oldOrderKey] >= oldOrder.nft.amount // order cannot be canceled or filled
        ) {
            emit LogSkipOrder(oldOrderKey, oldOrder.salt);
            return (LibOrder.ORDERKEY_SENTINEL, 0);
        }

        // check new order is valid
        // 校验新订单：确保新订单的 maker 是当前的调用者，且该订单目前处于活跃状态（未成交、未取消）。
        if (
            newOrder.maker != _msgSender() ||
            newOrder.salt == 0 ||
            (newOrder.expiry < block.timestamp && newOrder.expiry != 0) ||
            filledAmount[LibOrder.hash(newOrder)] != 0 // order cannot be canceled or filled
        ) {
            emit LogSkipOrder(oldOrderKey, newOrder.salt);
            return (LibOrder.ORDERKEY_SENTINEL, 0);
        }

        // cancel old order
        uint256 oldFilledAmount = filledAmount[oldOrderKey];
        // 将旧订单从红黑树（Price Tree）中移除，并将其在 filledAmount 中标记为已撤销。
        _removeOrder(oldOrder); // remove order from order storage

        // 在 filledAmount 中标记为已撤销。
        _cancelOrder(oldOrderKey); // cancel order from order book
        emit LogCancel(oldOrderKey, oldOrder.maker);

        newOrderKey = _addOrder(newOrder); // add new order to order storage

        // make new order
        // 如果是卖单 (List)
        if (oldOrder.side == LibOrder.Side.List) {
            // 由于 NFT 已经锁在金库里，金库只需将该 NFT 的所有权从 oldOrderKey 映射到 newOrderKey 即可，不需要用户再次转入 NFT
            IEasySwapVault(_vault).editNFT(oldOrderKey, newOrderKey);
        } else if (oldOrder.side == LibOrder.Side.Bid) {
            // 如果是买单 (Bid)：
            uint256 oldRemainingPrice = Price.unwrap(oldOrder.price) *
                (oldOrder.nft.amount - oldFilledAmount);
            uint256 newRemainingPrice = Price.unwrap(newOrder.price) *
                newOrder.nft.amount;
            if (newRemainingPrice > oldRemainingPrice) {
                // 如果新价格更高，_editOrderTry 会计算差价（deltaBidPrice）
                deltaBidPrice = newRemainingPrice - oldRemainingPrice;
                IEasySwapVault(_vault).editETH{value: uint256(deltaBidPrice)}(
                    oldOrderKey,
                    newOrderKey,
                    oldRemainingPrice,
                    newRemainingPrice,
                    oldOrder.maker
                );
            } else {
                // 如果新价格更低，金库会将多出的 ETH 退还，此时 bidPrice 为 0
                IEasySwapVault(_vault).editETH(
                    oldOrderKey,
                    newOrderKey,
                    oldRemainingPrice,
                    newRemainingPrice,
                    oldOrder.maker
                );
            }
        }

        emit LogMake(
            newOrderKey,
            newOrder.side,
            newOrder.saleKind,
            newOrder.maker,
            newOrder.nft,
            newOrder.price,
            newOrder.expiry,
            newOrder.salt
        );
    }

    function _matchOrder(
        LibOrder.Order calldata sellOrder,
        LibOrder.Order calldata buyOrder,
        uint256 msgValue
    ) internal returns (uint128 costValue) {
        OrderKey sellOrderKey = LibOrder.hash(sellOrder);
        OrderKey buyOrderKey = LibOrder.hash(buyOrder);
        _isMatchAvailable(sellOrder, buyOrder, sellOrderKey, buyOrderKey);

        if (_msgSender() == sellOrder.maker) {
            // sell order
            // accept bid
            require(msgValue == 0, "HD: value > 0"); // sell order cannot accept eth
            bool isSellExist = orders[sellOrderKey].order.maker != address(0); // check if sellOrder exist in order storage
            _validateOrder(sellOrder, isSellExist);
            _validateOrder(orders[buyOrderKey].order, false); // check if exist in order storage

            uint128 fillPrice = Price.unwrap(buyOrder.price); // the price of bid order
            if (isSellExist) {
                // check if sellOrder exist in order storage , del&fill if exist
                _removeOrder(sellOrder);
                _updateFilledAmount(sellOrder.nft.amount, sellOrderKey); // sell order totally filled
            }
            _updateFilledAmount(filledAmount[buyOrderKey] + 1, buyOrderKey);
            emit LogMatch(
                sellOrderKey,
                buyOrderKey,
                sellOrder,
                buyOrder,
                fillPrice
            );

            // transfer nft&eth
            IEasySwapVault(_vault).withdrawETH(
                buyOrderKey,
                fillPrice,
                address(this)
            );

            uint128 protocolFee = _shareToAmount(fillPrice, protocolShare);
            sellOrder.maker.safeTransferETH(fillPrice - protocolFee);

            if (isSellExist) {
                IEasySwapVault(_vault).withdrawNFT(
                    sellOrderKey,
                    buyOrder.maker,
                    sellOrder.nft.collection,
                    sellOrder.nft.tokenId
                );
            } else {
                IEasySwapVault(_vault).transferERC721(
                    sellOrder.maker,
                    buyOrder.maker,
                    sellOrder.nft
                );
            }
        } else if (_msgSender() == buyOrder.maker) {
            // buy order
            // accept list
            bool isBuyExist = orders[buyOrderKey].order.maker != address(0);
            _validateOrder(orders[sellOrderKey].order, false); // check if exist in order storage
            _validateOrder(buyOrder, isBuyExist);

            uint128 buyPrice = Price.unwrap(buyOrder.price);
            uint128 fillPrice = Price.unwrap(sellOrder.price);
            if (!isBuyExist) {
                require(msgValue >= fillPrice, "HD: value < fill price");
            } else {
                require(buyPrice >= fillPrice, "HD: buy price < fill price");
                IEasySwapVault(_vault).withdrawETH(
                    buyOrderKey,
                    buyPrice,
                    address(this)
                );
                // check if buyOrder exist in order storage , del&fill if exist
                _removeOrder(buyOrder);
                _updateFilledAmount(filledAmount[buyOrderKey] + 1, buyOrderKey);
            }
            _updateFilledAmount(sellOrder.nft.amount, sellOrderKey);

            emit LogMatch(
                buyOrderKey,
                sellOrderKey,
                buyOrder,
                sellOrder,
                fillPrice
            );

            // transfer nft&eth
            uint128 protocolFee = _shareToAmount(fillPrice, protocolShare);
            sellOrder.maker.safeTransferETH(fillPrice - protocolFee);
            if (buyPrice > fillPrice) {
                buyOrder.maker.safeTransferETH(buyPrice - fillPrice);
            }

            IEasySwapVault(_vault).withdrawNFT(
                sellOrderKey,
                buyOrder.maker,
                sellOrder.nft.collection,
                sellOrder.nft.tokenId
            );
            costValue = isBuyExist ? 0 : buyPrice;
        } else {
            revert("HD: sender invalid");
        }
    }

    function _isMatchAvailable(
        LibOrder.Order memory sellOrder,
        LibOrder.Order memory buyOrder,
        OrderKey sellOrderKey,
        OrderKey buyOrderKey
    ) internal view {
        require(
            OrderKey.unwrap(sellOrderKey) != OrderKey.unwrap(buyOrderKey),
            "HD: same order"
        );
        require(
            sellOrder.side == LibOrder.Side.List &&
                buyOrder.side == LibOrder.Side.Bid,
            "HD: side mismatch"
        );
        require(
            sellOrder.saleKind == LibOrder.SaleKind.FixedPriceForItem,
            "HD: kind mismatch"
        );
        require(sellOrder.maker != buyOrder.maker, "HD: same maker");
        require( // check if the asset is the same
            buyOrder.saleKind == LibOrder.SaleKind.FixedPriceForCollection ||
                (sellOrder.nft.collection == buyOrder.nft.collection &&
                    sellOrder.nft.tokenId == buyOrder.nft.tokenId),
            "HD: asset mismatch"
        );
        require(
            filledAmount[sellOrderKey] < sellOrder.nft.amount &&
                filledAmount[buyOrderKey] < buyOrder.nft.amount,
            "HD: order closed"
        );
    }

    /**
     * @notice caculate amount based on share.
     * @param total the total amount.
     * @param share the share in base point.
     */
    function _shareToAmount(
        uint128 total,
        uint128 share
    ) internal pure returns (uint128) {
        return (total * share) / LibPayInfo.TOTAL_SHARE;
    }

    function _checkDelegateCall() private view {
        require(address(this) != self);
    }

    function setVault(address newVault) public onlyOwner {
        require(newVault != address(0), "HD: zero address");
        _vault = newVault;
    }

    function withdrawETH(
        address recipient,
        uint256 amount
    ) external nonReentrant onlyOwner {
        recipient.safeTransferETH(amount);
        emit LogWithdrawETH(recipient, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}

    uint256[50] private __gap;
}
