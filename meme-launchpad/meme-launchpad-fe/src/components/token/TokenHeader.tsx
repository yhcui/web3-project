'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Star, Share2, Copy } from 'lucide-react'
import { StarIcon } from '@/components/ui/star-icon'
import { ChevronArrow } from '@/components/create-token/components/ChevronArrow'
import { SocialLinks, type SocialLink } from './SocialLinks'
import { TokenPageShareIcon } from '@/components/icons/generated/tokenPage/TokenPageShareIcon'
import { TokenPageSettingsIcon } from '@/components/icons/generated/tokenPage/TokenPageSettingsIcon'
import { useTokenData } from '@/providers/TokenDataProvider'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { TokenSelectorPopover } from './TokenSelectorPopover'
import { SettingsDrawer } from './SettingsDrawer'
import {
  useFavoriteToken,
  useUnfavoriteToken,
} from '@/api/endpoints/tokens/mutations'
import { useUIStore } from '@/stores/useUIStore'

interface TokenHeaderProps {
  tokenAddress: string
  tokenData?: {
    symbol: string
    name: string
    logo: string
    price: number
    priceUsd: number
    change24h: number
    marketCap: number
    liquidity: number
    volume24h: number
    holders: number
    top10Holdings: number
    transactions24h: number
    turnoverRate: number
    heatValue: number
    margin: number
    tags: string[]
    twitter?: string
    website?: string
    telegram?: string
    discord?: string
    whitepaper?: string
    burnProgress?: number
    isBurning?: boolean
  }
}

export function TokenHeader({ tokenAddress, tokenData }: TokenHeaderProps) {
  const t = useTranslations('TokenPage')
  const [isStarred, setIsStarred] = useState(false)
  const [showLeftGradient, setShowLeftGradient] = useState(false)
  const [showRightGradient, setShowRightGradient] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Get shared token data from provider
  const {
    tokenData: tokenDetailData,
    isLoading,
    error,
    refetch: refetchTokenData,
  } = useTokenData()
  const apiData = tokenDetailData ? { data: tokenDetailData } : null

  // Check scroll position to show/hide gradients
  useEffect(() => {
    const checkScroll = () => {
      const container = scrollContainerRef.current
      if (!container) return

      const { scrollLeft, scrollWidth, clientWidth } = container

      // Show left gradient if scrolled from start
      setShowLeftGradient(scrollLeft > 0)

      // Show right gradient if not scrolled to end
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 1)
    }

    const container = scrollContainerRef.current
    if (!container) return

    // Initial check
    checkScroll()

    // Add scroll listener
    container.addEventListener('scroll', checkScroll)

    // Add resize listener to recheck on window resize
    window.addEventListener('resize', checkScroll)

    return () => {
      // Cleanup: remove event listeners
      if (container) {
        container.removeEventListener('scroll', checkScroll)
      }
      window.removeEventListener('resize', checkScroll)
    }
  }, []) // Only run once on mount, not when apiData changes

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  // Map API data to component format
  const mapApiData = () => {
    if (!apiData?.data) return null

    const token = apiData.data

    // Parse numeric values
    const currentPrice = parseFloat(token.currentPrice) // This is the token price in BNB
    const currentPriceUsdt = parseFloat(token.currentPriceUsdt) // USDT price from API
    const marketCap = parseFloat(token.marketCapUsdt)
    const volume24h = parseFloat(token.totalVolume24H)
    const priceChange = parseFloat(token.priceChangePercentage24H)

    // Calculate BNB progress (current/target)
    const bnbCurrent = parseFloat(token.bnbCurrent)
    const bnbTarget = parseFloat(token.bnbTarget)
    const bnbProgress = bnbTarget > 0 ? (bnbCurrent / bnbTarget) * 100 : 0

    return {
      symbol: token.symbol,
      name: token.name,
      logo: token.logo,
      price: currentPrice, // Token price in BNB
      priceUsd: currentPriceUsdt, // USDT price from API
      change24h: priceChange,
      marketCap: marketCap,
      liquidity: token.liquidity, // TODO: Not provided by API - need clarification
      volume24h: volume24h,
      holders: token.holdersCount,
      top10Holdings: parseFloat(token.top10), // Display as percentage
      transactions24h: token.buyCount24H + token.sellCount24H,
      turnoverRate: parseFloat(Number(token.turnoverRate).toFixed(2)), // 保留2位小数
      heatValue: token.sortPoints, // TODO: Not provided by API - need calculation formula
      margin: 0, // TODO: Not provided by API - need clarification
      tags: token.tags || [],
      twitter: token.twitter || undefined,
      website: token.website || undefined,
      telegram: token.telegram || undefined,
      discord: token.discord || undefined,
      whitepaper: undefined, // TODO: Not in current API response - may need different endpoint
      burnProgress: bnbProgress, // BNB fundraising progress (bnbCurrent/bnbTarget)
      progressPct: parseFloat(token.progressPct) * 100,
      isBurning: bnbProgress > 0 && bnbProgress < 100,
      isFavorite: token.isFavorite || false,
    }
  }

  // Use API data if available, otherwise use mock data or provided tokenData
  const data = mapApiData() || {
    symbol: 'TOKEN',
    name: 'TOKEN/BNB',
    logo: '/assets/images/mock-trending/2-token.png',
    price: 0,
    priceUsd: 0,
    change24h: 0,
    marketCap: 0,
    liquidity: 0,
    volume24h: 0,
    holders: 0,
    top10Holdings: 0,
    transactions24h: 0,
    turnoverRate: 0,
    heatValue: 0,
    margin: 0,
    tags: [],
    burnProgress: 0,
    isBurning: false,
    website: undefined,
    twitter: undefined,
    telegram: undefined,
    discord: undefined,
    whitepaper: undefined,
    progressPct: 0,
    isFavorite: false,
  }

  // 同步API数据中的收藏状态
  useEffect(() => {
    if (data.isFavorite !== undefined) {
      setIsStarred(data.isFavorite)
    }
  }, [data.isFavorite])

  // 收藏和取消收藏的mutations
  const favoriteTokenMutation = useFavoriteToken()
  const unfavoriteTokenMutation = useUnfavoriteToken()

  // 设置抽屉状态
  const { toggleSettingsDrawer } = useUIStore()

  // 处理收藏切换 - 参考CreatorInfo.tsx的实现
  const handleFavoriteToggle = async () => {
    // 需要tokenId来调用API
    const tokenId = apiData?.data?.id
    if (!tokenId) {
      console.warn('Token ID not available for favorite operation')
      return
    }

    try {
      if (isStarred) {
        // 取消收藏
        await unfavoriteTokenMutation.mutateAsync({ tokenId })
      } else {
        // 添加收藏
        await favoriteTokenMutation.mutateAsync({ tokenId })
      }

      // 刷新 TokenDataProvider 中的共享数据，确保所有组件同步更新
      refetchTokenData()
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="relative flex h-14 w-full items-center rounded-lg bg-[#181A20] px-4">
        <div className="flex w-full items-center gap-2">
          {/* Token Logo Skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-[6px]" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>

          {/* Token Info Skeleton */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          {/* Price and Stats Skeleton */}
          <div className="ml-12 flex items-center gap-6">
            {/* Price */}
            <div className="mr-4 flex flex-col gap-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>

            {/* Statistics */}
            <div className="flex items-center gap-4">
              {/* Create 10 stat skeletons */}
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="absolute right-4 flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    console.error('Error fetching token details:', error)
  }
  console.log('data', data)

  return (
    <div className="relative flex h-14 w-full items-center rounded-lg bg-[#181A20] px-4">
      <div className="flex w-full items-center gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-6 cursor-pointer items-center justify-center rounded-[6px] border border-[#333B47] ${
              favoriteTokenMutation.isPending ||
              unfavoriteTokenMutation.isPending
                ? 'pointer-events-none opacity-50'
                : ''
            }`}
            onClick={handleFavoriteToggle}
            title={isStarred ? t('unfavorite') : t('favorite')}
          >
            <StarIcon filled={isStarred} />
          </div>
          {/* Token Logo with Progress Circle */}
          <div className="relative">
            <svg className="absolute -inset-0.5 h-9 w-9" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="17.4375"
                fill="none"
                stroke="rgba(224, 212, 131, 0.45)"
                strokeWidth="1.125"
              />
              {data.burnProgress !== undefined && data.burnProgress > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="17.4375"
                  fill="none"
                  stroke="#BFFB06"
                  strokeWidth="1.125"
                  strokeDasharray={`${(2 * Math.PI * 17.4375 * Math.min(data.burnProgress, 100)) / 100} ${2 * Math.PI * 17.4375}`}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />
              )}
            </svg>
            <div className="relative h-8 w-8">
              <Image
                src={data.logo}
                alt={data.symbol}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            </div>
            {/* Burn Badge */}
            {data.isBurning && (
              <div className="absolute -right-1 -bottom-1">
                <div className="relative h-3 w-3">
                  <div className="absolute inset-0 rounded-full bg-[#111319]" />
                  <div className="absolute inset-0 scale-[0.8] rounded-full bg-[#FF2655]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      width="6"
                      height="6"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_1549_45605)">
                        <path
                          d="M5.70094 0.446254C5.69259 0.410503 5.67441 0.3778 5.64845 0.351841C5.62249 0.325881 5.58979 0.307701 5.55404 0.299354C4.47974 0.0525535 3.30784 0.346254 2.47284 1.18125C2.35517 1.29908 2.24663 1.42568 2.14814 1.55995C2.12024 1.59795 2.08034 1.62425 2.03464 1.63555C1.59844 1.74355 1.17824 1.97145 0.829341 2.32035C0.673217 2.47622 0.537257 2.65105 0.424641 2.84075C0.329241 3.00185 0.492741 3.19185 0.668341 3.12695C0.945441 3.02455 1.24484 2.97425 1.55344 2.97405C1.54914 3.00035 1.54294 3.02635 1.53924 3.05265C1.7558 3.30472 1.98173 3.5486 2.21654 3.78375C2.45168 4.01859 2.69555 4.24452 2.94764 4.46105C2.97394 4.45735 2.99994 4.45115 3.02614 4.44685C3.02594 4.75545 2.97564 5.05485 2.87324 5.33195C2.80834 5.50755 2.99834 5.67105 3.15944 5.57565C3.34918 5.46304 3.52404 5.32708 3.67994 5.17095C4.02874 4.82215 4.25664 4.40185 4.36464 3.96575C4.37594 3.92005 4.40234 3.88015 4.44024 3.85225C4.57452 3.75377 4.70112 3.64522 4.81894 3.52755C5.65404 2.69235 5.94774 1.52055 5.70094 0.446254ZM4.35514 2.58985C4.22985 2.71514 4.05993 2.78553 3.88274 2.78553C3.70556 2.78553 3.53563 2.71514 3.41034 2.58985C3.28505 2.46457 3.21467 2.29464 3.21467 2.11745C3.21467 1.94027 3.28505 1.77034 3.41034 1.64505C3.53563 1.51977 3.70556 1.44938 3.88274 1.44938C3.97047 1.44938 4.05735 1.46666 4.1384 1.50023C4.21946 1.53381 4.2931 1.58302 4.35514 1.64505C4.41718 1.70709 4.46639 1.78074 4.49996 1.86179C4.53354 1.94285 4.55082 2.02972 4.55082 2.11745C4.55082 2.20519 4.53354 2.29206 4.49996 2.37311C4.46639 2.45417 4.41718 2.52782 4.35514 2.58985Z"
                          fill="white"
                        />
                        <path
                          d="M1.07484 4.04036C0.872343 4.24286 0.0138432 5.49756 0.258243 5.74196C0.502643 5.98636 1.75734 5.12776 1.95984 4.92536C2.16234 4.72286 2.12834 4.36066 1.88394 4.11636C1.63954 3.87186 1.27724 3.83786 1.07484 4.04036Z"
                          fill="white"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_1549_45605">
                          <rect width="6" height="6" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Left Section - Token Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            {/* Token Name and Ranking */}
            <div className="flex items-center gap-1">
              <h1 className="font-din-pro text-base font-normal text-white">
                {data.symbol}/BNB
              </h1>
              <Image
                src="/assets/images/ranks/medal-1.svg"
                alt="Rank"
                width={14}
                height={14}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="ml-2 flex items-center"
                    aria-label={t('selectToken')}
                    title={t('selectToken')}
                  >
                    <ChevronArrow />
                  </button>
                </PopoverTrigger>
                <TokenSelectorPopover
                  currentTokenAddress={tokenAddress}
                  onSelect={(token) => {
                    // Handle token selection
                    console.log('Selected token:', token)
                  }}
                />
              </Popover>
            </div>
            {/* Progress Bar */}
            {data.progressPct !== undefined && (
              <div className="ml-2 flex items-center gap-2">
                <span className="font-din-pro text-xs text-[#BFFB06]">
                  {data.progressPct.toFixed(1)}%
                </span>
                <div className="relative h-1 w-[29px] overflow-hidden rounded-lg bg-[rgba(224,212,131,0.45)]">
                  <div
                    className="absolute top-0 left-0 h-full rounded-lg bg-[#BFFB06]"
                    style={{ width: `${Math.min(data.progressPct, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Contract Address */}
            <div className="flex items-center gap-2">
              <span className="font-din-pro text-xs text-[#798391]">
                {formatAddress(tokenAddress)}
              </span>
              <button
                className="flex h-[10px] w-[10px] items-center justify-center"
                aria-label={t('copyAddress')}
                title={t('copyAddress')}
                onClick={() => navigator.clipboard.writeText(tokenAddress)}
              >
                <Copy className="text-[#798391]" />
              </button>
            </div>

            {/* Social Links */}
            {(() => {
              const socialLinks: SocialLink[] = []
              if (data.website)
                socialLinks.push({ type: 'website', url: data.website })
              if (data.twitter)
                socialLinks.push({ type: 'x', url: data.twitter })
              if (data.telegram)
                socialLinks.push({ type: 'telegram', url: data.telegram })
              if (data.discord)
                socialLinks.push({ type: 'discord', url: data.discord })
              if (data.whitepaper)
                socialLinks.push({ type: 'whitepaper', url: data.whitepaper })

              return socialLinks.length > 0 ? (
                <SocialLinks
                  links={socialLinks}
                  className="border-l border-[#333B47] pl-2"
                />
              ) : null
            })()}
          </div>
        </div>

        {/* Right Section - Price and Stats */}
        <div className="relative ml-12 flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="scrollbar-hide flex items-center gap-6 overflow-x-scroll"
          >
            {/* Price Info */}
            <div className="mr-4 flex flex-col items-start">
              <span className="font-din-pro text-lg font-bold text-[#F6465D]">
                {data.price
                  ? data.price >= 1
                    ? data.price.toFixed(4)
                    : data.price.toFixed(10).replace(/\.?0+$/, '')
                  : '0'}
              </span>
              <span className="font-din-pro text-xs text-white">
                $
                {data.priceUsd
                  ? data.priceUsd >= 1
                    ? data.priceUsd.toFixed(4)
                    : data.priceUsd.toFixed(8).replace(/\.?0+$/, '')
                  : '0'}
              </span>
            </div>

            {/* Statistics */}
            <div className="flex items-center gap-4">
              {/* 24h Change */}
              <div className="flex flex-col">
                <span className="font-din-pro text-xs text-nowrap text-[#798391]">
                  {t('change24h')}
                </span>
                <span
                  className={`font-din-pro text-xs ${data.change24h >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}
                >
                  {data.change24h > 0 ? '+' : ''}
                  {data.change24h}%
                </span>
              </div>

              {/* Market Cap */}
              <div className="flex flex-col">
                <span className="font-din-pro text-xs text-nowrap text-[#798391]">
                  {t('marketCap')}
                </span>
                <span className="font-din-pro text-xs text-white">
                  {data.marketCap ? data.marketCap.toLocaleString() : '0'}
                </span>
              </div>

              {/* Liquidity */}
              <div className="flex flex-col">
                <span className="font-din-pro text-xs text-nowrap text-[#798391]">
                  {t('liquidity')}
                </span>
                <span className="font-din-pro text-xs text-white">
                  {data.liquidity ? data.liquidity.toLocaleString() : '0'}
                </span>
              </div>

              {/* 24h Volume */}
              <div className="flex flex-col">
                <span className="font-din-pro text-xs text-nowrap text-[#798391]">
                  {t('volume24h')}
                </span>
                <span className="font-din-pro text-xs text-white">
                  {data.volume24h ? data.volume24h.toLocaleString() : '0'}
                </span>
              </div>

              {/* Holders */}
              <div className="flex flex-col">
                <span className="font-din-pro text-xs text-nowrap text-[#798391]">
                  {t('holders')}
                </span>
                <span className="font-din-pro text-xs text-white">
                  {data.holders ? data.holders.toLocaleString() : '0'}
                </span>
              </div>

              {/* TOP10 */}
              <div className="flex flex-col">
                <span className="font-din-pro text-xs text-nowrap text-[#798391]">
                  {t('top10')}
                </span>
                <span className="font-din-pro text-xs text-white">
                  {data.top10Holdings}%
                </span>
              </div>

              {/* 24h Transactions */}
              <div className="flex flex-col">
                <span className="font-din-pro text-xs text-nowrap text-[#798391]">
                  {t('transactions24h')}
                </span>
                <span className="font-din-pro text-xs text-white">
                  {data.transactions24h || 0}
                </span>
              </div>

              {/* Turnover Rate */}
              <div className="flex flex-col">
                <span className="font-din-pro text-xs text-nowrap text-[#798391]">
                  {t('turnoverRate')}
                </span>
                <span className="font-din-pro text-xs text-white">
                  {data.turnoverRate || 0}%
                </span>
              </div>

              {/* Heat Value */}
              <div className="flex flex-col">
                <span className="font-din-pro text-xs text-nowrap text-[#798391]">
                  {t('heatValue')}
                </span>
                <span className="font-din-pro text-xs text-white">
                  {data.heatValue ? data.heatValue.toLocaleString() : '0'}
                </span>
              </div>

              {/* Margin */}
              <div className="flex flex-col">
                <span className="font-din-pro text-xs text-nowrap text-[#798391]">
                  {t('margin')}
                </span>
                <span className="font-din-pro text-xs text-white">
                  {data.margin ? data.margin.toLocaleString() : '0'}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-col">
                <span className="font-din-pro text-xs text-nowrap text-[#798391]">
                  {t('tags')}
                </span>
                <span className="font-din-pro text-xs text-nowrap text-[#FCD549]">
                  {data.tags && data.tags.length > 0
                    ? data.tags.join(' ')
                    : '-'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                className="flex h-6 w-6 items-center justify-center"
                aria-label={t('share')}
                title={t('share')}
              >
                <TokenPageShareIcon
                  size={24}
                  className="text-[#798391] transition hover:text-[#BFFB06]"
                />
              </button>
              <button
                className="flex h-6 w-6 items-center justify-center"
                onClick={toggleSettingsDrawer}
                aria-label={t('Settings.title')}
                title={t('Settings.title')}
              >
                <TokenPageSettingsIcon
                  size={24}
                  className="text-[#798391] transition hover:text-[#BFFB06]"
                />
              </button>
            </div>
          </div>
          {/* Left edge blur effect */}
          {showLeftGradient && (
            <div className="pointer-events-none absolute top-0 left-0 h-full w-12 bg-gradient-to-r from-[#181A20] to-transparent" />
          )}
          {/* Right edge blur effect */}
          {showRightGradient && (
            <div className="pointer-events-none absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-[#181A20] to-transparent" />
          )}
        </div>
      </div>

      {/* 设置抽屉 */}
      <SettingsDrawer />
    </div>
  )
}
