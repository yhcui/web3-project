'use client'

import { useMemo, useState } from 'react'
import {
  useKlineHistoryWithCursor,
  KlineChartData,
  KlineInterval,
} from '@/api/endpoints/kline'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface KlineChartProps {
  tokenAddress: string
  tokenName?: string
  tokenSymbol?: string
}

const intervals: { value: KlineInterval; label: string }[] = [
  { value: '1m', label: '1 Min' },
  { value: '5m', label: '5 Min' },
  { value: '15m', label: '15 Min' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
]

// Period selector kept for future pagination implementation
const periods: { value: '1h' | '24h' | '7d' | '30d'; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
]

export function KlineChart({
  tokenAddress,
  tokenName,
  tokenSymbol,
}: KlineChartProps) {
  const [selectedInterval, setSelectedInterval] = useState<KlineInterval>('1h')
  const [selectedPeriod, setSelectedPeriod] = useState<
    '1h' | '24h' | '7d' | '30d'
  >('24h')

  // Use the new cursor-based API
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useKlineHistoryWithCursor({
    tokenAddr: tokenAddress,
    interval: selectedInterval,
    // No cursor for initial load - will get latest data
  })

  // Extract chart data from response
  const data = response?.chartData

  // Calculate price change
  const priceChange = useMemo(() => {
    if (!data || data.length < 2) return null
    const firstPrice = data[0].close
    const lastPrice = data[data.length - 1].close
    const change = lastPrice - firstPrice
    const changePercent = (change / firstPrice) * 100
    return {
      value: change,
      percent: changePercent,
      isPositive: change >= 0,
    }
  }, [data])

  // Simple chart visualization (you can replace with a real chart library)
  const renderSimpleChart = () => {
    if (!data || data.length === 0) return null

    const maxPrice = Math.max(...data.map((d) => d.high))
    const minPrice = Math.min(...data.map((d) => d.low))
    const priceRange = maxPrice - minPrice

    return (
      <div className="relative h-64 w-full">
        <div className="absolute inset-0 flex items-end justify-between gap-1">
          {data.map((candle, index) => {
            const heightPercent =
              ((candle.high - candle.low) / priceRange) * 100
            const bottomPercent = ((candle.low - minPrice) / priceRange) * 100
            const isGreen = candle.close >= candle.open

            return (
              <div
                key={index}
                className="relative flex-1"
                style={{ height: '100%' }}
              >
                <div
                  className={`absolute bottom-0 w-full ${
                    isGreen ? 'bg-green-500' : 'bg-red-500'
                  } opacity-70 transition-opacity hover:opacity-100`}
                  style={{
                    height: `${heightPercent}%`,
                    bottom: `${bottomPercent}%`,
                  }}
                  title={`Open: ${candle.open.toFixed(8)}
High: ${candle.high.toFixed(8)}
Low: ${candle.low.toFixed(8)}
Close: ${candle.close.toFixed(8)}
Volume: ${candle.volume.toFixed(2)}`}
                />
              </div>
            )
          })}
        </div>

        {/* Price labels */}
        <div className="text-muted-foreground absolute top-0 left-0 text-xs">
          {maxPrice.toFixed(8)}
        </div>
        <div className="text-muted-foreground absolute bottom-0 left-0 text-xs">
          {minPrice.toFixed(8)}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{tokenSymbol || 'Token'} Price Chart</CardTitle>
            <CardDescription>
              {tokenName && <span>{tokenName} • </span>}
              {priceChange && (
                <span
                  className={
                    priceChange.isPositive ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {priceChange.isPositive ? (
                    <TrendingUp className="inline h-4 w-4" />
                  ) : (
                    <TrendingDown className="inline h-4 w-4" />
                  )}{' '}
                  {priceChange.percent.toFixed(2)}%
                </span>
              )}
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Select
              value={selectedPeriod}
              onValueChange={(v) => setSelectedPeriod(v as any)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedInterval}
              onValueChange={(v) => setSelectedInterval(v as KlineInterval)}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervals.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-64 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load chart data.
              <button onClick={() => refetch()} className="ml-2 underline">
                Retry
              </button>
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && response && data && data.length > 0 && (
          <>
            {renderSimpleChart()}

            <div className="text-muted-foreground mt-4 flex justify-between text-sm">
              <div>
                <span className="font-medium">Latest: </span>
                {data[data.length - 1]?.close.toFixed(8)}
              </div>
              <div>
                <span className="font-medium">Volume: </span>
                {data[data.length - 1]?.volume.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Data Points: </span>
                {data.length}
              </div>
            </div>
          </>
        )}

        {!isLoading && !error && (!response || !data || data.length === 0) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No chart data available for this token.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// Example usage component
export function KlineChartExample() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Kline Chart Example</h1>

      <KlineChart
        tokenAddress="0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77"
        tokenName="Example Token"
        tokenSymbol="EXAMPLE"
      />

      <div className="bg-muted mt-8 rounded-lg p-4">
        <h2 className="mb-2 text-lg font-semibold">Integration Notes:</h2>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>
            This is a simple visualization. For production, use a library like
            TradingView Lightweight Charts
          </li>
          <li>The chart auto-refreshes every 30 seconds</li>
          <li>Data is cached for 5 minutes to reduce API calls</li>
          <li>Supports multiple time intervals and periods</li>
        </ul>
      </div>
    </div>
  )
}
