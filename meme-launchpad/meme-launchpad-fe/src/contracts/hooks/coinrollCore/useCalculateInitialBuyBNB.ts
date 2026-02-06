/**
 * Hook for calculating initial BNB required for token purchase
 * Following the smart contract integration standard
 */

import { useReadContract } from 'wagmi'
import { formatEther, parseUnits, parseEther } from 'viem'
import { useChainId } from 'wagmi'
import { useCallback, useEffect, useMemo } from 'react'
import CoinRollCoreABI from '@/contracts/abis/CoinRollCore.json'
import { getCoinRollCoreAddress } from '@/contracts/addresses'
import {
  CalculateInitialBuyBNBParams,
  CalculateInitialBuyResult,
  COINROLL_CORE_CONSTANTS,
} from '@/contracts/types/coinrollCore'

/**
 * Hook for calculating the BNB required for an initial token purchase
 * This uses the pure function from the smart contract for accurate calculations
 */
export function useCalculateInitialBuyBNB(
  params?: Partial<CalculateInitialBuyBNBParams>
) {
  const chainId = useChainId()

  // Convert string values to bigint for contract call
  const contractArgs = useMemo(() => {
    if (!params) return undefined

    const {
      saleAmount,
      virtualBNBReserve,
      virtualTokenReserve,
      percentageBP = 0,
    } = params

    // Return undefined if required parameters are missing
    if (!saleAmount || !virtualBNBReserve || !virtualTokenReserve) {
      return undefined
    }

    // Convert to bigint if needed
    const saleAmountBigInt =
      typeof saleAmount === 'string' ? parseEther(saleAmount) : saleAmount

    const virtualBNBReserveBigInt =
      typeof virtualBNBReserve === 'string'
        ? parseEther(virtualBNBReserve)
        : virtualBNBReserve

    const virtualTokenReserveBigInt =
      typeof virtualTokenReserve === 'string'
        ? parseEther(virtualTokenReserve)
        : virtualTokenReserve

    return [
      saleAmountBigInt,
      virtualBNBReserveBigInt,
      virtualTokenReserveBigInt,
      BigInt(percentageBP),
    ] as const
  }, [params])
  // Call the contract's pure function
  const { data, isLoading, isError, error } = useReadContract({
    address: getCoinRollCoreAddress(chainId),
    abi: CoinRollCoreABI,
    functionName: 'calculateInitialBuyBNB',
    args: contractArgs,
    query: {
      enabled: Boolean(contractArgs),
    },
  })

  // Calculate additional metrics
  const result = useMemo((): CalculateInitialBuyResult | null => {
    if (!data || !params) return null

    const bnbRequired = data as bigint

    // Calculate tokens that will be received
    const { saleAmount, percentageBP = 0 } = params
    const saleAmountBigInt =
      typeof saleAmount === 'string'
        ? parseEther(saleAmount)
        : (saleAmount as bigint)

    // Calculate how many tokens will be purchased
    const tokensReceived =
      (saleAmountBigInt * BigInt(percentageBP)) / BigInt(10000)

    // Calculate price impact (simplified)
    const priceImpact = percentageBP / 100 // Convert basis points to percentage

    return {
      bnbRequired,
      bnbRequiredFormatted: formatEther(bnbRequired),
      priceImpact,
      tokensReceived,
      tokensReceivedFormatted: formatEther(tokensReceived),
    }
  }, [data, params])

  // Helper function to calculate with default values
  const calculate = useCallback(
    (overrideParams?: Partial<CalculateInitialBuyBNBParams>) => {
      const mergedParams = {
        ...params,
        ...overrideParams,
      }

      if (
        !mergedParams.saleAmount ||
        !mergedParams.virtualBNBReserve ||
        !mergedParams.virtualTokenReserve
      ) {
        return null
      }

      // This would need to be a direct calculation since it's a pure function
      // For now, return null as we need the contract call
      return null
    },
    [params]
  )

  // Helper to calculate with common presets
  const calculateWithPreset = useCallback(
    (preset: '1%' | '5%' | '10%', totalSupply: string) => {
      const percentageMap = {
        '1%': 100,
        '5%': 500,
        '10%': 1000,
      }

      const percentageBP = percentageMap[preset]
      const saleAmount = parseEther(totalSupply)

      return {
        saleAmount: totalSupply,
        percentageBP,
        virtualBNBReserve:
          COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_BNB_RESERVE.toString(),
        virtualTokenReserve:
          COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_TOKEN_RESERVE.toString(),
      }
    },
    []
  )

  return {
    // Data
    bnbRequired: result?.bnbRequired,
    bnbRequiredFormatted: result?.bnbRequiredFormatted,
    priceImpact: result?.priceImpact,
    tokensReceived: result?.tokensReceived,
    tokensReceivedFormatted: result?.tokensReceivedFormatted,

    // Full result object
    result,

    // State
    isLoading,
    isError,
    error,

    // Helper functions
    calculate,
    calculateWithPreset,
  }
}

/**
 * Direct calculation function (for use without hooks)
 * This replicates the smart contract's pure function logic
 */
export function calculateInitialBuyBNBDirect(
  params: CalculateInitialBuyBNBParams
): CalculateInitialBuyResult {
  const { saleAmount, virtualBNBReserve, virtualTokenReserve, percentageBP, totalSupply } =
    params

  // Convert to bigint if needed
  const saleAmountBigInt =
    typeof saleAmount === 'string' ? parseEther(saleAmount) : saleAmount

  const virtualBNBReserveBigInt =
    typeof virtualBNBReserve === 'string'
      ? parseEther(virtualBNBReserve)
      : virtualBNBReserve

  const virtualTokenReserveBigInt =
    typeof virtualTokenReserve === 'string'
      ? parseEther(virtualTokenReserve)
      : virtualTokenReserve

  // Calculate tokens to purchase based on percentage
  // IMPORTANT: Contract uses totalSupply, not saleAmount (see MEMECore.sol:1064)
  // tokensOut = (totalSupply * percentageBP) / 10000
  const totalSupplyBigInt = totalSupply
    ? (typeof totalSupply === 'string' ? parseEther(totalSupply) : totalSupply)
    : saleAmountBigInt // Fallback to saleAmount for backward compatibility
  const tokensToPurchase =
    (totalSupplyBigInt * BigInt(percentageBP)) / BigInt(10000)

  // Using constant product formula: k = x * y
  // After buying: (virtualBNB + bnbIn) * (virtualToken - tokensOut) = k
  // Where k = virtualBNB * virtualToken

  const k = virtualBNBReserveBigInt * virtualTokenReserveBigInt
  const newVirtualTokenReserve = virtualTokenReserveBigInt - tokensToPurchase

  // Calculate required BNB
  // bnbRequired = k / newVirtualTokenReserve - virtualBNBReserve
  const bnbRequired = k / newVirtualTokenReserve - virtualBNBReserveBigInt

  // Calculate price impact
  const priceImpact = Number(percentageBP) / 100

  return {
    bnbRequired,
    bnbRequiredFormatted: formatEther(bnbRequired),
    priceImpact,
    tokensReceived: tokensToPurchase,
    tokensReceivedFormatted: formatEther(tokensToPurchase),
  }
}
