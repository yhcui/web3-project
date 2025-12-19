// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./multiSignatureClient.sol";

/*
这是一个底层的白名单工具库
多重签名（Multi-Signature）管理合约
某些敏感操作（比如借贷池的参数修改、资产调拨）不能由一个人说了算，必须经过 signatureOwners（管理员名单）中的多人投票，达到 threshold（阈值）人数后才能生效

*/
library whiteListAddress{
    // add whiteList
    // 向数组添加地址，添加前会检查是否已存在（去重）
    function addWhiteListAddress(address[] storage whiteList,address temp) internal{
        if (!isEligibleAddress(whiteList,temp)){
            whiteList.push(temp);
        }
    }

    /*

    从数组中删除地址。
    这里用了一个高效技巧：将要删除的元素与最后一个元素交换，然后弹出末尾。这样可以避免移动大量元素，节省 Gas
    */
    function removeWhiteListAddress(address[] storage whiteList,address temp)internal returns (bool) {
        uint256 len = whiteList.length;
        uint256 i=0;
        for (;i<len;i++){
            if (whiteList[i] == temp)
                break;
        }
        if (i<len){
            if (i!=len-1) {
                whiteList[i] = whiteList[len-1];
            }
            whiteList.pop();
            return true;
        }
        return false;
    }

    // 遍历数组，判断某个地址是否在列表内
    function isEligibleAddress(address[] memory whiteList,address temp) internal pure returns (bool){
        uint256 len = whiteList.length;
        for (uint256 i=0;i<len;i++){
            if (whiteList[i] == temp)
                return true;
        }
        return false;
    }
}
/*

在 Web3 借贷协议中，这个合约通常被作为“上级管理员”。
举个例子： 如果借贷池需要修改 autoLiquidateThreshold（自动清算阈值），这个操作不能直接修改。
某管理员调用 createApplication。
其他管理员看到申请后，调用 signApplication。
当签名人数够了，借贷池合约会调用 getValidSignature 确认授权，最后才会真正修改 PoolBaseInfo 里的数据。


代码中的一个小瑕疵（建议注意）：
代码中使用了 uint256 private constant defaultIndex = 0;。
这意味着 signApplication 始终只给该哈希下的第一个申请（Index 0）签名。
如果同一个操作被连续发起了多次，管理员无法直接通过这个函数给后续的申请签名，这在业务逻辑逻辑上可能存在局限性。

*/

contract multiSignature  is multiSignatureClient {
    uint256 private constant defaultIndex = 0;
    using whiteListAddress for address[];

    // 存储所有有权投票的管理员地址
    address[] public signatureOwners;

    // 最小签名人数。例如，5个管理员中必须有3个签名，此值为 3。
    uint256 public threshold;
    struct signatureInfo {
        address applicant; // 谁发起的这笔操作申请
        address[] signatures; // 记录了哪些管理员已经给这笔申请投了赞成票
    }

    // 键（Key）是 bytes32（通常是操作内容的哈希），值是一个 signatureInfo 数组
    // 同一个操作（比如转账给 A）可能会被多次发起，所以它用数组记录了多次申请的历史
    mapping(bytes32=>signatureInfo[]) public signatureMap;

    event TransferOwner(address indexed sender,address indexed oldOwner,address indexed newOwner);
    event CreateApplication(address indexed from,address indexed to,bytes32 indexed msgHash);
    event SignApplication(address indexed from,bytes32 indexed msgHash,uint256 index);
    event RevokeApplication(address indexed from,bytes32 indexed msgHash,uint256 index);

    constructor(address[] memory owners,uint256 limitedSignNum) multiSignatureClient(address(this)) public {
        require(owners.length>=limitedSignNum,"Multiple Signature : Signature threshold is greater than owners' length!");
        signatureOwners = owners;
        threshold = limitedSignNum;
    }

    function transferOwner(uint256 index,address newOwner) public onlyOwner validCall{
        require(index<signatureOwners.length,"Multiple Signature : Owner index is overflow!");
        emit TransferOwner(msg.sender,signatureOwners[index],newOwner);
        signatureOwners[index] = newOwner;
    }

    /*
    发起申请
    当有人想发起一个动作（如借款池调整、管理员变更）时：
    1它根据发起者 from 和 目标 to 生成一个唯一哈希 msghash。
    2在 signatureMap[msghash] 中新增一个 signatureInfo。
    3此时 signatures 数组还是空的，等待管理员签名。
    */
    function createApplication(address to) external returns(uint256) {
        bytes32 msghash = getApplicationHash(msg.sender,to);
        uint256 index = signatureMap[msghash].length;
        signatureMap[msghash].push(signatureInfo(msg.sender,new address[](0)));
        emit CreateApplication(msg.sender,to,msghash);
        return index;
    }
    /*
    调用者必须在 signatureOwners 名单中。它会把调用者的地址加入到对应申请的签名列表中
    */
    function signApplication(bytes32 msghash) external onlyOwner validIndex(msghash,defaultIndex){
        emit SignApplication(msg.sender,msghash,defaultIndex);
        signatureMap[msghash][defaultIndex].signatures.addWhiteListAddress(msg.sender);
    }
    /*
    如果管理员后悔了，可以撤销自己的签名。
    */
    function revokeSignApplication(bytes32 msghash) external onlyOwner validIndex(msghash,defaultIndex){
        emit RevokeApplication(msg.sender,msghash,defaultIndex);
        signatureMap[msghash][defaultIndex].signatures.removeWhiteListAddress(msg.sender);
    }
    /*
        验证结果：getValidSignature
        这是该合约的关键出口函数，通常由其他功能合约调用：
        它会检查某个哈希下的所有申请。
        如果某次申请的 signatures.length >= threshold，说明已经获得了足够多的票数。
        返回该申请的索引，表示这笔申请“通过了”
    */
    function getValidSignature(bytes32 msghash,uint256 lastIndex) external view returns(uint256){
        signatureInfo[] storage info = signatureMap[msghash];
        for (uint256 i=lastIndex;i<info.length;i++){
            if(info[i].signatures.length >= threshold){
                return i+1;
            }
        }
        return 0;
    }

    function getApplicationInfo(bytes32 msghash,uint256 index) validIndex(msghash,index) public view returns (address,address[]memory) {
        signatureInfo memory info = signatureMap[msghash][index];
        return (info.applicant,info.signatures);
    }

    function getApplicationCount(bytes32 msghash) public view returns (uint256) {
        return signatureMap[msghash].length;
    }
    // 生成hash前需要encodePacked
    function getApplicationHash(address from,address to) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(from, to));
    }

    // onlyOwner 修饰器: 确保只有预设的管理员可以进行签名或修改管理员名单。
    modifier onlyOwner{
        require(signatureOwners.isEligibleAddress(msg.sender),"Multiple Signature : caller is not in the ownerList!");
        _;
    }

    // validIndex 修饰器: 防止数组越界。
    modifier validIndex(bytes32 msghash,uint256 index){
        require(index<signatureMap[msghash].length,"Multiple Signature : Message index is overflow!");
        _;
    }
}