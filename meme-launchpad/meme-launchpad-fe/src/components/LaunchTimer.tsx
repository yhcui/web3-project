'use client'

import { useState, useEffect } from 'react'
import { useCountdown } from '@/hooks/useCountdownStore'
import type { LaunchMode } from '@/types/token'
import useIsMobile from '@/hooks/use-is-mobile'
import dayjs, { formatToUTC } from '@/utils/tools'
import { LAUNCH_MODE } from '@/enums/tokens'

interface LaunchTimerProps {
  launchTime: number // unix 秒级
  launchMode?: LaunchMode
}

export function LaunchTimer({ launchTime, launchMode }: LaunchTimerProps) {
  const [isClient, setIsClient] = useState(false)
  const isMobile = useIsMobile()
  useEffect(() => setIsClient(true), [])

  const isFutureTime = launchTime > dayjs().unix()
  const targetDate =
    isFutureTime && isClient ? new Date(launchTime * 1000) : null
  const countdown = useCountdown(targetDate)

  const isScheduledLaunch = launchMode === LAUNCH_MODE.IDO

  return (
    <div className="relative h-full w-full">
      {/* Gradient bg */}
      <div
        className={`absolute inset-0 bg-gradient-to-r opacity-10 ${
          isScheduledLaunch
            ? 'from-[#26231C6E] to-[#FFD010]'
            : 'from-[#11131970] to-[#BBC6EA]'
        }`}
      />
      <div
        className={`absolute inset-0 flex items-center justify-end gap-2 ${
          isScheduledLaunch ? 'pr-4 md:pr-[7px]' : 'pr-[7px]'
        }`}
      >
        {isFutureTime ? (
          !isClient ? (
            <CountdownPlaceholder isMobile={isMobile} />
          ) : (
            <CountdownDisplay countdown={countdown} isMobile={isMobile} />
          )
        ) : (
          <FormattedTime launchTime={launchTime} />
        )}
      </div>
    </div>
  )
}

function CountdownDisplay({
  countdown,
  isMobile,
}: {
  countdown: any
  isMobile: boolean
}) {
  if (!countdown) return <CountdownPlaceholder isMobile={isMobile} />
  const { hours, minutes, seconds } = countdown
  const block = (val: number, label: string) =>
    isMobile ? (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[18px] font-bold text-[]">
          {val.toString().padStart(2, '0')}
        </span>
        <span className="text-xs text-white/50">{label}</span>
      </div>
    ) : (
      <>
        <span className="text-[18px] font-bold text-[]">
          {val.toString().padStart(2, '0')}
        </span>
        <span className="text-xs text-white/50">{label}</span>
      </>
    )

  return (
    <>
      {block(hours, 'H')}
      {block(minutes, 'M')}
      {block(seconds, 'S')}
    </>
  )
}

function CountdownPlaceholder({ isMobile }: { isMobile: boolean }) {
  return isMobile ? (
    <>
      <div>
        <span className="text-[18px] font-bold text-[]">--</span>
        <span className="text-xs text-white/50">H</span>
      </div>
      <div>
        <span className="text-[18px] font-bold text-[]">--</span>
        <span className="text-xs text-white/50">M</span>
      </div>
      <div>
        <span className="text-[18px] font-bold text-[]">--</span>
        <span className="text-xs text-white/50">S</span>
      </div>
    </>
  ) : (
    <>
      <span className="text-[18px] font-bold text-[]">--</span>
      <span className="text-xs text-white/50">H</span>
      <span className="text-[18px] font-bold text-[]">--</span>
      <span className="text-xs text-white/50">M</span>
      <span className="text-[18px] font-bold text-[]">--</span>
      <span className="ml-1 text-xs text-white/50">S</span>
    </>
  )
}

function FormattedTime({ launchTime }: { launchTime: number }) {
  return (
    <>
      <span className="hidden text-[12px] text-white/70 md:inline">
        {formatToUTC(launchTime, 2)}
      </span>
      <span className="block text-[12px] text-white/70 md:hidden">
        {formatToUTC(launchTime, 2)}
      </span>
    </>
  )
}
