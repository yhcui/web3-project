/**
 * Contract Addresses Configuration
 * Following the smart contract integration standard
 */

import { Address } from 'viem'
import { bsc, bscTestnet } from 'wagmi/chains'

// ============================================================================
// Contract Address Types
// ============================================================================

export interface ContractAddresses {
  coinrollCore: Address
  coinrollFactory?: Address
  coinrollHelper?: Address
  pancakeRouter?: Address
  pancakeFactory?: Address
  wbnb?: Address
  // Add more contracts as needed
}

// ============================================================================
// BSC Mainnet Addresses
// ============================================================================

const bscMainnetAddresses: ContractAddresses = {
  // CoinRoll contracts - use environment variables for deployment addresses
  coinrollCore: (process.env.NEXT_PUBLIC_COINROLL_CORE_ADDRESS_MAINNET ||
    '0x0000000000000000000000000000000000000000') as Address,
  coinrollFactory: (process.env.NEXT_PUBLIC_COINROLL_FACTORY_ADDRESS_MAINNET ||
    '0x0000000000000000000000000000000000000000') as Address,
  coinrollHelper: (process.env.NEXT_PUBLIC_COINROLL_HELPER_ADDRESS_MAINNET ||
    '0x0000000000000000000000000000000000000000') as Address,

  // PancakeSwap V2 addresses (these are actual addresses)
  pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E' as Address,
  pancakeFactory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73' as Address,
  wbnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as Address,
}

// ============================================================================
// BSC Testnet Addresses
// ============================================================================

const bscTestnetAddresses: ContractAddresses = {
  // CoinRoll contracts - use environment variables for deployment addresses
  coinrollCore: (process.env.NEXT_PUBLIC_COINROLL_CORE_ADDRESS_TESTNET ||
    '0x0000000000000000000000000000000000000000') as Address,
  coinrollFactory: (process.env.NEXT_PUBLIC_COINROLL_FACTORY_ADDRESS_TESTNET ||
    '0x0000000000000000000000000000000000000000') as Address,
  coinrollHelper: (process.env.NEXT_PUBLIC_COINROLL_HELPER_ADDRESS_TESTNET ||
    '0x0000000000000000000000000000000000000000') as Address,

  // PancakeSwap V2 Testnet addresses (these are actual addresses)
  pancakeRouter: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1' as Address,
  pancakeFactory: '0x6725F303b657a9451d8BA641348b6761A6CC7a17' as Address,
  wbnb: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' as Address,
}

// ============================================================================
// Address Registry
// ============================================================================

export const contractAddresses: Record<number, ContractAddresses> = {
  [bsc.id]: bscMainnetAddresses,
  [bscTestnet.id]: bscTestnetAddresses,
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get contract address for a specific chain
 */
export function getContractAddress(
  chainId: number,
  contractName: keyof ContractAddresses
): Address {
  const addresses = contractAddresses[chainId]

  if (!addresses) {
    throw new Error(`No addresses configured for chain ${chainId}`)
  }

  const address = addresses[contractName]

  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(
      `Contract "${contractName}" not deployed on chain ${chainId}. ` +
        `Please update the address in src/contracts/addresses/index.ts`
    )
  }

  return address
}

/**
 * Get all contract addresses for a specific chain
 */
export function getChainAddresses(chainId: number): ContractAddresses {
  const addresses = contractAddresses[chainId]

  if (!addresses) {
    throw new Error(`No addresses configured for chain ${chainId}`)
  }

  return addresses
}

/**
 * Check if a contract is deployed on a specific chain
 */
export function isContractDeployed(
  chainId: number,
  contractName: keyof ContractAddresses
): boolean {
  try {
    const address = getContractAddress(chainId, contractName)
    return address !== '0x0000000000000000000000000000000000000000'
  } catch {
    return false
  }
}

/**
 * Get the current chain's contract addresses
 * Note: This should be used within a component that has access to wagmi hooks
 */
export function getCurrentChainAddresses(chainId: number): ContractAddresses {
  return getChainAddresses(chainId)
}

// ============================================================================
// Environment-based Configuration
// ============================================================================

/**
 * Get the default chain ID based on environment
 */
export function getDefaultChainId(): number {
  return process.env.NEXT_PUBLIC_CHAIN_ENV === 'mainnet'
    ? bsc.id
    : bscTestnet.id
}

/**
 * Get the default contract addresses based on environment
 */
export function getDefaultAddresses(): ContractAddresses {
  const chainId = getDefaultChainId()
  return getChainAddresses(chainId)
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that all required contracts are configured for a chain
 */
export function validateChainConfiguration(chainId: number): {
  isValid: boolean
  missingContracts: string[]
} {
  const addresses = contractAddresses[chainId]

  if (!addresses) {
    return {
      isValid: false,
      missingContracts: ['all'],
    }
  }

  const requiredContracts: (keyof ContractAddresses)[] = [
    'coinrollCore',
    // Add other required contracts here
  ]

  const missingContracts = requiredContracts.filter(
    (contract) =>
      !addresses[contract] ||
      addresses[contract] === '0x0000000000000000000000000000000000000000'
  )

  return {
    isValid: missingContracts.length === 0,
    missingContracts,
  }
}

// ============================================================================
// Exports for specific contracts
// ============================================================================

/**
 * Get CoinRollCore contract address
 */
export function getCoinRollCoreAddress(chainId: number): Address {
  return getContractAddress(chainId, 'coinrollCore')
}

/**
 * Get CoinRollFactory contract address
 */
export function getCoinRollFactoryAddress(chainId: number): Address {
  return getContractAddress(chainId, 'coinrollFactory')
}

/**
 * Get PancakeSwap Router address
 */
export function getPancakeRouterAddress(chainId: number): Address {
  return getContractAddress(chainId, 'pancakeRouter')
}

/**
 * Get WBNB address
 */
export function getWBNBAddress(chainId: number): Address {
  return getContractAddress(chainId, 'wbnb')
}
