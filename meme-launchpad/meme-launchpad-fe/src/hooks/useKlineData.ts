/**
 * Hook for subscribing to kline data for a specific token
 * 用于订阅特定 token 的 K线数据
 */

import { useEffect } from 'react'
import { useKlineStore } from '@/stores/useKlineStore'
import { getKlineWebSocketClient } from '@/lib/websocket/kline/client'

export function useKlineData(
  tokenAddress: string,
  interval: string = '1m',
  autoSubscribe: boolean = true
) {
  const klineData = useKlineStore((state) => state.klineData.get(tokenAddress))
  const connectionStatus = useKlineStore((state) => state.connection.status)

  useEffect(() => {
    if (!autoSubscribe || !tokenAddress || connectionStatus !== 'connected') {
      return
    }

    const ws = getKlineWebSocketClient()

    // Subscribe to kline data
    console.log(
      `[useKlineData] Subscribing to ${tokenAddress} with interval ${interval}`
    )
    ws.subscribe(tokenAddress, ['kline'], [interval])

    // Cleanup: unsubscribe when component unmounts or token changes
    return () => {
      console.log(`[useKlineData] Unsubscribing from ${tokenAddress}`)
      ws.unsubscribe(tokenAddress, ['kline'], [interval])
    }
  }, [tokenAddress, interval, autoSubscribe, connectionStatus])

  return {
    data: klineData,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
  }
}

/**
 * Hook for subscribing to trade data for a specific token
 * 用于订阅特定 token 的交易数据
 */
export function useTradeData(
  tokenAddress: string,
  autoSubscribe: boolean = true
) {
  const tradeData = useKlineStore((state) => state.tradeData.get(tokenAddress))
  const connectionStatus = useKlineStore((state) => state.connection.status)

  useEffect(() => {
    if (!autoSubscribe || !tokenAddress || connectionStatus !== 'connected') {
      return
    }

    const ws = getKlineWebSocketClient()

    // Subscribe to trade data
    console.log(`[useTradeData] Subscribing to trades for ${tokenAddress}`)
    ws.subscribe(tokenAddress, ['trade'])

    // Cleanup: unsubscribe when component unmounts or token changes
    return () => {
      console.log(
        `[useTradeData] Unsubscribing from trades for ${tokenAddress}`
      )
      ws.unsubscribe(tokenAddress, ['trade'])
    }
  }, [tokenAddress, autoSubscribe, connectionStatus])

  return {
    data: tradeData,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
  }
}

/**
 * Hook for subscribing to both kline and trade data
 * 用于同时订阅 K线和交易数据
 */
export function useTokenRealtimeData(
  tokenAddress: string,
  interval: string = '1m',
  autoSubscribe: boolean = true
) {
  const kline = useKlineData(tokenAddress, interval, autoSubscribe)
  const trades = useTradeData(tokenAddress, autoSubscribe)

  return {
    kline: kline.data,
    trades: trades.data,
    isConnected: kline.isConnected,
    connectionStatus: kline.connectionStatus,
  }
}
