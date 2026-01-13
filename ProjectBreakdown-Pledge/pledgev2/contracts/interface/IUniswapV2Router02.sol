// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IUniswapV2Router02 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    /*

    liquidity 返回的是你存入代币后，系统发给你的 LP Token（流动性池代币）的数量。
    在 Uniswap V2 这种恒定乘机做市商（AMM）机制中，它是你在这个资金池中所占份额的“收据”或“股权证明”。

    1. 它代表了什么？
    当你向 TokenA 和 TokenB 的池子添加流动性时：
    合约会根据你实际存入的代币数量，计算出你贡献了池子总容量的百分之几。
    合约会**铸造（Mint）**出对应数量的 LP Token 发送到你的 to 地址。
    这个返回的 liquidity 就是这些生成的 LP Token 的精度数值（通常是 18 位小数）。

    2. 这个数值是怎么计算的？
    根据 Uniswap V2 的公式，LP Token 的计算.如需详细可以阅读 Uniswap V2 的官方文档。

    这个 liquidity 有什么用？
    1、作为提取凭证： 当你以后想撤出流动性时（调用 removeLiquidity），你需要把这些 LP Token 归还（销毁）给合约，换回你应得的代币（A + B）以及这段时间累积的手续费收益。
    2、流动性挖矿： 很多 DeFi 项目会让你把这个 liquidity 数额（即 LP Token）质押到他们的“矿池”里，从而赚取额外的项目代币奖励。
    
    addLiquidity 的三个返回值
    amountA: 实际存入的 TokenA 数量（可能因为滑点比你填写的 desired 少一点）。
    amountB: 实际存入的 TokenB 数量。
    liquidity: 你获得的 LP Token 数量（即你的“股份”额度）。


    重要
    Uniswap V2 的核心公式是 x * y = 
    k 就是这个池子的“总流动性”的平方。
    当你添加流动性时，你本质上是在增大 k 值。返回给你的 liquidity 数值，本质上是 根号K 的增长份额。
    k 越大，流动性就越好
    你持有的 liquidity 代币，就是你对这个 k（总能量）的贡献占比
    这个 liquidity 返回值确实是一个相对增长值，而不是一个用来判断池子“好坏”的绝对指标。
    */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired, // 理想中想要存入的金额. 合约会尽量满足你的要求，但最终实际存入的量（返回值 amountA, amountB）通常会小于等于这两个值
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to, // 接收代币的地址
        uint deadline // 截止时间戳。如果交易在这个时间之后才被打包，则会自动失效，保护用户
    ) external returns (uint amountA, uint amountB, uint liquidity);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);

    /*
    使用场景
    1、撤资（止盈/止损）： 你不再看好这个交易对，或者你需要把资金调往其他地方，于是销毁份额取回本金。
    2、领取手续费收益： 在 Uniswap V2 中，交易手续费（0.3%）是自动累积到池子里的。你只有在调用 removeLiquidity 时，才能连本带利地取回这些手续费。 * 例如：你存入 1 ETH + 2000 USDT，过了一个月撤资，你可能取回了 1.1 ETH + 2200 USDT，多出的部分就是手续费收益。
    3、流动性挖矿结束： 很多平台（如 PancakeSwap 或 SushiSwap）的挖矿活动结束后，用户会从矿池取出 LP Token，然后调用这个方法换回原始代币。
    
    返回值 (uint amountA, uint amountB) 包含了你的本金 + 分红（手续费）

    removeLiquidity 不需要验证发送消息的人有没有liquidity这些份额么？
    答案是：需要验证，但验证的过程并不是由 Router 合约直接“查账”，而是通过 ERC20 的标准授权机制（Approve）来实现的。
    1. 验证是如何发生的？
    当你调用 removeLiquidity 时，内部逻辑是这样的：
        资产转移： Router 合约会尝试把你的 LP Token 从你的钱包转移到 LP 池子合约里进行销毁。
        权限检查： 既然 Router 要移动“你的”代币，它就必须拥有你的授权（Allowance）。
        转账触发： 在 removeLiquidity 的代码内部，会执行类似 transferFrom(msg.sender, pair, liquidity) 的操作。

    验证逻辑：

    如果你没有这么多 LP Token，transferFrom 会执行失败（余额不足）。
    如果你没有授权给 Router，transferFrom 也会执行失败（没有权限）。
    只有当你既有余额又给了授权，交易才能成功。

    为什么在参数里没看到授权？
    在调用 removeLiquidity 之前，你必须先进行一步链下操作（或前置交易）：
    第一步： 调用 LP Token 合约（即 Pair 合约）的 approve(router_address, liquidity)。这就像是在银行签了一份委托书，允许 Router 动用你的这笔份额。
    第二步： 此时你再调用 Router 的 removeLiquidity，它才能顺利通过验证。

    */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity, // 打算销毁多少个 LP Token 份额
        uint amountAMin, // amountAMin / amountBMin (滑点保护)： 这是你设定的底线。
        uint amountBMin, // 如果你设置 amountAMin 为 0.99 ETH。如果合约计算发现你只能取回 0.98 ETH，那么这笔交易会直接报错回滚，防止你吃亏
        address to, // 取回来的代币发给谁。通常填你自己的钱包地址
        uint deadline
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);
    /*
    解决“先授权、再撤资”需要两次交易、付两次 Gas 费的痛点：
    原理： 你在链下用私钥对“授权”这一行为进行数字签名。
    验证： 你把这个签名（v, r, s）作为参数传给 removeLiquidityWithPermit。
    内部逻辑： 合约内部先验证签名是否真的是你本人发的，如果是，自动帮你完成授权并立刻执行撤资。这通过密码学手段完成了身份和份额的验证。

    利用了 EIP-712 标准实现的“离线签名授权”
    解决了传统 approve 的痛点：不需要先发一笔交易去授权，直接签名就能撤资，省下一笔 Gas 费。

    线下做了什么？
    1、构建结构化数据： 根据 EIP-712 标准，将 owner（你）、spender（Router）、value（数量）、nonce（随机数）和 deadline 组成一个特定格式的哈希。

    2、私钥签名： 你的私钥对这个哈希进行加密，生成三个参数：v, r,, s。
        这三个数字就是你的“数字指纹”。
        安全性： 签名过程在钱包本地完成，私钥永远不会联网。

    如何防止重放攻击 (Security)
    你可能会问：如果黑客截获了我的 v, r, s，他能不能反复撤我的钱？
    答案是：不能。
    Nonce (随机数) 机制： 每个账户在 LP 合约里都有一个 nonce。每次 permit 成功，nonce 就会加 1。
    唯一性： 签名哈希里包含了当前的 nonce。如果你尝试第二次使用同一个签名，合约发现 nonce 已经变了，计算出的哈希就会对不上，验证直接失败。


    在 LP Token 合约内部，会使用 Solidity 的内置指令 ecrecover：
    1、还原地址： address recoveredAddress = ecrecover(hash, v, r, s);
    2、身份对比： 合约将还原出来的 recoveredAddress 与参数中的 owner（即 msg.sender）进行对比。
    3、匹配则授权： 如果地址完全一致，说明这个操作确实是私钥持有者本人授权的。合约会直接修改 allowance[owner][spender] 的数值。    
    

    整个过程：
    1. 数据的两层哈希 (The Hash Structure)
    为了确保签名只能在特定的合约、特定的链上生效，哈希计算分为两个部分：
    第一层：Domain Separator（域隔离符）这是为了防止重放攻击。它将合约地址、链 ID（ChainID）等信息哈希化：
    
    DomainSeparator = keccak256(TYPE_HASH, nameHash, versionHash, chainId, verifyingContract)

    第二层：Struct Hash（结构化数据哈希）
    这是你要授权的具体内容（谁授权给谁，多少钱，Nonce 是多少）：
    StructHash = keccak256(PERMIT_TYPEHASH, owner, spender, value, nonce, deadline)

    最终哈希 (Final Digest)
    最后，将这两者按照 EIP-712 标准合并，并再次进行 Keccak-256 哈希：
    Digest = keccak256("\x19\x01" + DomainSeparator + StructHash)

    这里的 \x19\x01 是 EIP-712 的特定前缀，用来区分其他类型的签名（如普通的文本签名）。

    2. 生成 v, r, s 的算法：ECDSA
    拿到上面的 Digest（最终哈希值）后，钱包会使用 ECDSA 算法配合你的私钥对这个 32 字节的哈希值进行处理


    在 Solidity 线上验签时，ecrecover(digest, v, r, s) 函数利用了椭圆曲线的数学特性：只需要“原始哈希”和“签名结果（v, r, s）”，就可以反推出是谁的私钥签的名。
    如果反推出的地址和 owner 地址一致，逻辑就走通了。
    
    */
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountToken, uint amountETH);
    /* 
        输入固定数量的 A 代币，换取尽可能多的 B 代币。
    */
    function swapExactTokensForTokens(
        uint amountIn, // 你确定要卖出的代币数量
        uint amountOutMin, // 最小接受数量（滑点保护）
        address[] calldata path, // 交换路径。例如 [USDT, WBNB, BTC] 表示先用 USDT 换 WBNB，再用 WBNB 换 BTC。
        address to, // 接收换好的代币的钱包地址
        uint deadline // 最后期限（时间戳）

        // amounts：一个数组，记录了路径中每一步转换的实际金额。
        // 比如 path 为 [A, B, C]，那么 amounts[0] 是 A 的输入量，amounts[1] 是中间产物 B 的数量，amounts[2] 是最终拿到的 C 的数量.    
    ) external returns (uint[] memory amounts);
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);

    /*
    在不考虑交易手续费和滑点的情况下，根据当前的池子储备量，计算出两种代币之间的等值比例
    通俗解释： 如果池子里有 100 个 A 和 200 个 B（比例 1:2），当你问“10 个 A 价值多少个 B”时，quote 会告诉你结果是 20。
    
    amountA	    你想要计算的 A 代币的数量。
    reserveA	交易对（Pair）中 A 代币的当前库存量。
    reserveB	交易对（Pair）中 B 代币的当前库存量。
    返回值 amountB	按照当前池子比例，amountA 等值于多少 amountB。

    */
    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    /*
    考虑了 0.3% 手续费 和 价格冲击（Price Impact） 的情况下，你实际能兑换到的代币数量。

    amountIn	你准备卖出的代币数量。
    reserveIn	池子中你卖出的那种代币的当前库存。
    reserveOut	池子中你想要换回的那种代币的当前库存。
    返回值 amountOut	实际到手的代币数量（已扣除手续费并计算了滑点）。
    */
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    /*
    getAmountIn 是 getAmountOut 的逆运算函数。
    实现“我想要精确地拿到 100 个 B 代币，请问我最少需要投入多少个 A 代币
    amountOut	你想要获得的精确代币数量。
    reserveIn	池子中你准备投入的那种代币的当前库存。
    reserveOut	池子中你想要换回的那种代币的当前库存。
    返回值 amountIn	为了换到 amountOut，你最少需要支付的代币数量。
    */
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);

    /*
    前端实时报价

    amountIn	uint	路径起点（第一个代币）的输入数量。
    path	address[]	兑换路径地址数组。例如 [TokenA, TokenB, TokenC]。
    返回值 amounts	uint[]	结果数组。记录了路径中每一个节点的代币数量。
    
    返回数组的具体内容
    如果你的路径是 [USDT, WBNB, BTC]，返回的 amounts 数组长度将与 path 相同（长度为 3）：
    amounts[0]：等于你输入的 amountIn（USDT 的数量）。
    amounts[1]：1 跳之后，得到的 WBNB 数量。
    amounts[2]：2 跳之后，最终拿到的 BTC 数量。

    */
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
    /*
    removeLiquidity（移除流动性）、ETH（结算为原生代币）、SupportingFeeOnTransferTokens（支持转账收税代币）。
    它不再严格校验接收到的代币数量是否等于发送量，而是“能收到多少是多少”，只要最终收到的数额大于 amountTokenMin 即可。
    收代币税 
    token	            address	与 ETH 配对的那种代币的地址。
    liquidity		    你准备销毁的 LP 代币数量。
    amountTokenMin		期望取回的代币最小数量（滑点保护）。
    amountETHMin		期望取回的 ETH 最小数量（滑点保护）。
    to	                address	接收资产的地址。
    deadline		    交易截止时间戳。

    为什么只针对 ETH 有返回值？
    注意函数定义：returns (uint amountETH)。 它只返回了 ETH 的数量，而没有返回代币的数量。这是因为：
    由于代币存在收税机制，Router 无法在不增加 Gas 成本的情况下准确预测你最终到手的代币数量。
    ETH 是标准资产，不收税，所以它的数量是确定可计算的。

    什么时候该用它？
    项目方/LP 视角：如果你参与的流动性对中，有一种代币是“土狗币”或带有“通缩机制”的代币，移除流动性时必须调用这个函数，否则交易会一直报错。
    借贷协议视角：如果你的借贷协议支持此类代币作为抵押品，在清算（撤出流动性）时，合约逻辑必须兼容此类函数，以防由于税收导致的清算失败。
    */
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountETH);

    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountETH);
    
    /*
    amountIn	    你卖出的代币数量（这部分在进入第一个池子前可能就会被扣税）。
    amountOutMin	最少到手金额。虽然支持扣税，但如果扣完税后的金额低于这个值，交易依然会失败，防止被“夹子”或过高的税收吸干。
    path	        交易路径，例如 [USDT, 某收税代币]。
    to	            最终接收代币的地址。
    deadline	    交易截止时间。
    */
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}
