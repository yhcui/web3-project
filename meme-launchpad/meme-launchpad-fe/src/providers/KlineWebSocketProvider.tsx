'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  useWebSocketConnection,
  useWebSocketCleanup,
} from '@/hooks/useTokenWebSocket'

interface KlineWebSocketProviderProps {
  children: ReactNode
  routes?: string[] // Routes that need WebSocket
}

export function KlineWebSocketProvider({
  children,
  routes = ['/token'], // Default: only token pages
}: KlineWebSocketProviderProps) {
  const pathname = usePathname()
  const { isConnected, disconnect, reconnect } = useWebSocketConnection()

  // Setup cleanup on page leave
  useWebSocketCleanup()

  // Check if current route needs WebSocket
  const shouldConnect = routes.some((route) => pathname.includes(route))

  useEffect(() => {
    if (shouldConnect && !isConnected) {
      // Connect when entering a route that needs WebSocket
      console.log('[KlineWSProvider] Connecting for route:', pathname)
      reconnect()
    } else if (!shouldConnect && isConnected) {
      // Disconnect when leaving WebSocket routes
      console.log(
        '[KlineWSProvider] Disconnecting - route does not need WS:',
        pathname
      )
      disconnect()
    }
  }, [shouldConnect, isConnected, pathname, reconnect, disconnect])

  return <>{children}</>
}
