/**
 * Hook for calculating token amount out for a given BNB input
 * Following the smart contract integration standard
 */

import { useReadContract } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { useChainId } from 'wagmi'
import { useMemo } from 'react'
import CoinRollHelperABI from '@/contracts/abis/CoinRollHelper.json'
import { getContractAddress } from '@/contracts/addresses'
import type {
  CalculateTokenAmountOutParams,
  CalculateTokenAmountOutResult,
  BondingCurveParams,
} from '@/contracts/types/coinrollHelper'

/**
 * Hook for calculating the token amount out for a given BNB input
 * This uses the pure function from the smart contract for accurate calculations
 */
export function useCalculateTokenAmountOut(
  params?: Partial<CalculateTokenAmountOutParams>
) {
  const chainId = useChainId()

  // Convert string values to bigint for contract call
  const contractArgs = useMemo(() => {
    if (!params?.bnbIn || !params?.curve) return undefined

    const { bnbIn, curve } = params

    // Convert BNB input to bigint if needed
    const bnbInBigInt = typeof bnbIn === 'string' ? parseEther(bnbIn) : bnbIn

    // Return undefined if BNB amount is 0
    if (bnbInBigInt === BigInt(0)) return undefined

    return [bnbInBigInt, curve] as const
  }, [params])

  // Get the helper contract address
  const helperAddress = useMemo(() => {
    try {
      return getContractAddress(chainId, 'coinrollHelper')
    } catch {
      // Return a placeholder address if not configured
      // This will make the hook return loading state
      return undefined
    }
  }, [chainId])

  // Call the contract's pure function
  const { data, isLoading, isError, error } = useReadContract({
    address: helperAddress,
    abi: CoinRollHelperABI,
    functionName: 'calculateTokenAmountOut',
    args: contractArgs,
    query: {
      enabled: Boolean(contractArgs && helperAddress),
    },
  })

  // Calculate additional metrics
  const result = useMemo((): CalculateTokenAmountOutResult | null => {
    if (!data || !params?.curve || !params?.bnbIn) return null

    const tokenAmount = data as bigint
    const { curve, bnbIn } = params
    const bnbInBigInt = typeof bnbIn === 'string' ? parseEther(bnbIn) : bnbIn

    // Calculate average price (BNB per token)
    const averagePrice =
      tokenAmount > BigInt(0)
        ? (bnbInBigInt * BigInt(1e18)) / tokenAmount
        : BigInt(0)

    // Calculate new reserves after trade
    const newBNBReserve = curve.virtualBNBReserve + bnbInBigInt
    const newTokenReserve = curve.virtualTokenReserve - tokenAmount

    // Calculate price after trade
    const priceAfterTrade =
      newTokenReserve > BigInt(0)
        ? (newBNBReserve * BigInt(1e18)) / newTokenReserve
        : BigInt(0)

    // Calculate price impact (simplified)
    const priceBeforeTrade =
      curve.virtualTokenReserve > BigInt(0)
        ? (curve.virtualBNBReserve * BigInt(1e18)) / curve.virtualTokenReserve
        : BigInt(0)

    const priceImpact =
      priceBeforeTrade > BigInt(0)
        ? Number(
            ((priceAfterTrade - priceBeforeTrade) * BigInt(10000)) /
              priceBeforeTrade
          ) / 100
        : 0

    return {
      tokenAmount,
      tokenAmountFormatted: formatEther(tokenAmount),
      priceImpact,
      averagePrice: formatEther(averagePrice),
      priceAfterTrade: formatEther(priceAfterTrade),
    }
  }, [data, params])

  return {
    // Data
    tokenAmount: result?.tokenAmount,
    tokenAmountFormatted: result?.tokenAmountFormatted,
    priceImpact: result?.priceImpact,
    averagePrice: result?.averagePrice,
    priceAfterTrade: result?.priceAfterTrade,

    // Full result object
    result,

    // State
    isLoading,
    isError,
    error,
  }
}

/**
 * Direct calculation function (for use without hooks)
 * This replicates the smart contract's pure function logic
 */
export function calculateTokenAmountOutDirect(
  params: CalculateTokenAmountOutParams
): CalculateTokenAmountOutResult {
  const { bnbIn, curve } = params

  // Convert to bigint if needed
  const bnbInBigInt = typeof bnbIn === 'string' ? parseEther(bnbIn) : bnbIn

  // Using constant product formula: k = x * y
  // After buying: (virtualBNB + bnbIn) * (virtualToken - tokensOut) = k
  const k =
    curve.k > BigInt(0)
      ? curve.k
      : curve.virtualBNBReserve * curve.virtualTokenReserve

  // Calculate new BNB reserve after adding input
  const newBNBReserve = curve.virtualBNBReserve + bnbInBigInt

  // Calculate new token reserve: newTokenReserve = k / newBNBReserve
  const newTokenReserve = k / newBNBReserve

  // Calculate tokens out
  const tokenAmount = curve.virtualTokenReserve - newTokenReserve

  // Check if there are enough tokens available
  if (tokenAmount > curve.availableTokens) {
    throw new Error('Insufficient tokens available')
  }

  // Calculate average price (BNB per token)
  const averagePrice =
    tokenAmount > BigInt(0)
      ? (bnbInBigInt * BigInt(1e18)) / tokenAmount
      : BigInt(0)

  // Calculate price after trade
  const priceAfterTrade =
    newTokenReserve > BigInt(0)
      ? (newBNBReserve * BigInt(1e18)) / newTokenReserve
      : BigInt(0)

  // Calculate price before trade
  const priceBeforeTrade =
    curve.virtualTokenReserve > BigInt(0)
      ? (curve.virtualBNBReserve * BigInt(1e18)) / curve.virtualTokenReserve
      : BigInt(0)

  // Calculate price impact
  const priceImpact =
    priceBeforeTrade > BigInt(0)
      ? Number(
          ((priceAfterTrade - priceBeforeTrade) * BigInt(10000)) /
            priceBeforeTrade
        ) / 100
      : 0

  return {
    tokenAmount,
    tokenAmountFormatted: formatEther(tokenAmount),
    priceImpact,
    averagePrice: formatEther(averagePrice),
    priceAfterTrade: formatEther(priceAfterTrade),
  }
}
