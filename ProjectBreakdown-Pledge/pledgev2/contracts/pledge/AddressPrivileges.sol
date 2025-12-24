// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../multiSignature/multiSignatureClient.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

/**
 * 它是一个权限中心（Access Control Center），专门用来管理一组具有 “铸币权（Minter Role）” 的账户地址。
 * @dev Collection of functions related to the address type
 */
contract AddressPrivileges is multiSignatureClient {

    constructor(address multiSignature) multiSignatureClient(multiSignature) public {
    }
    
    // 利用了 OpenZeppelin 的 EnumerableSet（可枚举集合）来存储地址
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet private _minters;

    /**
      *  添加一个新的铸币者
      * @notice add a minter
      * @dev function to add a minter for an asset
      * @param _addMinter add a  minter address
      # @return true or false
      */
    function addMinter(address _addMinter) public validCall returns (bool) {
        require(_addMinter != address(0), "Token: _addMinter is the zero address");
        return EnumerableSet.add(_minters, _addMinter);
    }

    /**
      * 移除一个现有的铸币者。
      * @notice delete a minter
      * @dev function to delete a minter for an asset
      * @param _delMinter delete a minter address
      # @return true or false
      */
    function delMinter(address _delMinter) public validCall returns (bool) {
        require(_delMinter != address(0), "Token: _delMinter is the zero address");
        return EnumerableSet.remove(_minters, _delMinter);
    }

    /**
      * @notice get minter list length
      * @dev function to get the minter list length
      # @return the lenght of minter list
      */
    function getMinterLength() public view returns (uint256) {
        return EnumerableSet.length(_minters);
    }

    /**
      * @notice Determine if this address is minter
      * @dev function to judge address
      * @param account is a condition
      # @return true or false
      */
    function isMinter(address account) public view returns (bool) {
        return EnumerableSet.contains(_minters, account);
    }

     /**
      * @notice Get minter account according to index
      * @dev function to get minter account
      * @param _index of index
      # @return  a minter account
      */
    function getMinter(uint256 _index) public view  returns (address){
        require(_index <= getMinterLength() - 1, "Token: index out of bounds");
        return EnumerableSet.at(_minters, _index);
    }

    modifier onlyMinter() {
        require(isMinter(msg.sender), "Token: caller is not the minter");
        _;
    }

}