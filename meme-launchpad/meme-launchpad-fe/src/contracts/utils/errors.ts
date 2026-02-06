/**
 * Contract Error Handling Utilities
 * Following the smart contract integration standard
 */

import {
  BaseError,
  ContractFunctionRevertedError,
  TransactionExecutionError,
} from 'viem'
import { ERROR_CODES, CoinRollCoreError } from '@/contracts/types/coinrollCore'

// ============================================================================
// Error Types
// ============================================================================

export enum ContractErrorCode {
  // Contract-specific errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_FEE = 'INSUFFICIENT_FEE',
  INSUFFICIENT_MARGIN = 'INSUFFICIENT_MARGIN',
  INSUFFICIENT_ALLOWANCE = 'INSUFFICIENT_ALLOWANCE',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  INVALID_SIGNER = 'INVALID_SIGNER',
  INVALID_STATUS = 'INVALID_STATUS',
  REQUEST_ALREADY_PROCESSED = 'REQUEST_ALREADY_PROCESSED',
  REQUEST_EXPIRED = 'REQUEST_EXPIRED',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  TOKEN_NOT_TRADING = 'TOKEN_NOT_TRADING',
  TRANSACTION_EXPIRED = 'TRANSACTION_EXPIRED',
  CONTRACT_PAUSED = 'CONTRACT_PAUSED',

  // User errors
  USER_REJECTED = 'USER_REJECTED',
  USER_CANCELLED = 'USER_CANCELLED',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_ERROR = 'RPC_ERROR',

  // Validation errors
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',

  // Gas errors
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  OUT_OF_GAS = 'OUT_OF_GAS',

  // Unknown
  UNKNOWN = 'UNKNOWN',
}

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES: Record<ContractErrorCode, string> = {
  [ContractErrorCode.INSUFFICIENT_BALANCE]:
    'Insufficient token balance for this operation',
  [ContractErrorCode.INSUFFICIENT_FEE]: 'Insufficient BNB for transaction fees',
  [ContractErrorCode.INSUFFICIENT_MARGIN]:
    'Insufficient margin for token creation',
  [ContractErrorCode.INSUFFICIENT_ALLOWANCE]:
    'Please approve tokens before this operation',
  [ContractErrorCode.INVALID_PARAMETERS]: 'Invalid parameters provided',
  [ContractErrorCode.INVALID_SIGNER]: 'Invalid signature or signer',
  [ContractErrorCode.INVALID_STATUS]:
    'Token is in an invalid status for this operation',
  [ContractErrorCode.REQUEST_ALREADY_PROCESSED]:
    'This request has already been processed',
  [ContractErrorCode.REQUEST_EXPIRED]: 'Request has expired, please try again',
  [ContractErrorCode.SLIPPAGE_EXCEEDED]:
    'Price changed too much, transaction reverted',
  [ContractErrorCode.TOKEN_NOT_TRADING]: 'Token is not available for trading',
  [ContractErrorCode.TRANSACTION_EXPIRED]: 'Transaction deadline has passed',
  [ContractErrorCode.CONTRACT_PAUSED]: 'Contract is temporarily paused',
  [ContractErrorCode.USER_REJECTED]: 'Transaction was rejected by user',
  [ContractErrorCode.USER_CANCELLED]: 'Transaction was cancelled by user',
  [ContractErrorCode.NETWORK_ERROR]:
    'Network connection error, please try again',
  [ContractErrorCode.RPC_ERROR]: 'RPC node error, please try again',
  [ContractErrorCode.INVALID_ADDRESS]: 'Invalid Ethereum address provided',
  [ContractErrorCode.INVALID_AMOUNT]: 'Invalid amount provided',
  [ContractErrorCode.GAS_ESTIMATION_FAILED]:
    'Failed to estimate gas, transaction may fail',
  [ContractErrorCode.OUT_OF_GAS]: 'Transaction ran out of gas',
  [ContractErrorCode.UNKNOWN]: 'An unexpected error occurred',
}

// ============================================================================
// Error Parsing
// ============================================================================

/**
 * Parse contract error from various error types
 */
export function parseContractError(error: unknown): {
  code: ContractErrorCode
  message: string
  details?: any
  originalError?: unknown
} {
  // Handle Viem BaseError
  if (error instanceof BaseError) {
    return parseViemError(error)
  }

  // Handle standard Error
  if (error instanceof Error) {
    return parseStandardError(error)
  }

  // Handle string errors
  if (typeof error === 'string') {
    return parseStringError(error)
  }

  // Unknown error type
  return {
    code: ContractErrorCode.UNKNOWN,
    message: ERROR_MESSAGES[ContractErrorCode.UNKNOWN],
    originalError: error,
  }
}

/**
 * Parse Viem-specific errors
 */
function parseViemError(error: BaseError): {
  code: ContractErrorCode
  message: string
  details?: any
  originalError?: unknown
} {
  // Check for contract revert
  const revertError = error.walk(
    (e) => e instanceof ContractFunctionRevertedError
  )

  if (revertError instanceof ContractFunctionRevertedError) {
    const errorName = revertError.data?.errorName ?? ''

    // Map contract error names to our error codes
    const errorMapping: Record<string, ContractErrorCode> = {
      InsufficientBalance: ContractErrorCode.INSUFFICIENT_BALANCE,
      InsufficientFee: ContractErrorCode.INSUFFICIENT_FEE,
      InsufficientMargin: ContractErrorCode.INSUFFICIENT_MARGIN,
      InvalidParameters: ContractErrorCode.INVALID_PARAMETERS,
      InvalidSigner: ContractErrorCode.INVALID_SIGNER,
      InvalidStatus: ContractErrorCode.INVALID_STATUS,
      RequestAlreadyProcessed: ContractErrorCode.REQUEST_ALREADY_PROCESSED,
      RequestExpired: ContractErrorCode.REQUEST_EXPIRED,
      SlippageExceeded: ContractErrorCode.SLIPPAGE_EXCEEDED,
      TokenNotTrading: ContractErrorCode.TOKEN_NOT_TRADING,
      TransactionExpired: ContractErrorCode.TRANSACTION_EXPIRED,
      EnforcedPause: ContractErrorCode.CONTRACT_PAUSED,
      Unauthorized: ContractErrorCode.INVALID_SIGNER,
    }

    const code = errorMapping[errorName] || ContractErrorCode.UNKNOWN

    return {
      code,
      message: ERROR_MESSAGES[code] || `Contract error: ${errorName}`,
      details: revertError.data,
      originalError: error,
    }
  }

  // Check for user rejection
  if (
    error.message?.includes('User rejected') ||
    error.message?.includes('User denied')
  ) {
    return {
      code: ContractErrorCode.USER_REJECTED,
      message: ERROR_MESSAGES[ContractErrorCode.USER_REJECTED],
      originalError: error,
    }
  }

  // Check for RPC/HTTP errors
  if (
    error.message?.includes('RPC endpoint') ||
    error.message?.includes('HTTP client error') ||
    error.message?.includes('fetch failed') ||
    error.message?.includes('network error') ||
    error.cause?.message?.includes('fetch')
  ) {
    return {
      code: ContractErrorCode.RPC_ERROR,
      message: ERROR_MESSAGES[ContractErrorCode.RPC_ERROR],
      originalError: error,
    }
  }

  // Check for gas errors
  if (error.message?.includes('gas') || error.message?.includes('Gas')) {
    return {
      code: ContractErrorCode.GAS_ESTIMATION_FAILED,
      message: ERROR_MESSAGES[ContractErrorCode.GAS_ESTIMATION_FAILED],
      originalError: error,
    }
  }

  // Default Viem error
  return {
    code: ContractErrorCode.UNKNOWN,
    message: error.shortMessage || error.message,
    originalError: error,
  }
}

/**
 * Parse standard JavaScript errors
 */
function parseStandardError(error: Error): {
  code: ContractErrorCode
  message: string
  details?: any
  originalError?: unknown
} {
  const message = error.message.toLowerCase()

  // Check for specific error patterns
  if (message.includes('insufficient') && message.includes('balance')) {
    return {
      code: ContractErrorCode.INSUFFICIENT_BALANCE,
      message: ERROR_MESSAGES[ContractErrorCode.INSUFFICIENT_BALANCE],
      originalError: error,
    }
  }

  if (
    message.includes('user') &&
    (message.includes('reject') || message.includes('denied'))
  ) {
    return {
      code: ContractErrorCode.USER_REJECTED,
      message: ERROR_MESSAGES[ContractErrorCode.USER_REJECTED],
      originalError: error,
    }
  }

  if (message.includes('network') || message.includes('fetch')) {
    return {
      code: ContractErrorCode.NETWORK_ERROR,
      message: ERROR_MESSAGES[ContractErrorCode.NETWORK_ERROR],
      originalError: error,
    }
  }

  return {
    code: ContractErrorCode.UNKNOWN,
    message: error.message,
    originalError: error,
  }
}

/**
 * Parse string errors
 */
function parseStringError(error: string): {
  code: ContractErrorCode
  message: string
  details?: any
  originalError?: unknown
} {
  const errorLower = error.toLowerCase()

  // Check for known patterns
  for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorLower.includes(code.toLowerCase().replace(/_/g, ' '))) {
      return {
        code: code as ContractErrorCode,
        message,
        originalError: error,
      }
    }
  }

  return {
    code: ContractErrorCode.UNKNOWN,
    message: error,
    originalError: error,
  }
}

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * Format error for user display
 */
export function formatErrorForDisplay(error: unknown): string {
  const parsed = parseContractError(error)
  return parsed.message
}

/**
 * Format error with details for logging
 */
export function formatErrorForLogging(error: unknown): string {
  const parsed = parseContractError(error)

  const parts = [`[${parsed.code}] ${parsed.message}`]

  if (parsed.details) {
    parts.push(`Details: ${JSON.stringify(parsed.details)}`)
  }

  if (parsed.originalError) {
    parts.push(`Original: ${parsed.originalError}`)
  }

  return parts.join(' | ')
}

// ============================================================================
// Error Recovery
// ============================================================================

/**
 * Suggest recovery action based on error code
 */
export function getSuggestedAction(code: ContractErrorCode): string | null {
  const suggestions: Partial<Record<ContractErrorCode, string>> = {
    [ContractErrorCode.INSUFFICIENT_BALANCE]:
      'Please ensure you have enough tokens in your wallet',
    [ContractErrorCode.INSUFFICIENT_FEE]:
      'Please add more BNB to your wallet for gas fees',
    [ContractErrorCode.INSUFFICIENT_ALLOWANCE]:
      'Please approve the contract to spend your tokens',
    [ContractErrorCode.SLIPPAGE_EXCEEDED]:
      'Try increasing your slippage tolerance',
    [ContractErrorCode.REQUEST_EXPIRED]: 'Please refresh and try again',
    [ContractErrorCode.NETWORK_ERROR]:
      'Check your internet connection and try again',
    [ContractErrorCode.CONTRACT_PAUSED]:
      'Please wait for the contract to be unpaused',
    [ContractErrorCode.GAS_ESTIMATION_FAILED]:
      'Try reducing the transaction amount or wait for network congestion to clear',
  }

  return suggestions[code] || null
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(code: ContractErrorCode): boolean {
  const nonRecoverable = [
    ContractErrorCode.INVALID_SIGNER,
    ContractErrorCode.REQUEST_ALREADY_PROCESSED,
    ContractErrorCode.INVALID_PARAMETERS,
  ]

  return !nonRecoverable.includes(code)
}

// ============================================================================
// Error Handlers
// ============================================================================

/**
 * Handle contract error with toast notification
 */
export function handleContractError(
  error: unknown,
  options?: {
    showToast?: boolean
    logError?: boolean
    onError?: (error: unknown) => void
  }
): void {
  const { showToast = true, logError = true, onError } = options || {}

  const parsed = parseContractError(error)

  if (logError) {
    console.error(formatErrorForLogging(error))
  }

  if (showToast) {
    // Import toast dynamically to avoid circular dependencies
    import('sonner').then(({ toast }) => {
      toast.error(parsed.message)

      const suggestion = getSuggestedAction(parsed.code)
      if (suggestion) {
        toast.info(suggestion)
      }
    })
  }

  if (onError) {
    onError(error)
  }
}

/**
 * Retry handler for recoverable errors
 */
export async function retryOnError<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number
    retryDelay?: number
    shouldRetry?: (error: unknown) => boolean
  }
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, shouldRetry } = options || {}

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const parsed = parseContractError(error)

      // Check if we should retry
      const canRetry = shouldRetry
        ? shouldRetry(error)
        : isRecoverableError(parsed.code)

      if (!canRetry || attempt === maxRetries - 1) {
        throw error
      }

      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * (attempt + 1))
      )
    }
  }

  throw new Error('Max retries exceeded')
}
