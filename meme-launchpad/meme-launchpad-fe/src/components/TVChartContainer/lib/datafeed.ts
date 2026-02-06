import {
  ResolutionString,
  LibrarySymbolInfo,
  HistoryCallback,
  SubscribeBarsCallback,
  Bar,
} from '@/public/static/charting_library'
import { SUPPORTED_RESOLUTIONS } from '../constants/tvChart'
import { fetchKlineHistoryWithCursor } from '@/api/endpoints/kline/queries'
import type { KlineInterval } from '@/api/schemas/kline.schema'
import type { TokenDetail } from '@/api/schemas/trade.schema'
import { KlineWebSocketClient } from '@/lib/websocket/kline/client'
import type { KlineUpdate } from '@/lib/websocket/kline/schemas'

// Helper function to convert interval string to minutes
function intervalToMinutes(interval: string): number {
  const unit = interval.slice(-1)
  const value = parseInt(interval.slice(0, -1))

  switch (unit) {
    case 'm':
      return value
    case 'h':
      return value * 60
    case 'd':
      return value * 60 * 24
    case 'w':
      return value * 60 * 24 * 7
    case 'M':
      return value * 60 * 24 * 30 // Approximate
    default:
      return 1 // Default to 1 minute
  }
}

// Check if received interval can be used to update chart interval
function canProcessInterval(
  receivedInterval: string,
  chartInterval: string
): boolean {
  const receivedMinutes = intervalToMinutes(receivedInterval)
  const chartMinutes = intervalToMinutes(chartInterval)

  // 🎯 智能间隔处理策略
  let canProcess = false
  let reason = ''

  if (receivedInterval === chartInterval) {
    // 1. 精确匹配 - 总是接受
    canProcess = true
    reason = 'exact match'
  } else if (receivedMinutes <= chartMinutes) {
    // 2. 接收到更小或相等间隔 - 可以聚合到更大间隔
    if (chartMinutes % receivedMinutes === 0) {
      canProcess = true
      reason = 'can aggregate smaller to larger (factor match)'
    } else {
      canProcess = true // 暂时允许，让时间对齐逻辑处理
      reason = 'can aggregate smaller to larger (general)'
    }
  } else {
    // 3. 接收到更大间隔 - 需要谨慎处理
    // 只有当图表间隔是更大间隔的因子时才接受
    if (receivedMinutes % chartMinutes === 0) {
      canProcess = true
      reason = 'larger interval is compatible divisor'
    } else {
      canProcess = false
      reason = 'incompatible larger interval'
    }
  }

  console.log(`[TradingView] 🔍 Interval compatibility analysis:`, {
    received: receivedInterval,
    chart: chartInterval,
    receivedMinutes,
    chartMinutes,
    canProcess,
    reason,
    priority: receivedInterval === chartInterval ? 'HIGH' : 'MEDIUM',
  })

  return canProcess
}

// Align timestamp to chart interval
function alignTimeToInterval(timestamp: number, interval: string): number {
  const minutes = intervalToMinutes(interval)
  const timeInMs = timestamp * 1000 // Convert to milliseconds
  const intervalMs = minutes * 60 * 1000

  // 🎯 特殊处理3分钟间隔对齐
  let aligned: number

  if (interval === '3m') {
    // 对于3分钟间隔，需要对齐到3分钟边界 (00:00, 00:03, 00:06, 00:09, ...)
    const date = new Date(timeInMs)
    const currentMinutes = date.getUTCMinutes()
    const currentSeconds = date.getUTCSeconds()
    const currentMillis = date.getUTCMilliseconds()

    // 找到最近的3分钟边界
    const alignedMinutes = Math.floor(currentMinutes / 3) * 3

    // 创建对齐后的时间（秒和毫秒设为0）
    const alignedDate = new Date(date)
    alignedDate.setUTCMinutes(alignedMinutes, 0, 0)
    aligned = alignedDate.getTime()

    console.log(`[TradingView] 3m Time alignment:`, {
      originalTime: new Date(timeInMs),
      originalMinutes: currentMinutes,
      alignedMinutes,
      alignedTime: new Date(aligned),
      interval: '3m',
    })
  } else {
    // 常规间隔对齐
    aligned = Math.floor(timeInMs / intervalMs) * intervalMs

    console.log(`[TradingView] Time alignment:`, {
      originalTime: new Date(timeInMs),
      alignedTime: new Date(aligned),
      interval,
      intervalMinutes: minutes,
    })
  }

  return aligned
}

// Get intervals to subscribe for better coverage
function getIntervalsToSubscribe(primaryInterval: string): string[] {
  // 🎯 精确订阅策略：只订阅请求的间隔，避免数据冲突
  const intervals = [primaryInterval] // 只订阅主要间隔

  console.log(`[TradingView] 📡 Precise subscription strategy:`, {
    primaryInterval,
    subscribedIntervals: intervals,
    strategy: 'exact interval only - no mixed intervals',
  })

  return intervals
}

export interface PeriodParams {
  from: number // Unix timestamp
  to: number // Unix timestamp
  firstDataRequest: boolean
  countBack?: number
}

type onReadyCallback = (arg0: {
  supported_resolutions: string[]
  supports_marks: boolean
  supports_timescale_marks: boolean
  supports_time: boolean
  reset_cache_timeout: number
}) => void

export const createDatafeed = (
  ws: KlineWebSocketClient,
  tokenInfo: TokenDetail,
  quote: 'USD' | 'BNB' = 'BNB',
  mode: 'PRICE' | 'MARKET_CAP' = 'PRICE',
  lastData: React.MutableRefObject<Bar | null>
) => {
  let currentQuote = quote
  let currentMode = mode
  let resetCacheCallback: (() => void) | null = null

  // Cache for data and cursors
  const noDataCache = new Map<string, { noData: boolean }>()
  const cursorCache = new Map<string, { cursor: string }>()

  // WebSocket subscription management
  const realtimeListeners = new Map<string, (data: KlineUpdate) => void>()
  const activeSubscriptions = new Map<
    string,
    {
      interval: string
      tokenAddress: string
      heartbeatInterval?: NodeJS.Timeout
    }
  >()

  // 🎯 防重复处理：记录已处理的消息
  const processedMessages = new Map<string, number>()

  // Debug helper for testing listeners
  if (typeof window !== 'undefined') {
    ;(window as any).debugDatafeed = {
      activeSubscriptions,
      realtimeListeners,
      testKlineUpdate: (data: KlineUpdate) => {
        console.log('[Debug] Manual kline update test:', data)
        console.log('[Debug] Active listeners:', realtimeListeners.size)
        realtimeListeners.forEach((listener, guid) => {
          console.log(`[Debug] Calling listener ${guid}`)
          try {
            listener(data)
          } catch (error) {
            console.error(`[Debug] Error calling listener ${guid}:`, error)
          }
        })
      },
    }
  }

  const datafeed = {
    onReady: (callback: onReadyCallback) => {
      setTimeout(() => {
        callback({
          supported_resolutions: Object.keys(SUPPORTED_RESOLUTIONS),
          supports_marks: false,
          supports_timescale_marks: false,
          supports_time: true,
          reset_cache_timeout: 86400, // 设置为 24 小时，防止频繁重新请求
        })
      }, 0)
    },
    resolveSymbol: (
      symbolName: string = tokenInfo.symbol,
      onSymbolResolvedCallback: (arg0: {
        name: string
        type: string
        description: string
        ticker: string
        session: string
        minmov: number
        pricescale: number
        timezone: string
        has_intraday: boolean
        has_daily: boolean
        has_seconds: boolean
        seconds_multipliers: string[]
        currency_code: string
        visible_plots_set: string
        data_status: string
        isStable: boolean
      }) => void
    ) => {
      const symbolInfo = {
        name: symbolName,
        type: 'crypto',
        description: symbolName + ` / ${currentQuote}`,
        ticker: symbolName,
        session: '24x7',
        minmov: 1,
        pricescale: 10000000,
        timezone: 'Etc/UTC',
        has_intraday: true,
        has_daily: true,
        has_seconds: true,
        seconds_multipliers: ['1', '5', '15', '30'],
        currency_code: currentQuote,
        visible_plots_set: 'ohlc',
        data_status: 'streaming',
        isStable: false,
      }
      setTimeout(() => onSymbolResolvedCallback(symbolInfo))
    },
    getBars: async (
      symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      periodParams: PeriodParams,
      onHistoryCallback: HistoryCallback,
      onErrorCallback: (error: string) => void
    ) => {
      try {
        // 构建缓存键
        const cacheKey = `${tokenInfo.tokenContractAddress}_${resolution}`

        // 检查缓存
        const cachedData = noDataCache.get(cacheKey)

        if (cachedData?.noData) {
          onHistoryCallback([], {
            noData: true,
          })
          noDataCache.delete(cacheKey)
          return
        }

        // 构建请求参数
        const requestParams = {
          tokenAddr: tokenInfo.tokenContractAddress ?? '',
          interval: SUPPORTED_RESOLUTIONS[
            resolution as keyof typeof SUPPORTED_RESOLUTIONS
          ] as KlineInterval,
          limit: periodParams.countBack,
          cursor: cursorCache.get(cacheKey)?.cursor ?? '',
          // from: periodParams.from,
          // to: periodParams.to,
        }

        const res = await fetchKlineHistoryWithCursor(requestParams)
        cursorCache.set(cacheKey, { cursor: res?.cursor ?? '' })
        console.log(res)

        if (res?.chartData) {
          const barsData = res.chartData.sort((a, b) => a.time - b.time) // 按时间排序，确保时间顺序正确
          const bars = barsData.filter(
            (item) => item.time <= periodParams.to * 1000
          )

          if (periodParams.firstDataRequest && bars.length) {
            lastData.current = bars[bars.length - 1]
          }

          onHistoryCallback(bars, {
            noData: !res.cursor,
          })
        } else {
          onErrorCallback('No data')
        }
      } catch (error) {
        console.error('Error in getBars:', error)
        // onHistoryCallback([], {
        //   noData: true,
        // });
        onErrorCallback(
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    },
    subscribeBars: async (
      symbol: string,
      resolution: ResolutionString,
      onRealtimeCallback: SubscribeBarsCallback,
      listenerGuid: string,
      onResetCacheNeededCallback: () => void
    ) => {
      try {
        // Save cache reset callback
        resetCacheCallback = onResetCacheNeededCallback

        // Get the interval for WebSocket subscription
        const interval = SUPPORTED_RESOLUTIONS[
          resolution as keyof typeof SUPPORTED_RESOLUTIONS
        ] as KlineInterval

        if (!interval) {
          console.error(`[TradingView] Unsupported resolution: ${resolution}`)
          return
        }

        console.log(
          `[TradingView] 🔧 Setting up subscription for ${listenerGuid}:`,
          {
            symbol,
            resolution,
            interval,
            tokenAddress: tokenInfo.tokenContractAddress,
            chartInterval: interval,
            resolutionMapping: Object.entries(SUPPORTED_RESOLUTIONS).find(
              ([k, v]) => v === interval
            ),
            currentTime: new Date().toISOString(),
            // 🚨 关键调试：检查实际配置
            CRITICAL_CHECK: {
              resolution,
              resolution_is_15: resolution === '15',
              interval_is_15m: interval === '15m',
              expecting_1m_but_got_15m:
                interval === '1m' && resolution === '15',
              localStorage_interval:
                typeof window !== 'undefined'
                  ? localStorage.getItem(
                      'tradingview.chart.lastUsedTimeBasedResolution'
                    )
                  : 'server-side',
            },
          }
        )

        // Create WebSocket event handler for kline updates
        const handleKlineUpdate = (updateData: KlineUpdate) => {
          // 🎯 防重复处理：检查消息是否已处理
          const messageKey = `${updateData.timestamp}_${updateData.data?.tokenAddress}_${updateData.data?.interval}_${updateData.data?.data?.t}`
          const currentTime = Date.now()

          if (processedMessages.has(messageKey)) {
            const lastProcessTime = processedMessages.get(messageKey)!
            if (currentTime - lastProcessTime < 1000) {
              // 1秒内的重复消息
              console.log(
                `[TradingView] ⏭️ Skipping duplicate message within 1s:`,
                {
                  messageKey,
                  timeSinceLastProcess: currentTime - lastProcessTime,
                }
              )
              return
            }
          }

          // 记录处理时间
          processedMessages.set(messageKey, currentTime)

          // 清理5秒前的记录，避免内存泄漏
          if (Math.random() < 0.01) {
            // 1% 概率清理
            for (const [key, time] of processedMessages.entries()) {
              if (currentTime - time > 5000) {
                processedMessages.delete(key)
              }
            }
          }

          // Add defensive checks for all values before using them
          const receivedTokenAddress = updateData.data?.tokenAddress
          const expectedTokenAddress = tokenInfo?.tokenContractAddress

          console.log(
            `[TradingView] Received kline update for ${listenerGuid}:`,
            {
              receivedToken:
                typeof receivedTokenAddress === 'string'
                  ? receivedTokenAddress.toLowerCase()
                  : receivedTokenAddress,
              expectedToken:
                typeof expectedTokenAddress === 'string'
                  ? expectedTokenAddress.toLowerCase()
                  : expectedTokenAddress,
              receivedInterval: updateData.data?.interval,
              expectedInterval: interval,
              tokenMatch:
                receivedTokenAddress &&
                expectedTokenAddress &&
                typeof receivedTokenAddress === 'string' &&
                typeof expectedTokenAddress === 'string' &&
                receivedTokenAddress.toLowerCase() ===
                  expectedTokenAddress.toLowerCase(),
              intervalMatch: updateData.data?.interval === interval,
              // 🎯 添加订阅状态调试
              currentSubscriptions: ws.getSubscriptions(),
              subscriptionRefCounts: ws.getSubscriptionRefCounts(),
              wsStatus: {
                connected: ws.isConnected(),
                ready: ws.isReadyForSubscriptions(),
              },
            }
          )

          // Only process updates for the correct token AND exact interval match
          if (
            receivedTokenAddress &&
            expectedTokenAddress &&
            typeof receivedTokenAddress === 'string' &&
            typeof expectedTokenAddress === 'string' &&
            receivedTokenAddress.toLowerCase() ===
              expectedTokenAddress.toLowerCase() &&
            updateData.data?.interval === interval
          ) {
            try {
              // Since we already filtered for exact interval match, we know it's valid
              console.log(`[TradingView] ✅ Processing exact interval match:`, {
                interval: updateData.data.interval,
                listenerGuid,
                priority: 'HIGH',
              })

              // Additional check: only process if data is newer than last data
              let shouldProcessTime = true
              if (lastData.current) {
                const proposedTime = alignTimeToInterval(
                  updateData.data.data.t,
                  interval
                )
                shouldProcessTime = proposedTime >= lastData.current.time
                console.log(`[TradingView] Time order check:`, {
                  proposedTime: new Date(proposedTime),
                  lastBarTime: new Date(lastData.current.time),
                  shouldProcessTime,
                  timeDiff: proposedTime - lastData.current.time,
                })
              }

              if (shouldProcessTime) {
                // Check if timestamp is reasonable (not too far in future)
                const currentTime = Date.now()
                const dataTime = updateData.data.data.t * 1000
                const timeDiff = dataTime - currentTime

                console.log(`[TradingView] Timestamp validation:`, {
                  currentTime: new Date(currentTime),
                  dataTime: new Date(dataTime),
                  timeDiffMinutes: Math.round(timeDiff / 60000),
                  isReasonable: Math.abs(timeDiff) < 5 * 60 * 1000, // Within 5 minutes
                })

                // Use current time if data time is too far in the future
                let adjustedTime = updateData.data.data.t
                if (timeDiff > 5 * 60) {
                  // More than 5 minutes in future
                  adjustedTime = Math.floor(currentTime / 1000)
                  console.log(
                    `[TradingView] ⚠️ Adjusting timestamp from future to current time`
                  )
                }

                // Transform WebSocket data to TradingView Bar format
                // 🎯 使用图表间隔对齐时间
                let alignedTime = alignTimeToInterval(adjustedTime, interval)

                // 🎯 智能时间处理：相同时间更新，只有新时间才创建新K线
                if (lastData.current && alignedTime < lastData.current.time) {
                  // 只有时间真的倒退了才需要修正（这种情况很少见）
                  alignedTime = lastData.current.time
                  console.log(
                    `[TradingView] ⚠️ Time regression detected and corrected:`,
                    {
                      originalAligned: new Date(
                        alignTimeToInterval(adjustedTime, interval)
                      ),
                      correctedTime: new Date(alignedTime),
                      lastBarTime: new Date(lastData.current.time),
                      interval,
                    }
                  )
                } else if (
                  lastData.current &&
                  alignedTime === lastData.current.time
                ) {
                  // 相同时间：更新现有K线，不创建新K线
                  console.log(
                    `[TradingView] 🔄 Updating existing bar at same time:`,
                    {
                      time: new Date(alignedTime),
                      interval,
                    }
                  )
                }

                const bar: Bar = {
                  time: alignedTime,
                  open: parseFloat(updateData.data.data.o),
                  high: parseFloat(updateData.data.data.h),
                  low: parseFloat(updateData.data.data.l),
                  close: parseFloat(updateData.data.data.c),
                  volume: parseFloat(updateData.data.data.v),
                }

                // Update last data reference
                lastData.current = bar

                console.log(
                  `[TradingView] Real-time update for ${listenerGuid}:`,
                  {
                    originalTime: new Date(updateData.data.data.t * 1000),
                    adjustedTime: new Date(adjustedTime * 1000),
                    alignedTime: new Date(bar.time),
                    price: bar.close,
                    volume: bar.volume,
                    receivedInterval: updateData.data.interval,
                    chartInterval: interval,
                    lastDataTime: lastData.current
                      ? new Date(lastData.current.time)
                      : null,
                  }
                )

                // Send update to TradingView chart
                try {
                  onRealtimeCallback(bar)
                  console.log(
                    `[TradingView] ✅ Successfully called onRealtimeCallback for ${listenerGuid}`
                  )

                  // Additional verification - check if TradingView accepted the update
                  setTimeout(() => {
                    if (
                      lastData.current &&
                      lastData.current.time === bar.time
                    ) {
                      console.log(
                        `[TradingView] ✅ Confirmed: Chart data updated successfully`
                      )
                    } else {
                      console.log(
                        `[TradingView] ⚠️ Warning: Chart data may not have updated`,
                        {
                          expectedTime: new Date(bar.time),
                          actualLastTime: lastData.current
                            ? new Date(lastData.current.time)
                            : null,
                        }
                      )
                    }
                  }, 100)
                } catch (error) {
                  console.error(
                    `[TradingView] ❌ Error in onRealtimeCallback for ${listenerGuid}:`,
                    error
                  )
                }
              } else {
                console.log(
                  `[TradingView] ⏭️ Skipping outdated data - would violate time order for ${interval}`
                )
              }
            } catch (error) {
              console.error(
                `[TradingView] Error processing kline update for ${listenerGuid}:`,
                error
              )
            }
          } else {
            // 🎯 重要：详细记录被跳过的更新，特别是间隔不匹配的情况
            const isIntervalMismatch = updateData.data?.interval !== interval
            const isTokenMismatch =
              !receivedTokenAddress ||
              !expectedTokenAddress ||
              receivedTokenAddress.toLowerCase() !==
                expectedTokenAddress.toLowerCase()

            if (isIntervalMismatch) {
              console.log(
                `[TradingView] ⏭️ Interval mismatch - skipped update:`,
                {
                  reason: 'interval mismatch',
                  received: {
                    token: receivedTokenAddress?.toLowerCase(),
                    interval: updateData.data?.interval,
                    timestamp: updateData.timestamp,
                    dataTime: updateData.data?.data?.t
                      ? new Date(updateData.data.data.t * 1000)
                      : 'unknown',
                  },
                  expected: {
                    token: expectedTokenAddress?.toLowerCase(),
                    interval,
                    listenerGuid,
                  },
                  // 🎯 关键信息：我们期望什么间隔，实际收到什么
                  needsAttention:
                    updateData.data?.interval !== interval
                      ? 'YES - Missing expected interval data'
                      : 'NO',
                }
              )
            } else if (isTokenMismatch) {
              // Token mismatch - less frequent logging
              if (Math.random() < 0.05) {
                console.log(
                  `[TradingView] ⏭️ Token mismatch - skipped update:`,
                  {
                    reason: 'token mismatch',
                    received: { token: receivedTokenAddress },
                    expected: { token: expectedTokenAddress },
                  }
                )
              }
            }
          }
        }

        const tokenAddress = tokenInfo.tokenContractAddress ?? ''

        // 🎯 严格的监听器管理：先清理，再注册，避免重复
        console.log(`[TradingView] 🧹 Setting up listener for ${listenerGuid}`)

        // 1. 清理任何现有的监听器
        const existingListener = realtimeListeners.get(listenerGuid)
        if (existingListener) {
          ws.off('kline_update', existingListener)
          console.log(
            `[TradingView] ✅ Cleaned up existing listener for ${listenerGuid}`
          )
        }

        // 2. 注册新的监听器
        ws.on('kline_update', handleKlineUpdate)

        // 🎯 心跳检测：定期检查是否收到预期的更新
        const heartbeatInterval = setInterval(() => {
          const now = Date.now()
          const timeSinceLastUpdate = lastData.current
            ? now - lastData.current.time
            : Infinity

          if (timeSinceLastUpdate > 2 * 60 * 1000) {
            // 2分钟没有更新
            console.warn(
              `[TradingView] ⚠️ No ${interval} updates for ${listenerGuid} in ${Math.round(timeSinceLastUpdate / 1000)}s`,
              {
                expectedInterval: interval,
                tokenAddress,
                lastUpdateTime: lastData.current
                  ? new Date(lastData.current.time)
                  : 'never',
                currentSubscriptions: ws.getSubscriptions(),
                isConnected: ws.isConnected(),
                wsListenerCount: ws.listenerCount('kline_update'),
              }
            )
          }
        }, 30000) // 每30秒检查一次

        // 3. 存储引用以便后续清理
        realtimeListeners.set(listenerGuid, handleKlineUpdate)
        activeSubscriptions.set(listenerGuid, {
          interval,
          tokenAddress,
          heartbeatInterval, // 存储定时器引用
        })

        console.log(
          `[TradingView] ✅ Registered new kline_update listener for ${listenerGuid}`,
          {
            totalListeners: ws.listenerCount('kline_update'),
            guidListeners: realtimeListeners.size,
          }
        )

        // Wait for WebSocket to be ready and then subscribe
        const subscribeWhenReady = () => {
          if (ws.isReadyForSubscriptions()) {
            // Subscribe to multiple intervals to ensure coverage
            const intervalsToSubscribe = getIntervalsToSubscribe(interval)
            console.log(
              `[TradingView] 📡 WebSocket ready, subscribing for ${listenerGuid}:`,
              {
                tokenAddress,
                primaryInterval: interval,
                resolution,
                allIntervals: intervalsToSubscribe,
                subscriptionAction: 'NEW_SUBSCRIBE',
              }
            )

            // 🎯 关键：实际执行订阅
            console.log(
              `[TradingView] 🚨 EXECUTING SUBSCRIPTION NOW: ${intervalsToSubscribe} for token ${tokenAddress}`
            )
            ws.subscribe(tokenAddress, ['kline'], intervalsToSubscribe)
            console.log(
              `[TradingView] ✅ Subscription command sent for ${listenerGuid}
              ${tokenAddress}
              ${intervalsToSubscribe}
              `
            )

            // 🎯 订阅后验证状态
            setTimeout(() => {
              console.log(
                `[TradingView] 🔍 Post-subscription state for ${listenerGuid}:`,
                {
                  wsSubscriptions: ws.getSubscriptions(),
                  wsRefCounts: ws.getSubscriptionRefCounts(),
                  expectedInterval: interval,
                }
              )
            }, 100)
          } else {
            console.log(
              `[TradingView] WebSocket not ready, waiting... (${listenerGuid})`,
              {
                connected: ws.isConnected(),
                ready: ws.getIsReady(),
                hasConnectionId: !!ws.getConnectionId(),
                connectionId: ws.getConnectionId(),
              }
            )

            // 🎯 强制订阅：连接已建立但未ready时也要订阅
            if (ws.isConnected()) {
              const intervalsToSubscribe = getIntervalsToSubscribe(interval)
              console.log(
                `[TradingView] 🚨 FORCING subscription despite readiness state for ${listenerGuid}`,
                {
                  intervals: intervalsToSubscribe,
                  primaryInterval: interval,
                  wsReady: ws.isReadyForSubscriptions(),
                  wsConnected: ws.isConnected(),
                  connectionId: ws.getConnectionId(),
                  forceReason: 'WebSocket connected but not ready',
                }
              )
              ws.subscribe(tokenAddress, ['kline'], intervalsToSubscribe)

              // 🎯 订阅后立即验证
              setTimeout(() => {
                console.log(
                  `[TradingView] 🔍 FORCED subscription verification for ${listenerGuid}:`,
                  {
                    wsSubscriptions: ws.getSubscriptions(),
                    wsRefCounts: ws.getSubscriptionRefCounts(),
                    expectedInterval: interval,
                    actualSubscriptions: Array.from(
                      ws.getSubscriptionRefCounts().keys()
                    ),
                  }
                )
              }, 200)
            } else {
              console.error(
                `[TradingView] 🚨 WebSocket not even connected for ${listenerGuid}!`,
                {
                  wsConnected: ws.isConnected(),
                  wsReady: ws.isReadyForSubscriptions(),
                  connectionId: ws.getConnectionId(),
                }
              )
            }
            // Listen for ready event
            const onReady = () => {
              const intervalsToSubscribe = getIntervalsToSubscribe(interval)
              console.log(
                `[TradingView] WebSocket became ready, subscribing for ${listenerGuid}`
              )
              ws.subscribe(tokenAddress, ['kline'], intervalsToSubscribe)
              ws.off('ready', onReady)
            }
            ws.once('ready', onReady)

            // Also try again after a short delay as fallback
            setTimeout(() => {
              if (ws.isReadyForSubscriptions()) {
                const intervalsToSubscribe = getIntervalsToSubscribe(interval)
                console.log(
                  `[TradingView] Fallback subscription for ${listenerGuid}`
                )
                ws.subscribe(tokenAddress, ['kline'], intervalsToSubscribe)
              }
            }, 300)
          }
        }

        subscribeWhenReady()
      } catch (error) {
        console.error('[TradingView] Error in subscribeBars:', error)
      }
    },
    unsubscribeBars: (listenerGuid: string) => {
      try {
        // Get subscription info
        const subscription = activeSubscriptions.get(listenerGuid)
        const listener = realtimeListeners.get(listenerGuid)

        if (subscription && listener) {
          // 🎯 清理心跳检测定时器
          if (subscription.heartbeatInterval) {
            clearInterval(subscription.heartbeatInterval)
            console.log(
              `[TradingView] 🧹 Cleared heartbeat interval for ${listenerGuid}`
            )
          }

          // Remove WebSocket event listener
          ws.off('kline_update', listener)

          // Unsubscribe from WebSocket channel
          ws.unsubscribe(
            subscription.tokenAddress,
            ['kline'],
            [subscription.interval]
          )

          console.log(
            `[TradingView] 🧹 Unsubscribed ${listenerGuid} from ${subscription.interval}`
          )
        }

        // Clean up references
        realtimeListeners.delete(listenerGuid)
        activeSubscriptions.delete(listenerGuid)
      } catch (error) {
        console.error('[TradingView] Error in unsubscribeBars:', error)
      }
    },
  }
  return datafeed
}
