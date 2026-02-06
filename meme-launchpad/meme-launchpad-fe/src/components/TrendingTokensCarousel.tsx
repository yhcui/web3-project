'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { StarIcon } from '@/components/ui/star-icon'
import { useHotPickTokens } from '@/api/endpoints/tokens'
import { Skeleton } from '@/components/ui/skeleton'
import Marquee from 'react-fast-marquee'
import { formatNumber, formatTokenPrice } from '@/utils/format'
import { useFavoriteToken, useUnfavoriteToken } from '@/api/endpoints/tokens'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const SkeletonItem: React.FC = () => (
  <div className="flex items-center gap-2 px-4">
    <Skeleton className="h-6 w-6 rounded-full" />
    <div className="space-y-1">
      <Skeleton className="h-2 w-[80px]" />
      <Skeleton className="h-2 w-[80px]" />
    </div>
  </div>
)

export function TrendingTokensCarousel() {
  const t = useTranslations('trendingTokens')
  const { mutate: favoriteToken } = useFavoriteToken()
  const { mutate: unfavoriteToken } = useUnfavoriteToken()
  const { data: hotPickData, isLoading, error } = useHotPickTokens()
  const params = useParams()
  const locale = params.locale as string

  // 本地收藏状态管理
  const [favoriteStates, setFavoriteStates] = useState<Record<string, boolean>>(
    {}
  )

  const tokens = useMemo(() => {
    return hotPickData?.data || []
  }, [hotPickData])

  // 初始化收藏状态
  useEffect(() => {
    if (hotPickData?.data && Object.keys(favoriteStates).length === 0) {
      const initialStates = hotPickData.data.reduce(
        (acc, token) => {
          acc[token.tokenID] = token.isFavorite || false
          return acc
        },
        {} as Record<string, boolean>
      )
      setFavoriteStates(initialStates)
    }
  }, [hotPickData])

  // 处理收藏/取消收藏操作
  const handleFavoriteToggle = (
    tokenId: number,
    isCurrentlyFavorite: boolean
  ) => {
    // 乐观更新
    setFavoriteStates((prev) => ({
      ...prev,
      [tokenId]: !isCurrentlyFavorite,
    }))

    // 根据当前状态调用不同接口
    const mutation = isCurrentlyFavorite ? unfavoriteToken : favoriteToken

    mutation(
      { tokenId },
      {
        onError: () => {
          // 出错时回滚状态
          setFavoriteStates((prev) => ({
            ...prev,
            [tokenId]: isCurrentlyFavorite, // 恢复之前的状态
          }))
        },
      }
    )
  }

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="relative w-full overflow-hidden">
        <div className="absolute top-0 right-7 left-7 z-10 h-px bg-[#474D57] opacity-20" />
        <div className="absolute right-7 bottom-0 left-7 z-10 h-px bg-[#474D57] opacity-20" />
        <div className="relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden bg-[#111319]">
          {Array.from({ length: 10 }).map((_, index) => (
            <SkeletonItem key={index} />
          ))}
        </div>
      </div>
    )
  }

  // 如果有错误，显示错误状态
  if (error) {
    return (
      <div className="relative w-full overflow-hidden">
        <div className="absolute top-0 right-7 left-7 z-10 h-px bg-[#474D57] opacity-20" />
        <div className="absolute right-7 bottom-0 left-7 z-10 h-px bg-[#474D57] opacity-20" />
        <div className="relative flex h-12 w-full items-center justify-center overflow-hidden bg-[#111319]">
          <span className="text-sm text-white/50">
            Failed to load trending tokens
          </span>
        </div>
      </div>
    )
  }

  // 如果没有数据，不显示组件
  if (!tokens.length) {
    return null
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Top border */}
      <div className="absolute top-0 right-7 left-7 z-10 h-px bg-[#474D57] opacity-20" />

      {/* Bottom border */}
      <div className="absolute right-7 bottom-0 left-7 z-10 h-px bg-[#474D57] opacity-20" />

      {/* Main carousel container */}
      <div className="relative h-12 w-full overflow-hidden bg-[#111319]">
        <Marquee
          speed={20}
          pauseOnHover={true}
          pauseOnClick={false}
          gradient={false}
          gradientWidth={0}
          className="h-full"
        >
          {tokens.map((token, index) => (
            <div
              key={`${token.tokenID}-${index}`}
              className="relative my-2 flex h-8 flex-shrink-0 cursor-pointer items-center pr-2 pl-3"
            >
              <div className="flex items-center gap-1">
                {/* Favorite star */}
                <div
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFavoriteToggle(
                      token.tokenID,
                      favoriteStates[token.tokenID] || false
                    )
                  }}
                >
                  <StarIcon
                    filled={favoriteStates[token.tokenID] || token.isFavorite}
                  />
                </div>
                <Link href={`/${locale}/token/${token.tokenAddr}`}>
                  <div className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-[#FFFFFF]/5">
                    {/* Token icon */}
                    <div className="flex items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          token.tokenLogo ||
                          '/assets/images/placeholder-token.svg'
                        }
                        alt={token.tokenName}
                        className="h-6 w-6 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            '/assets/images/placeholder-token.svg'
                        }}
                      />
                    </div>

                    {/* Token symbol */}
                    <div className="flex flex-col">
                      <span className="text-[10px] leading-3 font-bold text-white">
                        ${token.tokenSymbol}
                      </span>
                      <span className="text-[10px] leading-3 text-white/80">
                        {formatNumber(token.marketCap || '0')}
                      </span>
                    </div>

                    <div className="ml-2 flex flex-col">
                      {/* Price */}
                      <span className="font-din-pro text-[10px] leading-3 font-normal text-white">
                        {formatTokenPrice(token.tokenPrice)}
                      </span>

                      {/* Price change */}
                      <span
                        className={`font-din-pro text-[10px] leading-3 font-normal ${
                          parseFloat(token.priceChange) >= 0
                            ? 'text-[#00E2AC]'
                            : 'text-[#FF6767]'
                        }`}
                      >
                        {parseFloat(token.priceChange) >= 0 ? '+' : ''}
                        {token.priceChange}%
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Separator line */}
              <div className="absolute top-1/2 right-0 h-6 w-px -translate-y-1/2 bg-[#2B3139] opacity-40" />
            </div>
          ))}
        </Marquee>

        {/* Right gradient overlay */}
        <div
          className="pointer-events-none absolute top-0 right-0 z-10 h-full w-32"
          style={{
            background:
              'linear-gradient(to left, #111319 0%, #111319 49.52%, rgba(17, 19, 25, 0) 100%)',
          }}
        />
      </div>
    </div>
  )
}
