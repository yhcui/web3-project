import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabItem {
  label: string
  key: string | number
  content: ReactNode
}

interface TabProps {
  tabs: TabItem[]
  activeKey: string | number
  className?: string
  tabClass?: string
  activeTabClass?: string
  contentClass?: string
  variant?: 'default' | 'navigation'
  showLine?: boolean
  onChange?: (key: string | number) => void
  filterComponent?: ReactNode
}

const Tab: React.FC<TabProps> = ({
  tabs,
  activeKey,
  className,
  tabClass,
  contentClass,
  activeTabClass,
  variant = 'default',
  showLine = false,
  onChange,
  filterComponent,
}) => {
  if (variant === 'navigation') {
    return (
      <div>
        <div
          className={cn(
            'flex items-center border-b border-[#2b3139]',
            className
          )}
        >
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`relative shrink-0 cursor-pointer px-4 py-3 text-[16px] font-medium transition-colors ${
                activeKey === tab.key
                  ? 'text-white'
                  : 'text-[#656A79] hover:text-white'
              } ${tabClass}`}
              onClick={() => onChange?.(tab.key)}
            >
              {tab.label}
              {activeKey === tab.key && (
                <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-[#f0b90b]"></div>
              )}
            </div>
          ))}
        </div>
        <div className={contentClass}>
          {tabs.find((tab) => tab.key === activeKey)?.content}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className={cn('scrollbar-hide flex items-end gap-5', className)}>
        {tabs.map((tab, index) => {
          const isActive = activeKey === tab.key
          return (
            <div
              key={tab.key}
              className={`relative shrink-0 cursor-pointer text-[#656A79] transition-colors ${
                index === tabs.length - 1 ? 'mr-auto' : ''
              } ${isActive ? `text-white ${activeTabClass}` : 'hover:text-[#FFFFFF80]'} ${tabClass}`}
              onClick={() => onChange?.(tab.key)}
            >
              {tab.label}
              {isActive && showLine && (
                <div className="absolute right-0 bottom-0 left-0 h-[2px] bg-[]"></div>
              )}
            </div>
          )
        })}
        {filterComponent ?? null}
      </div>
      <div className={contentClass}>
        {tabs.find((tab) => tab.key === activeKey)?.content}
      </div>
    </div>
  )
}

export default Tab
