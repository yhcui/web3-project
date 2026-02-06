/**
 * CoinRollHelper Contract Hooks Exports
 * Following the smart contract integration standard
 */

export {
  useCalculateTokenAmountOut,
  calculateTokenAmountOutDirect,
} from './useCalculateTokenAmountOut'

export {
  useCalculateBNBAmountOut,
  calculateBNBAmountOutDirect,
} from './useCalculateBNBAmountOut'

// Re-export types for convenience
export type {
  BondingCurveParams,
  CalculateTokenAmountOutParams,
  CalculateTokenAmountOutResult,
  CalculateBNBAmountOutParams,
  CalculateBNBAmountOutResult,
  GetPriceParams,
  GetPriceResult,
  EstimateLPTokensParams,
  EstimateLPTokensResult,
  GetPairAddressParams,
  GetPairAddressResult,
  TradeDirection,
  TradeParams,
  TradeQuote,
  TradeValidation,
  LiquidityValidation,
} from '@/contracts/types/coinrollHelper'

export {
  COINROLL_HELPER_CONSTANTS,
  CoinRollHelperError,
  formatHelperError,
} from '@/contracts/types/coinrollHelper'
