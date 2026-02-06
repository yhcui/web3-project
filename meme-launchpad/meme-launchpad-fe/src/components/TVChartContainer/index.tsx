import { memo, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
} from '@/public/static/charting_library'
import { widget } from '@/public/static/charting_library'
import {
  getDefaultChartProps,
  getChartStyleOverrides,
  DEFAULT_PERIOD,
} from './constants/tvChart'
import { createDatafeed } from './lib/datafeed'
import { getKlineWebSocketClient } from '@/lib/websocket/kline/client'
import type { TokenDetail } from '@/api/schemas/trade.schema'
import type { Bar } from '@/public/static/charting_library'
import styles from './index.module.css'
import LoadingImg from '@/assets/common/loading.gif'
import { useUIStore } from '@/stores/useUIStore'

export const TVChartContainer = ({
  tokenInfo,
}: {
  tokenInfo: TokenDetail | null | undefined
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null)
  const ws = getKlineWebSocketClient()
  const lastData = useRef<Bar | null>(null)
  const datafeedRef = useRef<any>(null)
  const currentQuoteRef = useRef<'USD' | 'BNB'>('BNB')
  const currentModeRef = useRef<'PRICE' | 'MARKET_CAP'>('PRICE')
  const isInitializedRef = useRef(false)
  const tokenInfoRef = useRef<TokenDetail | null | undefined>(tokenInfo)

  // 获取K线颜色方案设置
  const { klineColorScheme } = useUIStore()

  // Debug states
  const [wsStatus, setWsStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Update tokenInfo ref whenever tokenInfo changes
  useEffect(() => {
    tokenInfoRef.current = tokenInfo
  }, [tokenInfo])

  // Set up WebSocket event listeners once (independent of tokenInfo changes)
  useEffect(() => {
    console.log('[TVChartContainer] Setting up WebSocket event listeners')

    // Temporary: Add a global kline listener to debug WebSocket reception
    const handleKlineUpdate = (message: any) => {
      const currentTokenInfo = tokenInfoRef.current
      const receivedTokenAddress =
        message.data?.tokenAddress || message.tokenAddress

      console.log('[TVChartContainer] 🔍 Global kline listener received:', {
        hasCurrentToken: !!currentTokenInfo,
        currentTokenAddress: currentTokenInfo?.tokenContractAddress,
        receivedTokenAddress,
        interval: message.data?.interval,
        hasTVWidget: !!tvWidgetRef.current,
        hasDatafeed: !!datafeedRef.current,
      })

      if (
        currentTokenInfo?.tokenContractAddress &&
        receivedTokenAddress &&
        typeof receivedTokenAddress === 'string' &&
        typeof currentTokenInfo.tokenContractAddress === 'string' &&
        receivedTokenAddress.toLowerCase() ===
          currentTokenInfo.tokenContractAddress.toLowerCase()
      ) {
        console.log('[TVChartContainer] ✅ Kline update matches our token!')
        console.log('[TVChartContainer] 📊 Kline update message:', message)
        setLastUpdate(new Date())

        // Test datafeed listeners if they exist
        if (typeof window !== 'undefined' && (window as any).debugDatafeed) {
          console.log('[TVChartContainer] 🔧 Testing datafeed listeners...')
          console.log(
            'Active listeners:',
            (window as any).debugDatafeed.realtimeListeners.size
          )
          ;(window as any).debugDatafeed.testKlineUpdate(message)
        }
      }
    }

    // Note: Kline updates are handled by TradingView datafeed, but we add this for debugging

    const handleSubscribed = () => {
      // Subscription confirmed - no action needed
    }

    const handleTradeUpdate = (message: any) => {
      // Use ref to get current tokenInfo value
      const currentTokenInfo = tokenInfoRef.current
      const receivedTokenAddress =
        message.data?.tokenAddress || message.tokenAddress

      if (
        currentTokenInfo?.tokenContractAddress &&
        receivedTokenAddress &&
        typeof receivedTokenAddress === 'string' &&
        typeof currentTokenInfo.tokenContractAddress === 'string' &&
        receivedTokenAddress.toLowerCase() ===
          currentTokenInfo.tokenContractAddress.toLowerCase()
      ) {
        setLastUpdate(new Date())
        console.log(
          '[TVChartContainer] 📈 Trade update received for current token'
        )
      }
    }

    const handleUnknownMessage = () => {
      // Unknown message - no action needed
    }

    const handleConnected = () => {
      setWsStatus('connected')
    }

    const handleDisconnected = () => {
      setWsStatus('disconnected')
    }

    // Set up monitoring listeners (including temporary kline debug listener)
    ws.on('kline_update', handleKlineUpdate) // Temporary for debugging
    ws.on('trade_update', handleTradeUpdate)
    ws.on('subscribed', handleSubscribed)
    ws.on('unknown-message', handleUnknownMessage)
    ws.on('connected', handleConnected)
    ws.on('disconnected', handleDisconnected)

    // Initial status check
    setWsStatus(ws.isConnected() ? 'connected' : 'disconnected')

    // Cleanup listeners on unmount
    return () => {
      console.log('[TVChartContainer] Cleaning up WebSocket event listeners')
      ws.off('kline_update', handleKlineUpdate) // Temporary debug listener
      ws.off('trade_update', handleTradeUpdate)
      ws.off('subscribed', handleSubscribed)
      ws.off('unknown-message', handleUnknownMessage)
      ws.off('connected', handleConnected)
      ws.off('disconnected', handleDisconnected)
    }
  }, []) // Empty dependency array - set up once

  useEffect(() => {
    // Early return if tokenInfo is not ready
    if (!tokenInfo) {
      return
    }

    // Validate required token info fields
    if (!tokenInfo.tokenContractAddress || !tokenInfo.symbol) {
      return
    }

    // Ensure DOM element is available before proceeding
    if (!chartContainerRef.current) {
      return
    }

    // Clean up previous instance if already initialized
    if (isInitializedRef.current && tvWidgetRef.current) {
      tvWidgetRef.current.remove()
      tvWidgetRef.current = null
    }

    // Ensure WebSocket is connected before creating datafeed
    if (!ws.isConnected()) {
      setWsStatus('connecting')
      ws.connect()
    } else {
      setWsStatus('connected')
    }

    // Create datafeed with WebSocket integration
    datafeedRef.current = createDatafeed(
      ws,
      tokenInfo,
      currentQuoteRef.current,
      currentModeRef.current,
      lastData
    )

    const widgetOptions: ChartingLibraryWidgetOptions = {
      // debug: false,
      symbol: tokenInfo.symbol,
      datafeed:
        datafeedRef.current as unknown as ChartingLibraryWidgetOptions['datafeed'],
      interval: (() => {
        const savedInterval = localStorage.getItem(
          'tradingview.chart.lastUsedTimeBasedResolution'
        )
        const finalInterval = (savedInterval ||
          DEFAULT_PERIOD) as ResolutionString
        console.log('[TVChart] 📊 Chart interval configuration:', {
          savedInterval,
          defaultPeriod: DEFAULT_PERIOD,
          finalInterval,
          tokenSymbol: tokenInfo.symbol,
          // 🎯 重要调试：显示实际使用的interval
          actualChartInterval: finalInterval,
          isUsingSavedInterval: !!savedInterval,
          wouldDefault: !savedInterval,
          // 🚨 检查是否被localStorage覆盖为15m
          possibleIssue:
            savedInterval === '15' ? 'FOUND: Saved interval is 15m!' : 'OK',
        })
        return finalInterval
      })(),
      container: chartContainerRef.current,
      ...getDefaultChartProps(klineColorScheme),
    } as unknown as ChartingLibraryWidgetOptions

    const tvWidget = new widget(widgetOptions)
    tvWidgetRef.current = tvWidget
    isInitializedRef.current = true

    tvWidget.onChartReady(() => {
      console.log('[TVChartContainer] 📊 TradingView chart ready!', {
        hasWidget: !!tvWidgetRef.current,
        hasDatafeed: !!datafeedRef.current,
        tokenAddress: tokenInfo.tokenContractAddress,
        symbol: tokenInfo.symbol,
        colorScheme: klineColorScheme,
      })

      // 确保颜色方案正确应用（防止初始化时颜色不对）
      try {
        const colorOverrides = getChartStyleOverrides(klineColorScheme)
        tvWidget.applyOverrides(colorOverrides)
        console.log(
          '[TVChartContainer] 🎨 Initial color scheme applied:',
          klineColorScheme
        )
      } catch (error) {
        console.error(
          '[TVChartContainer] ❌ Failed to apply initial color scheme:',
          error
        )
      }

      // Create volume indicator
      tvWidget.activeChart().createStudy('Volume', false, false, {
        'volume.volume.display': 10,
        'volume.volume.color': '#55bbaa',
        'volume.volume.transparency': 80, // 80% transparency
        'volume.volume ma:plot.color': '#aa68ff',
        'volume.volume ma:plot.transparency': 50, // Moving average transparency
        'volume.show ma': true,
        'volume.ma length': 20,
      })

      // Chart initialization completed
      console.log('[TVChartContainer] ✅ Chart setup completed')
    })

    return () => {
      if (tvWidgetRef.current) {
        // TradingView will automatically call unsubscribeBars during removal
        tvWidgetRef.current.remove()
        tvWidgetRef.current = null
      }

      isInitializedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenInfo?.tokenContractAddress])

  // 监听K线颜色方案变化，无感刷新颜色
  useEffect(() => {
    // 如果图表已经初始化，则直接应用新的颜色配置
    if (isInitializedRef.current && tvWidgetRef.current) {
      console.log(
        '[TVChartContainer] 🎨 Kline color scheme changed, applying new colors...',
        klineColorScheme
      )

      try {
        // 获取新的颜色配置
        const newColorOverrides = getChartStyleOverrides(klineColorScheme)

        // 应用新的颜色配置到当前图表
        tvWidgetRef.current.applyOverrides(newColorOverrides)

        console.log(
          '[TVChartContainer] ✅ Color scheme applied successfully!',
          klineColorScheme
        )
      } catch (error) {
        console.error(
          '[TVChartContainer] ❌ Failed to apply color scheme:',
          error
        )
      }
    }
  }, [klineColorScheme])

  return (
    <div className="relative h-full">
      {/* Always render the chart container */}
      <div ref={chartContainerRef} className={styles.TVChartContainer} />

      {/* Overlay loading state when tokenInfo is not available */}
      {!tokenInfo && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#181A20]">
          <Image src={LoadingImg} alt="loading" width={46} height={46} />
        </div>
      )}
    </div>
  )
}

export default memo(TVChartContainer)
