'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts'
import { Button } from '@/components/ui/button'
import { TransactionList } from './TransactionList'
import { TokenInfo } from './TokenInfo'
import {
  useKlineHistoryWithCursor,
  type KlineInterval,
  type KlineChartData,
} from '@/api/endpoints/kline'
import { Skeleton } from '@/components/ui/skeleton'
import { useKlineData } from '@/hooks/useTokenWebSocket'
import type { KlineUpdate } from '@/lib/websocket/kline/schemas'
import { useTokenDetailNew } from '@/api/endpoints/trade'
import { TVChartContainer } from '@/components/TVChartContainer'
import { useTokenData } from '@/providers/TokenDataProvider'
import type { TokenDetail } from '@/api/schemas/trade.schema'

interface CenterPanelProps {
  tokenAddress: string
  tokenId?: number
  className?: string
}

// Map UI intervals to API intervals
const intervalMapping: Record<string, KlineInterval> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
}

// Countdown component
interface CountdownProps {
  launchTime: number
  tokenSymbol?: string
  tokenName?: string
  onJoinClick?: () => void
}

function TokenCountdown({
  launchTime,
  tokenSymbol = 'TOKEN',
  tokenName = 'TOKEN/BNB',
  onJoinClick,
}: CountdownProps) {
  const t = useTranslations('Token.CenterPanel')
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000) // Current time in seconds
      const difference = launchTime - now

      if (difference > 0) {
        const hours = Math.floor(difference / 3600)
        const minutes = Math.floor((difference % 3600) / 60)
        const seconds = difference % 60

        setTimeLeft({ hours, minutes, seconds })
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      }
    }

    // Calculate immediately
    calculateTimeLeft()

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [launchTime])

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, '0')
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-center bg-[#181A20]">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Token info */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="font-din-pro text-2xl font-bold text-white">
              {tokenName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="h-5 w-5 text-[#F69414]" />
            <span className="font-din-pro text-lg text-[#F69414]">94</span>
          </div>
        </div>

        {/* Countdown timer */}
        <div className="relative flex items-center gap-2">
          {/* Background gradient bar */}
          <div
            className="absolute inset-x-0 h-[67px] opacity-10"
            style={{
              background:
                'linear-gradient(90deg, rgba(38, 35, 28, 0.43) 0%, rgba(255, 208, 16, 1) 50%, rgba(38, 35, 28, 0.43) 100%)',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          {/* Hours */}
          <div className="flex items-center gap-2">
            <div className="flex h-[60px] w-[72px] items-center justify-center rounded-lg">
              <span className="font-din-pro text-[40px] leading-[48px] font-bold text-[]">
                {formatNumber(timeLeft.hours)}
              </span>
            </div>
            <span className="font-din-pro text-[32px] leading-[48px] text-[#9197AA]">
              H
            </span>
          </div>

          {/* Minutes */}
          <div className="flex items-center gap-2">
            <div className="flex h-[60px] w-[72px] items-center justify-center rounded-lg">
              <span className="font-din-pro text-[40px] leading-[48px] font-bold text-[]">
                {formatNumber(timeLeft.minutes)}
              </span>
            </div>
            <span className="font-din-pro text-[32px] leading-[48px] text-[#9197AA]">
              M
            </span>
          </div>

          {/* Seconds */}
          <div className="flex items-center gap-2">
            <div className="flex h-[60px] w-[72px] items-center justify-center rounded-lg">
              <span className="font-din-pro text-[40px] leading-[48px] font-bold text-[]">
                {formatNumber(timeLeft.seconds)}
              </span>
            </div>
            <span className="font-din-pro text-[32px] leading-[48px] text-[#9197AA]">
              S
            </span>
          </div>
        </div>

        {/* Action button */}
        <Button
          onClick={onJoinClick}
          className="font-din-pro h-10 w-[181px] rounded-md bg-[#BFFB06] px-5 py-2 text-base font-normal text-black hover:bg-[#BFFB06]/90"
        >
          {t('joinNow')}
        </Button>

        {/* Info text */}
        <p className="font-din-pro text-base text-[#798391]">
          {t('willOpenAfterCountdown')}
        </p>
      </div>
    </div>
  )
}

// Helper function to convert number to subscript
const toSubscript = (num: number): string => {
  const subscriptMap: { [key: string]: string } = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉',
  }
  return num
    .toString()
    .split('')
    .map((digit) => subscriptMap[digit] || digit)
    .join('')
}

// Helper function to format price with subscript notation for zeros (limited to 3 significant digits)
const formatPrice = (price: number | undefined): string => {
  if (!price || price === 0) return '0'

  // For numbers >= 1, limit to 3 decimal places
  if (price >= 1) {
    let priceStr = price.toFixed(3)
    // Remove trailing zeros
    priceStr = priceStr.replace(/\.?0+$/, '')
    return priceStr
  }

  // Convert to string to avoid scientific notation
  let priceStr = price.toString()

  // Check if it's in scientific notation
  if (priceStr.includes('e')) {
    const parts = priceStr.split('e')
    const exponent = parseInt(parts[1])

    if (exponent < 0) {
      // For very small numbers, calculate decimals needed for 3 significant digits
      const decimals = Math.abs(exponent) + 3
      priceStr = price.toFixed(Math.min(decimals, 20))
    } else {
      // For large numbers
      priceStr = price.toFixed(3)
    }
  } else {
    // For numbers < 1, find leading zeros and limit to 3 significant digits
    if (priceStr.includes('.')) {
      const [intPart, decPart] = priceStr.split('.')
      const leadingZeros = decPart.match(/^0+/)
      const leadingZeroCount = leadingZeros ? leadingZeros[0].length : 0

      // Get the significant part after leading zeros
      const significantPart = decPart.substring(leadingZeroCount)
      // Limit to 3 significant digits
      const limitedSignificant = significantPart.substring(0, 3)

      // Reconstruct the decimal part
      const newDecPart = '0'.repeat(leadingZeroCount) + limitedSignificant
      priceStr = `${intPart}.${newDecPart}`
    } else {
      priceStr = price.toFixed(3)
    }
  }

  // Remove trailing zeros
  priceStr = priceStr.replace(/\.?0+$/, '')

  // Check if we need to use subscript notation
  if (priceStr.includes('.')) {
    const parts = priceStr.split('.')
    const decimalPart = parts[1]

    // Count leading zeros in decimal part
    const leadingZeros = decimalPart.match(/^0+/)
    if (leadingZeros && leadingZeros[0].length >= 2) {
      // Use subscript notation for multiple zeros
      const zeroCount = leadingZeros[0].length
      const significantDigits = decimalPart.substring(zeroCount)
      return `${parts[0]}.0${toSubscript(zeroCount)}${significantDigits}`
    }
  }

  return priceStr
}

// Transform kline data to TradingView format with proper time validation
const transformToTradingViewFormat = (data: KlineChartData[]) => {
  return data
    .map((candle) => {
      // Ensure time is a valid Unix timestamp in seconds
      let timestamp = candle.time

      // Convert from milliseconds to seconds if necessary
      if (timestamp > 1e12) {
        timestamp = Math.floor(timestamp / 1000)
      }

      // Validate timestamp is reasonable (after 2020 and before 2050)
      if (timestamp < 1577836800 || timestamp > 2524608000) {
        console.warn(
          'Invalid timestamp detected:',
          timestamp,
          'original:',
          candle.time
        )
        return null
      }

      return {
        time: timestamp, // Unix timestamp in seconds
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }
    })
    .filter((candle): candle is NonNullable<typeof candle> => candle !== null)
    .sort((a, b) => a.time - b.time) // Ensure ascending time order
}

// Calculate MA (Moving Average) data with proper time formatting
const calculateMAData = (candleData: KlineChartData[], period: number) => {
  const maData = []

  for (let i = period - 1; i < candleData.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += candleData[i - j].close
    }

    // Ensure time format consistency
    let timestamp = candleData[i].time
    if (timestamp > 1e12) {
      timestamp = Math.floor(timestamp / 1000)
    }

    maData.push({
      time: timestamp,
      value: sum / period,
    })
  }

  return maData
}

// Transform volume data with transparency and proper time formatting
const transformVolumeData = (data: KlineChartData[]) => {
  return data.map((candle, index, array) => {
    // Ensure time format consistency
    let timestamp = candle.time
    if (timestamp > 1e12) {
      timestamp = Math.floor(timestamp / 1000)
    }

    return {
      time: timestamp,
      value: candle.volume,
      color:
        index > 0 && candle.close >= array[index - 1].close
          ? 'rgba(46, 189, 133, 0.5)' // Green with 50% opacity
          : 'rgba(246, 70, 93, 0.5)', // Red with 50% opacity
    }
  })
}

// Calculate optimal minMove for price scale based on price range
const calculateOptimalMinMove = (klineData: KlineChartData[]) => {
  if (!klineData || klineData.length === 0) return 0.01

  // Find the price range
  let minPrice = Infinity
  let maxPrice = -Infinity

  klineData.forEach((candle) => {
    minPrice = Math.min(minPrice, candle.low)
    maxPrice = Math.max(maxPrice, candle.high)
  })

  // Calculate appropriate minMove based on price magnitude
  const priceRange = maxPrice - minPrice
  const avgPrice = (minPrice + maxPrice) / 2

  if (avgPrice < 0.000001) {
    // For very small prices (< 0.000001), use very fine granularity
    return Math.pow(10, Math.floor(Math.log10(avgPrice)) - 2)
  } else if (avgPrice < 0.0001) {
    // For small prices (< 0.0001), use fine granularity
    return Math.pow(10, Math.floor(Math.log10(avgPrice)) - 1)
  } else if (avgPrice < 0.01) {
    // For medium-small prices (< 0.01), use moderate granularity
    return Math.pow(10, Math.floor(Math.log10(avgPrice)) - 1)
  } else if (avgPrice < 1) {
    // For prices < 1, use standard granularity
    return 0.0001
  } else {
    // For prices >= 1, use coarser granularity
    return 0.01
  }
}

export function CenterPanel({
  tokenAddress,
  tokenId,
  className,
}: CenterPanelProps) {
  const t = useTranslations('Token.CenterPanel')
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<any>(null)
  const ma7SeriesRef = useRef<any>(null)
  const ma25SeriesRef = useRef<any>(null)
  const ma99SeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const chartInitializedRef = useRef<boolean>(false)
  const crosshairHandlerRef = useRef<((param: any) => void) | null>(null)
  const { tokenData } = useTokenData()

  const [activeTab, setActiveTab] = useState('priceChart')
  const [chartType] = useState<'basic' | 'tradingview'>('tradingview')
  const [timeInterval, setTimeInterval] = useState('15m')
  const [hoveredCandle, setHoveredCandle] = useState<{
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
    change: number
  } | null>(null)

  // Fetch token details to get launchTime
  const { data: tokenDetail } = useTokenDetailNew({ tokenAddress })

  // Check if token has launched
  const isTokenLaunched = useMemo(() => {
    if (!tokenDetail?.data?.launchTime) return true // Default to showing chart if no launch time

    const now = Math.floor(Date.now() / 1000) // Current time in seconds
    return tokenDetail.data.launchTime <= now
  }, [tokenDetail])

  // Fetch kline data from API using cursor-based approach
  // Note: Time range calculation removed as cursor-based API handles data fetching server-side
  const {
    data: klineResponse,
    isLoading,
    error,
  } = useKlineHistoryWithCursor({
    tokenAddr: tokenAddress,
    interval: intervalMapping[timeInterval],
    // No cursor for initial load - will get latest data
  })

  // Extract chart data from response
  const klineData = klineResponse?.chartData

  // Memoize the callback to prevent infinite re-renders
  const handleKlineUpdate = useCallback(
    (data: KlineUpdate['data']) => {
      // Only update if chart and series are ready
      if (!chartRef.current || !candlestickSeriesRef.current) {
        return
      }

      // Handle real-time kline updates for the chart
      if (data.interval === intervalMapping[timeInterval]) {
        try {
          // Ensure proper time format for real-time updates
          let timestamp = data.data.t
          if (timestamp > 1e12) {
            timestamp = Math.floor(timestamp / 1000)
          }

          const newCandle = {
            time: timestamp,
            open: parseFloat(data.data.o),
            high: parseFloat(data.data.h),
            low: parseFloat(data.data.l),
            close: parseFloat(data.data.c),
          }

          // Update or append the candle
          candlestickSeriesRef.current.update(newCandle)

          // Update volume if series exists
          if (volumeSeriesRef.current) {
            const volumeData = {
              time: timestamp,
              value: parseFloat(data.data.v),
              color:
                parseFloat(data.data.c) >= parseFloat(data.data.o)
                  ? 'rgba(46, 189, 133, 0.5)' // Green with 50% opacity
                  : 'rgba(246, 70, 93, 0.5)', // Red with 50% opacity
            }
            volumeSeriesRef.current.update(volumeData)
          }
        } catch (error) {
          console.error(
            '[CenterPanel] Error updating chart with kline data:',
            error
          )
        }
      }
    },
    [timeInterval]
  )

  // Subscribe to real-time kline updates only when chart is active and visible
  // useKlineData(
  //   tokenAddress,
  //   intervalMapping[timeInterval] || '1m',
  //   activeTab === 'priceChart' && chartType === 'tradingview' && isTokenLaunched
  //     ? handleKlineUpdate
  //     : undefined
  // )

  const tabs = [
    { id: 'priceChart', label: t('tabs.priceChart'), active: true },
    { id: 'tokenInfo', label: t('tabs.tokenInfo') },
    { id: 'tradingData', label: t('tabs.tradingData') },
    { id: 'airdropTasks', label: t('tabs.airdropTasks'), hasIcon: true },
    { id: 'fundVoting', label: t('tabs.fundVoting') },
  ]

  const timeIntervals = [
    { id: '1m', label: '1m' },
    { id: '5m', label: '5m' },
    { id: '15m', label: '15m' },
    { id: '1h', label: '1h' },
    { id: '4h', label: '4h' },
    { id: '1d', label: '1d' },
  ]

  // Initialize chart
  useEffect(() => {
    if (
      chartContainerRef.current &&
      !chartRef.current &&
      chartType === 'tradingview'
    ) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#181A20' },
          textColor: '#848E9C',
          fontSize: 11,
        },
        grid: {
          vertLines: {
            color: 'rgba(43, 49, 57, 0.5)',
            style: 1,
            visible: true,
          },
          horzLines: {
            color: 'rgba(43, 49, 57, 0.5)',
            style: 1,
            visible: true,
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: '#848E9C',
            width: 1,
            style: 3,
            labelVisible: true,
          },
          horzLine: {
            color: '#848E9C',
            width: 1,
            style: 3,
            labelVisible: true,
          },
        },
        width: chartContainerRef.current.clientWidth,
        height: 442,
        rightPriceScale: {
          borderColor: '#2B3139',
          borderVisible: false,
          alignLabels: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.2, // Leave space for volume
          },
        },
        timeScale: {
          borderColor: '#2B3139',
          borderVisible: false,
          timeVisible: true,
          secondsVisible: false,
        },
      })

      // Add candlestick series with custom price formatter
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#2EBD85',
        downColor: '#F6465D',
        borderUpColor: '#2EBD85',
        borderDownColor: '#F6465D',
        wickUpColor: '#2EBD85',
        wickDownColor: '#F6465D',
        borderVisible: true,
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => {
            // Use the same formatPrice function logic
            return formatPrice(price)
          },
        },
      })
      candlestickSeriesRef.current = candlestickSeries

      // Add MA lines with proper styling
      const ma7Series = chart.addSeries(LineSeries, {
        color: '#F0B90B',
        lineWidth: 1,
        lineStyle: 0, // Solid line
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      })
      ma7SeriesRef.current = ma7Series

      const ma25Series = chart.addSeries(LineSeries, {
        color: '#EB40B5',
        lineWidth: 1,
        lineStyle: 0, // Solid line
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      })
      ma25SeriesRef.current = ma25Series

      const ma99Series = chart.addSeries(LineSeries, {
        color: '#71269C',
        lineWidth: 1,
        lineStyle: 0, // Solid line
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      })
      ma99SeriesRef.current = ma99Series

      // Add volume histogram with transparency
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        priceLineVisible: false,
        lastValueVisible: false,
      })
      volumeSeriesRef.current = volumeSeries

      // Configure volume price scale
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.85, // Volume takes up bottom 15% of chart
          bottom: 0,
        },
        borderVisible: false,
        visible: false,
      })

      // Ensure main price scale configuration
      chart.priceScale('right').applyOptions({
        borderColor: '#2B3139',
        borderVisible: false,
        entireTextOnly: false,
        alignLabels: true,
        mode: 0, // Normal price scale mode
      })

      // Set the chart layout to have narrower price scale
      chart.applyOptions({
        rightPriceScale: {
          autoScale: true,
          mode: 0,
          alignLabels: true,
          borderVisible: false,
          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
        },
        layout: {
          background: { type: ColorType.Solid, color: '#181A20' },
          textColor: '#848E9C',
          fontSize: 11,
        },
      })

      chartRef.current = chart
      chartInitializedRef.current = true

      // Subscribe to crosshair move events to track hovered candle
      const crosshairMoveHandler = (param: any) => {
        if (!param || !param.time || !param.seriesData) {
          // No candle is being hovered, clear the state
          setHoveredCandle(null)
          return
        }

        // Get the candlestick series data
        const candleData = param.seriesData.get(candlestickSeries) as any
        const volumeData = volumeSeries
          ? (param.seriesData.get(volumeSeries) as any)
          : null

        if (
          candleData &&
          typeof candleData === 'object' &&
          'open' in candleData
        ) {
          // Calculate change percentage if we have previous candle data
          let changePercent = 0
          const currentTime = param.time as number

          // Find the previous candle in the data
          const allData = candlestickSeries.data() as any[]
          const currentIndex = allData.findIndex(
            (d: any) => d.time === currentTime
          )
          if (currentIndex > 0) {
            const previousCandle = allData[currentIndex - 1]
            if (previousCandle) {
              changePercent =
                ((candleData.close - previousCandle.close) /
                  previousCandle.close) *
                100
            }
          }

          setHoveredCandle({
            time: param.time as number,
            open: candleData.open,
            high: candleData.high,
            low: candleData.low,
            close: candleData.close,
            volume: volumeData?.value || 0,
            change: changePercent,
          })
        }
      }

      // Store handler reference for cleanup
      crosshairHandlerRef.current = crosshairMoveHandler
      chart.subscribeCrosshairMove(crosshairMoveHandler)

      // Use ResizeObserver instead of window resize for better performance
      if (chartContainerRef.current) {
        resizeObserverRef.current = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width } = entry.contentRect
            if (chartRef.current) {
              chartRef.current.applyOptions({ width })
            }
          }
        })
        resizeObserverRef.current.observe(chartContainerRef.current)
      }

      return () => {
        // Flag that chart is being cleaned up
        chartInitializedRef.current = false

        // Cleanup resize observer
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect()
          resizeObserverRef.current = null
        }

        // Unsubscribe from crosshair events
        if (chartRef.current && crosshairHandlerRef.current) {
          try {
            chartRef.current.unsubscribeCrosshairMove(crosshairHandlerRef.current)
          } catch (e) {
            // Handler might already be removed
          }
          crosshairHandlerRef.current = null
        }

        // Clear hovered candle state
        setHoveredCandle(null)

        // Remove all series from chart before clearing refs
        if (chartRef.current) {
          if (candlestickSeriesRef.current) {
            try {
              chartRef.current.removeSeries(candlestickSeriesRef.current)
            } catch (e) {
              // Series might already be removed
            }
          }
          if (ma7SeriesRef.current) {
            try {
              chartRef.current.removeSeries(ma7SeriesRef.current)
            } catch (e) {}
          }
          if (ma25SeriesRef.current) {
            try {
              chartRef.current.removeSeries(ma25SeriesRef.current)
            } catch (e) {}
          }
          if (ma99SeriesRef.current) {
            try {
              chartRef.current.removeSeries(ma99SeriesRef.current)
            } catch (e) {}
          }
          if (volumeSeriesRef.current) {
            try {
              chartRef.current.removeSeries(volumeSeriesRef.current)
            } catch (e) {}
          }
        }

        // Cleanup all series refs
        candlestickSeriesRef.current = null
        ma7SeriesRef.current = null
        ma25SeriesRef.current = null
        ma99SeriesRef.current = null
        volumeSeriesRef.current = null

        // Remove chart
        if (chart) {
          chart.remove()
        }
        chartRef.current = null
      }
    }
  }, [chartType])

  // Update chart data when kline data changes
  useEffect(() => {
    if (
      chartType === 'tradingview' &&
      klineData &&
      klineData.length > 0 &&
      chartInitializedRef.current
    ) {
      // Calculate optimal minMove for better grid spacing
      const optimalMinMove = calculateOptimalMinMove(klineData)

      // Update candlestick series with optimized price format
      if (candlestickSeriesRef.current) {
        const tradingViewData = transformToTradingViewFormat(klineData)
        candlestickSeriesRef.current.setData(tradingViewData)

        // Apply optimized price format for better grid spacing
        candlestickSeriesRef.current.applyOptions({
          priceFormat: {
            type: 'custom',
            formatter: (price: number) => {
              return formatPrice(price)
            },
            minMove: optimalMinMove,
          },
        })
      }

      // Update chart price scale for optimal grid lines
      if (chartRef.current) {
        chartRef.current.priceScale('right').applyOptions({
          borderColor: '#2B3139',
          borderVisible: false,
          entireTextOnly: false,
          alignLabels: true,
          mode: 0, // Normal price scale mode
          autoScale: true,
          // Configure tick marks for better grid spacing
          ticksVisible: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
        })
      }

      // Update MA lines
      if (ma7SeriesRef.current) {
        ma7SeriesRef.current.setData(calculateMAData(klineData, 7))
      }
      if (ma25SeriesRef.current) {
        ma25SeriesRef.current.setData(calculateMAData(klineData, 25))
      }
      if (ma99SeriesRef.current) {
        ma99SeriesRef.current.setData(calculateMAData(klineData, 99))
      }

      // Update volume data
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(transformVolumeData(klineData))
      }
    }
  }, [klineData, chartType])

  // Note: Chart cleanup is handled in the chart initialization useEffect
  // This separate cleanup effect is redundant and removed to prevent double cleanup

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Tab Navigation */}
      <div className="flex h-[42px] items-center justify-between rounded-t-lg border-b border-[#333B47] bg-[#181A20] px-4">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-1"
            >
              <span
                className={cn(
                  'text-sm leading-[22px] font-bold',
                  activeTab === tab.id ? 'text-white' : 'text-[#798391]'
                )}
              >
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="absolute -bottom-[1px] left-1/2 h-[3px] w-[14px] -translate-x-1/2 rounded-t-sm bg-[#BFFB06]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Container - All tabs remain in DOM, use CSS to show/hide */}
      <div className="relative flex-1">
        {/* Price Chart Tab */}
        <div
          className={cn(
            'flex h-full flex-col',
            activeTab !== 'priceChart' && 'hidden'
          )}
        >
          <div
            className={cn(
              'relative bg-[#181A20]',
              isTokenLaunched ? 'h-[442px]' : 'h-[482px]'
            )}
          >
            {!isTokenLaunched && tokenDetail?.data?.launchTime ? (
              // Countdown view - replaces only the chart area
              <TokenCountdown
                launchTime={tokenDetail.data.launchTime}
                tokenSymbol={tokenDetail.data.symbol}
                tokenName={`${tokenDetail.data.symbol}/BNB`}
                onJoinClick={() => {
                  // Handle join click - could navigate to swap/trade page
                  console.log('Join clicked')
                }}
              />
            ) : chartType === 'tradingview' ? (
              // Normal chart view
              <TVChartContainer tokenInfo={tokenData} />
            ) : (
              // Basic Chart Mode - Show placeholder
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-[#848E9C]">Basic chart view</p>
                  <p className="text-xs text-[#798391]">
                    Switch to Trading View for full chart
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Token Info Tab */}
        <div className={cn('h-full', activeTab !== 'tokenInfo' && 'hidden')}>
          <TokenInfo tokenAddress={tokenAddress} className="flex-1" />
        </div>

        {/* Trading Data Tab - Coming Soon */}
        <div
          className={cn(
            'flex h-[520px] items-center justify-center bg-[#181A20]',
            activeTab !== 'tradingData' && 'hidden'
          )}
        >
          <p className="text-[#848E9C]">Trading data coming soon</p>
        </div>

        {/* Airdrop Tasks Tab - Coming Soon */}
        <div
          className={cn(
            'flex h-[520px] items-center justify-center bg-[#181A20]',
            activeTab !== 'airdropTasks' && 'hidden'
          )}
        >
          <p className="text-[#848E9C]">Airdrop tasks coming soon</p>
        </div>

        {/* Fund Voting Tab - Coming Soon */}
        <div
          className={cn(
            'flex h-[520px] items-center justify-center bg-[#181A20]',
            activeTab !== 'fundVoting' && 'hidden'
          )}
        >
          <p className="text-[#848E9C]">Fund voting coming soon</p>
        </div>
      </div>

      {/* Transaction List - Always visible regardless of countdown */}
      <TransactionList
        tokenAddress={tokenAddress}
        tokenId={tokenId}
        className="mt-2"
      />
    </div>
  )
}
