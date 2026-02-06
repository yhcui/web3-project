import Sort, { type SortDirection } from '@/components/TableHeadSort'
import { useMemo, useState } from 'react'
import { useMyCreatedActivitiesList } from '@/api/endpoints/profile'
import CreatedActivityItem from '../components/CreatedActivityItem'
import ActionBar from '../components/ActionBar'
import { cn } from '@/lib/utils'
import { Pagination } from '@/components/Pagination'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTranslations } from 'next-intl'
import { DataWrapper } from '@/components/DataWrapper'

export default function CreatedActivities({
  className,
  onCreateActivity,
}: {
  className?: string
  onCreateActivity: () => void
}) {
  const { user } = useAuthStore()
  const t = useTranslations('profile.tableSort')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [tableHeader, setTableHeader] = useState<{
    [key: string]: SortDirection
  }>({
    name: 'default',
    address: 'default',
    type: 'default',
    time: 'default',
    total_amount: 'default',
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
      userId: user?.id || 0,
      sortField: sort.field.join(','),
      sortType: sort.type.join(','),
      status: 0,
      search: searchTerm,
    }
  }, [currentPage, pageSize, searchTerm, tableHeader])

  const {
    data: createdActivitiesList,
    isLoading,
    isError,
  } = useMyCreatedActivitiesList(params, {
    enabled: searchTerm ? searchTerm?.length >= 2 : true,
  })

  const items = useMemo(() => {
    return createdActivitiesList?.data.list || []
  }, [createdActivitiesList])

  const totalPages = useMemo(() => {
    return createdActivitiesList?.data.totalPage || 1
  }, [createdActivitiesList])

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
          <div className="col-span-9 flex lg:col-span-6">
            <Sort
              title={t('activities.activityName')}
              sortDirection={tableHeader.name}
              className="text-xs text-[#656A79] md:text-sm"
            />
          </div>

          {/* 活动地址 */}
          <div className="hidden lg:col-span-5 lg:block">
            <Sort
              title={t('activities.activityAddress')}
              sortKey="address"
              sortDirection={tableHeader.address}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 发起时间 */}
          <div className="col-span-6 lg:col-span-5">
            <Sort
              title={t('activities.createdAt')}
              sortKey="created_at"
              sortDirection={tableHeader.created_at}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 活动类型 */}
          <div className="col-span-6 lg:col-span-5">
            <Sort
              title={t('activities.activityType')}
              sortKey="type"
              sortDirection={tableHeader.type}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 活动时间 */}
          <div className="hidden lg:col-span-6 lg:block">
            <Sort
              title={t('activities.activityTime')}
              sortKey="time"
              sortDirection={tableHeader.time}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 奖池总额 */}
          <div className="hidden lg:col-span-5 lg:block">
            <Sort
              title={t('activities.totalAmount')}
              sortKey="total_amount"
              sortDirection={tableHeader.total_amount}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 活动状态 */}
          <div className="hidden lg:col-span-5 lg:block">
            <Sort
              title={t('activities.status')}
              sortKey="status"
              sortDirection={tableHeader.status}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
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
          {items.map((item, index) => (
            <CreatedActivityItem key={`${item.id}-${index}`} token={item} />
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
