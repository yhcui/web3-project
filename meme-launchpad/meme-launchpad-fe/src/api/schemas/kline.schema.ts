import { z } from 'zod'

/**
 * Kline interval types
 */
export const KlineInterval = z.enum([
  '1m',
  '3m',
  '5m',
  '15m',
  '30m',
  '1h',
  '2h',
  '4h',
  '6h',
  '8h',
  '12h',
  '1d',
  '3d',
  '1w',
  '1M',
])
export type KlineInterval = z.infer<typeof KlineInterval>

/**
 * Kline history query parameters (legacy - for backward compatibility)
 */
export const KlineHistoryQuerySchema = z.object({
  tokenAddr: z.string().min(1),
  interval: KlineInterval,
  from: z.number().int().positive(),
  to: z.number().int().positive(),
})
export type KlineHistoryQuery = z.infer<typeof KlineHistoryQuerySchema>

/**
 * Kline history with cursor query parameters
 */
export const KlineHistoryWithCursorQuerySchema = z.object({
  tokenAddr: z.string().min(1),
  interval: KlineInterval,
  cursor: z.string().optional(),
  limit: z.number().int().positive().optional(),
})
export type KlineHistoryWithCursorQuery = z.infer<
  typeof KlineHistoryWithCursorQuerySchema
>

/**
 * Kline data structure
 */
export const KlineDataSchema = z.object({
  s: z.string().optional().default(''), // Status or symbol
  t: z.array(z.number()).default([]), // Timestamps
  o: z.array(z.string()).default([]), // Open prices
  h: z.array(z.string()).default([]), // High prices
  l: z.array(z.string()).default([]), // Low prices
  c: z.array(z.string()).default([]), // Close prices
  v: z.array(z.string()).default([]), // Volumes
})
export type KlineData = z.infer<typeof KlineDataSchema>

/**
 * Kline history API response (legacy)
 */
export const KlineHistoryResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: KlineDataSchema.optional(),
})
export type KlineHistoryResponse = z.infer<typeof KlineHistoryResponseSchema>

/**
 * Kline history with cursor API response
 */
export const KlineHistoryWithCursorResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z
    .object({
      cursor: z.string(),
      klines: KlineDataSchema,
    })
    .optional(),
})
export type KlineHistoryWithCursorResponse = z.infer<
  typeof KlineHistoryWithCursorResponseSchema
>

/**
 * Transform kline data for chart rendering
 */
export interface KlineChartData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export function transformKlineData(data: KlineData): KlineChartData[] {
  const { t, o, h, l, c, v } = data

  // Ensure all arrays have the same length
  const length = Math.min(
    t.length,
    o.length,
    h.length,
    l.length,
    c.length,
    v.length
  )

  const chartData: KlineChartData[] = []

  for (let i = 0; i < length; i++) {
    chartData.push({
      time: t[i] * 1000, // 转换为毫秒时间戳，TradingView 需要毫秒级别
      open: parseFloat(o[i]) || 0,
      high: parseFloat(h[i]) || 0,
      low: parseFloat(l[i]) || 0,
      close: parseFloat(c[i]) || 0,
      volume: parseFloat(v[i]) || 0,
    })
  }

  // Sort by time in ascending order (oldest first)
  // Chart libraries expect data to be chronologically ordered
  return chartData.sort((a, b) => a.time - b.time)
}

/**
 * Transform kline data with cursor response
 */
export function transformKlineWithCursorData(
  response: KlineHistoryWithCursorResponse['data']
): { cursor: string; chartData: KlineChartData[] } | null {
  if (!response) return null

  return {
    cursor: response.cursor,
    chartData: transformKlineData(response.klines),
  }
}

/**
 * Format timestamp to date string
 */
export function formatKlineTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

/**
 * Get default time range (last 24 hours)
 */
export function getDefaultTimeRange(): { from: number; to: number } {
  const now = Math.floor(Date.now() / 1000)
  const from = now - 24 * 60 * 60 // 24 hours ago
  return { from, to: now }
}

/**
 * Get time range for specific periods
 */
export function getTimeRangeForPeriod(
  period: '1h' | '24h' | '7d' | '30d' | '1y'
): { from: number; to: number } {
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
