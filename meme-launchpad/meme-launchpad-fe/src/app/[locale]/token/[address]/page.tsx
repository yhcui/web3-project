'use client'

import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import { TokenHeader } from '@/components/token/TokenHeader'
import { TrendingTicker } from '@/components/token/TrendingTicker'
import { TokenContent } from '@/components/token/TokenContent'
import { TokenDataProvider, useTokenData } from '@/providers/TokenDataProvider'

// Inner component that uses the token data
function TokenPageContent() {
  const t = useTranslations('Token')
  const { tokenAddress, tokenData } = useTokenData()
  const tokenId = tokenData?.id

  return (
    <div className="mx-auto max-w-[1432px] py-3">
      {/* Token Header Section */}
      <TokenHeader tokenAddress={tokenAddress} />

      {/* Trending Ticker Section */}
      <TrendingTicker className="mt-2" />

      {/* Token Content Section with Resizable Panels */}
      <TokenContent
        tokenAddress={tokenAddress}
        tokenId={tokenId}
        className="mt-2 min-w-[1432px]"
      />

      {/* Additional sections will be added here */}
    </div>
  )
}

export default function TokenPage() {
  const params = useParams()
  const tokenAddress = params.address as string
  const prevTokenAddressRef = useRef<string | null>(null)

  // Track token address changes to help with cleanup
  useEffect(() => {
    if (prevTokenAddressRef.current && prevTokenAddressRef.current !== tokenAddress) {
      // Token address changed, cleanup will happen automatically via React
      // This is just for tracking purposes
      console.log('Token address changed, cleaning up previous token data')
    }
    prevTokenAddressRef.current = tokenAddress
  }, [tokenAddress])

  return (
    <TokenDataProvider tokenAddress={tokenAddress}>
      <TokenPageContent />
    </TokenDataProvider>
  )
}
