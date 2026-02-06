// components/DraggableItem.tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React, { useMemo, useState } from 'react'
import { DragContext } from './dragContext'

interface DraggableItemProps {
  id: string
  children: React.ReactNode
  className?: string
  isActive?: boolean
}
export const DraggableItem = ({
  id,
  children,
  className,
  isActive,
}: DraggableItemProps) => {
  const {
    attributes,
    listeners: dndListeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  })

  const listeners = useMemo(() => dndListeners, [])
  const ref = useMemo(() => setActivatorNodeRef, [])

  const contextValue = useMemo(
    () => ({
      attributes,
      listeners,
      ref,
      isDragging,
    }),
    [attributes, listeners, ref, isDragging]
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <DragContext.Provider value={contextValue}>
      <div
        ref={setNodeRef}
        style={style}
        className={`w-[360px] shrink-0 rounded-[12px] border pb-4 md:w-[440px] ${className || ''} ${
          isDragging
            ? 'z-50 border-[] opacity-90'
            : isActive
              ? 'border-[]/30'
              : 'border-[#2B3139]'
        }`}
      >
        {children}
      </div>
    </DragContext.Provider>
  )
}
