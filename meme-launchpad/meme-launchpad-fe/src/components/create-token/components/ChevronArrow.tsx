import React from 'react'

interface ChevronArrowProps {
  className?: string
  color?: string
  width?: number
  height?: number
  expanded?: boolean
}

export function ChevronArrow({
  className = '',
  color = '#656A79',
  width = 10,
  height = 6,
  expanded = false,
}: ChevronArrowProps) {
  // Use #FBD437 when expanded, otherwise use the provided color
  const fillColor = expanded ? '#FBD437' : color

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-all duration-200 ${expanded ? 'rotate-180' : ''} ${className}`}
    >
      <path
        d="M5.84847 5.62136C5.40088 6.12621 4.59912 6.12621 4.15153 5.62136L0.776127 1.81416C0.146588 1.10408 0.662961 -4.76837e-07 1.6246 0L8.3754 9.53674e-07C9.33704 9.53674e-07 9.85341 1.10408 9.22387 1.81416L5.84847 5.62136Z"
        fill={fillColor}
      />
    </svg>
  )
}
