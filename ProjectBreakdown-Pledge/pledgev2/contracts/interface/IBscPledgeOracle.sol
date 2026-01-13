// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;


interface IBscPledgeOracle {
    /**
     * 获取非代币化资产或直接资产的报价
      * @notice retrieves price of an asset
      * @dev function to get price for an asset
      * @param asset Asset for which to get the price
      * @return uint mantissa of asset price (scaled by 1e8) or zero if unset or contract paused
      */
    function getPrice(address asset) external view returns (uint256);
    /*
      通常用于借贷协议（如 Venus 或 Compound 的衍生协议）
      cToken (uint256) — 借贷凭证代币的标识或地址（注意这里用了 uint256，在某些架构中可能是索引 ID）
      它不是查询凭证代币本身的价格，而是查询该凭证对应的**底层资产（Underlying Asset）**的价格。
      在区块链借贷协议（如 Venus、Compound、Pledge 等）的上下文中，底层资产（Underlying Price） 是指相对于“存款凭证代币”而言的原始代币。

    */
    function getUnderlyingPrice(uint256 cToken) external view returns (uint256);
    /*
      getPrices 方法返回的价格币种通常由底层的预言机实现决定
      接口注释明确提到返回值是按 1e8（10^8）缩放的。这意味着：
      如果返回值为 100000000 (1 * 10^8)，代表价格为 1.00 USD

      底层逻辑： 
      该方法通常会批量调用 getPrice 或 getUnderlyingPrice。
      由于这些方法通常对接 Chainlink 的价格喂送（Price Feeds），
      而 Chainlink 最常见的非加密货币对（如 BNB/USD, BTC/USD）默认就是 8 位精度的美元报价。
      
    */
    function getPrices(uint256[] calldata assets) external view returns (uint256[]memory);
}
