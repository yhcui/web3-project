import { cn } from '@/lib/utils'
export type SortDirection = 'default' | 'asc' | 'desc'

// Sort Component
const Sort = ({
  title,
  sortKey = null,
  sortDirection = null,
  onChange,
  className,
}: {
  title: string
  sortKey?: string | null
  sortDirection: SortDirection | null
  onChange?: (key: string, direction: SortDirection) => void
  className?: string
}) => {
  const currentDirection = sortDirection ? sortDirection : 'default'
  const isActive = currentDirection !== 'default'

  const handleClick = () => {
    let nextDirection: SortDirection

    if (!isActive) {
      nextDirection = 'asc' // 第一次点击默认升序
    } else {
      nextDirection =
        currentDirection === 'asc'
          ? 'desc'
          : currentDirection === 'desc'
            ? 'default'
            : 'asc'
    }

    sortKey && onChange && onChange(sortKey, nextDirection)
  }

  const getFillColor = (pathIndex: number) => {
    if (!isActive) return '#656A79'

    if (pathIndex === 0) {
      // Top arrow
      return currentDirection === 'asc' ? '' : '#656A79'
    } else {
      // Bottom arrow
      return currentDirection === 'desc' ? '' : '#656A79'
    }
  }

  return (
    <div
      className="flex cursor-pointer items-center justify-end gap-1 font-normal select-none"
      onClick={handleClick}
    >
      <div
        className={cn(
          'text-[14px]',
          isActive ? 'text-white' : 'text-[#FFFFFFCC]',
          className
        )}
      >
        {title}
      </div>
      {sortKey && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.56565 0.252424C5.26725 -0.0841415 4.73275 -0.0841413 4.43435 0.252424L2.18408 2.79056C1.76439 3.26395 2.10864 4 2.74973 4L7.25027 4C7.89136 4 8.23561 3.26395 7.81592 2.79056L5.56565 0.252424Z"
            fill={getFillColor(0)}
          />
          <path
            d="M5.56565 9.74758C5.26725 10.0841 4.73275 10.0841 4.43435 9.74758L2.18408 7.20944C1.76439 6.73605 2.10864 6 2.74973 6L7.25027 6C7.89136 6 8.23561 6.73605 7.81592 7.20944L5.56565 9.74758Z"
            fill={getFillColor(1)}
          />
        </svg>
      )}
    </div>
  )
}

export default Sort
