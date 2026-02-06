/**
 * Contract Input Validation Utilities
 * Following the smart contract integration standard
 */

import { isAddress, getAddress } from 'viem'
import {
  isValidPercentageBP,
  isValidInitialBuyPercentage,
  COINROLL_CORE_CONSTANTS,
} from '@/contracts/types/coinrollCore'

// ============================================================================
// Address Validation
// ============================================================================

/**
 * Validate and checksum an Ethereum address
 * @throws Error if address is invalid
 */
export function validateAddress(address: string): `0x${string}` {
  if (!address) {
    throw new Error('Address is required')
  }

  if (!isAddress(address)) {
    throw new Error('Invalid Ethereum address format')
  }

  // Return checksummed address
  return getAddress(address)
}

/**
 * Validate multiple addresses
 * @throws Error if any address is invalid
 */
export function validateAddresses(addresses: string[]): `0x${string}`[] {
  return addresses.map((addr, index) => {
    try {
      return validateAddress(addr)
    } catch (error) {
      throw new Error(
        `Invalid address at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })
}

/**
 * Check if address is zero address
 */
export function isZeroAddress(address: string): boolean {
  return address === '0x0000000000000000000000000000000000000000'
}

// ============================================================================
// Amount Validation
// ============================================================================

/**
 * Validate token amount
 * @throws Error if amount is invalid
 */
export function validateAmount(
  amount: string,
  decimals: number,
  options?: {
    min?: bigint | string
    max?: bigint | string
    allowZero?: boolean
  }
): void {
  if (!amount) {
    throw new Error('Amount is required')
  }

  const num = parseFloat(amount)

  if (isNaN(num)) {
    throw new Error('Amount must be a valid number')
  }

  if (!options?.allowZero && num <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  if (options?.allowZero && num < 0) {
    throw new Error('Amount cannot be negative')
  }

  // Check decimal places
  const decimalPlaces = amount.split('.')[1]?.length || 0
  if (decimalPlaces > decimals) {
    throw new Error(`Maximum ${decimals} decimal places allowed`)
  }

  // Check min/max if provided
  if (options?.min !== undefined) {
    const minValue =
      typeof options.min === 'string'
        ? parseFloat(options.min)
        : Number(options.min)
    if (num < minValue) {
      throw new Error(`Amount must be at least ${minValue}`)
    }
  }

  if (options?.max !== undefined) {
    const maxValue =
      typeof options.max === 'string'
        ? parseFloat(options.max)
        : Number(options.max)
    if (num > maxValue) {
      throw new Error(`Amount must not exceed ${maxValue}`)
    }
  }
}

/**
 * Validate BNB amount
 */
export function validateBNBAmount(
  amount: string,
  options?: {
    min?: string
    max?: string
    allowZero?: boolean
  }
): void {
  validateAmount(amount, 18, options)
}

// ============================================================================
// Token Parameters Validation
// ============================================================================

/**
 * Validate token name
 * @throws Error if name is invalid
 */
export function validateTokenName(name: string): void {
  if (!name) {
    throw new Error('Token name is required')
  }

  if (name.length < 2) {
    throw new Error('Token name must be at least 2 characters')
  }

  if (name.length > 50) {
    throw new Error('Token name must not exceed 50 characters')
  }

  // Check for invalid characters (optional, adjust as needed)
  const validNameRegex = /^[a-zA-Z0-9\s\-_.]+$/
  if (!validNameRegex.test(name)) {
    throw new Error('Token name contains invalid characters')
  }
}

/**
 * Validate token symbol
 * @throws Error if symbol is invalid
 */
export function validateTokenSymbol(symbol: string): void {
  if (!symbol) {
    throw new Error('Token symbol is required')
  }

  if (symbol.length < 2) {
    throw new Error('Token symbol must be at least 2 characters')
  }

  if (symbol.length > 10) {
    throw new Error('Token symbol must not exceed 10 characters')
  }

  // Symbols should be uppercase alphanumeric
  const validSymbolRegex = /^[A-Z0-9]+$/
  if (!validSymbolRegex.test(symbol.toUpperCase())) {
    throw new Error('Token symbol must be alphanumeric')
  }
}

/**
 * Validate token supply
 * @throws Error if supply is invalid
 */
export function validateTokenSupply(supply: string): void {
  validateAmount(supply, 18, {
    min: '1',
    max: '1000000000000000', // 1 quadrillion tokens
    allowZero: false,
  })
}

// ============================================================================
// Percentage Validation
// ============================================================================

/**
 * Validate slippage percentage
 * @throws Error if slippage is invalid
 */
export function validateSlippage(slippage: number): void {
  if (slippage < 0) {
    throw new Error('Slippage cannot be negative')
  }

  if (slippage > 50) {
    throw new Error('Slippage cannot exceed 50%')
  }

  if (slippage > 10) {
    console.warn('High slippage tolerance detected:', slippage)
  }
}

/**
 * Validate percentage in basis points
 * @throws Error if percentage is invalid
 */
export function validatePercentageBP(percentageBP: number): void {
  if (!isValidPercentageBP(percentageBP)) {
    throw new Error(
      'Percentage must be between 0 and 10000 basis points (0-100%)'
    )
  }
}

/**
 * Validate initial buy percentage
 * @throws Error if percentage is invalid
 */
export function validateInitialBuyPercentage(percentageBP: number): void {
  if (!isValidInitialBuyPercentage(percentageBP)) {
    throw new Error(
      `Initial buy percentage must be between 0 and ${COINROLL_CORE_CONSTANTS.MAX_INITIAL_BUY_PERCENTAGE} basis points`
    )
  }
}

// ============================================================================
// Transaction Validation
// ============================================================================

/**
 * Validate deadline timestamp
 * @throws Error if deadline is invalid
 */
export function validateDeadline(deadline: number): void {
  const now = Math.floor(Date.now() / 1000)

  if (deadline <= now) {
    throw new Error('Deadline must be in the future')
  }

  const maxDeadline = now + 3600 // 1 hour max
  if (deadline > maxDeadline) {
    throw new Error('Deadline too far in the future (max 1 hour)')
  }
}

/**
 * Validate request timestamp for signature
 * @throws Error if timestamp is invalid
 */
export function validateRequestTimestamp(timestamp: number): void {
  const now = Math.floor(Date.now() / 1000)
  const maxAge = COINROLL_CORE_CONSTANTS.REQUEST_EXPIRY

  if (timestamp > now) {
    throw new Error('Request timestamp cannot be in the future')
  }

  if (timestamp < now - maxAge) {
    throw new Error('Request has expired')
  }
}

// ============================================================================
// Metadata Validation
// ============================================================================

/**
 * Validate token metadata
 * @throws Error if metadata is invalid
 */
export function validateTokenMetadata(metadata: any): void {
  if (!metadata) return // Metadata is optional

  // Check size limit (e.g., 1KB)
  const metadataString = JSON.stringify(metadata)
  if (metadataString.length > 1024) {
    throw new Error('Metadata exceeds maximum size (1KB)')
  }

  // Validate URLs if present
  const urlFields = ['website', 'twitter', 'telegram', 'discord']
  for (const field of urlFields) {
    if (metadata[field]) {
      try {
        new URL(metadata[field])
      } catch {
        throw new Error(`Invalid URL for ${field}`)
      }
    }
  }

  // Validate logo if present
  if (metadata.logo) {
    if (
      !metadata.logo.startsWith('https://') &&
      !metadata.logo.startsWith('ipfs://')
    ) {
      throw new Error('Logo URL must use HTTPS or IPFS protocol')
    }
  }
}

// ============================================================================
// Composite Validation
// ============================================================================

/**
 * Validate all parameters for token creation
 * @throws Error if any parameter is invalid
 */
export function validateCreateTokenParams(params: {
  name: string
  symbol: string
  totalSupply: string
  creator: string
  initialBuyPercentageBP?: number
  metadata?: any
}): void {
  // Validate basic token info
  validateTokenName(params.name)
  validateTokenSymbol(params.symbol)
  validateTokenSupply(params.totalSupply)
  validateAddress(params.creator)

  // Validate initial buy if present
  if (params.initialBuyPercentageBP !== undefined) {
    validateInitialBuyPercentage(params.initialBuyPercentageBP)
  }

  // Validate metadata if present
  if (params.metadata) {
    validateTokenMetadata(params.metadata)
  }
}

/**
 * Validate parameters for calculating initial buy
 * @throws Error if any parameter is invalid
 */
export function validateCalculateInitialBuyParams(params: {
  saleAmount: string
  virtualBNBReserve: string
  virtualTokenReserve: string
  percentageBP: number
}): void {
  validateAmount(params.saleAmount, 18, { allowZero: false })
  validateAmount(params.virtualBNBReserve, 18, { allowZero: false })
  validateAmount(params.virtualTokenReserve, 18, { allowZero: false })
  validatePercentageBP(params.percentageBP)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format validation errors for display
 */
export function formatValidationError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Validation failed'
}

/**
 * Batch validate multiple fields
 * Returns array of errors or empty array if all valid
 */
export function batchValidate(
  validations: Array<{ field: string; validate: () => void }>
): Array<{ field: string; error: string }> {
  const errors: Array<{ field: string; error: string }> = []

  for (const { field, validate } of validations) {
    try {
      validate()
    } catch (error) {
      errors.push({
        field,
        error: formatValidationError(error),
      })
    }
  }

  return errors
}
