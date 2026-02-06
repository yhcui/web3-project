'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import LoadingImg from '@/assets/common/loading.gif'
import { cn } from '@/lib/utils'
import { useCountdown } from '@/hooks/useCountdown'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useUpcomingTokens,
  useAlmostFullTokens,
  useTodayLaunchingTokens,
} from '@/api/endpoints/trade'
import { useTrendingTokens } from '@/api/endpoints/tokens'
import { useMyFollowedTokenList } from '@/api/endpoints/profile'
import { useUIStore } from '@/stores/useUIStore'
import Link from 'next/link'

interface LeftPanelProps {
  className?: string
  currentTokenAddress?: string
}

interface TokenItem {
  id: string
  symbol: string
  name: string
  logo: string
  price: number
  change: number
  marketCap: string
  volume: string
  comments: number
  hot: number
  hasRank?: number
  hasTimer?: boolean
  launchTime?: number
  launchMode?: string
  tokenAddr?: string
}

// Memoized component for TokenItem to prevent unnecessary re-renders
const TokenItemRow = React.memo(function TokenItemRow({
  token,
  index,
  isHighlighted,
}: {
  token: TokenItem
  index: number
  isHighlighted: boolean
}) {
  // Calculate countdown for tokens with future launch time
  // Memoize targetDate to prevent infinite re-renders
  const targetDate = useMemo(() => {
    return token.hasTimer && token.launchTime
      ? new Date(token.launchTime * 1000)
      : null
  }, [token.hasTimer, token.launchTime])

  const countdown = useCountdown(targetDate)

  return (
    <Link href={`/token/${token.tokenAddr}`}>
      <div
        className={cn(
          'relative flex items-center justify-between gap-2 overflow-hidden px-4 py-2 hover:bg-[#21242E]',
          isHighlighted && 'bg-[#21242E]'
        )}
      >
        {/* Token Info */}
        <div className="flex min-w-0 flex-shrink items-center gap-2">
          {/* Rank Number */}
          <div className="flex h-4 w-4 items-center justify-center">
            <span className="text-xs text-[#474D57]">{index + 1}</span>
          </div>

          {/* Token Icon with Badge */}
          <div className="relative h-6 min-h-6 w-6 min-w-6">
            <Image
              src={token.logo}
              alt={token.symbol}
              fill
              className="rounded-full object-cover"
            />
            {/* Border effect */}
            <div className="absolute inset-0 rounded-full border border-[#E0D4836E]" />
            <div
              className="absolute inset-0 rounded-full border border-[#FBD537]"
              style={{ borderWidth: '0.5px' }}
            />

            {/* Rank Badge */}
            {token.hasRank && (
              <div className="absolute -right-0.5 -bottom-0.5 flex h-2 w-2 items-center justify-center rounded-full bg-[#FF7E1C] ring-1 ring-[#111319]">
                <span className="text-[6px] font-bold text-white">✓</span>
              </div>
            )}
          </div>

          {/* Symbol */}
          <span className="max-w-[60px] truncate text-xs font-normal text-white">
            {token.symbol}
          </span>

          {/* Comments Badge */}
          <div className="flex items-center gap-0.5">
            <Image
              src="/assets/images/comment-icon.svg"
              alt="Comments"
              width={12}
              height={12}
              className="opacity-80"
            />
            <span className="text-xs text-[]">{token.comments}</span>
          </div>

          {/* Hot Badge */}
          <div className="flex items-center gap-0.5">
            <Image
              src="/assets/images/fire-icon.svg"
              alt="Hot"
              width={12}
              height={12}
            />
            <span className="text-xs text-[#F69414]">{token.hot}</span>
          </div>
        </div>

        {/* Timer or Price Info */}
        {token.hasTimer && countdown && isHighlighted ? (
          <div className="absolute top-0 right-0 h-full w-[190px]">
            <div className="relative h-full w-full">
              {/* Gradient background */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-[#26231C]/[0.43] to-[#FFD010]"
                style={{ opacity: 0.1 }}
              />

              {/* Timer */}
              <div className="absolute inset-0 flex items-center justify-end gap-1 pr-3">
                <div className="flex items-center gap-1">
                  <span className="text-[18px] leading-3 font-bold text-[]">
                    {countdown.hours.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs text-white/50">H</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[18px] leading-3 font-bold text-[]">
                    {countdown.minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs text-white/50">M</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[18px] leading-3 font-bold text-[]">
                    {countdown.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs text-white/50">S</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-shrink-0 items-center gap-2">
            {/* Price & Change */}
            <div className="min-w-[65px] text-right">
              <div className="truncate text-xs text-white">
                $
                {typeof token.price === 'number'
                  ? token.price.toFixed(2)
                  : token.price}
              </div>
              <div
                className={cn(
                  'text-xs',
                  token.change >= 0 ? 'text-[#2EBD85]' : 'text-[#F84638]'
                )}
              >
                {token.change >= 0 ? '+' : ''}
                {typeof token.change === 'number'
                  ? token.change.toFixed(1)
                  : token.change}
                %
              </div>
            </div>

            {/* Market Cap & Volume */}
            <div className="min-w-[60px] text-right">
              <div className="truncate text-xs text-white">
                ${formatNumber(token.marketCap)}
              </div>
              <div className="truncate text-xs text-[#798391]">
                ${formatNumber(token.volume)}
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
})

// Helper function to convert number to subscript
const toSubscript = (num: number): string => {
  const subscriptMap: { [key: string]: string } = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉',
  }
  return num
    .toString()
    .split('')
    .map((digit) => subscriptMap[digit] || digit)
    .join('')
}

// Helper function to format numbers with proper significant digits and subscript notation
const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num) || num === 0) return '0'

  // Handle large numbers
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  } else if (num >= 1) {
    return num.toFixed(2)
  }

  // Handle small numbers with subscript notation
  const numStr = num.toString()

  // Check if it's in scientific notation
  if (numStr.includes('e')) {
    const parts = numStr.split('e')
    const exponent = parseInt(parts[1])

    if (exponent < 0) {
      // For very small numbers, calculate decimals needed for 3 significant digits
      const decimals = Math.abs(exponent) + 3
      const formatted = num.toFixed(Math.min(decimals, 20))

      // Apply subscript notation
      if (formatted.includes('.')) {
        const [intPart, decPart] = formatted.split('.')
        const leadingZeros = decPart.match(/^0+/)
        if (leadingZeros && leadingZeros[0].length >= 2) {
          const zeroCount = leadingZeros[0].length
          const significantDigits = decPart.substring(zeroCount).substring(0, 3)
          return `0.0${toSubscript(zeroCount)}${significantDigits}`
        }
      }
      return formatted
    }
  }

  // For regular small decimals
  if (numStr.includes('.')) {
    const [intPart, decPart] = numStr.split('.')
    const leadingZeros = decPart.match(/^0+/)

    if (leadingZeros && leadingZeros[0].length >= 2) {
      // Use subscript notation for multiple zeros
      const zeroCount = leadingZeros[0].length
      const significantDigits = decPart.substring(zeroCount).substring(0, 3)
      return `0.0${toSubscript(zeroCount)}${significantDigits}`
    }

    // For numbers with 1 leading zero or no leading zeros
    // Limit to 4 significant digits
    if (leadingZeros && leadingZeros[0].length === 1) {
      const significantDigits = decPart.substring(1).substring(0, 4)
      return `0.0${significantDigits}`
    }

    return `${intPart}.${decPart.substring(0, 4)}`
  }

  // Default formatting for very small numbers
  return num.toFixed(4)
}

export function LeftPanel({ className, currentTokenAddress }: LeftPanelProps) {
  const t = useTranslations('Token.LeftPanel')
  const [searchQuery, setSearchQuery] = useState('')
  const [marketTab, setMarketTab] = useState('market')
  const tabContainerRef = React.useRef<HTMLDivElement>(null)

  // 使用全局store管理tab状态
  const activeTab = useUIStore((state) => state.leftPanelActiveTab)
  const setActiveTab = useUIStore((state) => state.setLeftPanelActiveTab)

  // Fetch data based on active tab
  const trendingQuery = useTrendingTokens({ pn: 1, ps: 50 })
  const upcomingQuery = useUpcomingTokens({ pn: 1, ps: 50 })
  const almostFullQuery = useAlmostFullTokens({ pn: 1, ps: 50 })
  const todayLaunchingQuery = useTodayLaunchingTokens({ pn: 1, ps: 50 })
  const favoriteQuery = useMyFollowedTokenList({
    pn: 1,
    ps: 50,
    search: '',
    sortField: '',
    sortType: '',
  })

  // Mock data for 'new' tab until API is available
  const mockNewTokens: TokenItem[] = []

  // Map API data to TokenItem interface
  const mapApiDataToTokenItem = (apiToken: any, index: number): TokenItem => {
    const currentTime = Math.floor(Date.now() / 1000)
    return {
      id: apiToken.tokenAddr || apiToken.tokenAddress || `token-${index}`,
      symbol: apiToken.symbol || 'N/A',
      name: apiToken.name || 'Unknown',
      logo:
        apiToken.logo ||
        apiToken.iconUrl ||
        '/assets/images/placeholder-token.svg',
      price: parseFloat(apiToken.price || apiToken.marketCap || '0'),
      change: parseFloat(
        apiToken.change24h || apiToken.priceChangePercentage24H || '0'
      ),
      marketCap: apiToken.marketCap || '0',
      volume: apiToken.volume24h || apiToken.currentBnb || '0',
      comments: 0, // Not provided by API
      hot: apiToken.hot || 0,
      hasRank: index < 3 ? index + 1 : undefined,
      hasTimer: apiToken.launchTime && apiToken.launchTime > currentTime,
      launchTime: apiToken.launchTime,
      launchMode: apiToken.launchMode,
      tokenAddr: apiToken.tokenAddr || apiToken.tokenAddress,
    }
  }

  // Get tokens based on active tab
  const getTokensData = () => {
    switch (activeTab) {
      case 'popular':
        return {
          data:
            trendingQuery.data?.data.result?.map(mapApiDataToTokenItem) || [],
          isLoading: trendingQuery.isLoading,
          error: trendingQuery.error,
        }
      case 'ready':
        return {
          data:
            upcomingQuery.data?.data.result?.map(mapApiDataToTokenItem) || [],
          isLoading: upcomingQuery.isLoading,
          error: upcomingQuery.error,
        }
      case 'almost':
        return {
          data:
            almostFullQuery.data?.data.result?.map(mapApiDataToTokenItem) || [],
          isLoading: almostFullQuery.isLoading,
          error: almostFullQuery.error,
        }
      case 'graduated':
        return {
          data:
            todayLaunchingQuery.data?.data.result?.map(mapApiDataToTokenItem) ||
            [],
          isLoading: todayLaunchingQuery.isLoading,
          error: todayLaunchingQuery.error,
        }
      case 'favorite':
        return {
          data: favoriteQuery.data?.data.list?.map(mapApiDataToTokenItem) || [],
          isLoading: favoriteQuery.isLoading,
          error: favoriteQuery.error,
        }
      case 'new':
        // New tab API not available yet, using mock data
        return {
          data: mockNewTokens,
          isLoading: false,
          error: null,
        }
      default:
        return { data: [], isLoading: false, error: null }
    }
  }

  const { data: tokens, isLoading, error } = getTokensData()

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens
    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [tokens, searchQuery])

  // Scroll functions for tab navigation
  const scrollLeft = () => {
    if (tabContainerRef.current) {
      tabContainerRef.current.scrollBy({
        left: -100,
        behavior: 'smooth',
      })
    }
  }

  const scrollRight = () => {
    if (tabContainerRef.current) {
      tabContainerRef.current.scrollBy({
        left: 100,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      {/* Market Tabs */}
      <div className="border-b border-[#333B47]">
        <div className="flex px-4">
          <button
            onClick={() => setMarketTab('market')}
            className={cn(
              'relative px-3 py-2 text-sm',
              marketTab === 'market' ? 'text-white' : 'text-[#798391]'
            )}
          >
            {t('marketTabs.market')}
            {marketTab === 'market' && (
              <div className="absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 bg-[#FBD537]" />
            )}
          </button>
          <button
            onClick={() => setMarketTab('anomaly')}
            className={cn(
              'relative px-3 py-2 text-sm',
              marketTab === 'anomaly' ? 'text-white' : 'text-[#798391]'
            )}
          >
            {t('marketTabs.anomaly')}
            {marketTab === 'anomaly' && (
              <div className="absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 bg-[#FBD537]" />
            )}
          </button>
        </div>
      </div>
      {/* Search Input */}
      <div className="relative px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-[34px] w-full rounded-lg border border-[#4F5867] bg-transparent pr-3 pl-10 text-sm text-white placeholder:text-[#798391] focus:border-[] focus:outline-none"
          />
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#798391]" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#333B47]">
        <div className="relative flex items-center">
          {/* Scroll Left Button */}
          <button
            onClick={scrollLeft}
            className="absolute left-3 z-10 flex h-9 w-4 items-center justify-center rounded transition-colors hover:bg-[#21242E]"
          >
            <ChevronLeft className="h-3 w-3 text-[#798391]" />
          </button>

          {/* Tabs */}
          <div
            ref={tabContainerRef}
            className="scrollbar-hide mx-10 flex-1 overflow-x-auto"
          >
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab('favorite')}
                className={cn(
                  'relative py-2 text-sm whitespace-nowrap',
                  activeTab === 'favorite' ? 'text-white' : 'text-[#798391]'
                )}
              >
                {t('tabs.favorite')}
                {activeTab === 'favorite' && (
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 bg-[#FBD537]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('popular')}
                className={cn(
                  'relative py-2 text-sm whitespace-nowrap',
                  activeTab === 'popular' ? 'text-white' : 'text-[#798391]'
                )}
              >
                {t('tabs.popular')}
                {activeTab === 'popular' && (
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 bg-[#FBD537]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('ready')}
                className={cn(
                  'relative py-2 text-sm whitespace-nowrap',
                  activeTab === 'ready' ? 'text-white' : 'text-[#798391]'
                )}
              >
                {t('tabs.ready')}
                {activeTab === 'ready' && (
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 bg-[#FBD537]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={cn(
                  'relative py-2 text-sm whitespace-nowrap',
                  activeTab === 'new' ? 'text-white' : 'text-[#798391]'
                )}
              >
                {t('tabs.new')}
                {activeTab === 'new' && (
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 bg-[#FBD537]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('almost')}
                className={cn(
                  'relative py-2 text-sm whitespace-nowrap',
                  activeTab === 'almost' ? 'text-white' : 'text-[#798391]'
                )}
              >
                {t('tabs.almost')}
                {activeTab === 'almost' && (
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 bg-[#FBD537]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('graduated')}
                className={cn(
                  'relative py-2 text-sm whitespace-nowrap',
                  activeTab === 'graduated' ? 'text-white' : 'text-[#798391]'
                )}
              >
                {t('tabs.graduated')}
                {activeTab === 'graduated' && (
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 bg-[#FBD537]" />
                )}
              </button>
            </div>
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={scrollRight}
            className="absolute right-3 z-10 flex h-9 w-4 items-center justify-center rounded transition-colors hover:bg-[#21242E]"
          >
            <ChevronRight className="h-3 w-3 text-[#798391]" />
          </button>

          {/* Gradient Fade */}
          <div className="pointer-events-none absolute right-0 h-full w-10 bg-gradient-to-l from-[#181A20] to-transparent" />
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 text-xs text-[#798391]">
        <span className="min-w-0 flex-shrink">{t('headers.name')}</span>
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="flex min-w-[65px] items-center justify-end gap-1">
            <span>{t('headers.price')}</span>
            <div className="flex flex-col gap-0.5">
              <div className="h-0 w-0 border-r-[3px] border-b-[3px] border-l-[3px] border-r-transparent border-b-[#798391] border-l-transparent" />
              <div className="h-0 w-0 border-t-[3px] border-r-[3px] border-l-[3px] border-t-[#798391] border-r-transparent border-l-transparent" />
            </div>
          </div>
          <span className="min-w-[60px] text-right">{t('headers.mcv')}</span>
        </div>
      </div>

      {/* Token List */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Image src={LoadingImg} alt="loading" width={24} height={24} />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-red-500">Failed to load tokens</p>
              <p className="mt-2 text-xs text-[#798391]">
                Please try again later
              </p>
            </div>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[#798391]">No tokens found</p>
          </div>
        ) : (
          filteredTokens.map((token, index) => (
            <TokenItemRow
              key={token.id}
              token={token}
              index={index}
              isHighlighted={token.tokenAddr === currentTokenAddress}
            />
          ))
        )}
      </div>
    </div>
  )
}
