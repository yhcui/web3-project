'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { useTokenDetailNew } from '@/api/endpoints/trade'
import type { TokenDetail } from '@/api/schemas/trade.schema'

interface TokenDataContextType {
  tokenAddress: string
  tokenData: TokenDetail | null | undefined
  isLoading: boolean
  error: any
  refetch: () => void
}

const TokenDataContext = createContext<TokenDataContextType | null>(null)

interface TokenDataProviderProps {
  tokenAddress: string
  children: React.ReactNode
}

/**
 * Provider component that fetches and shares token data across all child components
 * This prevents duplicate API calls and ensures consistent data
 */
export function TokenDataProvider({
  tokenAddress,
  children,
}: TokenDataProviderProps) {
  // Fetch token details once at the provider level
  const {
    data: tokenDetailResponse,
    isLoading,
    error,
    refetch,
  } = useTokenDetailNew(
    { tokenAddress },
    {
      // Reduce refetch frequency
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
      gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    }
  )

  const contextValue = useMemo(
    () => ({
      tokenAddress,
      tokenData: tokenDetailResponse?.data,
      isLoading,
      error,
      refetch,
    }),
    [tokenAddress, tokenDetailResponse?.data, isLoading, error, refetch]
  )

  return (
    <TokenDataContext.Provider value={contextValue}>
      {children}
    </TokenDataContext.Provider>
  )
}

/**
 * Hook to access shared token data
 * This replaces direct calls to useTokenDetailNew in components
 */
export function useTokenData() {
  const context = useContext(TokenDataContext)
  if (!context) {
    throw new Error('useTokenData must be used within TokenDataProvider')
  }
  return context
}
