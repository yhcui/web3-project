'use client'

import React from 'react'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface InfoTooltipProps {
  content: string | React.ReactNode
  children?: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  className?: string
  iconClassName?: string
  contentClassName?: string
}

export function InfoTooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 8,
  className,
  iconClassName,
  contentClassName,
}: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-full transition-colors hover:bg-[#252832]/50',
            className
          )}
          onClick={(e) => e.preventDefault()}
        >
          {children || (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={cn(iconClassName)}
            >
              <rect
                x="0.5"
                y="0.5"
                width="19"
                height="19"
                rx="9.5"
                stroke="#606572"
                strokeOpacity="0.5"
              />
              <path
                d="M9.91586 16.3067C9.46677 16.5576 9.09941 16.6831 8.81453 16.6831C8.56478 16.6831 8.36695 16.6063 8.22087 16.4531C8.07475 16.2998 8.00176 16.0871 8.00176 15.8153C8.00176 14.9442 8.5364 12.8148 9.60577 9.4274C9.65576 9.26705 9.68072 9.12412 9.68072 8.99877C9.68072 8.85948 9.61652 8.78969 9.48819 8.78969C9.34551 8.78969 9.1835 8.84557 9.00178 8.95694C8.81988 9.06852 8.41508 9.42402 7.78796 10.0234L7.31738 9.66789C8.0294 8.90127 8.6792 8.3557 9.26652 8.03168C9.85414 7.70764 10.3541 7.54553 10.7672 7.54553C10.9952 7.54553 11.1696 7.59436 11.2906 7.69181C11.4115 7.78953 11.4722 7.92182 11.4722 8.08914C11.4722 8.29137 11.2412 9.14869 10.7789 10.6612C10.0254 13.1354 9.6486 14.6271 9.6486 15.1358C9.6486 15.2335 9.67341 15.3154 9.72345 15.3815C9.7733 15.4478 9.8267 15.4807 9.88388 15.4807C10.112 15.4807 10.6966 15.0487 11.6376 14.1843L12.0546 14.5816C11.0777 15.4806 10.365 16.0558 9.91586 16.3067ZM12.4035 5.71503C12.186 5.94868 11.9419 6.0652 11.671 6.0652C11.4572 6.0652 11.2789 5.99201 11.1363 5.84563C10.9937 5.69941 10.9225 5.50774 10.9225 5.27062C10.9225 4.95707 11.0257 4.69039 11.2326 4.4708C11.4392 4.25135 11.6853 4.1416 11.9706 4.1416C12.1914 4.1416 12.3732 4.21311 12.5158 4.35582C12.6584 4.49884 12.7296 4.68176 12.7296 4.90468C12.7297 5.21144 12.621 5.48143 12.4035 5.71503Z"
                fill="#656A79"
              />
            </svg>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'max-w-xs border border-[#3F475A]/30 bg-[#252832] text-[#F0F1F5]',
          contentClassName
        )}
      >
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  )
}

// Alternative with Info icon from lucide-react
export function InfoTooltipIcon({
  content,
  side = 'top',
  align = 'center',
  sideOffset = 8,
  className,
  iconClassName,
  contentClassName,
}: Omit<InfoTooltipProps, 'children'>) {
  return (
    <InfoTooltip
      content={content}
      side={side}
      align={align}
      sideOffset={sideOffset}
      className={className}
      contentClassName={contentClassName}
    >
      <Info className={cn('h-5 w-5 text-[#656A79]', iconClassName)} />
    </InfoTooltip>
  )
}
