'use client'

import * as React from 'react'
import type { SVGProps } from 'react'
export const BurnIcon = (
  props: React.SVGProps<SVGSVGElement> & { size?: number } & {
    size?: number
  }
) => (
  <svg
    width={props.size || 12}
    height={props.size || 12}
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M9.04673 3.17173C8 3.5 7.40764 4.79656 7.5 5.5C6.53024 4.34435 6 3 6.61572 1C3.52281 2.18803 4 5.5 4.15393 6.62528C3 6 3.23035 4.43792 3.23035 4.43792C2.41561 4.85998 2 6.01563 2 6.93792C2 9.18781 3.7845 11 6 11C8.2155 11 10 9.74989 10 7.5C10 6 9 5.5 9.04673 3.17173Z"
      fill="#FF2655"
    />
  </svg>
)
BurnIcon.displayName = 'BurnIcon'
