// 合约地址配置
export const CONTRACTS = {
  POOL_MANAGER: '0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B',
  POSITION_MANAGER: '0xbe766Bf20eFfe431829C5d5a2744865974A0B610',
  SWAP_ROUTER: '0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2',
  LIQUIDITY_MANAGER: '0xbe766Bf20eFfe431829C5d5a2744865974A0B610', // 使用Position Manager作为流动性管理器
} as const

// 测试代币地址
export const TOKENS = {
  ETH: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // 原生ETH的特殊地址
    wrappedAddress: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // Sepolia WETH 地址
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true,
  },
  MNTokenA: {
    address: '0x4798388e3adE569570Df626040F07DF71135C48E',
    symbol: 'MNA',
    name: 'MetaNode Token A',
    decimals: 18,
  },
  MNTokenB: {
    address: '0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30',
    symbol: 'MNB',
    name: 'MetaNode Token B',
    decimals: 18,
  },
  MNTokenC: {
    address: '0x86B5df6FF459854ca91318274E47F4eEE245CF28',
    symbol: 'MNC',
    name: 'MetaNode Token C',
    decimals: 18,
  },
  MNTokenD: {
    address: '0x7af86B1034AC4C925Ef5C3F637D1092310d83F03',
    symbol: 'MND',
    name: 'MetaNode Token D',
    decimals: 18,
  },
} as const

// 网络配置
export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia
  name: 'Sepolia',
  rpcUrl: 'https://sepolia.infura.io/v3/d8ed0bd1de8242d998a1405b6932ab33',
  blockExplorer: 'https://sepolia.etherscan.io',
} as const

// 默认滑点配置
export const DEFAULT_SLIPPAGE = 0.5 // 0.5%

// 费率选项
export const FEE_TIERS = [500, 3000, 10000] // 0.05%, 0.3%, 1% 