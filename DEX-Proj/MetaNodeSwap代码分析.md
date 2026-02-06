# MetaNodeSwap代码分析

### Factory

**`createPool`** 

我们通过 `pool = address(new Pool{salt: salt}());` 这一行代码创建了一个新的 `Pool` 合约，并通过 `pools[token0][token1].push(pool);` 将它的地址保存到 `pools` 中。

这里需要注意的是，我们通过添加了 `salt` 来使用CREATE2的方式来创建合约，这样的好处是创建出来的合约地址是可预测的，地址生成的逻辑是 `新地址 = hash("0xFF",创建者地址, salt, initcode)`。

而在我们的代码中 `salt` 是通过 `abi.encode(token0, token1, tickLower, tickUpper, fee)` 计算出来的，这样的好处是只要我们知道了 `token0` 和 `token1` 的地址，以及 `tickLower`、`tickUpper` 和 `fee` 这三个参数，我们就可以预测出来新合约的地址。在我们的教程设计中，这样似乎并没有什么用。但是在实际的 DeFi 场景中，这样会带来很多好处。比如其他合约可以直接计算出我们 `Pool` 合约的地址，这样可以开发出和 `Pool` 合约交互的更多的功能。

当然，这样也会带来一个问题，这样会使得我们不能通过合约的构造函数传参来传递 `Pool` 合约的初始化参数，因为那样会导致上面新地址计算中的 `initcode` 发生变化。所以我们在代码中引入了 `parameters` 这个变量来保存 `Pool` 合约的初始化参数，这样我们就可以在 `Pool` 合约中通过 `parameters` 来获取到初始化参数。



### **PoolManager**

**`getPairs`**

可以看到我们设计了一个 `getPairs` 方法用于返回数据。可能会有一些同学有这样的疑问，为什么要设计一个函数方法用于返回，合约里面的变量不是会自动生成对应的 getter 方法用于获取其值的吗？

是的没有错，solidity 是会自动给合约里面定义的 public 变量生成对应的 getter 方法，开发者可以不用再额外设计获取值的方法，但是对于变量是数组这个特殊情况，solidity 生成的 getter 方法并不会返回整个数据，而是需要调用者指定索引，只返回索引对应的值。这么设计的原因是避免一次返回过多的数据，在别的合约使用这份数据时产生不可控的 gas 费。

因此，对于数组这个特殊情况，如果我们需要它返回全部的内容，就需要自己写一个合约方法将其返回。

获取到的数据供前端的token列表用。

**`getAllPools`**

由于池子的信息是在 `Factory` 合约中保存的，因此我们在返回全部池子信息的时候，还需要对 `Factory` 保存的信息进行处理，处理成我们想要的数据格式。

这部分的逻辑比较清晰，通过遍历全部的池子信息，做一些数据转换就行。

获取到的数据供前端展示所有的pool信息。

**`createAndInitializePoolIfNecessary`**

在创建完成池子之后，我们需要维护 DEX 整体池子的信息，该信息包含两部份，DEX 支持的交易对种类以及交易对的具体信息。前者主要是为了提供我们的 DEX 支持哪些 Token 间进行交易，后者主要是提供完整的池子信息。

在 `Factory` 合约中，每次创建完成一个池子，都会记录下它的信息，因此这个信息我们不需要再记录，我们需要记录的是交易对的种类，即在获得一个新的交易对时，动态地维护一个 `pairs` 数组。

需要注意的是，虽然 `createPool` 的入参 `tokenA` 和 `tokenB` 没有顺序要求，但是在 `createAndInitializePoolIfNecessary` 中我们创建的时候要求 `token0 < token1`。因为在这个方法中需要传入初始化的价格，而在交易池中价格是按照 `token0/token1` 的方式计算的，做这个限制可以避免 LP 不小心初始化错误的价格。在后续的代码和测试中，我们也约定了 `tokenA` 和 `tokenB` 是未排序的，而 `token0` 和 `token1` 是排序的，这样也便于我们理解代码。



### **Pool**

**`mint`**

我们传入要添加流动性 `amount`，以及 `data`，这个 `data` 是用来在回调函数中传递参数的，后面会再讲。`recipient` 可以指定讲流动性的权益赋予谁。这里需要注意的是 `amount` 是流动性，而不是要 mint 的代币，至于流动性如何计算，我们在 `PositionManager` 的章节中讲解，这一讲中先不具体展开。但是在我们这一讲的实现中，我们需要基于传入的 `amount` 计算出 `amount0` 和 `amount1`，并返回这两个值。`amount0` 和 `amount1` 分别是两个代币的数量，另外还需要在 `mint` 方法中调用我们定义的回调函数 `mintCallback`，以及修改 `Pool` 合约中的一些状态。

`amount0` 和 `amount1` 计算完成后需要调用 `mintCallback` 回调方法，LP 需要在这个回调方法中将对应的代币转入到 `Pool` 合约中，所以调用 `Pool` 合约 `mint` 方法的也需要是一个合约，并且在合约中定义好 `mintCallback` 方法。

**`burn`**

和 `mint` 类似，它也需要传入一个 `amount`，只是它不需要有回调，另外提取代币是放到 `collect` 中操作的。在 `burn` 方法中，我们只是把流动性移除，并计算出要退回给 LP 的 `amount0` 和 `amount1`，记录在合约状态中。

我们在 `Position` 中定义了 `tokensOwed0` 和 `tokensOwed1`，用来记录 LP 可以提取的代币数量，这个代币数量是在 `collect` 中提取的。

**`collect`**

提取代币是调用 `collect` 方法

**`swap`**

我们首先验证 `amountSpecified` 必须不为 0，`amountSpecified` 大于 0 代表我们指定了要支付的 token0 的数量，`amountSpecified` 小于 0 则代表我们指定了要获取的 token1 的数量。`zeroForOne` 为 `true` 代表了是 token0 换 token1，反之则相反。如果是 token0 换 token1，那么交易会导致池子的 token0 变多，价格下跌，我们需要验证 `sqrtPriceLimitX96` 必须小于当前的价格，也就是指 `sqrtPriceLimitX96` 是交易的一个价格下限。另外价格也需要大于可用的最小价格和小于可用的最大价格。

然后我们需要计算在用户指定的价格和数量情况下该池子可以提供交易的 token0 和 token1 的数量，在这里我们直接调用了 `SwapMath.computeSwapStep` 方法，该方法是直接复制的 [Uniswap V4 的代码](https://github.com/Uniswap/v4-core/blob/main/src/libraries/SwapMath.sol#L51)。

`SwapMath.computeSwapStep` 方法需要传入当前价格、限制价格、流动性数量、交易量和手续费，然后会返回可以交易的数量，以及手续费和交易后新的价格。在这个计算中，价格、流动性都是一个很大的数，这其实是为了避免出现精度问题。

我们还使用了 `TickMath` 中的方法来将 tick 转换为价格。

计算完成后，我们要更新一下池子的状态，以及调用回调方法（交易用户应该在回调中转入要卖出的 token），并且将换出的 token 转给用户。需要注意的是，手续费的计算和更新我们会在后面的课程中完成，在这里可以先忽略。

我们的代码是参考了 [Uniswap V3 的实现](https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Pool.sol#L596)，但是整体要简单得多。在 Uniswap V3 中，一个池子本身没有价格上下限，而是池子中的每个头寸都有自己的上下限。所以在交易的时候需要去循环在不同的头寸中移动来找到合适的头寸来交易。而在我们的实现中，我们限制了池子的价格上下限，池子中的每个头寸都是同样的价格范围，所以我们不需要通过一个 `while` 在不同的头寸中移动交易，而是直接一个计算即可。如果你感兴趣，可以对照 [Uniswap V3 的代码](https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Pool.sol#L641)来学习。

**`手续费计算`**

手续费收取除了需要考虑从用户手中扣除手续费外，还要考虑如何按照 LP 贡献的流动性来分配手续费收益。

首先我们需要在 `Pool` 合约中定义两个变量：

```
/// @inheritdoc IPool
uint256 public override feeGrowthGlobal0X128;
/// @inheritdoc IPool
uint256 public override feeGrowthGlobal1X128;
```



它们代表了从池子创建以来累计收取到的手续费，为什么需要记录这两个值呢？因为 LP 是可以随时提取手续费的，而且每个 LP 提取的时间不一样，所以 LP 提取手续费时我们需要计算出他历史累计的手续费收益。

具体值的计算上 `feeGrowthGlobal0X128` 和 `feeGrowthGlobal1X128` 是通过手续费乘以 `FixedPoint128.Q128`（2 的 96 次方），然后除以流动性数量得到的。和上一讲课程中的交易类似，乘以 `FixedPoint128.Q128` 是为了避免精度问题，最终 LP 提取手续费时会计算回实际的 token 数量。

我们在 `Position` 中也需要添加 `feeGrowthInside0LastX128` 和 `feeGrowthInside1LastX128`，它代表了 LP 上次提取手续费时的全局手续费收益，这样当 LP 提取手续费时我们就可以和池子累计的手续费收益来做计算算出他可以提取的收益了。

```
struct Position {
    // 该 Position 拥有的流动性
    uint128 liquidity;
    // 可提取的 token0 数量
    uint128 tokensOwed0;
    // 可提取的 token1 数量
    uint128 tokensOwed1;
    // 上次提取手续费时的 feeGrowthGlobal0X128
+   uint256 feeGrowthInside0LastX128;
    // 上次提取手续费是的 feeGrowthGlobal1X128
+   uint256 feeGrowthInside1LastX128;
}
```



比如如果池子的 `feeGrowthGlobal0X128` 是 100，LP 提取手续费时的 `Position` 中 `feeGrowthInside0LastX128` 也是 100，那么说明 LP 没有新的可以提取的手续费。

在 `_modifyPosition` 中，每次 LP 调用 `mint` 或者 `burn` 方法时更新头寸（`Position`）中的 `tokensOwed0` 和 `tokensOwed1`，将之前累计的手续费记录上，并重新开始记录手续费。

这样，当 LP 调用 `collect` 方法时，就可以将 `Position` 中的 `tokensOwed0` 和 `tokensOwed1` 转给用户了。

有一点提一下，为什么我们是在 `burn` 或者 `mint` 调用的 `_modifyPosition` 中计算手续费，而不是在用户 `swap` 的时候就把每个池子应该收到的手续费都记录上呢？因为一个池子中的流动性可能会很多，如果在交易的时候记录的话会产生大量的运算，会导致 Gas 太高。在这个计算中，LP 持有的流动性算是 LP 的“持股”份额，通过“持股”（Share）来计算 Token 也是很多 Defi 场景都会用到的方法。



### **PositionManager**

**`mint`**

`mint` 方法中需要做的是，根据 `MintParams` 中的参数，调用 `Pool` 合约的 `mint` 方法来添加流动性。并且通过 `PositionInfo` 结构体来记录流动性的信息。对于 `Pool` 合约来说，流动性都是 `PositionManager` 合约掌管，`PositionManager` 相当于代管了 `LP` 的流动性，所以需要在它内部再存储下相关信息。

调用 `mint` 方法后，`Pool` 合约会回调 `PositionManager` 合约，所以我们需要实现一个回调函数，并且在回调中给 `Pool` 合约打钱。

在上面的实现中，我们需要检查调用 `mintCallback` 的合约地址是否是 `Pool` 合约，然后给 `Pool` 合约打钱。这里需要用户先 `approve` 足够的金额，这样才能成功。

**`burn`**

接下来我们需要实现 `burn` 方法，用来移除流动性。和 `mint` 方法类似，我们需要调用 `Pool` 合约的 `burn` 方法来移除流动性。

在该方法中，我们做了如下两件事：

- 调用 `Pool` 合约的 `burn` 方法来移除流动性。
- 更新 `position` 的状态，更新 `tokensOwed0` 和 `tokensOwed1`，它们代表了 LP 可以提取的 token，包括手续费。

另外需要注意的是，在该方法上我们添加了一个 `isAuthorizedForToken` 修饰器，用来检查调用者是否有权限操作该 `positionId`，它用于确保合约调用者有对应流动性的 NFT 的权限。

**`collect`**

我们调用了 `Pool` 合约的 `collect` 方法来提取代币，然后销毁 `positionId` 对应的 NFT。同样我们也需要修饰器 `isAuthorizedForToken` 来确保调用者有权限操作该 `positionId`。



### SwapRouter

**`exactInput`**

遍历 `indexPath`，然后获取到对应的交易池的地址，接着调用交易池的 `swap` 接口，如果中途交易完成了就提前退出遍历即可。

其中我们调用 `swap` 函数时构造了一个 `data`，它会在 `Pool` 合约回调的时候传回来，我们需要在回调函数中通过相关信息来继续执行交易。

在回调函数中我们解析出在 `exactInput` 方法中传入的 `data`，另外结合 `amount0Delta` 和 `amount1Delta` 完成如下逻辑：

- 通过 `tokenIn` 和 `tokenOut` 以及 `index` 获取到对应的 `Pool` 合约地址，然后和 `msg.sender` 比较，确保调用是来自于 `Pool` 合约（避免被攻击）。
- 通过 `payer` 判断是否是报价（`quoteExactInput` 或者 `quoteExactOutput`）的请求，如果是则抛出错误，抛出的错误中带上需要转入或者接收的 token 数量，后面我们再实现报价接口时需要用到。
- 如果不是报价请求，则正常转账给交易池。我们需要通过 `amount0Delta` 和 `amount1Delta` 来判断转入或者转出的 token 数量。

和 `exactInput` 类似，`exactOutput` 方法也差不多，只是一个是按照 `amountIn` 来确定交易是否结束，一个是按照 `amountOut` 来确定交易是否结束。

**`quoteExactInput`**

价接口我们参考了 Uniswap 的 [Quoter.sol](https://github.com/Uniswap/v3-periphery/blob/main/contracts/lens/Quoter.sol) 实现，它用了一个小技巧。就是用 `try catch` 的包住 `swap` 接口，然后从抛出的错误这种解析出需要转入或者接收的 token 数量。

这个是为啥呢？因为我们需要模拟 `swap` 方法来预估交易需要的 Token，但是因为预估的时候并不会实际产生 Token 的交换，所以会报错。通过主动抛出一个特殊的错误，然后捕获这个错误，从错误信息中解析出需要的信息。

