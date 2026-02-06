import { useState } from 'react'
import { useEffect, useRef } from 'react'
import ChartPanel from './ChartPanel'
import TimeRangeSelector from './TimeRangeSelector'

interface ChartData {
  time: string
  value: number
}

interface ChartPanelWithTimeSelectorProps {
  title: string
  data7d: ChartData[] | undefined
  data30d: ChartData[] | undefined
  unit?: string
  className?: string
  showDropdown?: boolean
  dropdownOptions?: string[]
  onDropdownChange?: (value: string) => void
}

export default function ChartPanelWithTimeSelector({
  title,
  data7d,
  data30d,
  unit = '',
  className = '',
  showDropdown = false,
  dropdownOptions = [],
  onDropdownChange,
}: ChartPanelWithTimeSelectorProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const currentData = timeRange === '7d' ? data7d : data30d

  const handleDropdownSelect = (option: string) => {
    onDropdownChange?.(option)
    setIsDropdownOpen(false)
  }

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showDropdown) return
    const handleClickOutside = (event: MouseEvent) => {
      setIsDropdownOpen(false)
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <div className={`min-h-[300px] p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        {showDropdown ? (
          <div className="relative">
            <button
              onClick={(e) => {
                e.nativeEvent.stopImmediatePropagation()
                setIsDropdownOpen(!isDropdownOpen)
              }}
              className="flex items-center gap-2 text-[16px] font-medium text-white transition-colors hover:text-[#FFD600]"
            >
              {title}
              {showDropdown && (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.75 6.49023C14.1642 6.49023 14.5 6.82602 14.5 7.24023V8.44229C14.5 8.63365 14.4269 8.81777 14.2955 8.95696L10.5455 12.932C10.2495 13.2457 9.75047 13.2457 9.45445 12.932L5.70445 8.95696C5.57314 8.81777 5.5 8.63365 5.5 8.44229V7.24023C5.5 6.82602 5.83579 6.49023 6.25 6.49023H13.75Z"
                    fill="#798391"
                  />
                </svg>
              )}
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 z-10 mt-2 min-w-[150px] rounded-md border border-[#4F5867] bg-[#2B3139] shadow-lg">
                {dropdownOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleDropdownSelect(option)}
                    className="w-full px-3 py-2 text-left text-white first:rounded-t-md last:rounded-b-md hover:bg-[#3F475A]"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-[16px] font-medium text-white">{title}</div>
        )}
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {currentData && currentData.length > 0 && (
        <ChartPanel
          data={currentData}
          title=""
          unit={unit}
          className="!bg-transparent !p-0"
        />
      )}
    </div>
  )
}
