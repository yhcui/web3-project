'use client'

import { cn } from '@/lib/utils'

interface ArrowIconProps {
  direction: 'up' | 'down' | 'left' | 'right'
  className?: string
  fillClassName?: string
  size?: number
}

export function ArrowIcon({
  direction,
  className,
  fillClassName,
  size = 16,
}: ArrowIconProps) {
  const paths = {
    down: 'M8.9598 10.6214C8.51221 11.1262 7.71045 11.1262 7.26286 10.6214L3.88745 6.81416C3.25792 6.10408 3.77429 5 4.73593 5L11.4867 5C12.4484 5 12.9647 6.10408 12.3352 6.81416L8.9598 10.6214Z',
    up: 'M8.04019 5.37859C8.48779 4.87383 9.28955 4.87383 9.73714 5.37859L13.1126 9.18584C13.7421 9.89592 13.2257 11 12.2641 11L5.51327 11C4.55163 11 4.03526 9.89592 4.66479 9.18584L8.04019 5.37859Z',
    left: 'M5.37859 8.5402C4.87383 8.98779 4.87383 9.78955 5.37859 10.2371L9.18584 14.1126C9.89592 14.7421 11 14.2257 11 13.2641L11 5.51327C11 4.55163 9.89592 4.03526 9.18584 4.66479L5.37859 8.5402Z',
    right:
      'M10.6214 8.5402C11.1262 8.98779 11.1262 9.78955 10.6214 10.2371L6.81416 14.1126C6.10408 14.7421 5 14.2257 5 13.2641L5 5.51327C5 4.55163 6.10408 4.03526 6.81416 4.66479L10.6214 8.5402Z',
  }

  const viewBoxes = {
    down: '0 0 17 16',
    up: '0 0 17 16',
    left: '0 0 16 17',
    right: '0 0 16 17',
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBoxes[direction]}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('transition-opacity', className)}
    >
      <path
        d={paths[direction]}
        className={cn(
          'fill-white/40 transition-opacity group-hover:fill-white',
          fillClassName
        )}
      />
    </svg>
  )
}
