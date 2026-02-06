/**
 * CoinRollCore Contract Hooks Exports
 * Following the smart contract integration standard
 */

export {
  useCalculateInitialBuyBNB,
  calculateInitialBuyBNBDirect,
} from './useCalculateInitialBuyBNB'
export { useCreateToken } from './useCreateToken'
export { useCreateTokenContract } from './useCreateTokenContract'
export { useBuyTokens, calculateMinTokenAmount } from './useBuyTokens'
export { useSellTokens, calculateMinBNBAmount } from './useSellTokens'
export { useBondingCurve } from './useBondingCurve'

export type {
  CreateTokenContractParams,
  CreateTokenContractResult,
} from './useCreateTokenContract'
export type { BuyTokensParams, BuyTokensResult } from './useBuyTokens'
export type { SellTokensParams, SellTokensResult } from './useSellTokens'
export type {
  UseBondingCurveParams,
  UseBondingCurveResult,
} from './useBondingCurve'

// Re-export types for convenience
export type {
  CalculateInitialBuyBNBParams,
  CreateTokenParams,
  CreateTokenResult,
  CalculateInitialBuyResult,
  TokenCreatedEvent,
  TokenCreatedWithInitialBuyEvent,
} from '@/contracts/types/coinrollCore'
