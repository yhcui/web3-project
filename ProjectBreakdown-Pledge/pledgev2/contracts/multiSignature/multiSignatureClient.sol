// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IMultiSignature{
    // 如果返回的 newIndex > 0：说明该操作已经拿到了足够的管理员签名，准予通过。
    // 如果返回 0：说明签名不够或者申请不存在，直接 revert 报错：“This tx is not approved”
    function getValidSignature(bytes32 msghash,uint256 lastIndex) external view returns(uint256);
}

/*

如果你希望某个业务合约（如借贷池、金库、配置中心）的函数受到多签保护，那么该合约必须继承 multiSignatureClient

多签客户端” (Multi-Signature Client)
如果说 multiSignature 合约是“投票站”，那么 multiSignatureClient 就是“安检口”
任何带有 validCall 修饰符的函数，都必须先去“投票站”确认已经获得了足够多的签名，否则无法执行。

*/
contract multiSignatureClient{
    // 没有使用 Solidity 常规的变量声明，而是通过 keccak256("org.multiSignature.storage") 计算出一个极大的随机位置，并将多签合约的地址存放在那里
    // 用于 可升级合约（Proxy Pattern）。它可以防止子合约（借贷池）的变量覆盖掉父合约（多签客户端）的变量，确保多签地址存储的安全性，避免“槽位冲突”。
    uint256 private constant multiSignaturePositon = uint256(keccak256("org.multiSignature.storage"));
    uint256 private constant defaultIndex = 0;
    /*
        构造函数 constructor
        在部署时，必须传入多签管理合约的地址。它通过 saveValue 将这个地址永久锁定在预设的存储槽中
    */
    constructor(address multiSignature) public {
        require(multiSignature != address(0),"multiSignatureClient : Multiple signature contract address is zero!");
        // 通过 saveValue 将这个地址永久锁定在预设的存储槽中
        saveValue(multiSignaturePositon,uint256(multiSignature));
    }

    function getMultiSignatureAddress()public view returns (address){
        return address(getValue(multiSignaturePositon));
    }

    // 以后在业务合约中会频繁使用的工具
    modifier validCall(){
        checkMultiSignature();
        _;
    }

    function checkMultiSignature() internal view {
        uint256 value;
        assembly {
            // 这行代码在 checkMultiSignature 里其实有点奇怪，它获取了交易携带的 ETH 金额（msg.value），但随后并没有使用。这可能是开发者预留的钩子，或者是为了某些底层的 Gas 优化。
            value := callvalue()
        }
        //生成hash, 它将 msg.sender（当前调用者）和 address(this)（当前业务合约地址）打包生成 msgHash
        bytes32 msgHash = keccak256(abi.encodePacked(msg.sender, address(this)));

        //获取多签合约的地址
        address multiSign = getMultiSignatureAddress();
//        uint256 index = getValue(uint256(msgHash));
        uint256 newIndex = IMultiSignature(multiSign).getValidSignature(msgHash,defaultIndex);
        require(newIndex > defaultIndex, "multiSignatureClient : This tx is not aprroved");
//        saveValue(uint256(msgHash),newIndex);
    }

    function saveValue(uint256 position,uint256 value) internal
    {
        assembly {
            sstore(position, value)
        }
    }

    function getValue(uint256 position) internal view returns (uint256 value) {
        assembly {
            value := sload(position)
        }
    }
}