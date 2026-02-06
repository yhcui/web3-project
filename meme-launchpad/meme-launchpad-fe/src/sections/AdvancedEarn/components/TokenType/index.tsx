// components/TokenType.tsx
import React, { useEffect, useMemo } from 'react'
import { type TokenTypeConfig } from '../../tokenTypes'
import Action from '../Action'
import TokenList from '../TokenList'
import { DraggableItem } from './draggableItem'
import { useFiltersContext } from './filtersContext'
import {
  useAdvancedList,
  type AdvancedTokenItem,
} from '@/api/endpoints/advanced'

interface TokenTypeProps {
  title: string
  icon: React.ReactNode
  className?: string
  config?: TokenTypeConfig
  isActive?: boolean
}

const pageNum = 1
const pageSize = 20

export default function TokenType({
  title,
  icon,
  className,
  config,
  isActive = false,
}: TokenTypeProps) {
  const { filters } = useFiltersContext()

  const params = useMemo(() => {
    const baseParams = {
      pn: pageNum,
      ps: pageSize,
      sortType: config?.value,
    }

    if (filters && (filters as Record<string, unknown>).id === config?.id) {
      return {
        ...baseParams,
        ...(filters as Record<string, unknown>),
      }
    }

    return baseParams
  }, [filters, config?.id])

  const { data: advancedData, isLoading } = useAdvancedList(params)
  const items = useMemo(() => {
    if (!advancedData?.data?.list) return []
    return advancedData.data.list.map((item) => ({
      ...item,
    }))
  }, [advancedData])

  return (
    <DraggableItem
      id={config?.id || 'draggable'}
      className={className}
      isActive={isActive}
    >
      <Action title={title} icon={icon} id={config?.id || ''} />
      <TokenList config={config} items={items} isLoading={isLoading} />
    </DraggableItem>
  )
}
