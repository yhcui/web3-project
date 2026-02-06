/**
 * CoinRollHelper Contract Types
 * Following the smart contract integration standard
 */

import type { Address } from 'viem'

// ============================================================================
// Contract Types
// ============================================================================

/**
 * Bonding curve parameters
 */
export interface BondingCurveParams {
  virtualBNBReserve: bigint
  virtualTokenReserve: bigint
  k: bigint
  availableTokens: bigint
  collectedBNB: bigint
}

/**
 * Parameters for calculating token amount out
 */
export interface CalculateTokenAmountOutParams {
  bnbIn: bigint | string
  curve: BondingCurveParams
}

/**
 * Parameters for calculating BNB amount out
 */
export interface CalculateBNBAmountOutParams {
  tokenIn: bigint | string
  curve: BondingCurveParams
}

/**
 * Result of token amount calculation
 */
export interface CalculateTokenAmountOutResult {
  tokenAmount: bigint
  tokenAmountFormatted: string
  priceImpact: number
  averagePrice: string
  priceAfterTrade: string
}

/**
 * Result of BNB amount calculation
 */
export interface CalculateBNBAmountOutResult {
  bnbAmount: bigint
  bnbAmountFormatted: string
  priceImpact: number
  averagePrice: string
  priceAfterTrade: string
}

/**
 * Parameters for getting price
 */
export interface GetPriceParams {
  curve: BondingCurveParams
}

/**
 * Result of getting price
 */
export interface GetPriceResult {
  price: bigint
  priceFormatted: string
  priceInUSD?: number // Optional, can be calculated with BNB price
}

/**
 * Parameters for estimating LP tokens
 */
export interface EstimateLPTokensParams {
  token: Address
  bnbAmount: bigint | string
  tokenAmount: bigint | string
}

/**
 * Result of LP token estimation
 */
export interface EstimateLPTokensResult {
  lpTokens: bigint
  lpTokensFormatted: string
  shareOfPool: number // Percentage
}

/**
 * Parameters for getting pair address
 */
export interface GetPairAddressParams {
  token: Address
}

/**
 * Result of getting pair address
 */
export interface GetPairAddressResult {
  pairAddress: Address
  isV2: boolean
  isV3: boolean
}

// ============================================================================
// Constants
// ============================================================================

export const COINROLL_HELPER_CONSTANTS = {
  // Basis points
  BASIS_POINTS: 10000,

  // Default slippage in basis points (5% = 500 bp)
  DEFAULT_SLIPPAGE_BP: 500,

  // Maximum slippage in basis points (10% = 1000 bp)
  MAX_SLIPPAGE_BP: 1000,

  // Minimum trade amounts
  MIN_BNB_AMOUNT: BigInt('1000000000000000'), // 0.001 BNB
  MIN_TOKEN_AMOUNT: BigInt('1000000000000000000'), // 1 token (18 decimals)

  // Fee basis points
  TRADING_FEE_BP: 30, // 0.3% trading fee

  // PancakeSwap addresses (will be loaded from contract)
  PANCAKE_V2_ROUTER: '0x10ED43C718714eb63d5aA57B78B54704E256024E' as Address,
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as Address,
} as const

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Trade validation result
 */
export interface TradeValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  minAmountOut?: bigint
  maxAmountIn?: bigint
  priceImpact?: number
}

/**
 * Liquidity validation result
 */
export interface LiquidityValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  minLPTokens?: bigint
  shareOfPool?: number
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * No specific events for CoinRollHelper as it's a helper contract
 * Events would be emitted from the main contracts (Core, Factory)
 */

// ============================================================================
// Error Types
// ============================================================================

export enum CoinRollHelperError {
  INSUFFICIENT_LIQUIDITY = 'InsufficientLiquidity',
  INVALID_CURVE = 'InvalidCurve',
  ZERO_AMOUNT = 'ZeroAmount',
  SLIPPAGE_TOO_HIGH = 'SlippageTooHigh',
  INSUFFICIENT_BALANCE = 'InsufficientBalance',
  PAIR_NOT_FOUND = 'PairNotFound',
  CALCULATION_OVERFLOW = 'CalculationOverflow',
}

/**
 * Helper function to format error messages
 */
export function formatHelperError(error: CoinRollHelperError): string {
  const errorMessages: Record<CoinRollHelperError, string> = {
    [CoinRollHelperError.INSUFFICIENT_LIQUIDITY]:
      'Insufficient liquidity for this trade',
    [CoinRollHelperError.INVALID_CURVE]: 'Invalid bonding curve parameters',
    [CoinRollHelperError.ZERO_AMOUNT]: 'Trade amount cannot be zero',
    [CoinRollHelperError.SLIPPAGE_TOO_HIGH]: 'Slippage tolerance exceeded',
    [CoinRollHelperError.INSUFFICIENT_BALANCE]:
      'Insufficient balance for this trade',
    [CoinRollHelperError.PAIR_NOT_FOUND]: 'Trading pair not found',
    [CoinRollHelperError.CALCULATION_OVERFLOW]: 'Calculation overflow occurred',
  }

  return errorMessages[error] || 'Unknown error occurred'
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Trade direction
 */
export enum TradeDirection {
  BUY = 'buy',
  SELL = 'sell',
}

/**
 * Trade parameters for UI
 */
export interface TradeParams {
  direction: TradeDirection
  inputAmount: string
  outputAmount?: string
  slippageBP: number
  deadline?: number
  recipient?: Address
}

/**
 * Trade quote for UI display
 */
export interface TradeQuote {
  inputAmount: string
  outputAmount: string
  minimumOutput: string
  priceImpact: number
  tradeFee: string
  route: string[]
  estimatedGas?: bigint
  pricePerToken: string
}
