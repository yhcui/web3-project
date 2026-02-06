import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingButtonProps {
  text?: string
  className?: string
}

export const LoadingButton = ({ className }: LoadingButtonProps) => {
  return (
    <svg
      className={cn('mr-3 h-5 w-5 animate-spin text-white', className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.1"
        fill="none"
      />

      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.7"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="47.12"
        strokeDashoffset="0"
        transform="rotate(-90 12 12)"
      />
    </svg>
  )
}
