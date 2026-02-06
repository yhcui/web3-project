'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface PeriodicBurningProps {
  className?: string
  totalBurnAmount?: string // Total BNB burned
  burnedPercentage?: number // 0-100
  totalBurnPeriod?: string // Total period
  burnInterval?: string // Interval between burns
  remainingLockPeriod?: string // Remaining lock time
  singleBurnPercentage?: string // Percentage per burn
  singleBurnApprox?: string // Approximate BNB per burn
  singleBurnAmount?: string // Exact BNB per burn
}

export function PeriodicBurning({
  className,
  totalBurnAmount = '7 BNB',
  burnedPercentage = 25,
  totalBurnPeriod = '777.22',
  burnInterval = '10',
  remainingLockPeriod = '7',
  singleBurnPercentage = '1.20',
  singleBurnApprox = '60 BNB',
  singleBurnAmount = '2 BNB',
}: PeriodicBurningProps) {
  const t = useTranslations('Token.PeriodicBurning')

  return (
    <div className={cn('bg-[#181A20] p-4', className)}>
      {/* Header */}
      <div className="mb-[14px]">
        <h3 className="text-sm font-bold text-white">{t('title')}</h3>
      </div>

      {/* Total Burn Amount */}
      <div className="mb-[9px] flex items-center justify-between">
        <span className="text-xs text-[#798391]">{t('totalBurnAmount')}</span>
        <span className="text-xs text-white">{totalBurnAmount}</span>
      </div>

      {/* Burned Percentage with Progress Bar */}
      <div className="mb-[10px] flex items-center justify-between">
        <span className="text-xs text-[#798391]">{t('burnedPercentage')}</span>
        <div className="flex w-[123px] items-center">
          {/* Progress Bar Container - 100px width for bar, 23px for text */}
          <div className="relative mr-2 h-1 w-[100px]">
            {/* Background Bar */}
            <div className="absolute inset-0 rounded-[14px] bg-[#262B32]" />
            {/* Progress Fill - 36px at 25% */}
            <div
              className="absolute top-0 left-0 h-full rounded-[99px] bg-[]"
              style={{
                width: `${Math.min(burnedPercentage * 1.44, 100)}px`, // 36px at 25% = 1.44px per percent
              }}
            />
          </div>
          {/* Percentage Text */}
          <span className="w-[23px] text-right text-xs text-[]">
            {burnedPercentage}%
          </span>
        </div>
      </div>

      {/* Total Burn Period */}
      <div className="mb-[10px] flex items-center justify-between">
        <span className="text-xs text-[#798391]">{t('totalBurnPeriod')}</span>
        <span className="text-xs text-white">{totalBurnPeriod}</span>
      </div>

      {/* Remaining Lock Period */}
      <div className="mb-[10px] flex items-center justify-between">
        <span className="text-xs text-[#798391]">
          {t('remainingLockPeriod')}
        </span>
        <span className="text-xs text-white">
          {t('days', { count: remainingLockPeriod })}
        </span>
      </div>

      {/* Burn Interval */}
      <div className="mb-[10px] flex items-center justify-between">
        <span className="text-xs text-[#798391]">{t('burnInterval')}</span>
        <span className="text-xs text-white">
          {t('minutes', { count: burnInterval })}
        </span>
      </div>

      {/* Single Burn Percentage */}
      <div className="mb-[10px] flex items-center justify-between">
        <span className="text-xs text-[#798391]">
          {t('singleBurnPercentage')}
        </span>
        <span className="text-xs text-white">
          {singleBurnPercentage}% ≈ {singleBurnApprox}
        </span>
      </div>

      {/* Single Burn Amount */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#798391]">{t('singleBurnAmount')}</span>
        <span className="text-xs text-white">{singleBurnAmount}</span>
      </div>
    </div>
  )
}
