'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { FloatInput, FloatInputProps } from '@/components/ui/float-input'
import { Button } from '@/components/ui/button'

export interface QuickSelectOption {
  label: string
  value: number
}

export interface PercentageInputProps extends Omit<FloatInputProps, 'suffix'> {
  quickSelectOptions?: QuickSelectOption[]
  showQuickSelect?: boolean
  quickSelectClassName?: string
  onQuickSelect?: (value: number) => void
  showPercentSymbol?: boolean
  percentSymbolClassName?: string
}

export const PercentageInput = forwardRef<
  HTMLInputElement,
  PercentageInputProps
>(
  (
    {
      quickSelectOptions = [
        { label: '10%', value: 10 },
        { label: '25%', value: 25 },
        { label: '50%', value: 50 },
      ],
      showQuickSelect = false,
      quickSelectClassName,
      onQuickSelect,
      showPercentSymbol = true,
      percentSymbolClassName,
      className,
      onChange,
      min = 0,
      max = 100,
      ...props
    },
    ref
  ) => {
    const handleQuickSelect = (value: number) => {
      onChange?.(value)
      onQuickSelect?.(value)
    }

    const floatInputElement = (
      <FloatInput
        ref={ref}
        min={min}
        max={max}
        onChange={onChange}
        suffix={showPercentSymbol ? '%' : undefined}
        suffixClassName={cn(
          'text-2xl font-bold text-[#FFFFFF]',
          percentSymbolClassName
        )}
        className="w-[180px] md:w-full"
        {...props}
      />
    )

    if (!showQuickSelect) {
      return floatInputElement
    }

    return (
      <div
        className={cn(
          'flex flex-col gap-4 md:flex-row md:items-center',
          className
        )}
      >
        <div className="flex-1">{floatInputElement}</div>
        <div className="flex gap-2">
          {quickSelectOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              onClick={() => handleQuickSelect(option.value)}
              className={cn(
                'h-[50px] flex-1 bg-[#252832] px-3 text-[#656A79] hover:bg-[#252832] hover:text-white md:min-w-[120px]',
                quickSelectClassName
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    )
  }
)

PercentageInput.displayName = 'PercentageInput'
