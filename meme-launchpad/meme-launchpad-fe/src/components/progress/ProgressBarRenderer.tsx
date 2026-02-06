import React from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { TokenListItem } from '@/api/schemas/token.schema'
import { LAUNCH_MODE } from '@/enums/tokens'
import { formatNumber, formatPercentage } from '@/utils/format'

interface ProgressBarRendererProps {
  token: TokenListItem
  className?: string
}

/**
 * 格式化锁仓时间
 * @param lockupTime - 锁仓时间（字符串或数字）
 * @returns 格式化后的时间字符串
 */
const formatLockupTime = (lockupTime: string | number) => {
  if (!lockupTime || lockupTime === '') return ''

  const time =
    typeof lockupTime === 'string' ? parseFloat(lockupTime) : lockupTime

  if (time >= 1) {
    return `${time}D`
  } else {
    const hours = Math.round(time * 24)
    return `${hours}H`
  }
}

/**
 * 进度条渲染器组件
 * 根据不同的 launchMode 渲染不同类型的进度条
 */
export function ProgressBarRenderer({
  token,
  className = '',
}: ProgressBarRendererProps) {
  const t = useTranslations('trendingTokens')

  const renderProgressBar = () => {
    switch (token.launchMode) {
      case LAUNCH_MODE.IDO:
        return (
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {token.targetBnb} <span className="text-xs">BNB</span>
              </h3>
              <span className="text-xs text-[]">
                {formatPercentage(token.progressPct)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 text-xs text-white">
              <span className="mr-auto">
                {token.preUserLimit == '0'
                  ? t('openSale')
                  : t('limit') + token.preUserLimit}
              </span>
              <Image src="/icons/lock.svg" alt="Limit" width={10} height={10} />
              <span>{formatLockupTime(token.lockupTime)}</span>
            </div>
            <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[#474D57]/20">
              <div
                className="h-full rounded-full bg-[] transition-all duration-300"
                style={{ width: `${formatPercentage(token.progressPct)}` }}
              />
            </div>
          </div>
        )

      // TODO: burn 进度条
      case LAUNCH_MODE.BURN:
        return (
          <div>
            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center">
                <Image
                  src="/icons/burn.svg"
                  alt="Burn"
                  width={12}
                  height={12}
                />
                <span className="text-[#FF2655]">6500</span>/10000BNB
              </div>
              <div className="flex items-center">
                <span className="text-[#FFC700]">90%</span> Burned
              </div>
            </div>
            <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[#474D57]/20">
              <div
                className="h-full rounded-full bg-[] transition-all duration-300"
                style={{ width: `${formatPercentage(token.progressPct)}` }}
              />
            </div>
          </div>
        )

      default: // IMMEDIATE and any other case
        return (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm leading-5 font-bold text-[#F0F1F5]">
                {formatNumber(token.marketCap || 0)}
              </span>
              <span className="text-xs leading-5 font-normal text-white/80">
                <span className="text-[]">
                  {formatPercentage(token.progressPct)}
                </span>{' '}
                / +{token.priceChangePercentage24H}%
              </span>
            </div>
            <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[#474D57]/20">
              <div
                className="h-full rounded-full bg-[] transition-all duration-300"
                style={{ width: `${formatPercentage(token.progressPct)}` }}
              />
            </div>
          </div>
        )
    }
  }

  return <div className={className}>{renderProgressBar()}</div>
}

/**
 * 简化的进度条组件
 * 用于不需要复杂逻辑的场景
 */
export function SimpleProgressBar({
  percentage,
  className = '',
  showPercentage = true,
  showVolume = false,
  volume = 0,
}: {
  percentage: number
  className?: string
  showPercentage?: boolean
  showVolume?: boolean
  volume?: number
}) {
  return (
    <div className={className}>
      {(showPercentage || showVolume) && (
        <div className="flex items-center justify-end">
          {showVolume && (
            <span className="text-xs text-white">
              {formatNumber(volume, 2, '$')}
            </span>
          )}
          {showPercentage && (
            <span className="ml-auto text-xs text-[]">
              {formatPercentage(percentage)}
            </span>
          )}
        </div>
      )}
      <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[#474D57]/20">
        <div
          className="h-full rounded-full bg-[] transition-all duration-300"
          style={{ width: `${formatPercentage(percentage)}` }}
        />
      </div>
    </div>
  )
}
