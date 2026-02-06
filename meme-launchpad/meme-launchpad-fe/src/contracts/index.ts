/**
 * Smart Contract Integration Exports
 * Main entry point for all contract-related functionality
 * Following the smart contract integration standard
 */

// ============================================================================
// ABIs
// ============================================================================
export { default as CoinRollCoreABI } from './abis/CoinRollCore.json'

// ============================================================================
// Types
// ============================================================================
export * from './types/coinrollCore'

// ============================================================================
// Addresses
// ============================================================================
export {
  getContractAddress,
  getChainAddresses,
  isContractDeployed,
  getCurrentChainAddresses,
  getDefaultChainId,
  getDefaultAddresses,
  validateChainConfiguration,
  getCoinRollCoreAddress,
  getCoinRollFactoryAddress,
  getPancakeRouterAddress,
  getWBNBAddress,
  type ContractAddresses,
} from './addresses'

// ============================================================================
// Hooks
// ============================================================================
// CoinRollCore hooks
export {
  useCalculateInitialBuyBNB,
  calculateInitialBuyBNBDirect,
  useCreateToken,
} from './hooks/coinrollCore'

// ============================================================================
// Services
// ============================================================================
export { CoinRollCoreService } from './services/CoinRollCoreService'

// ============================================================================
// Utilities
// ============================================================================
// Validation utilities
export {
  validateAddress,
  validateAddresses,
  isZeroAddress,
  validateAmount,
  validateBNBAmount,
  validateTokenName,
  validateTokenSymbol,
  validateTokenSupply,
  validateSlippage,
  validatePercentageBP,
  validateInitialBuyPercentage,
  validateDeadline,
  validateRequestTimestamp,
  validateTokenMetadata,
  validateCreateTokenParams,
  validateCalculateInitialBuyParams,
  formatValidationError,
  batchValidate,
} from './utils/validation'

// Error handling utilities
export {
  ContractErrorCode,
  parseContractError,
  formatErrorForDisplay,
  formatErrorForLogging,
  getSuggestedAction,
  isRecoverableError,
  handleContractError,
  retryOnError,
} from './utils/errors'

// ============================================================================
// Constants
// ============================================================================
export { COINROLL_CORE_CONSTANTS } from './types/coinrollCore'
