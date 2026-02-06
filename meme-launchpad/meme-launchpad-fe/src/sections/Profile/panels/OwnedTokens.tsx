import Sort, { type SortDirection } from '@/components/TableHeadSort'
import { useMemo, useState } from 'react'
import { LoadingButton } from '@/components/Loading'
import OwnedTokenItem from '../components/OwnedTokenItem'
import ActionBar from '../components/ActionBar'
import { cn } from '@/lib/utils'
import { useMyOwnedTokenList } from '@/api/endpoints/profile/queries'
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
    volume: 'default',
    hot: 'default',
    total_locked_token: 'default',
    my_locked_token: 'default',
    activity_application: 'default',
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
      search: searchTerm,
    }
  }, [currentPage, pageSize, searchTerm, tableHeader])

  const {
    data: ownedTokenList,
    isLoading,
    isError,
  } = useMyOwnedTokenList(params, {
    enabled: searchTerm ? searchTerm?.length >= 2 : true,
  })

  const items = useMemo(() => {
    return ownedTokenList?.data.list || []
  }, [ownedTokenList])

  const totalPages = useMemo(() => {
    return ownedTokenList?.data.totalPage || 1
  }, [ownedTokenList])

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

          {/* 市值 */}
          <div className="hidden lg:col-span-6 lg:block">
            <Sort
              title={t('owned.marketCap')}
              sortKey="market_cap"
              sortDirection={tableHeader.market_cap}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 热力值 */}
          <div className="hidden lg:col-span-6 lg:block">
            <Sort
              title={t('hot')}
              sortKey="hot"
              sortDirection={tableHeader.hot}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 总锁仓代币 */}
          <div className="col-span-6 lg:col-span-7">
            <Sort
              title={t('owned.totalLocked')}
              sortKey="total_locked_token"
              sortDirection={tableHeader.total_locked_token}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 当前我的锁仓 */}
          <div className="col-span-6 lg:col-span-7">
            <Sort
              title={t('owned.myLocked')}
              sortKey="my_locked_token"
              sortDirection={tableHeader.my_locked_token}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 项目活动申请 */}
          <div className="hidden lg:col-span-6 lg:block">
            <Sort
              title={t('projectActivityApplication')}
              sortDirection={tableHeader.projectActivityApplication}
              className="text-[#656A79]"
            />
          </div>

          {/* more */}
          <div className="col-span-3 lg:hidden">
            <Sort
              sortDirection={null}
              title={t('more')}
              className="text-xs text-[#656A79] md:text-sm"
            />
          </div>
        </div>

        {/* 内容区域 */}
        <DataWrapper className="mt-4" list={items} loading={isLoading}>
          {items.map((token, idx) => (
            <OwnedTokenItem
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
