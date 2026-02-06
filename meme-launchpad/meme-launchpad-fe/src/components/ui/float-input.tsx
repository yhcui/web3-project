'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export interface FloatInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'onBlur' | 'onFocus'
  > {
  value?: number | string
  onChange?: (value: number | string) => void
  onBlur?: (value: number) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  min?: number
  max?: number
  suffix?: React.ReactNode
  placeholder?: string
  className?: string
  inputClassName?: string
  suffixClassName?: string
  allowEmpty?: boolean
  clearOnFocus?: boolean
  formatOnBlur?: boolean
}

export const FloatInput = forwardRef<HTMLInputElement, FloatInputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      onFocus,
      min,
      max,
      suffix,
      placeholder = '0',
      className,
      inputClassName,
      suffixClassName,
      allowEmpty = true,
      clearOnFocus = true,
      formatOnBlur = true,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Allow empty value if configured
      if (inputValue === '' && allowEmpty) {
        onChange?.(allowEmpty ? '' : 0)
        return
      }

      // Validate input format - only allow valid decimal number format
      const isValidInput = /^\d*\.?\d*$/.test(inputValue)
      if (!isValidInput) return

      // Check for multiple decimal points
      const dotCount = (inputValue.match(/\./g) || []).length
      if (dotCount > 1) return

      // Handle leading zeros (convert "05" to "5", but keep "0." as is)
      if (
        inputValue.length > 1 &&
        inputValue[0] === '0' &&
        inputValue[1] !== '.'
      ) {
        onChange?.(inputValue.substring(1))
        return
      }

      // Apply max constraint if specified
      if (
        max !== undefined &&
        inputValue &&
        !inputValue.endsWith('.') &&
        inputValue !== '.'
      ) {
        const numValue = parseFloat(inputValue)
        if (numValue > max) return
      }

      // Apply min constraint if specified (for non-empty values)
      if (
        min !== undefined &&
        inputValue &&
        !inputValue.endsWith('.') &&
        inputValue !== '.'
      ) {
        const numValue = parseFloat(inputValue)
        // Allow typing values that will eventually be valid (e.g., typing "0" when min is 0.1)
        // Only block if the value is definitely invalid and not in progress
        if (
          inputValue.length > 1 &&
          numValue < min &&
          !inputValue.includes('.')
        ) {
          return
        }
      }

      onChange?.(inputValue)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      if (!formatOnBlur) {
        onBlur?.(parseFloat(inputValue) || 0)
        return
      }

      if (inputValue === '' || inputValue === '.') {
        const finalValue = allowEmpty ? 0 : (min ?? 0)
        onChange?.(finalValue)
        onBlur?.(finalValue)
      } else if (inputValue.endsWith('.')) {
        const finalValue = parseFloat(inputValue.slice(0, -1)) || 0
        onChange?.(finalValue)
        onBlur?.(finalValue)
      } else {
        let finalValue = parseFloat(inputValue) || 0

        // Apply constraints
        if (max !== undefined && finalValue > max) finalValue = max
        if (min !== undefined && finalValue < min) finalValue = min

        onChange?.(finalValue)
        onBlur?.(finalValue)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Clear input on focus if value is 0 and clearOnFocus is enabled
      if (clearOnFocus && (value === 0 || value === '0')) {
        onChange?.('')
      }
      onFocus?.(e)
    }

    const displayValue = value === 0 && clearOnFocus ? '' : value

    if (suffix) {
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <Input
            ref={ref}
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={inputClassName}
            {...props}
          />
          <span className={suffixClassName}>{suffix}</span>
        </div>
      )
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*\.?[0-9]*"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={cn(inputClassName, className)}
        {...props}
      />
    )
  }
)

FloatInput.displayName = 'FloatInput'
