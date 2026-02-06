// contexts/DragContext.ts
import { createContext, useContext } from 'react'

interface DragContextValue {
  attributes: Record<string, any>
  listeners: any
  ref: (node: HTMLElement | null) => void
  isDragging: boolean
}

export const DragContext = createContext<DragContextValue>({
  attributes: {},
  listeners: undefined,
  ref: () => {},
  isDragging: false,
})

export const useDragContext = () => useContext(DragContext)
