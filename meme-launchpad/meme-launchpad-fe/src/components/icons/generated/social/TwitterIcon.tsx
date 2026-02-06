'use client'

import * as React from 'react'
import type { SVGProps } from 'react'
export const TwitterIcon = (
  props: React.SVGProps<SVGSVGElement> & { size?: number } & {
    size?: number
  }
) => (
  <svg
    width={props.size || 12}
    height={props.size || 12}
    viewBox="0 0 14 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <mask
      id="mask0_747_15927"
      style={{
        maskType: 'luminance',
      }}
      maskUnits="userSpaceOnUse"
      x={0}
      y={0}
      width={14}
      height={11}
    >
      <path
        d="M14 1.3125C13.475 1.4875 12.95 1.6625 12.3375 1.75C12.95 1.4 13.3875 0.874989 13.5625 0.262489C13.0375 0.524989 12.425 0.7875 11.725 0.875C11.2 0.35 10.5 0 9.625 0C8.05 0 6.825 1.225 6.825 2.625C6.825 2.8 6.825 3.06246 6.9125 3.23746C4.55 3.14996 2.45 2.1 1.05 0.4375C0.787501 0.7875 0.699999 1.3125 0.699999 1.75C0.699999 2.7125 1.225 3.5 1.925 3.9375C1.4875 3.9375 1.05 3.76248 0.612501 3.58748C0.612501 4.89998 1.575 5.94998 2.8875 6.21248C2.625 6.29998 2.3625 6.29996 2.1 6.29996C1.925 6.29996 1.75 6.29998 1.575 6.21248C1.925 7.26248 2.975 8.04996 4.2 8.04996C3.2375 8.74996 2.0125 9.1875 0.699999 9.1875C0.437499 9.1875 0.2625 9.1875 0 9.1875C1.225 9.975 2.7125 10.4125 4.375 10.4125C9.625 10.4125 12.425 6.38749 12.425 2.88749C12.425 2.79999 12.425 2.62497 12.425 2.53747C13.125 2.36247 13.65 1.8375 14 1.3125Z"
        fill="currentColor"
      />
    </mask>
    <g mask="url(#mask0_747_15927)">
      <mask
        id="mask1_747_15927"
        style={{
          maskType: 'luminance',
        }}
        maskUnits="userSpaceOnUse"
        x={-55}
        y={-782}
        width={1401}
        height={876}
      >
        <path
          d="M1345.05 -781.288H-54.9492V93.7115H1345.05V-781.288Z"
          fill="currentColor"
        />
      </mask>
      <g mask="url(#mask1_747_15927)">
        <path
          d="M14.8758 -0.788086H-0.699219V11.4619H14.8758V-0.788086Z"
          fill="currentColor"
        />
      </g>
    </g>
  </svg>
)
TwitterIcon.displayName = 'TwitterIcon'
