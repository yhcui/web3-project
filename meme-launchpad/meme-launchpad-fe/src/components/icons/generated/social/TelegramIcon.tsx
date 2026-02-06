'use client'

import * as React from 'react'
import type { SVGProps } from 'react'
export const TelegramIcon = (
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
      d="M4.58659 9.51601L4.7347 7.27851L8.7971 3.61811C8.97695 3.45414 8.76008 3.37479 8.52204 3.51761L3.50751 6.68608L1.33878 5.99843C0.873299 5.86619 0.868009 5.54352 1.44457 5.31078L9.89205 2.05239C10.2782 1.87784 10.6485 2.14761 10.5004 2.74004L9.06158 9.51601C8.96108 9.99736 8.67015 10.1137 8.26814 9.89157L6.07825 8.27296L5.02563 9.29385C4.90397 9.41551 4.80346 9.51601 4.58659 9.51601Z"
      fill="currentColor"
    />
  </svg>
)
TelegramIcon.displayName = 'TelegramIcon'
