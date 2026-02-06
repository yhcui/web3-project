'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface BondingCurveProgressProps {
  className?: string
  progress?: number // 0-100
  raised?: number // BNB raised
  target?: number // Target BNB amount
  tokensRemaining?: string // Tokens left in curve
  marketCapTarget?: string // Market cap target for liquidity deployment
}

export function BondingCurveProgress({
  className,
  progress = 80,
  raised = 160,
  target = 200,
  tokensRemaining = 'y',
  marketCapTarget = 'xxxxx',
}: BondingCurveProgressProps) {
  const t = useTranslations('Token.BondingCurve')

  return (
    <div className={cn('bg-[#181A20] p-4', className)}>
      {/* Header with title and percentage */}
      <div className="mb-[9px] flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">{t('title')}</h3>
        <span className="text-sm font-bold text-[#BFFB06]">
          {progress.toFixed(2)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-3 h-2 w-full overflow-hidden rounded-[100px] bg-[#C1BC73]/25">
        {/* Filled portion with gradient - 238px max width out of 288px total */}
        <div
          className="absolute top-0 left-0 h-full rounded-[100px] bg-gradient-to-l from-[#F6E084] to-[]"
          style={{
            width: `${Math.min(progress, 100) * 0.8264}%`, // 238/288 = 0.8264 max width ratio
          }}
        />
      </div>

      {/* First description text */}
      <p className="mb-2 text-xs leading-[20px] text-[#B7BDC6]">
        {t('description1', {
          tokensRemaining,
          raised: raised.toString(),
          target: target.toString(),
        })}
      </p>

      {/* Second description text */}
      <p className="text-xs leading-[20px] text-[#B7BDC6]">
        {t('description2', {
          marketCapTarget,
        })}
      </p>
    </div>
  )
}
