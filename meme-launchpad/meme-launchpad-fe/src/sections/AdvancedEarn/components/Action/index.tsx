'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { useDragContext } from '../TokenType/dragContext'
import { useFiltersContext } from '../TokenType/filtersContext'
import { LAUNCH_MODE } from '@/enums/tokens'
import { VOLUME_STATISTICS_TYPE } from '@/enums/advanced'
import { useTranslations } from 'next-intl'

interface ActionProps {
  title: string
  icon: React.ReactNode
  id: string
  dragAttributes?: DraggableAttributes
  dragListeners?: SyntheticListenerMap
  isDragging?: boolean
}

function Action({ title, icon, id }: ActionProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [selectedTime, setSelectedTime] = useState('1d')
  const [selectedType, setSelectedType] = useState('normal')
  const [isMargin, setIsMargin] = useState(false)
  const [isSign, setIsSign] = useState(false)
  const [isPancakeV3, setIsPancakeV3] = useState(false)
  const [showPlay, setShowPlay] = useState(true)
  const [marketCapMin, setMarketCapMin] = useState('')
  const [marketCapMax, setMarketCapMax] = useState('')
  const [holdersMin, setHoldersMin] = useState('')
  const [holdersMax, setHoldersMax] = useState('')
  const [volumeMin, setVolumeMin] = useState('')
  const [volumeMax, setVolumeMax] = useState('')

  const { attributes, listeners, ref, isDragging } = useDragContext()
  const { setFilters } = useFiltersContext()
  const tAdvanced = useTranslations('advancedEarn')
  const tLaunch = useTranslations('launch')

  // 当开始拖拽时，自动关闭 Popover
  useEffect(() => {
    if (isDragging && showPopover) {
      setShowPopover(false)
    }
  }, [isDragging, showPopover])

  const toggleSearch = () => {
    setShowSearch(!showSearch)
  }

  // 时间筛选
  const timeValueMap = useMemo<Record<string, number>>(
    () => ({
      '5min': VOLUME_STATISTICS_TYPE.MIN_5,
      '30min': VOLUME_STATISTICS_TYPE.MIN_30,
      '1h': VOLUME_STATISTICS_TYPE.HOUR_1,
      '4h': VOLUME_STATISTICS_TYPE.HOUR_4,
      '1d': VOLUME_STATISTICS_TYPE.DAY_1,
      '7d': VOLUME_STATISTICS_TYPE.DAY_7,
    }),
    []
  )
  const getTimeValue = useCallback(
    (time: string) => timeValueMap[time],
    [timeValueMap]
  )

  // 发射类型
  const launchValueMap = useMemo<Record<string, number>>(
    () => ({
      normal: LAUNCH_MODE.IMMEDIATE,
      presale: LAUNCH_MODE.IMMEDIATE,
      ido: LAUNCH_MODE.IDO,
      burning: LAUNCH_MODE.BURN,
    }),
    []
  )
  const getLaunchValue = useCallback(
    (launchType: string) => launchValueMap[launchType],
    [launchValueMap]
  )

  // check 类型
  const switchValueMap = useMemo<Record<string, number>>(
    () => ({
      true: 1,
      false: 2,
    }),
    []
  )
  const getSwitchValue = useCallback(
    (switchType: boolean) => switchValueMap[switchType.toString()],
    [switchValueMap]
  )

  return (
    <section>
      <div className="flex items-center justify-between gap-2 border-b border-[#252832] p-3 md:border-none md:px-4 md:pt-4">
        <div className="flex items-center gap-1 text-base font-bold text-white">
          {icon}
          {title}
        </div>
        <div className="flex gap-[5px]">
          {/* Search */}
          <FilterButton
            onClick={toggleSearch}
            className={`${showSearch ? 'bg-[#252832] text-white' : 'text-[#656A79]'}`}
          >
            <Search size={14} />
          </FilterButton>

          {/* Filters */}
          <Popover open={showPopover} onOpenChange={setShowPopover}>
            <PopoverTrigger asChild>
              <FilterButton
                className={`${showPopover ? 'bg-[#252832] text-white' : 'text-[#656A79]'}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.1563 3.0875C13.0594 2.9 12.8672 2.78125 12.6563 2.78125H3.31253C3.1016 2.78125 2.90785 2.9 2.81097 3.0875C2.7141 3.275 2.73285 3.50156 2.85628 3.67344L6.29691 8.43281V13.0625C6.29691 13.2703 6.41253 13.4625 6.59691 13.5594C6.67972 13.6031 6.77035 13.625 6.85941 13.625C6.97035 13.625 7.08128 13.5922 7.1766 13.5266L9.44222 11.9812C9.59535 11.8766 9.68753 11.7031 9.68753 11.5172V8.4375L13.1125 3.67188C13.236 3.5 13.2532 3.275 13.1563 3.0875ZM11.5594 3.90625L11.0422 4.625H4.93285L4.41253 3.90625H11.5594ZM8.66878 7.92812C8.60003 8.02344 8.56253 8.13906 8.56253 8.25625V11.2188L7.42191 11.9969V8.25C7.42191 8.13125 7.38441 8.01562 7.31566 7.92031L5.74691 5.75H10.2344L8.66878 7.92812Z"
                    fill="currentColor"
                  />
                </svg>
              </FilterButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-full border-[#2B3139] bg-[#1a1d29] p-4 text-white md:w-[310px]"
              align="end"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-base">Trading Volume Time</p>
                  <div className="grid grid-cols-3 items-center gap-3">
                    {Object.keys(timeValueMap).map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`rounded-sm px-3 py-1 text-sm transition-colors ${
                          selectedTime === time
                            ? 'bg-[] text-black'
                            : 'border border-[#2B3139] text-[#C8C7D8] hover:text-white'
                        }`}
                      >
                        {tLaunch(`time.${time}`)}
                      </button>
                    ))}
                  </div>
                  <p className="text-base">Market Cap (USD)</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      onChange={(e) => setMarketCapMin(e.target.value)}
                      className="flex-1 border border-[#2B3139]"
                    />
                    <span>To</span>
                    <Input
                      type="text"
                      onChange={(e) => setMarketCapMax(e.target.value)}
                      className="flex-1 border border-[#2B3139]"
                    />
                  </div>
                  <p className="text-base">Volume (USD)</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      onChange={(e) => setVolumeMin(e.target.value)}
                      className="flex-1 border border-[#2B3139]"
                    />
                    <span>To</span>
                    <Input
                      type="text"
                      onChange={(e) => setVolumeMax(e.target.value)}
                      className="flex-1 border border-[#2B3139]"
                    />
                  </div>
                  <p className="text-base">Number of Holders</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      onChange={(e) => setHoldersMin(e.target.value)}
                      className="flex-1 border border-[#2B3139]"
                    />
                    <span>To</span>
                    <Input
                      type="text"
                      onChange={(e) => setHoldersMax(e.target.value)}
                      className="flex-1 border border-[#2B3139]"
                    />
                  </div>

                  <p className="text-base">Token Type</p>
                  <div className="grid grid-cols-4 items-center gap-2">
                    {Object.keys(launchValueMap).map((launchType) => (
                      <button
                        key={launchType}
                        onClick={() => setSelectedType(launchType)}
                        className={`rounded-sm p-1 text-sm font-bold transition-colors ${
                          selectedType === launchType
                            ? 'bg-[] text-black'
                            : 'border border-[#2B3139] text-[#C8C7D8] hover:text-white'
                        }`}
                      >
                        {tLaunch(`tabs.${launchType}`)}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <label
                      htmlFor="pancake-v3"
                      className="flex items-center gap-2"
                    >
                      <img
                        className="w-3"
                        src="/assets/images/comment-icon.svg"
                        alt=""
                      />
                      <span>Margin</span>
                    </label>
                    <Switch
                      id="Margin"
                      checked={isMargin}
                      onCheckedChange={setIsMargin}
                      className="border border-[#2B3139] data-[state=checked]:bg-[] data-[state=unchecked]:bg-[#2b3139]"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <label htmlFor="pancake-v3">Pancake V3</label>
                    <Switch
                      id="pancake-v3"
                      checked={isPancakeV3}
                      onCheckedChange={setIsPancakeV3}
                      className="border border-[#2B3139] data-[state=checked]:bg-[] data-[state=unchecked]:bg-[#2b3139]"
                    />
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-2">
                    <Button variant="secondary" className="flex-1">
                      Reset
                    </Button>
                    <Button
                      onClick={() => {
                        setFilters({
                          id,
                          volumeStatisticsType: getTimeValue(selectedTime),
                          tokenIssuanceMode: getLaunchValue(selectedType),
                          marketCapMin: marketCapMin,
                          marketCapMax: marketCapMax,
                          volumeMin: volumeMin,
                          volumeMax: volumeMax,
                          holdersMin: holdersMin,
                          holdersMax: holdersMax,
                          isTop10: getSwitchValue(isMargin),
                          isPancakeV3: getSwitchValue(isPancakeV3),
                        })
                        setShowPopover(false)
                      }}
                      className="flex-1 bg-[] text-black hover:bg-[]/70"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Play */}
          <FilterButton onClick={() => setShowPlay(!showPlay)}>
            {showPlay ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <rect
                  x="5"
                  y="5"
                  width="3"
                  height="10"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="12"
                  y="5"
                  width="3"
                  height="10"
                  rx="1"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="12"
                viewBox="0 0 9 12"
                fill="currentColor"
              >
                <path
                  d="M7.76867 5.1706C8.35712 5.56697 8.35712 6.43303 7.76867 6.8294L1.55866 11.0123C0.894435 11.4597 4.29847e-07 10.9838 4.64854e-07 10.1829L8.30535e-07 1.81709C8.65542e-07 1.01624 0.894435 0.540291 1.55866 0.987698L7.76867 5.1706Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </FilterButton>

          {/* Drag */}
          <FilterButton
            ref={ref}
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="transition-all duration-150"
            >
              <path
                d="M11 4V6H8V3H10L7 0L4 3H6V6H3V4L0 7L1 8L3 10V8H6V11H4L7 14L8 13L10 11H8V8H11V10L14 7L11 4Z"
                fill="currentColor"
              />
            </svg>
          </FilterButton>
        </div>
      </div>
      {showSearch && (
        <div className="mx-5 mt-2 box-border flex items-center rounded-[8px] border border-[#2B3139] px-3 focus-within:border-[]">
          <Search size={16} color="#656A79" />

          <Input
            className="border-0 bg-transparent px-2 text-sm text-[#C8C7D8] placeholder-[#6E6D7A]"
            placeholder="Search"
            type="text"
            autoFocus={true}
          />
        </div>
      )}
    </section>
  )
}

const FilterButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className = '', ...props }, ref) => (
  <button
    ref={ref}
    className={`flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#2B3139] bg-[#191B22] text-[#656A79] transition-colors hover:bg-[#252832] hover:text-white ${className}`}
    {...props}
  >
    {children}
  </button>
))
FilterButton.displayName = 'FilterButton'

export default React.memo(Action)
