require("@nomicfoundation/hardhat-toolbox")
require("@nomiclabs/hardhat-ethers")
require('hardhat-contract-sizer')
require('@openzeppelin/hardhat-upgrades')
require('solidity-coverage')

// config
const { config: dotenvConfig } = require("dotenv")
const { resolve } = require("path")
dotenvConfig({ path: resolve(__dirname, "./.env") })

const SEPOLIA_PK_ONE = process.env.SEPOLIA_PK_ONE
const SEPOLIA_PK_TWO = process.env.SEPOLIA_PK_TWO
if (!SEPOLIA_PK_ONE) {
  throw new Error("Please set at least one private key in a .env file")
}

const MAINNET_PK = process.env.MAINNET_PK
const MAINNET_ALCHEMY_AK = process.env.MAINNET_ALCHEMY_AK

const SEPOLIA_ALCHEMY_AK = process.env.SEPOLIA_ALCHEMY_AK
if (!SEPOLIA_ALCHEMY_AK) {
  throw new Error("Please set your SEPOLIA_ALCHEMY_AK in a .env file")
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        // 编译器会对字节码进行优化，减少 gas 消耗、缩小 bytecode 大小。
        // 强烈推荐在生产环境中启用。没有它，合约 gas 成本会显著更高。
        enabled: true, // 启用优化器
        // 表示合约预计被调用 50 次。runs 值越小，优化越偏向减少部署成本（creation gas）；值越大，越偏向减少运行时 gas（execution gas）。
        // 50 是偏向低调用频率的设置（适合不经常调用的合约，如某些治理或一次性工具合约）。
        // 常见值：200（默认，平衡）、1_000_000（高频调用，如 DeFi 核心合约）、低值如 50 用于节省部署 gas。
        runs: 50, // 优化运行次数
      },
      // 传统管道是直接从 Solidity → EVM 字节码；viaIR 是 Solidity → Yul (IR) → EVM。
      // 开启后可实现更强大的跨函数优化，通常能进一步降低 gas 消耗（尤其配合 optimizer）。
      // - 优点：更好优化，常用于极致 gas 优化项目。
      // - 缺点：编译更慢；Hardhat 的某些高级功能（如详细 stack traces、console.log）可能不完整或失效。
      // - 推荐与 optimizer 一起使用，否则可能引发 stack too deep 错误。
      // - 未来 Solidity 计划将其设为默认。
      viaIR: true, // 启用 IR-based 编译管道
    },
    metadata: {
      // Solidity 默认会在 bytecode 末尾附加一个 CBOR 编码的 metadata hash（约 50-60 字节），用于链上源代码验证（Etherscan/Sourcify 等）。设为 'none' 会完全移除这部分。
      // - 优点：减少部署 gas（约 800-1000 gas）和 bytecode 大小。
      // - 缺点：无法在 Etherscan 等平台自动验证源代码（需手动上传 metadata JSON）。
      // - 常用于追求极致 gas 优化的生产合约。其他可选值：'ipfs'（默认）、'bzzr1'（Swarm）。
      bytecodeHash: 'none', // 不将 metadata hash 附加到 bytecode 末尾
    }
  },
  networks: {
    // mainnet: {
    //   url: `https://eth-mainnet.g.alchemy.com/v2/${MAINNET_ALCHEMY_AK}`,
    //   accounts: [`${MAINNET_PK}`],
    //   saveDeployments: true,
    //   chainId: 1,
    // },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${SEPOLIA_ALCHEMY_AK}`,
      accounts: [`${SEPOLIA_PK_ONE}`, `${SEPOLIA_PK_TWO}`],
    },
    // optimism: {
    //   url: `https://rpc.ankr.com/optimism`,
    //   accounts: [`${MAINNET_PK}`],
    // },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
}
