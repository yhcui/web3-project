// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {LibTransferSafeUpgradeable, IERC721} from "./libraries/LibTransferSafeUpgradeable.sol";
import {LibOrder, OrderKey} from "./libraries/LibOrder.sol";

import {IEasySwapVault} from "./interface/IEasySwapVault.sol";
/*
(资产托管层)：专门负责托管用户存入的 ETH 和 NFT 资产。
它充当“保险库”，仅允许授权的 OrderBook 合约进行资产划转，确保了资产安全性

在 EasySwap 这种“链上订单簿”设计中，它扮演着非常关键的角色。
与 OpenSea 那种资产留在用户钱包的模式不同，EasySwap 要求 Maker 将资产预先存入这个金库。
*/
contract EasySwapVault is IEasySwapVault, OwnableUpgradeable {
    using LibTransferSafeUpgradeable for address;
    using LibTransferSafeUpgradeable for IERC721;

    // 唯一管理者 只有这个地址有权调用它的核心资产转移方法（onlyEasySwapOrderBook 权限控制）
    address public orderBook;

    // 它不按用户地址记录余额，而是按 OrderKey（订单 ID） 记录。这意味着资产是和订单绑定的。
    mapping(OrderKey => uint256) public ETHBalance; // 记录买单（Bid）锁定的 ETH
    mapping(OrderKey => uint256) public NFTBalance; // 记录卖单（List）锁定的 NFT TokenId

    modifier onlyEasySwapOrderBook() {
        require(msg.sender == orderBook, "HV: only EasySwap OrderBook");
        _;
    }

    function initialize() public initializer {
        __Ownable_init(_msgSender());
    }

    function setOrderBook(address newOrderBook) public onlyOwner {
        require(newOrderBook != address(0), "HV: zero address");
        orderBook = newOrderBook;
    }

    function balanceOf(
        OrderKey orderKey
    ) external view returns (uint256 ETHAmount, uint256 tokenId) {
        ETHAmount = ETHBalance[orderKey];
        tokenId = NFTBalance[orderKey];
    }
    // 当用户创建买单时，OrderBook 调用此方法。它会检查 msg.value 是否足额，并将金额记在对应的 orderKey 下
    function depositETH(
        OrderKey orderKey,
        uint256 ETHAmount
    ) external payable onlyEasySwapOrderBook {
        require(msg.value >= ETHAmount, "HV: not match ETHAmount");
        ETHBalance[orderKey] += msg.value;
    }
    // 用于用户取消订单时，将资产原路退回给 Maker。
    function withdrawETH(
        OrderKey orderKey,
        uint256 ETHAmount,
        address to
    ) external onlyEasySwapOrderBook {
        ETHBalance[orderKey] -= ETHAmount;
        to.safeTransferETH(ETHAmount);
    }

    // 当用户创建卖单时，此方法通过 safeTransferNFT 将 NFT 从用户钱包转入金库。
    function depositNFT(
        OrderKey orderKey,
        address from,
        address collection,
        uint256 tokenId
    ) external onlyEasySwapOrderBook {
        IERC721(collection).safeTransferNFT(from, address(this), tokenId);

        NFTBalance[orderKey] = tokenId;
    }
    // 用于用户取消订单时，将资产原路退回给 Maker。
    function withdrawNFT(
        OrderKey orderKey,
        address to,
        address collection,
        uint256 tokenId
    ) external onlyEasySwapOrderBook {
        require(NFTBalance[orderKey] == tokenId, "HV: not match tokenId");
        delete NFTBalance[orderKey];
        // 将自己的直接转NFT就可以了不需要授权。
        IERC721(collection).safeTransferNFT(address(this), to, tokenId);
    }

    /*
    订单编辑 (Edit) —— 系统最精妙的地方
    */   
    function editETH(
        OrderKey oldOrderKey,
        OrderKey newOrderKey,
        uint256 oldETHAmount,
        uint256 newETHAmount,
        address to
    ) external payable onlyEasySwapOrderBook {
        ETHBalance[oldOrderKey] = 0;
        if (oldETHAmount > newETHAmount) {
            // 如果新价格比旧价格低：金库把多出来的 ETH 退给用户
            ETHBalance[newOrderKey] = newETHAmount;
            to.safeTransferETH(oldETHAmount - newETHAmount);
        } else if (oldETHAmount < newETHAmount) {
            // 如果新价格比旧价格高：要求 OrderBook 补足差价
            require(
                msg.value >= newETHAmount - oldETHAmount,
                "HV: not match newETHAmount"
            );
            ETHBalance[newOrderKey] = msg.value + oldETHAmount;
        } else {
            ETHBalance[newOrderKey] = oldETHAmount;
        }
    }

    function editNFT(
        OrderKey oldOrderKey,
        OrderKey newOrderKey
    ) external onlyEasySwapOrderBook {
        // 直接在映射里把 NFTBalance[oldOrderKey] 的值赋给 newOrderKey，然后删除旧记录。整个过程没有链上 NFT 转移，极度节省 Gas
        NFTBalance[newOrderKey] = NFTBalance[oldOrderKey];
        delete NFTBalance[oldOrderKey];
    }

    // 用于订单成交时。当 Taker 出现，OrderBook 指令金库将锁定的 NFT 直接发给 Taker（或者从 Taker 手里把 NFT 发给 Maker）
    function transferERC721(
        address from,
        address to,
        LibOrder.Asset calldata assets
    ) external onlyEasySwapOrderBook {
        IERC721(assets.collection).safeTransferNFT(from, to, assets.tokenId);
    }

    function batchTransferERC721(
        address to,
        LibOrder.NFTInfo[] calldata assets
    ) external {
        for (uint256 i = 0; i < assets.length; ++i) {
            IERC721(assets[i].collection).safeTransferNFT(
                _msgSender(),
                to,
                assets[i].tokenId
            );
        }
    }

    // 合约实现了 onERC721Received，确保它能正确接收通过 safeTransferFrom 发送过来的 NFT，防止 NFT 被锁死在不支持接收的合约里
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }

    receive() external payable {}

    uint256[50] private __gap;
}
