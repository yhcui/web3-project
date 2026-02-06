'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { getKlineWebSocketClient } from '@/lib/websocket/kline/client'
import type { KlineUpdate, TradeUpdate } from '@/lib/websocket/kline/schemas'

// Hook for managing WebSocket connection (lightweight version)
export function useWebSocketConnection() {
  const client = useRef(getKlineWebSocketClient())
  const [isConnected, setIsConnected] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [latency, setLatency] = useState(0)

  useEffect(() => {
    const ws = client.current

    // Load cached connection ID
    ws.loadConnectionId()

    // Setup event listeners
    const handleConnected = () => {
      setIsConnected(true)
    }

    const handleDisconnected = () => {
      setIsConnected(false)
    }

    const handleConnectionId = (id: string) => {
      setConnectionId(id)
    }

    const handlePong = ({ latency }: { latency: number }) => {
      setLatency(latency)
    }

    // Attach event listeners
    ws.on('connected', handleConnected)
    ws.on('disconnected', handleDisconnected)
    ws.on('connectionId', handleConnectionId)
    ws.on('pong', handlePong)

    // Connect
    ws.connect()

    // Cleanup
    return () => {
      ws.off('connected', handleConnected)
      ws.off('disconnected', handleDisconnected)
      ws.off('connectionId', handleConnectionId)
      ws.off('pong', handlePong)
    }
  }, [])

  const disconnect = useCallback(() => {
    client.current.disconnect()
  }, [])

  const reconnect = useCallback(() => {
    client.current.connect()
  }, [])

  return {
    isConnected,
    connectionId,
    latency,
    disconnect,
    reconnect,
  }
}

// Hook for subscribing to token real-time data (kline + trade)
export function useTokenRealtimeData(
  tokenAddress: string,
  interval: string = '1m',
  enabled: boolean = true
) {
  const client = useRef(getKlineWebSocketClient())
  const [klineData, setKlineData] = useState<KlineUpdate['data'] | null>(null)
  const [tradeData, setTradeData] = useState<TradeUpdate['data'] | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const ws = client.current

    // Check connection status
    const checkConnection = () => {
      setIsConnected(ws.isConnected())
    }

    // Listen for connection changes
    ws.on('connected', checkConnection)
    ws.on('disconnected', checkConnection)

    // Initial check
    checkConnection()

    return () => {
      ws.off('connected', checkConnection)
      ws.off('disconnected', checkConnection)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !isConnected || !tokenAddress) return

    const ws = client.current

    // Handle kline updates
    const handleKlineUpdate = (data: KlineUpdate['data']) => {
      if (
        data?.tokenAddress &&
        typeof data.tokenAddress === 'string' &&
        typeof tokenAddress === 'string' &&
        data.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
      ) {
        setKlineData(data)
      }
    }

    // Handle trade updates
    const handleTradeUpdate = (data: TradeUpdate['data']) => {
      if (
        data?.tokenAddress &&
        typeof data.tokenAddress === 'string' &&
        typeof tokenAddress === 'string' &&
        data.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
      ) {
        setTradeData(data)
      }
    }

    // Subscribe to both kline and trade channels for this token
    ws.subscribe(tokenAddress, ['kline', 'trade'], [interval])

    // Listen for updates
    ws.on('kline_update', handleKlineUpdate)
    ws.on('trade_update', handleTradeUpdate)

    // Cleanup
    return () => {
      ws.unsubscribe(tokenAddress, ['kline', 'trade'])
      ws.off('kline_update', handleKlineUpdate)
      ws.off('trade_update', handleTradeUpdate)
    }
  }, [tokenAddress, interval, isConnected, enabled])

  return {
    klineData,
    tradeData,
    isConnected,
  }
}

// Hook specifically for kline data subscription
export function useKlineData(
  tokenAddress: string,
  interval: string = '1m',
  onUpdate?: (data: KlineUpdate['data']) => void
) {
  const client = useRef(getKlineWebSocketClient())
  const [data, setData] = useState<KlineUpdate['data'] | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const listenerRef = useRef<((data: any) => void) | null>(null)
  const connectionListenersRef = useRef<{
    connected: () => void
    disconnected: () => void
  } | null>(null)
  const subscriptionRef = useRef<{ token: string; interval: string } | null>(
    null
  )

  // Store callback in a ref to avoid re-subscription
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    const ws = client.current

    // Remove old connection listeners if they exist
    if (connectionListenersRef.current) {
      ws.off('connected', connectionListenersRef.current.connected)
      ws.off('disconnected', connectionListenersRef.current.disconnected)
    }

    // Check connection status
    const checkConnection = () => {
      setIsConnected(ws.isConnected())
    }

    // Store new listeners
    connectionListenersRef.current = {
      connected: checkConnection,
      disconnected: checkConnection,
    }

    // Listen for connection changes
    ws.on('connected', checkConnection)
    ws.on('disconnected', checkConnection)

    // Initial check
    checkConnection()

    return () => {
      if (connectionListenersRef.current) {
        ws.off('connected', connectionListenersRef.current.connected)
        ws.off('disconnected', connectionListenersRef.current.disconnected)
        connectionListenersRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isConnected || !tokenAddress) return

    const ws = client.current

    // Clean up previous subscription if token or interval changed
    if (subscriptionRef.current) {
      const { token: prevToken, interval: prevInterval } =
        subscriptionRef.current
      if (prevToken !== tokenAddress || prevInterval !== interval) {
        // Unsubscribe from previous
        ws.unsubscribe(prevToken, ['kline'], [prevInterval])
        if (listenerRef.current) {
          ws.off('kline_update', listenerRef.current)
          listenerRef.current = null
        }
      }
    }

    // Handle kline updates
    const handleKlineUpdate = (updateData: KlineUpdate['data']) => {
      if (
        updateData?.tokenAddress &&
        typeof updateData.tokenAddress === 'string' &&
        typeof tokenAddress === 'string' &&
        updateData.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
      ) {
        setData(updateData)
        onUpdateRef.current?.(updateData)
      }
    }

    // Remove old listener if it exists (safety check)
    if (listenerRef.current) {
      ws.off('kline_update', listenerRef.current)
    }

    // Store the listener and subscription info
    listenerRef.current = handleKlineUpdate
    subscriptionRef.current = { token: tokenAddress, interval }

    // Subscribe to kline channel for this token
    ws.subscribe(tokenAddress, ['kline'], [interval])

    // Listen for updates
    ws.on('kline_update', handleKlineUpdate)

    // Cleanup
    return () => {
      // Only unsubscribe if this is still the current subscription
      if (
        subscriptionRef.current?.token === tokenAddress &&
        subscriptionRef.current?.interval === interval
      ) {
        ws.unsubscribe(tokenAddress, ['kline'], [interval])
        subscriptionRef.current = null
      }

      // Always remove the listener using the stored reference
      if (listenerRef.current === handleKlineUpdate) {
        ws.off('kline_update', handleKlineUpdate)
        listenerRef.current = null
      }

      // Clear data on unmount to prevent stale data
      setData(null)
    }
  }, [tokenAddress, interval, isConnected])

  return {
    data,
    isConnected,
  }
}

// Hook specifically for trade data subscription
export function useTradeData(
  tokenAddress: string,
  onUpdate?: (data: TradeUpdate['data']) => void
) {
  const client = useRef(getKlineWebSocketClient())
  const [data, setData] = useState<TradeUpdate['data'] | null>(null)
  const [trades, setTrades] = useState<TradeUpdate['data']['data'][]>([])
  const [isConnected, setIsConnected] = useState(false)
  const listenerRef = useRef<((data: any) => void) | null>(null)
  const connectionListenersRef = useRef<{
    connected: () => void
    disconnected: () => void
  } | null>(null)
  const subscriptionRef = useRef<string | null>(null)

  // Store callback in a ref to avoid re-subscription
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    const ws = client.current

    // Remove old connection listeners if they exist
    if (connectionListenersRef.current) {
      ws.off('connected', connectionListenersRef.current.connected)
      ws.off('disconnected', connectionListenersRef.current.disconnected)
    }

    // Check connection status
    const checkConnection = () => {
      setIsConnected(ws.isConnected())
    }

    // Store new listeners
    connectionListenersRef.current = {
      connected: checkConnection,
      disconnected: checkConnection,
    }

    // Listen for connection changes
    ws.on('connected', checkConnection)
    ws.on('disconnected', checkConnection)

    // Initial check
    checkConnection()

    return () => {
      if (connectionListenersRef.current) {
        ws.off('connected', connectionListenersRef.current.connected)
        ws.off('disconnected', connectionListenersRef.current.disconnected)
        connectionListenersRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isConnected || !tokenAddress) return

    const ws = client.current

    // Clean up previous subscription if token changed
    if (subscriptionRef.current && subscriptionRef.current !== tokenAddress) {
      ws.unsubscribe(subscriptionRef.current, ['trade'])
      if (listenerRef.current) {
        ws.off('trade_update', listenerRef.current)
        listenerRef.current = null
      }
      setTrades([]) // Clear old trades
    }

    // Handle trade updates
    const handleTradeUpdate = (updateData: TradeUpdate['data']) => {
      if (
        updateData?.tokenAddress &&
        typeof updateData.tokenAddress === 'string' &&
        typeof tokenAddress === 'string' &&
        updateData.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
      ) {
        setData(updateData)
        // Keep a buffer of recent trades (last 50)
        setTrades((prev) => {
          // Check for duplicate trade before adding
          const isDuplicate = prev.some(
            (trade) =>
              trade.txHash === updateData.data.txHash &&
              trade.timestamp === updateData.data.timestamp
          )
          if (isDuplicate) return prev
          return [updateData.data, ...prev].slice(0, 50)
        })
        onUpdateRef.current?.(updateData)
      }
    }

    // Remove old listener if it exists (safety check)
    if (listenerRef.current) {
      ws.off('trade_update', listenerRef.current)
    }

    // Store the listener and subscription info
    listenerRef.current = handleTradeUpdate
    subscriptionRef.current = tokenAddress

    // Subscribe to trade channel for this token
    ws.subscribe(tokenAddress, ['trade'])

    // Listen for updates
    ws.on('trade_update', handleTradeUpdate)

    // Cleanup
    return () => {
      // Only unsubscribe if this is still the current subscription
      if (subscriptionRef.current === tokenAddress) {
        ws.unsubscribe(tokenAddress, ['trade'])
        subscriptionRef.current = null
      }

      // Always remove the listener using the stored reference
      if (listenerRef.current === handleTradeUpdate) {
        ws.off('trade_update', handleTradeUpdate)
        listenerRef.current = null
      }

      // Clear trades on unmount to prevent memory leak
      setTrades([])
      setData(null)
    }
  }, [tokenAddress, isConnected])

  return {
    latestTrade: data,
    trades,
    isConnected,
  }
}

// Hook to handle page leave cleanup
export function useWebSocketCleanup(tokenAddress?: string) {
  const client = useRef(getKlineWebSocketClient())

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Unsubscribe from specific token or all
      if (tokenAddress) {
        client.current.unsubscribe(tokenAddress, ['kline', 'trade'])
      } else {
        client.current.unsubscribeAll()
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[KlineWS] Page hidden, maintaining connection')
      } else {
        console.log('[KlineWS] Page visible')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // Cleanup on component unmount
      handleBeforeUnload()
    }
  }, [tokenAddress])
}
