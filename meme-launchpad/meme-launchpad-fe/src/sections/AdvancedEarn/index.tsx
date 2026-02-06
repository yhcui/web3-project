'use client'

import { useState } from 'react'
import QuickBuy from '@/components/QuickBuy'
import TokenType from './components/TokenType/index'
import { TOKEN_TYPES } from './tokenTypes'
import { useTranslations } from 'next-intl'
import { FiltersContext } from './components/TokenType/filtersContext'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

export default function AdvancedEarn() {
  const t = useTranslations('advancedEarn')
  const [tokenTypes, setTokenTypes] = useState(TOKEN_TYPES)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor)
  )

  return (
    <div className="pb-16">
      <QuickBuy />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => {
          setActiveId(active.id as string)
        }}
        onDragEnd={({ active, over }) => {
          if (active.id !== over?.id) {
            setTokenTypes((items) => {
              const oldIndex = items.findIndex((item) => item.id === active.id)
              const newIndex = items.findIndex((item) => item.id === over?.id)
              return arrayMove(items, oldIndex, newIndex)
            })
          }
          setActiveId(null)
        }}
        onDragCancel={() => {
          setActiveId(null)
        }}
      >
        <div className="scrollbar-hide mt-4 flex w-full gap-2 overflow-x-auto md:gap-4">
          <FiltersContext.Provider value={{ filters, setFilters }}>
            <SortableContext items={tokenTypes.map((item) => item.id)}>
              {tokenTypes.map((tokenType, index) => (
                <TokenType
                  key={tokenType.id}
                  title={`${t(tokenType.titleKey)}`}
                  icon={tokenType.icon}
                  className={
                    index === 0
                      ? 'ml-2 md:ml-7'
                      : index === tokenTypes.length - 1
                        ? 'mr-2 md:mr-7'
                        : ''
                  }
                  config={tokenType}
                  isActive={activeId === tokenType.id}
                />
              ))}
            </SortableContext>
          </FiltersContext.Provider>
        </div>
      </DndContext>
    </div>
  )
}
