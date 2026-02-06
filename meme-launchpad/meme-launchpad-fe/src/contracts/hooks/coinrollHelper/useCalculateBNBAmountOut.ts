/**
 * Hook for calculating BNB amount out for a given token input
 * Following the smart contract integration standard
 */

import { useReadContract } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { useChainId } from 'wagmi'
import { useMemo } from 'react'
import CoinRollHelperABI from '@/contracts/abis/CoinRollHelper.json'
import { getContractAddress } from '@/contracts/addresses'
import type {
  CalculateBNBAmountOutParams,
  CalculateBNBAmountOutResult,
  BondingCurveParams,
} from '@/contracts/types/coinrollHelper'

/**
 * Hook for calculating the BNB amount out for a given token input (selling)
 * This uses the pure function from the smart contract for accurate calculations
 */
export function useCalculateBNBAmountOut(
  params?: Partial<CalculateBNBAmountOutParams>
) {
  const chainId = useChainId()

  // Convert string values to bigint for contract call
  const contractArgs = useMemo(() => {
    if (!params?.tokenIn || !params?.curve) return undefined

    const { tokenIn, curve } = params

    // Convert token input to bigint if needed
    const tokenInBigInt =
      typeof tokenIn === 'string' ? parseEther(tokenIn) : tokenIn

    // Return undefined if token amount is 0
    if (tokenInBigInt === BigInt(0)) return undefined

    return [tokenInBigInt, curve] as const
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
    functionName: 'calculateBNBAmountOut',
    args: contractArgs,
    query: {
      enabled: Boolean(contractArgs && helperAddress),
    },
  })

  // Calculate additional metrics
  const result = useMemo((): CalculateBNBAmountOutResult | null => {
    if (!data || !params?.curve || !params?.tokenIn) return null

    const bnbAmount = data as bigint
    const { curve, tokenIn } = params
    const tokenInBigInt =
      typeof tokenIn === 'string' ? parseEther(tokenIn) : tokenIn

    // Calculate average price (BNB per token)
    const averagePrice =
      tokenInBigInt > BigInt(0)
        ? (bnbAmount * BigInt(1e18)) / tokenInBigInt
        : BigInt(0)

    // Calculate new reserves after trade
    const newBNBReserve = curve.virtualBNBReserve - bnbAmount
    const newTokenReserve = curve.virtualTokenReserve + tokenInBigInt

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
            ((priceBeforeTrade - priceAfterTrade) * BigInt(10000)) /
              priceBeforeTrade
          ) / 100
        : 0

    return {
      bnbAmount,
      bnbAmountFormatted: formatEther(bnbAmount),
      priceImpact,
      averagePrice: formatEther(averagePrice),
      priceAfterTrade: formatEther(priceAfterTrade),
    }
  }, [data, params])

  return {
    // Data
    bnbAmount: result?.bnbAmount,
    bnbAmountFormatted: result?.bnbAmountFormatted,
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
export function calculateBNBAmountOutDirect(
  params: CalculateBNBAmountOutParams
): CalculateBNBAmountOutResult {
  const { tokenIn, curve } = params

  // Convert to bigint if needed
  const tokenInBigInt =
    typeof tokenIn === 'string' ? parseEther(tokenIn) : tokenIn

  // Using constant product formula: k = x * y
  // After selling: (virtualBNB - bnbOut) * (virtualToken + tokensIn) = k
  const k =
    curve.k > BigInt(0)
      ? curve.k
      : curve.virtualBNBReserve * curve.virtualTokenReserve

  // Calculate new token reserve after adding input
  const newTokenReserve = curve.virtualTokenReserve + tokenInBigInt

  // Calculate new BNB reserve: newBNBReserve = k / newTokenReserve
  const newBNBReserve = k / newTokenReserve

  // Calculate BNB out
  const bnbAmount = curve.virtualBNBReserve - newBNBReserve

  // Check if there's enough BNB available
  if (bnbAmount > curve.collectedBNB) {
    throw new Error('Insufficient BNB liquidity')
  }

  // Calculate average price (BNB per token)
  const averagePrice =
    tokenInBigInt > BigInt(0)
      ? (bnbAmount * BigInt(1e18)) / tokenInBigInt
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

  // Calculate price impact (negative for selling)
  const priceImpact =
    priceBeforeTrade > BigInt(0)
      ? Number(
          ((priceBeforeTrade - priceAfterTrade) * BigInt(10000)) /
            priceBeforeTrade
        ) / 100
      : 0

  return {
    bnbAmount,
    bnbAmountFormatted: formatEther(bnbAmount),
    priceImpact,
    averagePrice: formatEther(averagePrice),
    priceAfterTrade: formatEther(priceAfterTrade),
  }
}
