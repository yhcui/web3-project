'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import './DateTimePicker.css'

interface DateTimePickerProps {
  value?: Date | string
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  showIcon?: boolean
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date and time',
  className,
  showIcon = true,
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date>(() => {
    if (value) return new Date(value)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  })

  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedYear, setSelectedYear] = React.useState(date.getFullYear())
  const [selectedMonth, setSelectedMonth] = React.useState(date.getMonth())
  const [selectedDay, setSelectedDay] = React.useState(date.getDate())
  const [selectedHour, setSelectedHour] = React.useState(
    date.getHours() % 12 || 12
  )
  const [selectedMinute, setSelectedMinute] = React.useState(date.getMinutes())
  const [selectedSecond, setSelectedSecond] = React.useState(date.getSeconds())
  const [selectedAmPm, setSelectedAmPm] = React.useState<'AM' | 'PM'>(
    date.getHours() >= 12 ? 'PM' : 'AM'
  )

  const [showYearDropdown, setShowYearDropdown] = React.useState(false)
  const [showMonthDropdown, setShowMonthDropdown] = React.useState(false)

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const formatDisplayValue = () => {
    if (!value) return placeholder

    const d = new Date(value)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return `${year}/${month}/${day}        ${hours}:${minutes}:${seconds}`
  }

  const formatSelectedDate = () => {
    return `${MONTHS[selectedMonth]} ${selectedDay}, ${selectedYear}`
  }

  const formatSelectedTime = () => {
    const hour = String(selectedHour).padStart(2, '0')
    const minute = String(selectedMinute).padStart(2, '0')
    const second = String(selectedSecond).padStart(2, '0')
    return `${hour}:${minute}:${second} ${selectedAmPm}`
  }

  const handleOK = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay)
    const hour24 =
      selectedAmPm === 'PM' && selectedHour !== 12
        ? selectedHour + 12
        : selectedAmPm === 'AM' && selectedHour === 12
          ? 0
          : selectedHour
    newDate.setHours(hour24, selectedMinute, selectedSecond, 0)
    setDate(newDate)
    onChange(newDate)
    setIsOpen(false)
  }

  const handleCancel = () => {
    if (value) {
      const d = new Date(value)
      setSelectedYear(d.getFullYear())
      setSelectedMonth(d.getMonth())
      setSelectedDay(d.getDate())
      setSelectedHour(d.getHours() % 12 || 12)
      setSelectedMinute(d.getMinutes())
      setSelectedSecond(d.getSeconds())
      setSelectedAmPm(d.getHours() >= 12 ? 'PM' : 'AM')
    }
    setIsOpen(false)
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth)
    const daysInPrevMonth =
      selectedMonth === 0
        ? getDaysInMonth(selectedYear - 1, 11)
        : getDaysInMonth(selectedYear, selectedMonth - 1)

    const days = []

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div
          key={`prev-${i}`}
          className="flex h-[40px] w-[40px] items-center justify-center"
        >
          <span className="text-[14px] font-semibold text-[#545F78]">
            {daysInPrevMonth - i}
          </span>
        </div>
      )
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === selectedDay
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDay(day)}
          className={cn(
            'flex h-[40px] w-[40px] items-center justify-center rounded-[4px] transition-colors',
            isSelected
              ? 'bg-[#BFFB06] text-[#000000]'
              : 'text-[#F0F1F5] hover:bg-[#3F475A]'
          )}
        >
          <span className="text-[14px] font-semibold">{day}</span>
        </button>
      )
    }

    // Next month days
    const totalCells = days.length
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className="flex h-[40px] w-[40px] items-center justify-center"
        >
          <span className="text-[14px] font-semibold text-[#545F78]/40">
            {day}
          </span>
        </div>
      )
    }

    return days
  }

  const TimeColumn = React.memo(function TimeColumn({
    values,
    selectedValue,
    onSelect,
    format,
  }: {
    values: number[]
    selectedValue: number
    onSelect: (value: number) => void
    format: (value: number) => string
  }) {
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (scrollRef.current) {
        const selectedIndex = values.indexOf(selectedValue)
        if (selectedIndex !== -1) {
          const itemHeight = 44 // 40px height + 4px gap
          const scrollTop = Math.max(
            0,
            selectedIndex * itemHeight - itemHeight * 3
          )
          scrollRef.current.scrollTop = scrollTop
        }
      }
    }, [selectedValue, values])

    return (
      <div
        ref={scrollRef}
        className="custom-scrollbar flex h-[336px] flex-col gap-[4px] overflow-y-auto pr-[4px]"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#3F475A transparent',
        }}
      >
        {values.map((value) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={cn(
              'flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[4px] transition-colors',
              selectedValue === value
                ? 'bg-[#BFFB06] text-[#0A0C0F]'
                : 'text-[#F0F1F5] hover:bg-[#3F475A]'
            )}
          >
            <span className="text-[14px] font-semibold">{format(value)}</span>
          </button>
        ))}
      </div>
    )
  })

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex h-[50px] w-full items-center justify-between rounded-lg border border-transparent bg-[#15181E] px-4 text-left font-normal text-[#656A79] transition-colors hover:border-[]',
            className
          )}
        >
          <span className="text-[14px] font-semibold">
            {formatDisplayValue()}
          </span>
          {showIcon && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M6 2V5M14 2V5M3 8H17M5 3H15C16.1046 3 17 3.89543 17 5V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V5C3 3.89543 3.89543 3 5 3Z"
                stroke="#656A79"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto rounded-[16px] border border-[#2B3139] bg-[#1B1E25] p-[8px]"
        align="start"
        sideOffset={4}
      >
        <div className="flex items-center gap-[8px]">
          {/* Day Picker */}
          <div className="flex flex-col items-end gap-[16px] p-[16px]">
            {/* Header */}
            <div className="flex w-full items-center justify-center gap-[128px]">
              <span className="text-[14px] font-semibold text-[#F0F1F5]">
                {formatSelectedDate()}
              </span>
            </div>

            {/* Divider */}
            <div className="h-[1px] w-full bg-[#3F475A]" />

            {/* Month/Year Selectors */}
            <div className="flex w-full items-center justify-between gap-[8px]">
              {/* Year Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="flex items-center gap-[2px] rounded-[8px] bg-transparent px-[8px] py-[4px] hover:bg-[#3F475A]"
                >
                  <span className="text-[14px] font-semibold text-[#F0F1F5]">
                    {selectedYear}
                  </span>
                  <ChevronDown className="h-[12px] w-[12px] text-[#F0F1F5]" />
                </button>
                {showYearDropdown && (
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-[200px] overflow-y-auto rounded-[8px] border border-[#3F475A] bg-[#1B1E25] p-[4px]">
                    {Array.from(
                      { length: 20 },
                      (_, i) => selectedYear - 10 + i
                    ).map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year)
                          setShowYearDropdown(false)
                        }}
                        className="block w-full px-[8px] py-[4px] text-left text-[14px] font-semibold text-[#F0F1F5] hover:bg-[#3F475A]"
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Month Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="flex items-center gap-[2px] rounded-[8px] bg-[#3F475A] px-[16px] py-[4px] hover:bg-[#545F78]"
                >
                  <span className="text-[14px] font-semibold text-[#F0F1F5]">
                    {MONTHS[selectedMonth]}
                  </span>
                  <ChevronDown className="h-[12px] w-[12px] text-[#F0F1F5]" />
                </button>
                {showMonthDropdown && (
                  <div className="absolute top-full right-0 z-50 mt-1 max-h-[200px] overflow-y-auto rounded-[8px] border border-[#3F475A] bg-[#1B1E25] p-[4px]">
                    {MONTHS.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(index)
                          setShowMonthDropdown(false)
                        }}
                        className="block w-full px-[8px] py-[4px] text-left text-[14px] font-semibold text-[#F0F1F5] hover:bg-[#3F475A]"
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Weekdays */}
            <div className="flex w-full">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="flex h-[32px] w-[40px] items-center justify-center"
                >
                  <span className="text-[14px] font-semibold text-[#545F78]">
                    {day}
                  </span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-[4px]">
              {renderCalendarDays()}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="h-full w-[1px] bg-[#2B3139]" />

          {/* Time Picker */}
          <div className="flex flex-col items-end gap-[16px] p-[16px]">
            {/* Header */}
            <div className="flex w-full items-center justify-center gap-[128px]">
              <span className="text-[14px] font-semibold text-[#F0F1F5]">
                {formatSelectedTime()}
              </span>
            </div>

            {/* Divider */}
            <div className="h-[1px] w-full bg-[#3F475A]" />

            {/* Time Columns */}
            <div className="flex gap-[8px]">
              {/* Hour */}
              <TimeColumn
                values={Array.from({ length: 12 }, (_, i) =>
                  i === 0 ? 12 : i
                )}
                selectedValue={selectedHour}
                onSelect={setSelectedHour}
                format={(v) => String(v).padStart(2, '0')}
              />

              {/* Minute */}
              <TimeColumn
                values={Array.from({ length: 60 }, (_, i) => i)}
                selectedValue={selectedMinute}
                onSelect={setSelectedMinute}
                format={(v) => String(v).padStart(2, '0')}
              />

              {/* Second */}
              <TimeColumn
                values={Array.from({ length: 60 }, (_, i) => i)}
                selectedValue={selectedSecond}
                onSelect={setSelectedSecond}
                format={(v) => String(v).padStart(2, '0')}
              />

              {/* AM/PM */}
              <div className="flex flex-col gap-[4px]">
                <button
                  onClick={() => setSelectedAmPm('AM')}
                  className={cn(
                    'flex h-[40px] w-[40px] items-center justify-center rounded-[4px] transition-colors',
                    selectedAmPm === 'AM'
                      ? 'bg-[#BFFB06] text-[#0A0C0F]'
                      : 'text-[#F0F1F5] hover:bg-[#3F475A]'
                  )}
                >
                  <span className="text-[14px] font-semibold">AM</span>
                </button>
                <button
                  onClick={() => setSelectedAmPm('PM')}
                  className={cn(
                    'flex h-[40px] w-[40px] items-center justify-center rounded-[4px] transition-colors',
                    selectedAmPm === 'PM'
                      ? 'bg-[#BFFB06] text-[#0A0C0F]'
                      : 'text-[#F0F1F5] hover:bg-[#3F475A]'
                  )}
                >
                  <span className="text-[14px] font-semibold">PM</span>
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex w-full gap-[8px]">
              <button
                onClick={handleCancel}
                className="flex h-[32px] w-[100px] items-center justify-center rounded-[4px] bg-[#3F475A] text-[14px] font-semibold text-[#F0F1F5] transition-colors hover:bg-[#545F78]"
              >
                Cancel
              </button>
              <button
                onClick={handleOK}
                className="flex h-[32px] w-[100px] items-center justify-center rounded-[4px] bg-[#BFFB06] text-[14px] font-semibold text-[#0A0C0F] transition-colors hover:bg-[]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
