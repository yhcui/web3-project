# Kline API Usage Guide

## Overview

The Kline API provides access to candlestick chart data for tokens, including historical price data and real-time updates.

> **Migration Notice**: The API now supports cursor-based pagination through the new `/kline/history-with-cursor` endpoint. The legacy time-range based API is still available but deprecated.

## Cursor-Based API (Recommended)

### Basic Usage with Cursor

```tsx
import { useKlineHistoryWithCursor } from '@/api/endpoints/kline'

function TokenChart({ tokenAddress }: { tokenAddress: string }) {
  const { data, isLoading, error } = useKlineHistoryWithCursor({
    tokenAddr: tokenAddress,
    interval: '1m',
    cursor: undefined, // Optional: pass cursor for pagination
  })

  if (isLoading) return <div>Loading chart data...</div>
  if (error) return <div>Error loading chart</div>

  // data contains { cursor: string, chartData: KlineChartData[] }
  return <YourChartComponent data={data?.chartData} />
}
```

### Infinite Loading with Cursor

```tsx
import { useInfiniteKlineHistory } from '@/api/endpoints/kline'

function InfiniteChart({ tokenAddress }: { tokenAddress: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteKlineHistory({
      tokenAddr: tokenAddress,
      interval: '1h',
    })

  // Flatten all pages into a single array and sort chronologically
  // Note: Multiple pages need to be re-sorted to ensure proper time ordering
  const allKlines =
    data?.pages
      .flatMap((page) => page?.chartData || [])
      .sort((a, b) => a.time - b.time) || []

  return (
    <div>
      <YourChartComponent data={allKlines} />
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading more...' : 'Load More History'}
        </button>
      )}
    </div>
  )
}
```

## Legacy API (Deprecated)

### Basic Usage

```tsx
import { useKlineHistory } from '@/api/endpoints/kline'

function TokenChart({ tokenAddress }: { tokenAddress: string }) {
  const { data, isLoading, error } = useKlineHistory({
    tokenAddr: tokenAddress,
    interval: '1m',
    from: Math.floor(Date.now() / 1000) - 86400, // 24 hours ago
    to: Math.floor(Date.now() / 1000), // now
  })

  if (isLoading) return <div>Loading chart data...</div>
  if (error) return <div>Error loading chart</div>

  // data is KlineChartData[] with format:
  // [{ time, open, high, low, close, volume }, ...]
  return <YourChartComponent data={data} />
}
```

## Auto Time Range

```tsx
import { useKlineHistoryAuto } from '@/api/endpoints/kline'

function TokenChart({ tokenAddress }: { tokenAddress: string }) {
  const { data, isLoading } = useKlineHistoryAuto({
    tokenAddr: tokenAddress,
    interval: '5m',
    period: '7d', // Automatically calculates last 7 days
  })

  // ...
}
```

## Real-time Updates

```tsx
import { useKlineRealtime } from '@/api/endpoints/kline'

function LiveChart({ tokenAddress }: { tokenAddress: string }) {
  const { data, isLoading } = useKlineRealtime({
    tokenAddr: tokenAddress,
    interval: '1m',
    pollingInterval: 5000, // Refresh every 5 seconds
  })

  // Chart automatically updates with new data
  return <YourChartComponent data={data} />
}
```

## Available Intervals

- `1m` - 1 minute
- `3m` - 3 minutes
- `5m` - 5 minutes
- `15m` - 15 minutes
- `30m` - 30 minutes
- `1h` - 1 hour
- `2h` - 2 hours
- `4h` - 4 hours
- `6h` - 6 hours
- `8h` - 8 hours
- `12h` - 12 hours
- `1d` - 1 day
- `3d` - 3 days
- `1w` - 1 week
- `1M` - 1 month

## Time Range Helpers

```tsx
import { getTimeRangeForPeriod } from '@/api/endpoints/kline'

// Get time range for last 30 days
const { from, to } = getTimeRangeForPeriod('30d')

// Available periods: '1h', '24h', '7d', '30d', '1y'
```

## Data Format

The API returns data in `KlineChartData[]` format:

```typescript
interface KlineChartData {
  time: number // Unix timestamp
  open: number // Opening price
  high: number // Highest price
  low: number // Lowest price
  close: number // Closing price
  volume: number // Trading volume
}
```

## Cache Management

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { klineKeys } from '@/api/endpoints/kline'

function RefreshButton({ tokenAddr, interval, from, to }) {
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    // Invalidate specific kline query
    queryClient.invalidateQueries({
      queryKey: klineKeys.historyDetail({ tokenAddr, interval, from, to }),
    })

    // Or invalidate all kline queries
    queryClient.invalidateQueries({
      queryKey: klineKeys.all,
    })
  }

  return <button onClick={handleRefresh}>Refresh</button>
}
```

## Integration with Chart Libraries

### Example with Lightweight Charts

```tsx
import { useKlineHistory } from '@/api/endpoints/kline'
import { createChart } from 'lightweight-charts'

function TradingViewChart({ tokenAddress }: { tokenAddress: string }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { data } = useKlineHistory({
    tokenAddr: tokenAddress,
    interval: '1h',
    from: Math.floor(Date.now() / 1000) - 7 * 86400,
    to: Math.floor(Date.now() / 1000),
  })

  useEffect(() => {
    if (!chartRef.current || !data) return

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 400,
    })

    const candlestickSeries = chart.addCandlestickSeries()

    // Transform data for TradingView format
    const chartData = data.map((d) => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))

    candlestickSeries.setData(chartData)

    return () => chart.remove()
  }, [data])

  return <div ref={chartRef} />
}
```

## Error Handling

```tsx
import { useKlineHistory } from '@/api/endpoints/kline'

function TokenChart({ tokenAddress }: { tokenAddress: string }) {
  const { data, isLoading, error, refetch } = useKlineHistory({
    tokenAddr: tokenAddress,
    interval: '1m',
    from: Math.floor(Date.now() / 1000) - 3600,
    to: Math.floor(Date.now() / 1000),
  })

  if (error) {
    return (
      <div>
        <p>Failed to load chart data</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    )
  }

  // ...
}
```

## Migration Guide

### Migrating from Time-Range to Cursor-Based API

The new cursor-based API provides better performance and scalability for loading historical kline data. Here's how to migrate:

#### Before (Time-Range Based)

```tsx
const { data } = useKlineHistory({
  tokenAddr: '0x...',
  interval: '1h',
  from: timestamp - 86400,
  to: timestamp,
})

// data is KlineChartData[]
```

#### After (Cursor-Based)

```tsx
const { data } = useKlineHistoryWithCursor({
  tokenAddr: '0x...',
  interval: '1h',
  cursor: undefined, // Initial load
})

// data is { cursor: string, chartData: KlineChartData[] }
const chartData = data?.chartData || []
```

### Key Differences

1. **Request Parameters**:
   - Old: `tokenAddr`, `interval`, `from`, `to`
   - New: `tokenAddr`, `interval`, `cursor` (optional)

2. **Response Structure**:
   - Old: Direct array of `KlineChartData[]`
   - New: Object with `cursor` and `chartData` properties

3. **Pagination**:
   - Old: Manual time range calculation
   - New: Cursor-based pagination with `useInfiniteKlineHistory`

4. **Benefits**:
   - More efficient server-side data fetching
   - Better support for infinite scrolling
   - Consistent pagination regardless of data density
   - Simplified client-side logic

### Gradual Migration Strategy

1. **Phase 1**: Update imports to use new hooks alongside old ones
2. **Phase 2**: Replace simple use cases with `useKlineHistoryWithCursor`
3. **Phase 3**: Implement infinite loading with `useInfiniteKlineHistory`
4. **Phase 4**: Remove legacy hook usage once all components are migrated

### Cache Key Compatibility

The new hooks use different cache keys, so they won't conflict with existing cached data:

- Legacy: `['kline', 'history', params]`
- New: `['kline', 'history-with-cursor', params]`
