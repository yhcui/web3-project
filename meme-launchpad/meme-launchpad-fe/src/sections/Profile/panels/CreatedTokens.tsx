import { useState, useMemo } from 'react'
import Sort, { type SortDirection } from '@/components/TableHeadSort'
import ActionBar from '../components/ActionBar'
import CreatedTokenItem from '../components/CreatedTokenItem'
import { useMyCreateTokenList } from '@/api/endpoints/profile/queries'
import { LoadingButton } from '@/components/Loading'
import { Pagination } from '@/components/Pagination'
import LuckUpClaimDialog from '../dialog/LuckUpClaimDialog'
import FundingApplyDialog from '../dialog/FundingApplyDialog'
import { useTranslations } from 'next-intl'
import { DataWrapper } from '@/components/DataWrapper'

export default function CreatedTokens({
  onCreateActivity,
}: {
  onCreateActivity: () => void
}) {
  const t = useTranslations('profile.tableSort')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [openLuckUpClaimDialog, setOpenLuckUpClaimDialog] = useState(false)
  const [openFundingApplyDialog, setOpenFundingApplyDialog] = useState(false)
  const [tableHeader, setTableHeader] = useState<{
    [key: string]: SortDirection
  }>({
    name: 'default',
    market_cap: 'default',
    hot: 'default',
    progress_pct: 'default',
    total_locked_token: 'default',
    my_locked_token: 'default',
    project_locked_token_receive: 'default',
    project_activity_application: 'default',
    project_fund_application: 'default',
  })

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
    data: createdTokenList,
    isLoading,
    isError,
  } = useMyCreateTokenList(params, {
    enabled: searchTerm ? searchTerm?.length >= 2 : true,
  })

  const items = useMemo(() => {
    return createdTokenList?.data.list || []
  }, [createdTokenList])

  const totalPages = useMemo(() => {
    return createdTokenList?.data.totalPage || 1
  }, [createdTokenList])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const setTableHeaderField = (key: string, direction: SortDirection) => {
    setTableHeader((prev) => ({
      ...prev,
      [key]: direction,
    }))
  }

  return (
    <div className="py-6">
      <ActionBar
        onSearch={(value) => setSearchTerm(value)}
        onCreateActivity={onCreateActivity}
      />
      <div className="mt-8">
        {/* Table Header */}
        <div className="grid grid-cols-24 text-sm lg:grid-cols-37">
          {/* name */}
          <div className="col-span-9 flex lg:col-span-5">
            <Sort
              title={t('name')}
              sortDirection={null}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* market_cap */}
          <div className="hidden lg:col-span-3 lg:block">
            <Sort
              title={t('created.marketCap')}
              sortKey="market_cap"
              sortDirection={tableHeader.market_cap}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* hot */}
          <div className="hidden lg:col-span-3 lg:block">
            <Sort
              title={t('hot')}
              sortKey="hot"
              sortDirection={tableHeader.hot}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* progress_pct */}
          <div className="hidden lg:col-span-6 lg:block">
            <Sort
              title={t('created.progress')}
              sortKey="progress_pct"
              sortDirection={tableHeader.progress_pct}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* total_locked_token */}
          <div className="col-span-6 lg:col-span-4">
            <Sort
              title={t('created.totalLocked')}
              sortKey="total_locked_token"
              sortDirection={tableHeader.total_locked_token}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* my_locked_token */}
          <div className="col-span-6 lg:col-span-4">
            <Sort
              title={t('created.myLocked')}
              sortKey="my_locked_token"
              sortDirection={tableHeader.my_locked_token}
              className="text-xs text-[#656A79] md:text-sm"
              onChange={setTableHeaderField}
            />
          </div>

          {/* project_locked_token_receive */}
          <div className="hidden lg:col-span-4 lg:block">
            <Sort
              title={t('created.projectLocked')}
              sortKey="project_locked_token_receive"
              sortDirection={tableHeader.project_locked_token_receive}
              className="text-[#656A79]"
              onChange={setTableHeaderField}
            />
          </div>

          {/* project_activity_application */}
          <div className="hidden lg:col-span-4 lg:block">
            <Sort
              title={t('projectActivityApplication')}
              sortDirection={tableHeader.project_activity_application}
              className="text-[#656A79]"
            />
          </div>

          {/* project_fund_application */}
          <div className="hidden lg:col-span-4 lg:block">
            <Sort
              title={t('projectFundApplication')}
              sortDirection={tableHeader.project_fund_application}
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
            <CreatedTokenItem
              key={idx}
              token={token}
              onLuckUpClaim={() => setOpenLuckUpClaimDialog(true)}
              onFundingApply={() => setOpenFundingApplyDialog(true)}
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

      {/* LuckUp Claim Dialog */}
      <LuckUpClaimDialog
        open={openLuckUpClaimDialog}
        onOpenChange={setOpenLuckUpClaimDialog}
      />

      {/* Funding Apply Dialog */}
      <FundingApplyDialog
        open={openFundingApplyDialog}
        onOpenChange={setOpenFundingApplyDialog}
      />
    </div>
  )
}
