import Image from 'next/image'
import React from 'react'
import EmptyImg from '@/assets/common/empty.png'
import LoadingImg from '@/assets/common/loading.gif'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface DataWrapperProps<T> {
  list: T[]
  children: React.ReactNode
  emptyText?: string
  loading?: boolean
  className?: string
}

export function DataWrapper<T>({
  list,
  children,
  emptyText,
  loading = false,
  className,
}: DataWrapperProps<T>) {
  const t = useTranslations('wallet')
  const showEmpty = !loading && (!list || list.length === 0)

  const finalEmptyText = emptyText ?? t('noData')

  if (loading || showEmpty) {
    return (
      <div
        className={cn(
          'flex min-h-[300px] flex-col items-center justify-center text-center text-gray-400',
          className
        )}
      >
        {loading ? (
          <Image src={LoadingImg} alt="loading" width={46} height={46} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3">
            <Image src={EmptyImg} alt="empty" width={72} height={72} />
            <p className="text-xs text-[#656A79]">{finalEmptyText}</p>
          </div>
        )}
      </div>
    )
  }

  return <div className={cn('w-full', className)}>{children}</div>
}
