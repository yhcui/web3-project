'use client'

import {
  useKlineStore,
  selectConnectionStatus,
  selectLatency,
} from '@/stores/useKlineStore'
import { cn } from '@/lib/utils'

export function KlineConnectionStatus({ className }: { className?: string }) {
  const status = useKlineStore(selectConnectionStatus)
  const latency = useKlineStore(selectLatency)

  const statusConfig = {
    connected: {
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      label: 'Connected',
    },
    connecting: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      label: 'Connecting...',
    },
    reconnecting: {
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
      label: 'Reconnecting...',
    },
    disconnected: {
      color: 'text-gray-500',
      bgColor: 'bg-gray-500',
      label: 'Disconnected',
    },
    error: {
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      label: 'Error',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <div className="relative flex items-center">
        <div className={cn('h-2 w-2 rounded-full', config.bgColor)} />
        {status === 'connected' && (
          <div
            className={cn(
              'absolute h-2 w-2 animate-ping rounded-full',
              config.bgColor
            )}
          />
        )}
      </div>
      <span className={config.color}>{config.label}</span>
      {status === 'connected' && latency !== null && (
        <span className="text-muted-foreground">({latency}ms)</span>
      )}
    </div>
  )
}
