import { expect } from "chai";
import { viem } from "hardhat";
import hre from "hardhat";
import { encodeSqrtRatioX96, TickMath } from "@uniswap/v3-sdk";

describe("SwapRouter", function () {
  async function deployFixture() {
    // 部署两个测试代币
    // TestToken 继承自 OpenZeppelin ERC20，实现了完整的 ERC20 接口：
    // - balanceOf(address) -> uint256
    // - transfer(address, uint256) -> bool
    // - transferFrom(address, address, uint256) -> bool
    // - approve(address, uint256) -> bool
    // - allowance(address, address) -> uint256
    // - totalSupply() -> uint256
    // - name() -> string
    // - symbol() -> string
    // - decimals() -> uint8
    const tokenA = await hre.viem.deployContract("TestToken");
    const tokenB = await hre.viem.deployContract("TestToken");
    
    // 验证 token 实现了所有必需的 ERC20 方法
    const [walletClient] = await hre.viem.getWalletClients();
    const [walletAddress] = await walletClient.getAddresses();
    
    // 验证基本 ERC20 方法存在
    expect(await tokenA.read.name()).to.equal("TestToken");
    expect(await tokenA.read.symbol()).to.equal("TK");
    expect(await tokenA.read.decimals()).to.equal(18);
    expect(await tokenA.read.totalSupply()).to.be.a("bigint");
    
    // 验证 balanceOf 方法
    const balance = await tokenA.read.balanceOf([walletAddress]);
    expect(balance).to.be.a("bigint");
    
    // 验证 approve 和 allowance 方法
    await tokenA.write.approve([walletAddress, 1000n]);
    const allowance = await tokenA.read.allowance([walletAddress, walletAddress]);
    expect(allowance).to.equal(1000n);
    
    // 同样验证 tokenB
    expect(await tokenB.read.name()).to.equal("TestToken");
    expect(await tokenB.read.symbol()).to.equal("TK");
    expect(await tokenB.read.decimals()).to.equal(18);
    
    const token0 = tokenA.address < tokenB.address ? tokenA : tokenB;
    const token1 = tokenA.address < tokenB.address ? tokenB : tokenA;

    // 部署一个 PoolManager 合约
    const poolManager = await viem.deployContract("PoolManager");

    // 初始化池子的价格上下限
    const tickLower = TickMath.getTickAtSqrtRatio(encodeSqrtRatioX96(1, 1));
    const tickUpper = TickMath.getTickAtSqrtRatio(encodeSqrtRatioX96(40000, 1));
    const sqrtPriceX96 = BigInt(encodeSqrtRatioX96(10000, 1).toString());

    // 建立池子，同样的 token0 和 token1，两种不同的费率
    await poolManager.write.createAndInitializePoolIfNecessary([
      {
        token0: token0.address,
        token1: token1.address,
        tickLower: tickLower,
        tickUpper: tickUpper,
        fee: 3000,
        sqrtPriceX96,
      },
    ]);

    await poolManager.write.createAndInitializePoolIfNecessary([
      {
        token0: token0.address,
        token1: token1.address,
        tickLower: tickLower,
        tickUpper: tickUpper,
        fee: 10000,
        sqrtPriceX96,
      },
    ]);

    // 部署 PositionManager 合约
    const positionManager = await viem.deployContract("PositionManager", [
      poolManager.address,
    ]);

    // 拿到 PoolManager 合约的地址，部署 SwapRouter 合约
    const swapRouter = await viem.deployContract("SwapRouter", [
      poolManager.address,
    ]);

    // 打印合约地址
    console.log("==========================================");
    console.log("Deployed Contract Addresses:");
    console.log("==========================================");
    console.log("PoolManager:", poolManager.address);
    console.log("PositionManager:", positionManager.address);
    console.log("SwapRouter:", swapRouter.address);
    console.log("==========================================");

    // 注入流动性
    // 部署一个 LP 测试合约
    const testLP = await viem.deployContract("TestLP");
    // 给 testLP 发 token
    const initBalanceValue = 1000000000000n * 10n ** 18n;
    await token0.write.mint([testLP.address, initBalanceValue]);
    await token1.write.mint([testLP.address, initBalanceValue]);
    // 给池子1注入流动性
    // 获取池子1的地址
    const pool1Address = await poolManager.read.getPool([
      token0.address,
      token1.address,
      0,
    ]);
    // 给池子1注入流动性
    await token0.write.approve([pool1Address, initBalanceValue]);
    await token1.write.approve([pool1Address, initBalanceValue]);
    await testLP.write.mint([
      testLP.address,
      50000n * 10n ** 18n,
      pool1Address,
      token0.address,
      token1.address,
    ]);

    // 给池子2注入流动性
    // 获取池子2的地址
    const pool2Address = await poolManager.read.getPool([
      token0.address,
      token1.address,
      1,
    ]);
    // 给池子2注入流动性
    await token0.write.approve([pool2Address, initBalanceValue]);
    await token1.write.approve([pool2Address, initBalanceValue]);
    await testLP.write.mint([
      testLP.address,
      50000n * 10n ** 18n,
      pool2Address,
      token0.address,
      token1.address,
    ]);

    const [owner] = await hre.viem.getWalletClients();
    const [sender] = await owner.getAddresses();

    return {
      swapRouter,
      token0,
      token1,
      sender,
      poolManager,
      positionManager,
    };
  }

  it("exactInput", async function () {
    const { swapRouter, token0, token1, sender } = await deployFixture();
    await token0.write.mint([sender, 1000000000000n * 10n ** 18n]);
    await token0.write.approve([swapRouter.address, 100n * 10n ** 18n]);

    await swapRouter.write.exactInput([
      {
        tokenIn: token0.address,
        tokenOut: token1.address,
        amountIn: 10n * 10n ** 18n,
        amountOutMinimum: 0n,
        indexPath: [0, 1],
        sqrtPriceLimitX96: BigInt(encodeSqrtRatioX96(100, 1).toString()),
        recipient: sender,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1000),
      },
    ]);

    // 检查收到的 tokenOut 数量
    const token1Amount = await token1.read.balanceOf([sender]);
    expect(token1Amount).to.equal(97750848089103280585132n); // 大概是 97760 * 10 ** 18，按照 10000 的价格
  });

  it("exactOutput", async function () {
    const { swapRouter, token0, token1, sender } = await deployFixture();
    await token0.write.mint([sender, 1000000000000n * 10n ** 18n]);
    await token0.write.approve([swapRouter.address, 100n * 10n ** 18n]);

    await swapRouter.write.exactOutput([
      {
        tokenIn: token0.address,
        tokenOut: token1.address,
        amountOut: 10n * 10n ** 18n,
        amountInMaximum: 10n * 10n ** 18n,
        indexPath: [0, 1],
        sqrtPriceLimitX96: BigInt(encodeSqrtRatioX96(100, 1).toString()),
        recipient: sender,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1000),
      },
    ]);

    // 检查支出的 tokenIn 数量
    const token0Amount = await token0.read.balanceOf([sender]);
    expect(1000000000000n * 10n ** 18n - token0Amount).to.equal(
      1003011033103311n
    );
    // 检查收到的 tokenOut 数量
    const token1Amount = await token1.read.balanceOf([sender]);
    expect(token1Amount).to.equal(10000000000000000000n);
  });

  it("quoteExactInput", async function () {
    const { swapRouter, token0, token1 } = await deployFixture();

    const data = await swapRouter.simulate.quoteExactInput([
      {
        tokenIn: token0.address,
        tokenOut: token1.address,
        amountIn: 10n * 10n ** 18n,
        indexPath: [0, 1],
        sqrtPriceLimitX96: BigInt(encodeSqrtRatioX96(100, 1).toString()),
      },
    ]);
    expect(data.result).to.equal(97750848089103280585132n); // 10 个 token0 按照 10000 的价格大概可以换 97750 token1
  });

  it("quoteExactOutput", async function () {
    const { swapRouter, token0, token1 } = await deployFixture();

    const data = await swapRouter.simulate.quoteExactOutput([
      {
        tokenIn: token0.address,
        tokenOut: token1.address,
        amountOut: 10000n * 10n ** 18n,
        indexPath: [0, 1],
        sqrtPriceLimitX96: BigInt(encodeSqrtRatioX96(100, 1).toString()),
      },
    ]);

    expect(data.result).to.equal(1005019065211667067n); // 价格是 10000 大概需要 1 * 10n ** 18n token0，还有一些手续费
  });
});
