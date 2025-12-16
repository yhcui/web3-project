import { CONTRACTS } from './constants'

// Pool ABI - 用于获取单个池子的详细信息
export const POOL_ABI = [
  {
    type: 'function',
    name: 'token0',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'token1',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'fee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint24' }],
  },
  {
    type: 'function',
    name: 'liquidity',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint128' }],
  },
  {
    type: 'function',
    name: 'sqrtPriceX96',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint160' }],
  },
  {
    type: 'function',
    name: 'tick',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'int24' }],
  },
  {
    type: 'function',
    name: 'feeGrowthGlobal0X128',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'feeGrowthGlobal1X128',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// SwapRouter ABI (简化版本，包含主要函数)
export const SWAP_ROUTER_ABI = [
  {
    type: 'function',
    name: 'exactInput',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'indexPath', type: 'uint32[]' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'quoteExactInput',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'indexPath', type: 'uint32[]' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const

// PoolManager ABI
export const POOL_MANAGER_ABI = [
  {
    type: 'function',
    name: 'getAllPools',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: 'poolsInfo',
        type: 'tuple[]',
        components: [
          { name: 'pool', type: 'address' },
          { name: 'token0', type: 'address' },
          { name: 'token1', type: 'address' },
          { name: 'index', type: 'uint32' },
          { name: 'fee', type: 'uint24' },
          { name: 'feeProtocol', type: 'uint8' },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'tick', type: 'int24' },
          { name: 'sqrtPriceX96', type: 'uint160' },
          { name: 'liquidity', type: 'uint128' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getPairs',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'token0', type: 'address' },
          { name: 'token1', type: 'address' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'createAndInitializePoolIfNecessary',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'token0', type: 'address' },
          { name: 'token1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'sqrtPriceX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'pool', type: 'address' }],
  },
] as const

// PositionManager ABI
export const POSITION_MANAGER_ABI = [
  {
    type: 'function',
    name: 'getAllPositions',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: 'positionInfo',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'token0', type: 'address' },
          { name: 'token1', type: 'address' },
          { name: 'index', type: 'uint32' },
          { name: 'fee', type: 'uint24' },
          { name: 'liquidity', type: 'uint128' },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'tokensOwed0', type: 'uint128' },
          { name: 'tokensOwed1', type: 'uint128' },
          { name: 'feeGrowthInside0LastX128', type: 'uint256' },
          { name: 'feeGrowthInside1LastX128', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'token0', type: 'address' },
          { name: 'token1', type: 'address' },
          { name: 'index', type: 'uint32' },
          { name: 'amount0Desired', type: 'uint256' },
          { name: 'amount1Desired', type: 'uint256' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
    ],
    outputs: [
      { name: 'positionId', type: 'uint256' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'burn',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'positionId', type: 'uint256' }],
    outputs: [
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'collect',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'positionId', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' },
    ],
  },
] as const

// ERC20 ABI (简化版本)
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// 流动性管理器ABI
export const LIQUIDITY_MANAGER_ABI = [
  {
    type: 'function',
    name: 'addLiquidity',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'token0', type: 'address' },
          { name: 'token1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'amount0Desired', type: 'uint256' },
          { name: 'amount1Desired', type: 'uint256' },
          { name: 'amount0Min', type: 'uint256' },
          { name: 'amount1Min', type: 'uint256' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
    ],
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'amount0', type: 'uint128' },
      { name: 'amount1', type: 'uint128' },
    ],
  },
] as const

// 合约配置
export const contractConfig = {
  swapRouter: {
    address: CONTRACTS.SWAP_ROUTER as `0x${string}`,
    abi: SWAP_ROUTER_ABI,
  },
  poolManager: {
    address: CONTRACTS.POOL_MANAGER as `0x${string}`,
    abi: POOL_MANAGER_ABI,
  },
  positionManager: {
    address: CONTRACTS.POSITION_MANAGER as `0x${string}`,
    abi: POSITION_MANAGER_ABI,
  },
  pool: {
    abi: POOL_ABI,
  },
  erc20: {
    abi: ERC20_ABI,
  },
  liquidityManager: {
    address: CONTRACTS.LIQUIDITY_MANAGER as `0x${string}`,
    abi: LIQUIDITY_MANAGER_ABI,
  },
} 