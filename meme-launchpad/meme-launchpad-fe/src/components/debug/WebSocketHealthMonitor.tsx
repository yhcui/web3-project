'use client'

import { useEffect, useState } from 'react'
import { getKlineWebSocketClient } from '@/lib/websocket/kline/client'
import { cn } from '@/lib/utils'

interface WebSocketHealthMonitorProps {
  className?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function WebSocketHealthMonitor({
  className,
  position = 'bottom-right',
}: WebSocketHealthMonitorProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Map<string, Set<string>>>(
    new Map()
  )
  const [refCounts, setRefCounts] = useState<Map<string, number>>(new Map())
  const [latency, setLatency] = useState(0)
  const [eventListenerCount, setEventListenerCount] = useState(0)

  useEffect(() => {
    const ws = getKlineWebSocketClient()

    const updateStatus = () => {
      setIsConnected(ws.isConnected())
      setSubscriptions(ws.getSubscriptions())
      setRefCounts(ws.getSubscriptionRefCounts())
    }

    const handleConnected = () => {
      updateStatus()
    }

    const handleDisconnected = () => {
      updateStatus()
    }

    const handlePong = ({ latency: newLatency }: { latency: number }) => {
      setLatency(newLatency)
    }

    const handleSubscribed = () => {
      updateStatus()
    }

    const handleUnsubscribed = () => {
      updateStatus()
    }

    // Count event listeners periodically
    const countListeners = () => {
      let count = 0
      const eventNames = ws.eventNames()
      eventNames.forEach((event) => {
        count += ws.listenerCount(event)
      })
      setEventListenerCount(count)
    }

    // Initial status
    updateStatus()
    countListeners()

    // Listen to events
    ws.on('connected', handleConnected)
    ws.on('disconnected', handleDisconnected)
    ws.on('pong', handlePong)
    ws.on('subscribed', handleSubscribed)
    ws.on('unsubscribed', handleUnsubscribed)

    // Update listener count periodically
    const interval = setInterval(() => {
      countListeners()
      updateStatus()
    }, 2000)

    return () => {
      ws.off('connected', handleConnected)
      ws.off('disconnected', handleDisconnected)
      ws.off('pong', handlePong)
      ws.off('subscribed', handleSubscribed)
      ws.off('unsubscribed', handleUnsubscribed)
      clearInterval(interval)
    }
  }, [])

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const totalSubscriptions = Array.from(subscriptions.values()).reduce(
    (acc, channels) => acc + channels.size,
    0
  )

  const totalRefCount = Array.from(refCounts.values()).reduce(
    (acc, count) => acc + count,
    0
  )

  // Determine health status
  const getHealthStatus = () => {
    if (!isConnected) return 'disconnected'
    if (eventListenerCount > 50) return 'warning'
    if (latency > 1000) return 'warning'
    if (totalRefCount > totalSubscriptions * 2) return 'warning'
    return 'healthy'
  }

  const healthStatus = getHealthStatus()

  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    disconnected: 'bg-red-500',
  }

  return (
    <div
      className={cn(
        'fixed z-50 max-w-[350px] min-w-[250px] rounded-lg bg-black/90 p-3 font-mono text-xs text-white',
        positionClasses[position],
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold">WebSocket Health</span>
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            statusColors[healthStatus],
            healthStatus !== 'disconnected' && 'animate-pulse'
          )}
        />
      </div>

      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span className="opacity-70">Status:</span>
          <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="opacity-70">Latency:</span>
          <span
            className={
              latency > 1000
                ? 'text-yellow-400'
                : latency > 500
                  ? 'text-yellow-300'
                  : 'text-green-400'
            }
          >
            {latency}ms
          </span>
        </div>

        <div className="flex justify-between">
          <span className="opacity-70">Subscriptions:</span>
          <span>{totalSubscriptions}</span>
        </div>

        <div className="flex justify-between">
          <span className="opacity-70">Ref Count:</span>
          <span
            className={
              totalRefCount > totalSubscriptions * 2
                ? 'text-yellow-400'
                : 'text-green-400'
            }
          >
            {totalRefCount}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="opacity-70">Event Listeners:</span>
          <span
            className={
              eventListenerCount > 50
                ? 'text-red-400'
                : eventListenerCount > 30
                  ? 'text-yellow-400'
                  : 'text-green-400'
            }
          >
            {eventListenerCount}
          </span>
        </div>

        {/* Show active subscriptions */}
        {subscriptions.size > 0 && (
          <div className="mt-2 border-t border-white/20 pt-2">
            <div className="mb-1 font-bold">Active Subscriptions:</div>
            {Array.from(subscriptions.entries()).map(([token, channels]) => (
              <div key={token} className="ml-2">
                <div className="truncate" title={token}>
                  {token.slice(0, 8)}...{token.slice(-6)}
                </div>
                <div className="ml-2 opacity-70">
                  {Array.from(channels).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {eventListenerCount > 50 && (
          <div className="mt-2 border-t border-white/20 pt-2 text-yellow-400">
            ⚠️ High event listener count detected
          </div>
        )}

        {totalRefCount > totalSubscriptions * 2 && (
          <div className="mt-2 border-t border-white/20 pt-2 text-yellow-400">
            ⚠️ Reference count mismatch detected
          </div>
        )}

        {latency > 1000 && (
          <div className="mt-2 border-t border-white/20 pt-2 text-yellow-400">
            ⚠️ High latency detected
          </div>
        )}
      </div>
    </div>
  )
}
