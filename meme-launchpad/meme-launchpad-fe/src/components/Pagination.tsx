'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}: PaginationProps) {
  const t = useTranslations('common')

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []

    if (totalPages <= maxVisiblePages + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate range around current page
      let start = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
      let end = Math.min(totalPages - 1, start + maxVisiblePages - 1)

      // Adjust start if we're near the end
      if (end === totalPages - 1) {
        start = Math.max(2, end - maxVisiblePages + 1)
      }

      // Add ellipsis if needed at the start
      if (start > 2) {
        pages.push('...')
      }

      // Add visible page numbers
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed at the end
      if (end < totalPages - 1) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages, maxVisiblePages])

  return (
    <div className="flex items-center gap-[10px]">
      {/* Previous Arrow */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex h-[12.5px] w-[12.5px] items-center justify-center"
      >
        <Image
          src="/assets/images/pagination-arrow-left.svg"
          alt=""
          width={7.29}
          height={12.5}
          className={currentPage === 1 ? 'opacity-40' : ''}
        />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-6">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="font-din-pro text-sm leading-[1.24em] font-normal text-white opacity-80"
              >
                ...
              </span>
            )
          }

          const pageNumber = page as number
          const isActive = pageNumber === currentPage

          return isActive ? (
            <div
              key={pageNumber}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2B3139]"
            >
              <span className="font-din-pro text-sm leading-[1.24em] font-normal text-white">
                {pageNumber}
              </span>
            </div>
          ) : (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className="font-din-pro text-sm leading-[1.24em] font-normal text-white opacity-80 transition-opacity hover:opacity-100"
            >
              {pageNumber}
            </button>
          )
        })}
      </div>

      {/* Next Arrow */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex h-[12.5px] w-[12.5px] items-center justify-center"
        aria-label={t('pagination.next')}
      >
        <Image
          src="/assets/images/pagination-arrow-right.svg"
          alt=""
          width={7.29}
          height={12.5}
          className={currentPage === totalPages ? 'opacity-40' : ''}
        />
      </button>
    </div>
  )
}
