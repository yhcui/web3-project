import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter"

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      // accounts: ["c3403525339818ca6d633b409c2f8e31d24250b303f97311b3e2b3bc73516c1f"],
    },
    // sepolia: {
    //   url: "",
    //   accounts: [""], // 替换为你的钱包私钥
    // },
  },
  // etherscan: {
  //   apiKey: {
  //     sepolia: "",
  //   },
  // },
};

module.exports = {
  default: config,
  gasReporter: {
    enable : true,
    currency: '$'
  }
}
