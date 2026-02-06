/**
 * Kline API exports
 *
 * This module provides access to candlestick/kline chart data
 * for tokens, including historical price data and real-time updates.
 */

// Export all query hooks
export {
  // Legacy hooks (deprecated)
  useKlineHistory,
  useKlineHistoryAuto,
  useKlineRealtime,
  // New cursor-based hooks
  useKlineHistoryWithCursor,
  useInfiniteKlineHistory,
  // Query keys
  klineKeys,
} from './queries'

// Re-export types and utilities from schema
export {
  type KlineInterval,
  // Legacy types
  type KlineHistoryQuery,
  type KlineHistoryResponse,
  // New cursor-based types
  type KlineHistoryWithCursorQuery,
  type KlineHistoryWithCursorResponse,
  // Common types
  type KlineData,
  type KlineChartData,
  // Enums
  KlineInterval as KlineIntervalEnum,
  // Transform functions
  transformKlineData,
  transformKlineWithCursorData,
  // Utility functions
  formatKlineTime,
  getDefaultTimeRange,
  getTimeRangeForPeriod,
} from '@/api/schemas/kline.schema'
