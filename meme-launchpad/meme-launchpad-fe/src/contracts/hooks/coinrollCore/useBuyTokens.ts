/**
 * Hook for buying tokens with BNB on CoinRollCore
 * Following the smart contract integration standard
 */

import { useMemo, useCallback } from 'react'
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { parseEther, formatEther, Address } from 'viem'
import { getCoinRollCoreAddress } from '@/contracts/addresses'
import CoinRollCoreABI from '@/contracts/abis/CoinRollCore.json'
import type { BondingCurveParams } from '@/contracts/types/coinrollHelper'
import { retryOnError, parseContractError, ContractErrorCode } from '@/contracts/utils/errors'

export interface BuyTokensParams {
  tokenAddress?: string
  bnbAmount: string
  minTokenAmount: string
  deadline?: number
}

export interface BuyTokensResult {
  // Transaction functions
  buy: () => Promise<void>
  canBuy: boolean

  // Transaction state
  isPreparing: boolean
  isConfirming: boolean
  isWaiting: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null

  // Transaction data
  hash?: `0x${string}`
  receipt?: any

  // Helper functions
  reset: () => void
}

/**
 * Hook for buying tokens with BNB
 */
export function useBuyTokens(params: BuyTokensParams): BuyTokensResult {
  const { address: userAddress } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const contractAddress = useMemo(
    () => getCoinRollCoreAddress(publicClient?.chain?.id || 97), // Default to BSC testnet
    [publicClient?.chain?.id]
  )

  // Prepare contract arguments
  const contractArgs = useMemo(() => {
    if (!params.tokenAddress || !params.bnbAmount || !params.minTokenAmount) {
      return undefined
    }

    const deadlineTimestamp =
      params.deadline || Math.floor(Date.now() / 1000) + 300 // 5 minutes default

    return [
      params.tokenAddress as Address,
      parseEther(params.minTokenAmount),
      BigInt(deadlineTimestamp),
    ] as const
  }, [
    params.tokenAddress,
    params.bnbAmount,
    params.minTokenAmount,
    params.deadline,
  ])

  // Skip simulation - directly execute transactions
  const isPreparing = false
  const prepareError = null
  const simulateData = useMemo(() => {
    if (!contractArgs || !userAddress || !params.bnbAmount) return null
    return {
      request: {
        address: contractAddress,
        abi: CoinRollCoreABI,
        functionName: 'buy' as const,
        args: contractArgs,
        value: parseEther(params.bnbAmount),
        account: userAddress,
      },
    }
  }, [contractArgs, contractAddress, userAddress, params.bnbAmount])

  // Write contract
  const {
    writeContract,
    data: hash,
    isPending: isConfirming,
    isSuccess: isWriteSuccess,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  // Wait for transaction
  const {
    isLoading: isWaiting,
    isSuccess,
    isError: isReceiptError,
    error: receiptError,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Buy function with retry mechanism
  const buy = useCallback(async () => {
    if (!simulateData?.request) {
      throw new Error('Transaction not prepared')
    }

    // Retry on RPC errors
    await retryOnError(
      async () => {
        await writeContract(simulateData.request as any)
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        shouldRetry: (error) => {
          const parsed = parseContractError(error)
          return (
            parsed.code === ContractErrorCode.RPC_ERROR ||
            parsed.code === ContractErrorCode.NETWORK_ERROR
          )
        },
      }
    )
  }, [simulateData, writeContract])

  // Can buy check
  const canBuy = useMemo(() => {
    return Boolean(
      userAddress &&
        walletClient &&
        simulateData?.request &&
        !isPreparing &&
        !isConfirming &&
        !isWaiting &&
        !prepareError
    )
  }, [
    userAddress,
    walletClient,
    simulateData,
    isPreparing,
    isConfirming,
    isWaiting,
    prepareError,
  ])

  // Combined error
  const error = prepareError || writeError || receiptError

  // Reset function
  const reset = useCallback(() => {
    resetWrite()
  }, [resetWrite])

  return {
    buy,
    canBuy,
    isPreparing,
    isConfirming,
    isWaiting,
    isSuccess,
    isError: Boolean(error),
    error: error as Error | null,
    hash,
    receipt,
    reset,
  }
}

/**
 * Calculate minimum tokens to receive based on slippage
 */
export function calculateMinTokenAmount(
  expectedAmount: string,
  slippagePercent: number
): string {
  if (!expectedAmount || parseFloat(expectedAmount) === 0) {
    return '0'
  }

  // Add a small buffer (0.1%) to account for rounding differences
  const effectiveSlippage = slippagePercent + 0.1
  const slippageMultiplier = (100 - effectiveSlippage) / 100
  const minAmount = parseFloat(expectedAmount) * slippageMultiplier

  console.log('calculateMinTokenAmount:', {
    expectedAmount,
    slippagePercent,
    effectiveSlippage,
    slippageMultiplier,
    minAmount,
  })

  // Always return decimal format (not scientific notation) for viem's parseEther
  // Use 18 decimal places to match token precision
  // This prevents InvalidDecimalNumberError when parsing very small amounts
  if (minAmount === 0) {
    return '0'
  }

  // For very small amounts, use more decimal places to preserve precision
  if (minAmount < 0.0001) {
    return minAmount.toFixed(18)
  }

  // For larger amounts, use reasonable precision
  return minAmount.toFixed(6)
}
