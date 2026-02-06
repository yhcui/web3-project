import Sort, { type SortDirection } from '@/components/TableHeadSort'
import { useMemo, useState } from 'react'
import { LoadingButton } from '@/components/Loading'
import { useMyIDOList } from '@/api/endpoints/profile'
import IDOTokenItem from '../components/IDOTokenItem'
import ActionBar from '../components/ActionBar'
import { cn } from '@/lib/utils'
import { Pagination } from '@/components/Pagination'
import { debounce } from 'lodash'
import IDOClaimDialog from '../dialog/IDOClaimDialog'
import { useTranslations } from 'next-intl'
import { DataWrapper } from '@/components/DataWrapper'

export default function IDOTokens({
  className,
  onCreateActivity,
}: {
  className?: string
  onCreateActivity?: () => void
}) {
  const t = useTranslations('profile.tableSort')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [showClaimDialog, setShowClaimDialog] = useState(false)
  const [claimTokenAddress, setClaimTokenAddress] = useState('')
  const [claimAmount, setClaimAmount] = useState('')
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
      search: searchTerm,
    }
  }, [currentPage, pageSize, searchTerm, tableHeader])

  const {
    data: idoList,
    isLoading,
    isError,
  } = useMyIDOList(params, {
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

          {/* 总锁仓代币 */}
          <div className="col-span-6 lg:col-span-3">
            <Sort
              title={t('ido.totalLocked')}
              sortKey="total_locked_token"
              sortDirection={tableHeader.total_locked_token}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 总锁仓时间 */}
          <div className="hidden lg:col-span-3 lg:block">
            <Sort
              title={t('ido.totalLockedTime')}
              sortKey="total_lock_days"
              sortDirection={tableHeader.total_lock_days}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 剩余锁仓时间 */}
          <div className="hidden lg:col-span-4 lg:block">
            <Sort
              title={t('ido.remainingLockedTime')}
              sortKey="remain_lock_time"
              sortDirection={tableHeader.remain_lock_time}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 已领取代币 */}
          <div className="col-span-6 lg:col-span-4">
            <Sort
              title={t('ido.claimedTokens')}
              sortKey="claimed_amount"
              sortDirection={tableHeader.claimed_amount}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 当前进度 */}
          <div className="hidden lg:col-span-5 lg:block">
            <Sort
              title={t('ido.progress')}
              sortKey="progress_pct"
              sortDirection={tableHeader.progress_pct}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 待领取代币 */}
          <div className="hidden lg:col-span-3 lg:block">
            <Sort
              title={t('ido.pendingClaim')}
              sortKey="pending_amount"
              sortDirection={tableHeader.pending_amount}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* 领取代币 */}
          <div className="hidden lg:col-span-3 lg:block">
            <Sort
              title={t('ido.claimToken')}
              sortDirection={tableHeader.claimToken}
              className="text-[#656A79]"
            />
          </div>

          {/* 项目活动申请 */}
          <div className="hidden lg:col-span-4 lg:block">
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
          {items.map((item) => (
            <IDOTokenItem
              key={item.tokenAddress}
              token={item}
              onClaimChange={(tokenAddress, amount) => {
                setShowClaimDialog(true)
                setClaimTokenAddress(tokenAddress)
                setClaimAmount(amount)
              }}
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

      {/* Claim Dialog */}
      <IDOClaimDialog
        open={showClaimDialog}
        onOpenChange={setShowClaimDialog}
        tokenAddress={claimTokenAddress}
        amount={claimAmount}
      />
    </div>
  )
}
