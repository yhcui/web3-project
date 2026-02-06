import { useEffect, useState } from 'react'
import { IconsChevronDownIcon } from '@/components/icons/generated'

interface TimeFilterProps {
  value: string
  onChange: (value: string) => void
  options?: string[]
}

export default function TimeFilter({
  value,
  onChange,
  options = ['ALL', '24小时', '7天', '1个月', '3个月', '1年'],
}: TimeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
  }

  // 实现点击文档其他地方时关闭弹窗
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      // @ts-ignore
      if (!event.target?.closest('.time-filter-dropdown')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div
      className="relative text-[12px]"
      onClick={(e) => {
        // 使用原生事件冒泡阻止功能
        e.nativeEvent.stopImmediatePropagation()
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-md border px-3 py-1 text-white transition-all hover:bg-gray-800 ${
          isOpen ? 'border-[#FFD600]' : 'border-[#4F5867]'
        }`}
      >
        <span>{value}</span>
        <div className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg
            width="6"
            height="6"
            viewBox="0 0 6 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6 0.5V2.10326L3 5.5L0 2.10326V0.5H6Z" fill="#798391" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-10 mt-1 min-w-[120px] rounded-md border border-gray-700 bg-[#181A20] shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-white first:rounded-t-md last:rounded-b-md hover:bg-gray-700 ${
                value === option ? '' : ''
              }`}
            >
              <div
                className={`h-3 w-3 rounded-full border ${
                  value === option
                    ? 'border-[#FFD600] bg-[#FFD600]'
                    : 'border-gray-500'
                }`}
              >
                {value === option ? (
                  <div className="flex h-3 w-3 items-center justify-center rounded-full border-[#FFD600] bg-[#FFD600]">
                    <div className="h-1 w-1 rounded-full bg-black"></div>
                  </div>
                ) : (
                  <div className="block h-3 w-3 rounded-full border border-gray-500"></div>
                )}
              </div>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
