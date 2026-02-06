'use client'

import { useMemo } from 'react'
import { useSyncExternalStore } from 'react'

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
}

function createCountdownStore(targetDate: Date | null) {
  let listeners = new Set<() => void>()
  let lastSnapshot: TimeLeft | null = null

  const calculate = (): TimeLeft | null => {
    if (!targetDate) return null

    const diff = targetDate.getTime() - Date.now()
    if (diff <= 0) return null

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { hours, minutes, seconds }
  }

  const getSnapshot = (): TimeLeft | null => {
    // 返回缓存，避免无限循环
    if (!lastSnapshot) {
      lastSnapshot = calculate()
    }
    return lastSnapshot
  }

  const subscribe = (callback: () => void) => {
    const timer = setInterval(() => {
      const next = calculate()
      // 只有数据变化时才更新
      if (
        !lastSnapshot ||
        next?.hours !== lastSnapshot.hours ||
        next?.minutes !== lastSnapshot.minutes ||
        next?.seconds !== lastSnapshot.seconds
      ) {
        lastSnapshot = next
        callback()
      }
    }, 1000)

    return () => clearInterval(timer)
  }

  return { subscribe, getSnapshot }
}

export function useCountdown(targetDate: Date | null): TimeLeft | null {
  // 保证 targetDate 改变时才重建 store
  const store = useMemo(() => createCountdownStore(targetDate), [targetDate])

  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => null)
}
