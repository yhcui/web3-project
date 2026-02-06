import Sort, { type SortDirection } from '@/components/TableHeadSort'
import { useMemo, useState } from 'react'
import { LoadingButton } from '@/components/Loading'
import FollowedTokenItem from '../components/FollowedTokenItem'
import ActionBar from '../components/ActionBar'
import { useMyFollowedTokenList } from '@/api/endpoints/profile'
import { cn } from '@/lib/utils'
import { Pagination } from '@/components/Pagination'
import { useTranslations } from 'next-intl'
import { DataWrapper } from '@/components/DataWrapper'

export default function IDOTokens({
  className,
  onCreateActivity,
}: {
  className?: string
  onCreateActivity: () => void
}) {
  const t = useTranslations('profile.tableSort')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [tableHeader, setTableHeader] = useState<{
    [key: string]: SortDirection
  }>({
    name: 'default',
    hot: 'default',
    total_locked_token: 'default',
    total_lock_days: 'default',
    remain_lock_time: 'default',
    claimed_amount: 'default',
    progress_pct: 'default',
    pending_amount: 'default',
    claimToken: 'default',
    projectActivityApplication: 'default',
  })

  const setTableHeaderField = (key: string, direction: SortDirection) => {
    setTableHeader((prev) => ({
      ...prev,
      [key]: direction,
    }))
  }

  const params = useMemo(() => {
    const sort = Object.keys(tableHeader).reduce(
      (acc, key) => {
        const value = tableHeader[key]
        if (value !== 'default') {
          acc.field.push(key)
          acc.type.push(value)
        }
        return acc
      },
      { field: [] as string[], type: [] as SortDirection[] }
    )

    return {
      pn: currentPage,
      ps: pageSize,
      sortField: sort.field.join(','),
      sortType: sort.type.join(','),
      tokenSymbol: '',
      pageType: 1,
      category: '0',
      search: searchTerm,
    }
  }, [currentPage, pageSize, searchTerm, tableHeader])

  const {
    data: idoList,
    isLoading,
    isError,
  } = useMyFollowedTokenList(params, {
    enabled: searchTerm ? searchTerm?.length >= 2 : true,
  })

  const items = useMemo(() => {
    return idoList?.data.list || []
  }, [idoList])

  const totalPages = useMemo(() => {
    return idoList?.data.totalPage || 1
  }, [idoList])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className={cn('py-6', className)}>
      <ActionBar
        onSearch={(value) => setSearchTerm(value)}
        onCreateActivity={onCreateActivity}
      />
      <div className="mt-8">
        {/* Table Header */}
        <div className="grid grid-cols-24 text-sm md:px-2 lg:grid-cols-37">
          {/* 名字 */}
          <div className="col-span-9 flex lg:col-span-5">
            <Sort
              title={t('name')}
              sortDirection={tableHeader.name}
              className="text-xs text-[#656A79] md:text-sm"
            />
          </div>

          {/* 热力值 */}
          <div className="hidden lg:col-span-3 lg:block">
            <Sort
              title={t('hot')}
              sortKey="hot"
              sortDirection={tableHeader.hot}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 价格 */}
          <div className="hidden lg:col-span-3 lg:block">
            <Sort
              title={t('followed.price')}
              sortKey="price"
              sortDirection={tableHeader.price}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 24h 涨幅 */}
          <div className="col-span-6 lg:col-span-3">
            <Sort
              title={t('followed.priceChange24h')}
              sortKey="price_change_pct"
              sortDirection={tableHeader.price_change_pct}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 24h 交易量 */}
          <div className="hidden lg:col-span-4 lg:block">
            <Sort
              title={t('followed.volume24h')}
              sortKey="volume"
              sortDirection={tableHeader.volume}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 市值 */}
          <div className="col-span-6 lg:col-span-3">
            <Sort
              title={t('followed.marketCap')}
              sortKey="market_cap"
              sortDirection={tableHeader.market_cap}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 交易次数 */}
          <div className="hidden lg:col-span-3 lg:block">
            <Sort
              title={t('followed.transactions')}
              sortKey="trade_count"
              sortDirection={tableHeader.trade_count}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 持币人数 */}
          <div className="hidden lg:col-span-3 lg:block">
            <Sort
              title={t('followed.holders')}
              sortKey="holder_count"
              sortDirection={tableHeader.holder_count}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* top10 */}
          <div className="hidden lg:col-span-3 lg:block">
            <Sort
              title={t('followed.top10')}
              sortKey="top10"
              sortDirection={tableHeader.top10}
              className="text-[#656A79]"
            />
          </div>

          {/* age */}
          <div className="hidden lg:col-span-3 lg:block">
            <Sort
              title={t('followed.age')}
              sortKey="age"
              sortDirection={tableHeader.age}
              className="text-[#656A79]"
            />
          </div>

          {/* 进度 */}
          <div className="hidden lg:col-span-4 lg:block">
            <Sort
              title={t('followed.progress')}
              sortKey="progress_pct"
              sortDirection={tableHeader.progress_pct}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* more */}
          <div className="col-span-3 lg:hidden"></div>
        </div>

        {/* 内容区域 */}
        <DataWrapper className="mt-4" list={items} loading={isLoading}>
          {items.map((token, idx) => (
            <FollowedTokenItem
              key={idx}
              token={token}
              pageSize={pageSize}
              currentPage={currentPage}
              idx={idx}
            />
          ))}
        </DataWrapper>
      </div>

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
  )
}
