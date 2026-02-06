'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface TrendingToken {
  symbol: string
  change: number
}

interface TrendingTickerProps {
  className?: string
}

export function TrendingTicker({ className }: TrendingTickerProps) {
  const t = useTranslations('Token.TrendingTicker')

  // Mock data for trending tokens - this would come from an API
  const trendingTokens: TrendingToken[] = [
    { symbol: 'BNB', change: 747.33 },
    { symbol: 'DSASDFG', change: 7.21 },
    { symbol: 'DSASDFG', change: 7.21 },
    { symbol: 'DSASDFG', change: -7.21 },
    { symbol: 'DSASDFG', change: 7.21 },
    { symbol: 'DSASG', change: -7.21 },
    { symbol: 'DSASDFG', change: 7.21 },
    { symbol: 'DSASDFG', change: 7.21 },
    { symbol: 'DSASDFG', change: 7.21 },
    { symbol: 'DSASG', change: -7.21 },
    { symbol: 'DSASG', change: -7.21 },
    { symbol: 'DSASG', change: -7.21 },
    { symbol: 'DSASG', change: -7.21 },
    { symbol: 'DSASG', change: -7.21 },
  ]

  // Duplicate tokens for seamless scrolling
  const scrollingTokens = [
    ...trendingTokens,
    ...trendingTokens,
    ...trendingTokens,
  ]

  return (
    <div
      className={cn(
        'relative h-9 w-full max-w-[1432px] overflow-hidden rounded-lg bg-[#181A20]',
        className
      )}
    >
      <div className="animate-scroll-left flex items-center gap-3 py-2 pl-4 whitespace-nowrap">
        {scrollingTokens.map((token, index) => (
          <span
            key={index}
            className="font-din-pro inline-flex items-center text-xs leading-5 text-white"
          >
            {token.symbol}{' '}
            <span
              className={cn(
                token.change >= 0 ? 'text-[#02C076]' : 'text-[#F84638]'
              )}
            >
              {token.change >= 0 ? '+' : ''}
              {token.change}%
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
