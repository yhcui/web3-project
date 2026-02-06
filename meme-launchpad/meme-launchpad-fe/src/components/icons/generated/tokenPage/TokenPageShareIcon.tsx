'use client'

import * as React from 'react'
import type { SVGProps } from 'react'
export const TokenPageShareIcon = (
  props: React.SVGProps<SVGSVGElement> & { size?: number } & {
    size?: number
  }
) => (
  <svg
    width={props.size || 12}
    height={props.size || 12}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 3C7.02991 3 3 7.02991 3 12C3 16.9701 7.02991 21 12 21C16.9701 21 21 16.9701 21 12C21 7.02991 16.9701 3 12 3ZM15.8109 8.75558L13.5529 13.3902C13.4926 13.4826 13.4304 13.573 13.34 13.6031L8.76763 15.7989C8.70737 15.829 8.64509 15.8592 8.58482 15.8592C8.46228 15.8592 8.33973 15.829 8.24933 15.7366C8.09665 15.6141 8.06652 15.4011 8.15692 15.2183L10.3828 10.5536C10.4129 10.4612 10.5054 10.3708 10.5958 10.3406L15.2002 8.17701C15.383 8.0846 15.598 8.11473 15.7205 8.26741C15.8712 8.41808 15.9033 8.63103 15.8109 8.75558Z"
      fill="currentColor"
    />
    <path
      d="M12 10.9336C11.3953 10.9336 10.9336 11.3977 10.9336 12C10.9313 12.6047 11.393 13.0664 12 13.0664C12.5672 13.0664 13.0664 12.6023 13.0664 12C13.0664 11.3953 12.5672 10.9336 12 10.9336Z"
      fill="currentColor"
    />
  </svg>
)
TokenPageShareIcon.displayName = 'TokenPageShareIcon'
