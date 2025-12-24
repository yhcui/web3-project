// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../multiSignature/multiSignatureClient.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";


// 预言机合约，提供资产价格查询服务
contract BscPledgeOracle is multiSignatureClient {

    mapping(uint256 => AggregatorV3Interface) internal assetsMap;

    mapping(uint256 => uint256) internal decimalsMap;

    /*
      双重价格来源机制 (Hybrid Price Source)
      该合约设计了两种获取价格的路径，这种“双保险”设计在 DeFi 中非常常见：
        路径 A：Chainlink 聚合器 (assetsMap) 这是首选路径。通过调用 Chainlink 的 latestRoundData() 获取去中心化的实时喂价。它是动态的、自动更新的。
        路径 B：手动喂价 (priceMap) 这是备选路径。如果某个代币在 Chainlink 上没有喂价，或者 Chainlink 服务出现故障，管理员可以通过 setPrice 手动输入价格。
    */
    mapping(uint256 => uint256) internal priceMap;
    uint256 internal decimals = 1;

    constructor(address multiSignature) multiSignatureClient(multiSignature) public {
//        //  bnb/USD
//        assetsMap[uint256(0x0000000000000000000000000000000000000000)] = AggregatorV3Interface(0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526);
//        // DAI/USD
//        assetsMap[uint256(0xf2bDB4ba16b7862A1bf0BE03CD5eE25147d7F096)] = AggregatorV3Interface(0xE4eE17114774713d2De0eC0f035d4F7665fc025D);
//        // BTC/USD
//        assetsMap[uint256(0xF592aa48875a5FDE73Ba64B527477849C73787ad)] = AggregatorV3Interface(0x5741306c21795FdCBb9b265Ea0255F499DFe515C);
//        // BUSD/USD
//        assetsMap[uint256(0xDc6dF65b2fA0322394a8af628Ad25Be7D7F413c2)] = AggregatorV3Interface(0x9331b55D9830EF609A2aBCfAc0FBCE050A52fdEa);
//
//
//        decimalsMap[uint256(0x0000000000000000000000000000000000000000)] = 18;
//        decimalsMap[uint256(0xf2bDB4ba16b7862A1bf0BE03CD5eE25147d7F096)] = 18;
//        decimalsMap[uint256(0xF592aa48875a5FDE73Ba64B527477849C73787ad)] = 18;
//        decimalsMap[uint256(0xDc6dF65b2fA0322394a8af628Ad25Be7D7F413c2)] = 18;

    }

    /**
      * @notice set the precision
      * @dev function to update precision for an asset
      * @param newDecimals replacement oldDecimal
      */
    function setDecimals(uint256 newDecimals) public validCall{
        decimals = newDecimals;
    }


    /**
      * @notice Set prices in bulk
      * @dev function to update prices for an asset
      * @param prices replacement oldPrices
      */
    function setPrices(uint256[]memory assets,uint256[]memory prices) external validCall {
        require(assets.length == prices.length, "input arrays' length are not equal");
        uint256 len = assets.length;
        for (uint i=0;i<len;i++){
            priceMap[i] = prices[i];
        }
    }

    /**
      * @notice retrieve prices of assets in bulk
      * @dev function to get price for an assets
      * @param  assets Asset for which to get the price
      * @return uint mantissa of asset price (scaled by 1e8) or zero if unset or contract paused
      */
    function getPrices(uint256[]memory assets) public view returns (uint256[]memory) {
        uint256 len = assets.length;
        uint256[] memory prices = new uint256[](len);
        for (uint i=0;i<len;i++){
            prices[i] = getUnderlyingPrice(assets[i]);
        }
        return prices;
    }

    /**
      * @notice retrieves price of an asset
      * @dev function to get price for an asset
      * @param asset Asset for which to get the price
      * @return uint mantissa of asset price (scaled by 1e8) or zero if unset or contract paused
      */
    function getPrice(address asset) public view returns (uint256) {
        return getUnderlyingPrice(uint256(asset));
    }

    /**
      * 
      * underlying 是一个非常核心的术语，翻译为**“标的资产”或“底层资产”**
      * @notice get price based on index
      * @dev function to get price for index
      * @param underlying for which to get the price “标的资产”或“底层资产”
      * @return uint mantissa of asset price (scaled by 1e8) or zero if unset or contract paused
      */
    function getUnderlyingPrice(uint256 underlying) public view returns (uint256) {
      // 检查配置：首先看 assetsMap 里有没有配置这个资产的 Chainlink 地址
        AggregatorV3Interface assetsPrice = assetsMap[underlying];
        if (address(assetsPrice) != address(0)){
            // Chainlink 取价：如果有，调用 latestRoundData() 获取原始价格 price。

            /*
              Chainlink 的 latestRoundData() 会返回一个 updatedAt 时间戳。 
              建议：优秀的操作码会检查 block.timestamp - updatedAt 是否超过了某个阈值（比如 1 小时）。
              如果不检查，在极端行情下如果 Chainlink 停止更新，合约会一直使用一个“过时的错误价格”，导致坏账。
            */
            (, int price,,,) = assetsPrice.latestRoundData();
            /*
              精度对齐 (Normalization)：
                Chainlink 的法币喂价通常是 8 位小数。
                代码尝试将价格统一归一化为 18 位小数 级别。
                逻辑：10**(18 - tokenDecimals)。这确保了不同精度的代币（如 6 位小数的 USDT 和 18 位小数的 DAI）在计算价值时单位一致。



          // 统一归一化为 18 位精度
            if (tokenDecimals < 18) {
                return finalPrice.mul(10**(18 - tokenDecimals)).div(decimals);
            } else if (tokenDecimals > 18) {
                return finalPrice.div(10**(tokenDecimals - 18)).div(decimals);
            } else {
                return finalPrice.div(decimals);
            }
            
            归一化（Normalization）是 DeFi 开发中最容易出错但也最重要的地方。之所以要“统一归一化为 18 位精度”，是因为在借贷协议中，你需要把**不同品种的苹果（代币）放在同一个秤（U 本位价值）**上称重
            1. 为什么要归一化？
            假设你的借贷池支持两种资产：
            BTC：精度（Decimals）是 8 位。
            DAI：精度（Decimals）是 18 位。

            如果此时 BTC 和 DAI 的价格都是 $30,000$。
            Chainlink 返回的 BTC 价格（8 位精度）是：30000_00000000
            Chainlink 返回的 DAI 价格（8 位精度）是：1_00000000
            如果你直接用“代币数量 * 价格”，由于代币单位（10^8 vs 10^18）完全不同，算出来的总价值会差出亿万倍。为了能让不同代币进行加减运算（比如计算抵押品总价值），必须强行把它们转成同样的“虚拟精度”（通常选 18）。


            */
            uint256 tokenDecimals = decimalsMap[underlying];
            if (tokenDecimals < 18){
                return uint256(price)/decimals*(10**(18-tokenDecimals));
            }else if (tokenDecimals > 18){
              return uint256(price)/decimals/(10**(tokenDecimals-18));
              // 原代码有问题
                // return uint256(price)/decimals/(10**(18-tokenDecimals));
            }else{
                return uint256(price)/decimals;
            }
        }else {
          // 回退机制：如果没配置 Chainlink，则直接返回 priceMap 里的手动设置值。
            return priceMap[underlying];
        }
    }


    /**
      * @notice set price of an asset
      * @dev function to set price for an asset
      * @param asset Asset for which to set the price
      * @param price the Asset's price
      */
    function setPrice(address asset,uint256 price) public validCall {
        priceMap[uint256(asset)] = price;
    }

    /**
      * @notice set price of an underlying
      * @dev function to set price for an underlying
      * @param underlying underlying for which to set the price
      * @param price the underlying's price
      */
    function setUnderlyingPrice(uint256 underlying,uint256 price) public validCall {
        require(underlying>0 , "underlying cannot be zero");
        priceMap[underlying] = price;
    }

    /**
      * @notice set price of an asset
      * @dev function to set price for an asset
      * @param asset Asset for which to set the price
      * @param aggergator the Asset's aggergator
      */
    function setAssetsAggregator(address asset,address aggergator,uint256 _decimals) public validCall {
        assetsMap[uint256(asset)] = AggregatorV3Interface(aggergator);
        decimalsMap[uint256(asset)] = _decimals;
    }

    /**
      * @notice set price of an underlying
      * @dev function to set price for an underlying
      * @param underlying underlying for which to set the price
      * @param aggergator the underlying's aggergator
      */
    function setUnderlyingAggregator(uint256 underlying,address aggergator,uint256 _decimals) public validCall {
        require(underlying>0 , "underlying cannot be zero");
        assetsMap[underlying] = AggregatorV3Interface(aggergator);
        decimalsMap[underlying] = _decimals;
    }

    /** @notice get asset aggregator based on asset
      * @dev function to get aggregator for asset
      * @param asset for which to get the aggregator
      * @ return  an asset aggregator
      */
    function getAssetsAggregator(address asset) public view returns (address,uint256) {
        return (address(assetsMap[uint256(asset)]),decimalsMap[uint256(asset)]);
    }

     /**
       * @notice get asset aggregator based on index
       * @dev function to get aggregator for index
       * @param underlying for which to get the aggregator
       * @ return an asset aggregator
       */
    function getUnderlyingAggregator(uint256 underlying) public view returns (address,uint256) {
        return (address(assetsMap[underlying]),decimalsMap[underlying]);
    }

}
