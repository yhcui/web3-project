'use client'

import * as React from 'react'
import type { SVGProps } from 'react'
export const MediumIcon = (
  props: React.SVGProps<SVGSVGElement> & { size?: number } & {
    size?: number
  }
) => (
  <svg
    width={props.size || 12}
    height={props.size || 12}
    viewBox="0 0 14 9"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <mask
      id="mask0_747_15909"
      style={{
        maskType: 'luminance',
      }}
      maskUnits="userSpaceOnUse"
      x={0}
      y={0}
      width={14}
      height={9}
    >
      <path
        d="M13.3204 0.611667C12.9126 0.611667 12.6408 2.17476 12.6408 4.07767C12.6408 5.98058 12.9806 7.54367 13.3204 7.54367C13.7282 7.54367 14 5.98058 14 4.07767C14 2.17476 13.7282 0.611667 13.3204 0.611667ZM10.2621 0.271861C9.17476 0.271861 8.29126 1.97087 8.29126 4.07767C8.29126 6.18447 9.17476 7.88348 10.2621 7.88348C11.3495 7.88348 12.233 6.18447 12.233 4.07767C12.233 1.97087 11.3495 0.271861 10.2621 0.271861ZM3.94175 0C1.76699 0 0 1.83495 0 4.07767C0 6.32039 1.76699 8.15534 3.94175 8.15534C6.1165 8.15534 7.88349 6.32039 7.88349 4.07767C7.88349 1.83495 6.1165 0 3.94175 0Z"
        fill="currentColor"
      />
    </mask>
    <g mask="url(#mask0_747_15909)">
      <mask
        id="mask1_747_15909"
        style={{
          maskType: 'luminance',
        }}
        maskUnits="userSpaceOnUse"
        x={-22}
        y={-607}
        width={1088}
        height={680}
      >
        <path
          d="M1065.63 -606.894H-21.748V72.718H1065.63V-606.894Z"
          fill="currentColor"
        />
      </mask>
      <g mask="url(#mask1_747_15909)">
        <path
          d="M14.6795 -0.679688H-0.679688V8.83488H14.6795V-0.679688Z"
          fill="currentColor"
        />
      </g>
    </g>
  </svg>
)
MediumIcon.displayName = 'MediumIcon'
