import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { KlineData, TradeData } from '@/lib/websocket/kline/schemas'

interface KlineDataPoint {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  quoteVolume: number
  trades: number
  taker_buy_base_volume: number
  taker_buy_quote_volume: number
}

interface TradeDataPoint {
  price: number
  quantity: number
  timestamp: number
  isBuyerMaker: boolean
  tradeId: string
}

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  connectionId: string | null
  lastConnected: number | null
  lastError: Error | null
  reconnectAttempt: number
  latency: number | null
}

interface Subscription {
  tokens: string[]
  channels: Array<'kline' | 'trade'>
  intervals?: string[]
  subscribedAt: number
}

interface KlineState {
  // Connection state
  connection: ConnectionState

  // Subscriptions
  subscriptions: Map<string, Subscription>

  // Kline data cache (token -> interval -> data array)
  klineData: Map<string, Map<string, KlineDataPoint[]>>

  // Trade data cache (token -> data array)
  tradeData: Map<string, TradeDataPoint[]>

  // Latest prices (token -> price)
  latestPrices: Map<string, number>

  // Actions
  setConnectionStatus: (status: ConnectionState['status']) => void
  setConnectionId: (id: string | null) => void
  setLatency: (latency: number) => void
  setError: (error: Error | null) => void

  addSubscription: (key: string, subscription: Subscription) => void
  removeSubscription: (key: string) => void
  clearSubscriptions: () => void

  updateKlineData: (
    token: string,
    interval: string,
    data: KlineDataPoint
  ) => void
  setKlineData: (
    token: string,
    interval: string,
    data: KlineDataPoint[]
  ) => void

  updateTradeData: (token: string, data: TradeDataPoint) => void
  setTradeData: (token: string, data: TradeDataPoint[]) => void

  updateLatestPrice: (token: string, price: number) => void

  clearData: () => void
  reset: () => void
}

const MAX_KLINE_POINTS = 1000 // Maximum kline data points to keep per interval
const MAX_TRADE_POINTS = 100 // Maximum trade data points to keep

export const useKlineStore = create<KlineState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    connection: {
      status: 'disconnected',
      connectionId: null,
      lastConnected: null,
      lastError: null,
      reconnectAttempt: 0,
      latency: null,
    },

    subscriptions: new Map(),
    klineData: new Map(),
    tradeData: new Map(),
    latestPrices: new Map(),

    // Connection actions
    setConnectionStatus: (status) =>
      set((state) => ({
        connection: {
          ...state.connection,
          status,
          lastConnected:
            status === 'connected'
              ? Date.now()
              : state.connection.lastConnected,
          reconnectAttempt:
            status === 'reconnecting'
              ? state.connection.reconnectAttempt + 1
              : status === 'connected'
                ? 0
                : state.connection.reconnectAttempt,
        },
      })),

    setConnectionId: (id) =>
      set((state) => ({
        connection: {
          ...state.connection,
          connectionId: id,
        },
      })),

    setLatency: (latency) =>
      set((state) => ({
        connection: {
          ...state.connection,
          latency,
        },
      })),

    setError: (error) =>
      set((state) => ({
        connection: {
          ...state.connection,
          lastError: error,
          status: error ? 'error' : state.connection.status,
        },
      })),

    // Subscription actions
    addSubscription: (key, subscription) =>
      set((state) => {
        const newSubscriptions = new Map(state.subscriptions)
        newSubscriptions.set(key, subscription)
        return { subscriptions: newSubscriptions }
      }),

    removeSubscription: (key) =>
      set((state) => {
        const newSubscriptions = new Map(state.subscriptions)
        newSubscriptions.delete(key)
        return { subscriptions: newSubscriptions }
      }),

    clearSubscriptions: () => set({ subscriptions: new Map() }),

    // Kline data actions
    updateKlineData: (token, interval, data) =>
      set((state) => {
        const newKlineData = new Map(state.klineData)

        if (!newKlineData.has(token)) {
          newKlineData.set(token, new Map())
        }

        const tokenData = newKlineData.get(token)!
        const intervalData = tokenData.get(interval) || []

        // Add new data point
        const updatedData = [...intervalData, data]

        // Keep only the last MAX_KLINE_POINTS
        if (updatedData.length > MAX_KLINE_POINTS) {
          updatedData.shift()
        }

        tokenData.set(interval, updatedData)

        // Update latest price from kline close
        const newLatestPrices = new Map(state.latestPrices)
        newLatestPrices.set(token, data.close)

        return {
          klineData: newKlineData,
          latestPrices: newLatestPrices,
        }
      }),

    setKlineData: (token, interval, data) =>
      set((state) => {
        const newKlineData = new Map(state.klineData)

        if (!newKlineData.has(token)) {
          newKlineData.set(token, new Map())
        }

        const tokenData = newKlineData.get(token)!
        tokenData.set(interval, data.slice(-MAX_KLINE_POINTS))

        // Update latest price if data is not empty
        if (data.length > 0) {
          const newLatestPrices = new Map(state.latestPrices)
          newLatestPrices.set(token, data[data.length - 1].close)
          return {
            klineData: newKlineData,
            latestPrices: newLatestPrices,
          }
        }

        return { klineData: newKlineData }
      }),

    // Trade data actions
    updateTradeData: (token, data) =>
      set((state) => {
        const newTradeData = new Map(state.tradeData)
        const trades = newTradeData.get(token) || []

        // Add new trade
        const updatedTrades = [...trades, data]

        // Keep only the last MAX_TRADE_POINTS
        if (updatedTrades.length > MAX_TRADE_POINTS) {
          updatedTrades.shift()
        }

        newTradeData.set(token, updatedTrades)

        // Update latest price from trade
        const newLatestPrices = new Map(state.latestPrices)
        newLatestPrices.set(token, data.price)

        return {
          tradeData: newTradeData,
          latestPrices: newLatestPrices,
        }
      }),

    setTradeData: (token, data) =>
      set((state) => {
        const newTradeData = new Map(state.tradeData)
        newTradeData.set(token, data.slice(-MAX_TRADE_POINTS))

        // Update latest price if data is not empty
        if (data.length > 0) {
          const newLatestPrices = new Map(state.latestPrices)
          newLatestPrices.set(token, data[data.length - 1].price)
          return {
            tradeData: newTradeData,
            latestPrices: newLatestPrices,
          }
        }

        return { tradeData: newTradeData }
      }),

    updateLatestPrice: (token, price) =>
      set((state) => {
        const newLatestPrices = new Map(state.latestPrices)
        newLatestPrices.set(token, price)
        return { latestPrices: newLatestPrices }
      }),

    // Clear actions
    clearData: () =>
      set({
        klineData: new Map(),
        tradeData: new Map(),
        latestPrices: new Map(),
      }),

    reset: () =>
      set({
        connection: {
          status: 'disconnected',
          connectionId: null,
          lastConnected: null,
          lastError: null,
          reconnectAttempt: 0,
          latency: null,
        },
        subscriptions: new Map(),
        klineData: new Map(),
        tradeData: new Map(),
        latestPrices: new Map(),
      }),
  }))
)

// Selectors
export const selectConnectionStatus = (state: KlineState) =>
  state.connection.status
export const selectConnectionId = (state: KlineState) =>
  state.connection.connectionId
export const selectLatency = (state: KlineState) => state.connection.latency
export const selectIsConnected = (state: KlineState) =>
  state.connection.status === 'connected'

export const selectKlineData =
  (token: string, interval: string) => (state: KlineState) => {
    return state.klineData.get(token)?.get(interval) || []
  }

export const selectTradeData = (token: string) => (state: KlineState) => {
  return state.tradeData.get(token) || []
}

export const selectLatestPrice = (token: string) => (state: KlineState) => {
  return state.latestPrices.get(token)
}

export const selectSubscriptions = (state: KlineState) => state.subscriptions
