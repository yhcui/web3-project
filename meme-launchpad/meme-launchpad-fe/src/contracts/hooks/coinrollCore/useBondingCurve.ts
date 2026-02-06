/**
 * Hook for fetching bonding curve parameters from CoinRollCore
 */

import { useReadContract, useChainId } from 'wagmi'
import { Address } from 'viem'
import { useMemo } from 'react'
import CoinRollCoreABI from '@/contracts/abis/CoinRollCore.json'
import { getCoinRollCoreAddress } from '@/contracts/addresses'
import type { BondingCurveParams } from '@/contracts/types/coinrollHelper'

export interface UseBondingCurveParams {
  tokenAddress?: string
}

export interface UseBondingCurveResult {
  bondingCurve?: BondingCurveParams
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Hook for fetching bonding curve parameters for a token
 */
export function useBondingCurve(
  params: UseBondingCurveParams
): UseBondingCurveResult {
  const chainId = useChainId()

  const contractAddress = useMemo(
    () => getCoinRollCoreAddress(chainId || 97), // Default to BSC testnet
    [chainId]
  )

  const {
    data: bondingCurve,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: contractAddress,
    abi: CoinRollCoreABI,
    functionName: 'getBondingCurve',
    args: params.tokenAddress ? [params.tokenAddress as Address] : undefined,
    query: {
      enabled: Boolean(params.tokenAddress),
      refetchInterval: 2000, // Refetch every 2 seconds to get latest state for better sync
    },
  })

  // Parse the bonding curve data
  const parsedBondingCurve = useMemo(() => {
    if (!bondingCurve) return undefined

    // The contract returns a struct with bonding curve params
    const curve = bondingCurve as {
      virtualBNBReserve: bigint
      virtualTokenReserve: bigint
      k: bigint
      availableTokens: bigint
      collectedBNB: bigint
    }

    return {
      virtualBNBReserve: curve.virtualBNBReserve,
      virtualTokenReserve: curve.virtualTokenReserve,
      k: curve.k,
      availableTokens: curve.availableTokens,
      collectedBNB: curve.collectedBNB,
    } as BondingCurveParams
  }, [bondingCurve])

  return {
    bondingCurve: parsedBondingCurve,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  }
}
