'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { TrendingCard } from './TrendingCard'
import { ArrowIcon } from '@/components/ui/arrow-icon'
import { ChevronRight } from 'lucide-react'
import { useTrendingTokens } from '@/api/endpoints/tokens'
import { Skeleton } from '@/components/ui/skeleton'
import { LAUNCH_MODE } from '@/enums/tokens'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import dayjs from '@/utils/tools'
import { DataWrapper } from '@/components/DataWrapper'

// Skeleton component for loading state
const TrendingSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('flex flex-col space-y-3', className)}>
    <Skeleton className="h-[168px] rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-18 w-[200px]" />
      <Skeleton className="h-4" />
    </div>
  </div>
)

export function TrendingSection() {
  const t = useTranslations('trending')
  const tLaunch = useTranslations('launch')
  const [timeFilter, setTimeFilter] = useState('30d')
  const [sortFilter, setSortFilter] = useState('all')
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  const timeValueMap = useMemo<Record<string, number>>(
    () => ({
      '24h': 24 * 60 * 60,
      '3d': 3 * 24 * 60 * 60,
      '7d': 7 * 24 * 60 * 60,
      '30d': 30 * 24 * 60 * 60,
    }),
    []
  )

  const sortValueMap = useMemo<Record<string, number>>(
    () => ({
      all: LAUNCH_MODE.ALL,
      ido: LAUNCH_MODE.IDO,
      upcoming: LAUNCH_MODE.UPCOMING,
      launched: LAUNCH_MODE.IMMEDIATE,
      burning: LAUNCH_MODE.BURN,
    }),
    []
  )

  // 获取时间
  const getTimeRange = useMemo(() => {
    const now = Math.floor(Date.now() / 1000) // 当前时间戳（秒）
    const timeOffset = timeValueMap[timeFilter] || 0

    return {
      launchTimeStart: now - timeOffset,
      launchTimeEnd: now,
    }
  }, [timeFilter])

  // 使用 useMemo 缓存查询参数，避免重复请求
  const queryParams = useMemo(
    () => ({
      pn: 1,
      ps: 10,
      lunchMode: sortValueMap[sortFilter],
      launchTimeStart: getTimeRange.launchTimeStart,
      timestamp: dayjs().unix(),
    }),
    [sortFilter, getTimeRange.launchTimeStart]
  )

  // 调用接口的参数逻辑
  const {
    data: trendingData,
    isLoading,
    error,
  } = useTrendingTokens(queryParams)

  const trendingTokens = trendingData?.data?.result || []

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  // 如果有错误，显示错误状态
  if (error) {
    return (
      <section className="w-full max-w-[1200px] px-2 py-3 lg:px-0">
        <div className="mx-auto">
          <div className="mb-4 flex items-center justify-between pt-3">
            <h2 className="text-xl font-bold text-white lg:text-2xl">
              🔥 {t('title')}
            </h2>
          </div>
          <div className="flex h-32 items-center justify-center rounded-xl bg-[#1a1d29]">
            <span className="text-sm text-white/50">
              Failed to load trending tokens
            </span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full max-w-[1200px] px-2 py-3 lg:px-0">
      <div className="mx-auto">
        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between pt-3">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white lg:text-[22px]">
              🔥 {t('title')}
            </h2>
            <Link
              href="/ranking"
              className="hidden items-center gap-1 pt-2 text-sm text-[#656A79] transition-colors hover:text-gray-400 md:flex"
            >
              <span>{t('viewAll')}</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3">
            {/* Time Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex h-9 items-center justify-center gap-2 rounded-lg border border-[#2B3139] bg-transparent px-4 text-sm font-medium text-[#F3F3F3] transition-colors hover:border-[]">
                  {tLaunch(`time.${timeFilter}`)}
                  <ArrowIcon direction="down" size={17} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[100px] border-[#2B3139] bg-[#1a1d29]">
                <DropdownMenuRadioGroup
                  value={timeFilter}
                  onValueChange={setTimeFilter}
                >
                  {Object.keys(timeValueMap).map((item) => (
                    <DropdownMenuRadioItem
                      key={item}
                      value={item}
                      className="cursor-pointer"
                    >
                      {tLaunch(`time.${item}`)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex h-9 items-center justify-center gap-2 rounded-lg border border-[#2B3139] bg-transparent px-4 text-sm transition-colors hover:border-[]">
                  <span className="font-normal text-[#F3F3F3] opacity-60">
                    {tLaunch('sort.label')}
                  </span>
                  <span className="font-medium text-[#F3F3F3]">
                    {tLaunch(`tabs.${sortFilter}`)}
                  </span>
                  <ArrowIcon direction="down" size={17} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[150px] border-[#2B3139] bg-[#1a1d29]">
                <DropdownMenuRadioGroup
                  value={sortFilter}
                  onValueChange={setSortFilter}
                >
                  {Object.keys(sortValueMap).map((item) => (
                    <DropdownMenuRadioItem
                      key={item}
                      value={item}
                      className="text-white capitalize"
                    >
                      {tLaunch(`tabs.${item}`)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              className="group hidden size-9 items-center justify-center gap-2 rounded-lg border border-[#2B3139] bg-transparent text-sm font-medium text-[#F3F3F3] transition-colors hover:border-[] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#2B3139] md:flex"
              onClick={() => api?.scrollPrev()}
              disabled={current === 1}
            >
              <ArrowIcon direction="left" />
            </button>

            <button
              className="group hidden size-9 items-center justify-center gap-2 rounded-lg border border-[#2B3139] bg-transparent text-sm font-medium text-[#F3F3F3] transition-colors hover:border-[] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#2B3139] md:flex"
              onClick={() => api?.scrollNext()}
              disabled={current === count}
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        </div>

        {/* Trending Cards Carousel */}
        <DataWrapper
          list={trendingTokens}
          loading={isLoading}
          className="min-h-[348px]"
        >
          <Carousel
            opts={{
              align: 'start',
              slidesToScroll: 1,
            }}
            className="hidden w-full pl-4 md:block lg:pl-0"
            setApi={setApi}
          >
            <CarouselContent>
              {trendingTokens.map((token, index) => (
                <CarouselItem
                  key={token.tokenAddr || index}
                  className="basis-full md:basis-[38%] lg:basis-[29%]"
                >
                  <TrendingCard token={token} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div
              className="pointer-events-none absolute top-0 right-0 z-10 h-full w-24"
              style={{
                background:
                  'linear-gradient(to left, #111319 0%,rgb(17, 19, 25, 0) 100%)',
              }}
            />
          </Carousel>
        </DataWrapper>

        {/* 第二种 loading 状态 */}
        {/* {isLoading ? (
          <div className="grid h-[348px] md:grid-cols-3 md:gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <TrendingSkeleton key={index} />
            ))}
          </div>
        ) : trendingTokens.length > 0 ? (
          <Carousel
            opts={{
              align: 'start',
              slidesToScroll: 1,
            }}
            className="hidden w-full pl-4 md:block lg:pl-0"
            setApi={setApi}
          >
            <CarouselContent>
              {trendingTokens.map((token, index) => (
                <CarouselItem
                  key={token.tokenAddr || index}
                  className="basis-full md:basis-[38%] lg:basis-[29%]"
                >
                  <TrendingCard token={token} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div
              className="pointer-events-none absolute top-0 right-0 z-10 h-full w-24"
              style={{
                background:
                  'linear-gradient(to left, #111319 0%,rgb(17, 19, 25, 0) 100%)',
              }}
            />
          </Carousel>
        ) : (
          <div className="flex h-[348px] items-center justify-center rounded-xl bg-[#1B1E25]">
            <span className="text-sm text-white/50">No Data</span>
          </div>
        )} */}

        {/* Mobile - Trending Cards Carousel */}
        <div className="space-y-4 md:hidden">
          {trendingTokens.slice(0, 3).map((token, index) => (
            <TrendingCard key={token.tokenAddr || index} token={token} />
          ))}
        </div>
        <div className="mt-4 flex justify-center md:hidden">
          <Link
            href="/ranking"
            className="flex items-center gap-1 pt-2 text-sm text-[#656A79] transition-colors hover:text-gray-400"
          >
            <span>{t('viewAll')}</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
