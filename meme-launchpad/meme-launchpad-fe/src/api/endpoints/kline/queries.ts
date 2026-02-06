import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import {
  KlineHistoryQuery,
  KlineHistoryQuerySchema,
  KlineHistoryResponseSchema,
  KlineHistoryWithCursorQuery,
  KlineHistoryWithCursorQuerySchema,
  KlineHistoryWithCursorResponseSchema,
  KlineChartData,
  transformKlineData,
  transformKlineWithCursorData,
} from '@/api/schemas/kline.schema'

/**
 * Query keys factory for kline data
 */
export const klineKeys = {
  all: ['kline'] as const,
  history: () => [...klineKeys.all, 'history'] as const,
  historyDetail: (params: KlineHistoryQuery) =>
    [...klineKeys.history(), params] as const,
  historyWithCursor: () => [...klineKeys.all, 'history-with-cursor'] as const,
  historyWithCursorDetail: (params: KlineHistoryWithCursorQuery) =>
    [...klineKeys.historyWithCursor(), params] as const,
}

/**
 * Fetch kline history data
 */
export async function fetchKlineHistory(
  params: KlineHistoryQuery
): Promise<KlineChartData[]> {
  // Validate query parameters
  const validatedParams = KlineHistoryQuerySchema.parse(params)

  // Make API request
  const response = await kyClient
    .get('kline/history', {
      searchParams: {
        tokenAddr: validatedParams.tokenAddr,
        interval: validatedParams.interval,
        from: validatedParams.from.toString(),
        to: validatedParams.to.toString(),
      },
    })
    .json()

  // Parse and validate response
  const parsedResponse = parseApiResponse(response, KlineHistoryResponseSchema)

  // Transform data for chart rendering
  if (parsedResponse.data) {
    return transformKlineData(parsedResponse.data)
  }

  return []
}

/**
 * Hook to fetch kline history data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useKlineHistory({
 *   tokenAddr: '0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77',
 *   interval: '1m',
 *   from: 1752560415,
 *   to: 1758560415,
 * })
 * ```
 */
export function useKlineHistory(params: KlineHistoryQuery) {
  return useQuery({
    queryKey: klineKeys.historyDetail(params),
    queryFn: () => fetchKlineHistory(params),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // Auto-refetch every 30 seconds for real-time data
    enabled: !!params.tokenAddr, // Only fetch when token address is provided
  })
}

/**
 * Fetch kline history with cursor
 */
export async function fetchKlineHistoryWithCursor(
  params: KlineHistoryWithCursorQuery
): Promise<{ cursor: string; chartData: KlineChartData[] } | null> {
  // Validate query parameters
  const validatedParams = KlineHistoryWithCursorQuerySchema.parse(params)

  // Build search params
  const searchParams: Record<string, string> = {
    tokenAddr: validatedParams.tokenAddr,
    interval: validatedParams.interval,
    limit: validatedParams.limit?.toString() ?? '',
  }

  if (validatedParams.cursor) {
    searchParams.cursor = validatedParams.cursor
  }

  // Make API request
  const response = await kyClient
    .get('kline/history-with-cursor', { searchParams })
    .json()

  // Parse and validate response
  const parsedResponse = parseApiResponse(
    response,
    KlineHistoryWithCursorResponseSchema
  )

  // Transform data for chart rendering
  return transformKlineWithCursorData(parsedResponse.data)
}

/**
 * Hook to fetch kline history with cursor support
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useKlineHistoryWithCursor({
 *   tokenAddr: '0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77',
 *   interval: '1m',
 *   cursor: 'MjAyNS0wOC0xOFQwMDowMDowMFo', // Optional
 * })
 * ```
 */
export function useKlineHistoryWithCursor(params: KlineHistoryWithCursorQuery) {
  return useQuery({
    queryKey: klineKeys.historyWithCursorDetail(params),
    queryFn: () => fetchKlineHistoryWithCursor(params),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // Auto-refetch every 30 seconds for real-time data
    enabled: !!params.tokenAddr, // Only fetch when token address is provided
  })
}

/**
 * Hook to fetch kline history with infinite loading support
 * Uses cursor-based pagination to load more historical data
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 *   isLoading
 * } = useInfiniteKlineHistory({
 *   tokenAddr: '0x7e8f0e2BDfc9586Dc2499b2cA2948A7fFF7e4Dc77',
 *   interval: '1m',
 * })
 *
 * // Flatten all pages into a single array and sort chronologically
 * // Note: Multiple pages need to be re-sorted to ensure proper time ordering
 * const allKlines = data?.pages
 *   .flatMap(page => page?.chartData || [])
 *   .sort((a, b) => a.time - b.time) || []
 * ```
 */
export function useInfiniteKlineHistory({
  tokenAddr,
  interval,
}: {
  tokenAddr: string
  interval: KlineHistoryWithCursorQuery['interval']
}) {
  return useInfiniteQuery({
    queryKey: klineKeys.historyWithCursorDetail({ tokenAddr, interval }),
    queryFn: ({ pageParam }) =>
      fetchKlineHistoryWithCursor({
        tokenAddr,
        interval,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // If we have data and a cursor, return it for the next page
      return lastPage?.cursor
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!tokenAddr,
  })
}

/**
 * Hook to fetch kline history with automatic time range
 * @deprecated Use useKlineHistoryWithCursor instead
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useKlineHistoryAuto({
 *   tokenAddr: '0x7e8f0e2BDfc9586Dc2499b2cA2948A7fFF7e4Dc77',
 *   interval: '1m',
 *   period: '24h', // Optional, defaults to 24h
 * })
 * ```
 */
export function useKlineHistoryAuto({
  tokenAddr,
  interval,
  period = '24h',
}: {
  tokenAddr: string
  interval: KlineHistoryQuery['interval']
  period?: '1h' | '24h' | '7d' | '30d' | '1y'
}) {
  // Dynamic import to avoid circular dependency
  const getTimeRangeForPeriod = (
    period: '1h' | '24h' | '7d' | '30d' | '1y'
  ) => {
    const now = Math.floor(Date.now() / 1000)
    const periods = {
      '1h': 60 * 60,
      '24h': 24 * 60 * 60,
      '7d': 7 * 24 * 60 * 60,
      '30d': 30 * 24 * 60 * 60,
      '1y': 365 * 24 * 60 * 60,
    }

    const from = now - periods[period]
    return { from, to: now }
  }

  const timeRange = getTimeRangeForPeriod(period)

  return useKlineHistory({
    tokenAddr,
    interval,
    ...timeRange,
  })
}

/**
 * Hook to fetch and poll kline data for real-time updates
 * Useful for live chart updates
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useKlineRealtime({
 *   tokenAddr: '0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77',
 *   interval: '1m',
 * })
 * ```
 */
export function useKlineRealtime({
  tokenAddr,
  interval,
  pollingInterval = 5000, // 5 seconds default
}: {
  tokenAddr: string
  interval: KlineHistoryQuery['interval']
  pollingInterval?: number
}) {
  const now = Math.floor(Date.now() / 1000)
  const from = now - 24 * 60 * 60 // Last 24 hours

  return useQuery({
    queryKey: klineKeys.historyDetail({ tokenAddr, interval, from, to: now }),
    queryFn: () => fetchKlineHistory({ tokenAddr, interval, from, to: now }),
    staleTime: 0, // Always consider stale for real-time data
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: pollingInterval,
    enabled: !!tokenAddr,
  })
}
