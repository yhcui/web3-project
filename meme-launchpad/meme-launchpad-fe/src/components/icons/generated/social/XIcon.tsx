'use client'

import * as React from 'react'
import type { SVGProps } from 'react'
export const XIcon = (
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
      opacity={0.8}
      d="M8.75885 2H10.0748L7.19982 5.28594L10.582 9.75736H7.93379L5.85959 7.04547L3.48623 9.75736H2.16947L5.24457 6.24268L2 2H4.71548L6.59037 4.47878L8.75885 2ZM8.29699 8.96969H9.02618L4.31925 2.7463H3.53675L8.29699 8.96969Z"
      fill="currentColor"
    />
  </svg>
)
XIcon.displayName = 'XIcon'
