'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { LaunchCard } from './LaunchCard'
import { Pagination } from './Pagination'
import { ArrowIcon } from '@/components/ui/arrow-icon'
import { useTokenList } from '@/api/endpoints/tokens'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { LAUNCH_MODE } from '@/enums/tokens'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import IDOIcon from '@/assets/common/ido-tab.svg'
import dayjs from '@/utils/tools'
import { DataWrapper } from '@/components/DataWrapper'

export function LaunchSection() {
  const t = useTranslations('launch')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedTime, setSelectedTime] = useState('30d')
  const [selectedSort, setSelectedSort] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [enabled, setEnabled] = useState(false)

  const itemsPerPage = 20

  const timeValueMap = useMemo<Record<string, number>>(
    () => ({
      '24h': 24 * 60 * 60,
      '3d': 3 * 24 * 60 * 60,
      '7d': 7 * 24 * 60 * 60,
      '30d': 30 * 24 * 60 * 60,
    }),
    []
  )

  const tabValueMap = useMemo<Record<string, number>>(
    () => ({
      all: LAUNCH_MODE.ALL,
      ido: LAUNCH_MODE.IDO,
      upcoming: LAUNCH_MODE.UPCOMING,
      launched: LAUNCH_MODE.IMMEDIATE,
      burning: LAUNCH_MODE.BURN,
    }),
    []
  )

  // 筛选值映射
  const sortValueMap: Record<string, string> = {
    newest: '1',
    raised: '2',
    hot: '3',
    marketCap: '4',
    tradingVolume: '5',
    holders: '6',
  }

  // 状态值映射
  const statusValueMap = useMemo<Record<string, string>>(
    () => ({
      false: '20', // 已创建
      true: '30', // 已发射
    }),
    []
  )

  // 获取筛选值
  const getSortValue = useCallback(
    (sortKey: string) => sortValueMap[sortKey] || '1',
    [sortValueMap]
  )
  const getStatusValue = useCallback(
    (enabled: boolean) => statusValueMap[enabled.toString()],
    [statusValueMap]
  )

  // 将时间选择转换为时间戳
  const getTimeRange = useMemo(() => {
    const now = Math.floor(Date.now() / 1000) // 当前时间戳（秒）
    const timeOffset = timeValueMap[selectedTime] || 0

    return {
      launchTimeStart: now - timeOffset,
      launchTimeEnd: now,
    }
  }, [selectedTime])

  // 使用 useMemo 缓存查询参数，避免重复请求
  const queryParams = useMemo(
    () => ({
      pn: currentPage,
      ps: itemsPerPage,
      sort: getSortValue(selectedSort),
      status: getStatusValue(enabled),
      lunchMode: activeTab === 'all' ? 0 : tabValueMap[activeTab],
      launchTimeStart: getTimeRange.launchTimeStart,
      timestamp: dayjs().unix(),
    }),
    [
      currentPage,
      itemsPerPage,
      selectedSort,
      enabled,
      activeTab,
      getTimeRange.launchTimeStart,
    ]
  )

  // 调用接口的参数逻辑
  const {
    data: tokenData,
    isLoading,
    isError,
    error,
  } = useTokenList(queryParams)

  const displayedTokens = useMemo(() => {
    return tokenData?.data.result || []
  }, [tokenData])

  const totalPages = useMemo(() => {
    return tokenData?.data.totalPage || 1
  }, [tokenData])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const SkeletonItem: React.FC = () => (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[260px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4" />
      </div>
    </div>
  )

  return (
    <section className="w-full max-w-[1200px] px-2 py-3 lg:px-0">
      <div className="mx-auto">
        {/* Filter Controls */}
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Tabs */}
          <div className="relative flex items-center justify-between gap-4 overflow-x-auto md:justify-start lg:gap-[20px] lg:pb-0">
            {Object.keys(tabValueMap).map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(tab)}
                className={`font-din-pro relative flex cursor-pointer items-center gap-1 pb-1 text-base leading-[28px] font-bold whitespace-nowrap transition-colors hover:text-[#FFFFFFCC] lg:text-xl lg:leading-[36px] ${
                  activeTab === tab ? 'text-white' : 'text-[#ffffff80]'
                }`}
              >
                {tabValueMap[tab] == LAUNCH_MODE.IDO ? (
                  <Image
                    className={`w-4 ${activeTab === tab ? 'opacity-100' : 'opacity-50'}`}
                    src={IDOIcon}
                    alt="IDO"
                    width={16}
                    height={16}
                  />
                ) : (
                  <></>
                )}
                {t(`tabs.${tab}`)}
                {activeTab === tab && (
                  <span className="absolute bottom-1 left-1/2 h-[2px] w-full -translate-x-1/2 bg-[]" />
                )}
              </button>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center justify-end gap-2 lg:gap-3">
            {/* V3 Badge */}
            <Label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#2B3139] p-3 px-4 py-0 hover:border-[] has-[[aria-checked=true]]:border-[]">
              <Checkbox
                id="v3check"
                checked={enabled}
                onCheckedChange={(checked) => setEnabled(!!checked)}
                className="hidden"
              />
              <Image
                src="/assets/images/v3-icon.png"
                alt="V3"
                width={24}
                height={24}
              />
              <span className="text-sm leading-5 font-medium text-[#F3F3F3]">
                V3
              </span>
            </Label>

            {/* Time Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex h-9 items-center gap-2 rounded-lg border border-[#2B3139] px-4 transition-colors hover:border-[]">
                  <span className="font-din-pro text-sm leading-5 font-medium text-[#F3F3F3]">
                    {t(`time.${selectedTime}`)}
                  </span>
                  <ArrowIcon direction="down" size={17} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[100px] border-[#2B3139] bg-[#1a1d29]">
                <DropdownMenuRadioGroup
                  value={selectedTime}
                  onValueChange={setSelectedTime}
                >
                  {Object.keys(timeValueMap).map((time) => (
                    <DropdownMenuRadioItem
                      key={time}
                      value={time}
                      className="cursor-pointer"
                    >
                      {t(`time.${time}`)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex h-9 items-center justify-center gap-2 rounded-lg border border-[#2B3139] bg-transparent px-4 text-sm transition-colors hover:border-[]">
                  <span className="font-normal text-[#F3F3F3] opacity-60">
                    {t('sort.label')}
                  </span>

                  <span className="font-medium text-[#F3F3F3]">
                    {t(`sort.${selectedSort}`)}
                  </span>
                  <ArrowIcon direction="down" size={17} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[150px] border-[#2B3139] bg-[#1a1d29]">
                <DropdownMenuRadioGroup
                  value={selectedSort}
                  onValueChange={setSelectedSort}
                >
                  {Object.keys(sortValueMap).map((item) => (
                    <DropdownMenuRadioItem
                      key={item}
                      value={item}
                      className="cursor-pointer"
                    >
                      {t(`sort.${item}`)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Launch Cards Grid */}
        <DataWrapper list={displayedTokens} loading={isLoading}>
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] gap-2 md:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] md:gap-4">
            {displayedTokens.map((token) => (
              <LaunchCard key={token.tokenAddr} token={token} />
            ))}
          </div>
        </DataWrapper>
        {/* <div className="grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] gap-2 md:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] md:gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <SkeletonItem key={index} />
              ))
            ) : isError ? (
              <p className="text-red-500">Error: {error?.message}</p>
            ) : displayedTokens.length === 0 ? (
              <p className="col-span-full text-center text-base leading-[10] text-white/50">
                No data
              </p>
            ) : (
              displayedTokens.map((token) => (
                <LaunchCard key={token.tokenAddr} token={token} />
              ))
            )}
          </div> */}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="mt-12 flex justify-end">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </section>
  )
}
