import ActionBar from '../components/ActionBar'
import UserCard from '../components/UserCard'
import { useMyFollowingList } from '@/api/endpoints/profile/queries'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { DataWrapper } from '@/components/DataWrapper'
import { Pagination } from '@/components/Pagination'

export default function Following() {
  const [searchTerm, setSearchTerm] = useState('')
  const params = useMemo(() => {
    return {
      pn: 1,
      ps: 10,
      search: searchTerm,
    }
  }, [searchTerm])

  const {
    data: followingList,
    isLoading,
    isError,
  } = useMyFollowingList(params, {
    enabled: searchTerm ? searchTerm?.length >= 2 : true,
  })
  const t = useTranslations('profile')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const totalPages = useMemo(() => {
    return Math.ceil((followingList?.data.total || 0) / pageSize)
  }, [followingList, pageSize])

  const items = useMemo(() => {
    return followingList?.data.list || []
  }, [followingList])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="mt-6">
      <ActionBar isOnlySearch onSearch={(value) => setSearchTerm(value)} />
      <DataWrapper className="mt-4" list={items} loading={isLoading}>
        {items.map((item) => (
          <UserCard key={item.id} user={item} />
        ))}
      </DataWrapper>

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
