import React from 'react'
import { useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'

interface InlineFormLabelProps {
  name: string
  required?: boolean
  optional?: boolean
  children: React.ReactNode
  className?: string
}

export function InlineFormLabel({
  name,
  required = false,
  optional = false,
  children,
  className = '',
}: InlineFormLabelProps) {
  const {
    formState: { errors },
  } = useFormContext()

  const error = errors[name]

  return (
    <div
      className={cn(
        'flex items-center justify-between text-[#F0F1F5]',
        className
      )}
    >
      <div className="flex items-center gap-1">
        <span className="text-base font-bold">{children}</span>
        {required && (
          <span className="text-base font-bold text-[#BFFB06]">*</span>
        )}
        {optional && <span className="text-sm text-[#656A79]">(Optional)</span>}
      </div>
      {error && (
        <span className="text-sm text-red-500">{error.message as string}</span>
      )}
    </div>
  )
}
