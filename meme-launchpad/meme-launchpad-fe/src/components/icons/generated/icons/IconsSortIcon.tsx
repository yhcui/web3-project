'use client'

import * as React from 'react'
import type { SVGProps } from 'react'
export const IconsSortIcon = (
  props: React.SVGProps<SVGSVGElement> & { size?: number } & {
    size?: number
  }
) => (
  <svg
    width={props.size || 12}
    height={props.size || 12}
    viewBox="0 0 4 5"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M0 4.0855V3.07012L2 0.915039L4 3.06889V4.0855H0Z"
      fill="currentColor"
    />
  </svg>
)
IconsSortIcon.displayName = 'IconsSortIcon'
