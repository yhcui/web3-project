// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {LibPayInfo} from "./libraries/LibPayInfo.sol";

abstract contract ProtocolManager is
    Initializable,
    OwnableUpgradeable
{
    /*
    平台收取的交易手续费比例
    它基于基准点（Base Point）计算，通常 100 代表 1%（对应 LibPayInfo.TOTAL_SHARE 为 10000）
    */
    uint128 public protocolShare;

    event LogUpdatedProtocolShare(uint128 indexed newProtocolShare);

    function __ProtocolManager_init(
        uint128 newProtocolShare
    ) internal onlyInitializing {
        // __Ownable_init(_msgSender());
        __ProtocolManager_init_unchained(
            newProtocolShare
        );
    }

    function __ProtocolManager_init_unchained(
        uint128 newProtocolShare
    ) internal onlyInitializing {
        _setProtocolShare(newProtocolShare);
    }

    function setProtocolShare(
        uint128 newProtocolShare
    ) external onlyOwner {
        _setProtocolShare(newProtocolShare);
    }

    function _setProtocolShare(uint128 newProtocolShare) internal {
        require(
            newProtocolShare <= LibPayInfo.MAX_PROTOCOL_SHARE,
            "PM: exceed max protocol share"
        );
        protocolShare = newProtocolShare;
        emit LogUpdatedProtocolShare(newProtocolShare);
    }

    uint256[50] private __gap;
}
