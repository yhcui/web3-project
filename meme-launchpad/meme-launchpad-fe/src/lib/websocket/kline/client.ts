import { EventEmitter } from 'events'
import {
  WebSocketMessageSchema,
  LenientWebSocketMessageSchema,
  PingMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  ConnectionResponse,
  DataMessage,
  ErrorMessage,
  PongMessage,
  KlineUpdate,
  TradeUpdate,
} from './schemas'
import {
  validateWebSocketMessage,
  identifyAndValidateMessage,
  debugMessageStructure,
} from './validation-helper'

interface KlineWebSocketOptions {
  url?: string
  reconnectAttempts?: number
  reconnectDelay?: number
  pingInterval?: number
  pongTimeout?: number
}

export class KlineWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null
  private url: string
  private connectionId: string | null = null
  private reconnectAttempts: number
  private reconnectDelay: number
  private currentReconnectAttempts = 0
  private pingInterval: number
  private pongTimeout: number
  private pingTimer: NodeJS.Timeout | null = null
  private pongTimer: NodeJS.Timeout | null = null
  private requestCounter = 0
  private subscriptions = new Map<string, Set<string>>() // token -> channels
  private subscriptionRefCount = new Map<string, number>() // subscription key -> ref count
  private eventListenerCount = new Map<string, number>() // event type -> listener count
  private isIntentionallyClosed = false
  private messageQueue: Array<SubscribeMessage | UnsubscribeMessage> = []
  private isReady = false

  constructor(options: KlineWebSocketOptions = {}) {
    super()
    this.url = options.url || `${process.env.NEXT_PUBLIC_WS_URL}/kline/conn`
    this.reconnectAttempts = options.reconnectAttempts ?? 5
    this.reconnectDelay = options.reconnectDelay ?? 1000
    this.pingInterval = options.pingInterval ?? 30000 // 30 seconds
    this.pongTimeout = options.pongTimeout ?? 5000 // 5 seconds
  }

  // Connect to WebSocket server
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[KlineWS] Already connected')
      return
    }

    this.isIntentionallyClosed = false
    const connectionUrl = this.connectionId
      ? `${this.url}?connectionId=${this.connectionId}`
      : this.url

    console.log('[KlineWS] Connecting to:', connectionUrl)

    try {
      this.ws = new WebSocket(connectionUrl)
      this.setupEventHandlers()
    } catch (error) {
      console.error('[KlineWS] Connection error:', error)
      this.handleReconnect()
    }
  }

  // Setup WebSocket event handlers
  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = this.handleOpen.bind(this)
    this.ws.onmessage = this.handleMessage.bind(this)
    this.ws.onerror = this.handleError.bind(this)
    this.ws.onclose = this.handleClose.bind(this)
  }

  // Handle connection open
  private handleOpen(): void {
    console.log('[KlineWS] 🔗 WebSocket connection opened')
    this.currentReconnectAttempts = 0
    // 🎯 不要在这里设置isReady，等待connectionId
    console.log('[KlineWS] 🕐 Waiting for connectionId to be fully ready...')
    this.emit('connected')

    // Start health monitoring
    this.startHealthMonitoring()

    // Process queued messages
    this.processMessageQueue()

    // Restore subscriptions if reconnecting
    if (this.connectionId && this.subscriptions.size > 0) {
      console.log('[KlineWS] 🔄 Restoring existing subscriptions...')
      this.restoreSubscriptions()
    }
  }

  // Handle incoming messages
  private handleMessage(event: MessageEvent): void {
    try {
      const rawData = event.data

      // Handle multiple JSON objects in one message (split by newlines or concatenated)
      const jsonMessages = this.parseMultipleJsonObjects(rawData)

      // Process each JSON message separately
      for (const data of jsonMessages) {
        this.processMessage(data, rawData)
      }
    } catch (error: any) {
      // Improved error handling with better context
      console.error('[KlineWS] ❌ Critical message handling error:', error)
      console.error('[KlineWS] Original event data:', event.data)
      this.emit('error', error)
    }
  }

  // Parse multiple JSON objects from a single message
  private parseMultipleJsonObjects(rawData: string): any[] {
    try {
      // First try to parse as single JSON
      return [JSON.parse(rawData)]
    } catch (error) {
      // If single JSON parse fails, try to split multiple JSON objects
      console.log(
        '[KlineWS] Single JSON parse failed, attempting to split multiple objects'
      )

      const messages: any[] = []

      // Method 1: Split by newlines
      const lines = rawData.split('\n').filter((line) => line.trim())
      if (lines.length > 1) {
        console.log(
          `[KlineWS] Found ${lines.length} JSON objects separated by newlines`
        )
        for (const line of lines) {
          try {
            messages.push(JSON.parse(line.trim()))
          } catch (lineError) {
            console.warn('[KlineWS] Failed to parse line:', line, lineError)
          }
        }
        if (messages.length > 0) return messages
      }

      // Method 2: Split by looking for }{ pattern (concatenated JSON)
      const jsonBoundary = /}\s*{/g
      if (jsonBoundary.test(rawData)) {
        console.log('[KlineWS] Detected concatenated JSON objects')
        const jsonParts = rawData.split(jsonBoundary)

        for (let i = 0; i < jsonParts.length; i++) {
          let jsonStr = jsonParts[i].trim()

          // Add missing braces
          if (i > 0) jsonStr = '{' + jsonStr
          if (i < jsonParts.length - 1) jsonStr = jsonStr + '}'

          try {
            messages.push(JSON.parse(jsonStr))
          } catch (partError) {
            console.warn(
              '[KlineWS] Failed to parse JSON part:',
              jsonStr,
              partError
            )
          }
        }
        if (messages.length > 0) return messages
      }

      // If all methods fail, throw the original error
      throw error
    }
  }

  // Process individual message
  private processMessage(data: any, originalRawData: string): void {
    try {
      // DEBUG: Log all important messages for troubleshooting
      if (
        data.type === 'kline_update' ||
        data.type === 'subscribed' ||
        data.type === 'data' ||
        !data.type?.includes('update')
      ) {
        console.log('[KlineWS] 📨 Message received:', {
          type: data.type,
          timestamp: data.timestamp,
          tokenAddress: data.data?.tokenAddress,
          interval: data.data?.interval,
        })
      }

      // First, try lenient validation to identify the message type
      const identified = identifyAndValidateMessage(data)
      if (!identified.success) {
        console.error('[KlineWS] Failed to identify message:', identified.error)
        throw new Error(identified.error as string)
      }

      // For kline_update messages, skip strict validation to avoid unnecessary errors
      let message = data // Default to raw data
      if (data.type !== 'kline_update') {
        // Try strict validation with detailed error reporting for non-kline messages
        const validation = validateWebSocketMessage(
          data,
          WebSocketMessageSchema
        )
        if (!validation.success) {
          console.warn('[KlineWS] Validation failed for:', data.type)
        }
      }

      switch (message.type) {
        case 'connected':
          console.log('[KlineWS] 🎯 Received CONNECTED message:', message)
          this.handleConnectionResponse(message as ConnectionResponse)
          break
        case 'pong':
          this.handlePong(message as PongMessage)
          break
        case 'subscribe':
          // Handle server response with type 'subscribe' (non-standard but seems to be what server sends)
          console.log('[KlineWS] ✅ Server responded to subscription:', message)
          this.emit('subscribed', message)
          break
        case 'subscribed':
          this.emit('subscribed', message)
          break
        case 'unsubscribe':
          // Handle server response with type 'unsubscribe' (confirmation)
          console.log('[KlineWS] ✅ Server confirmed unsubscription:', message)
          this.emit('unsubscribed', message)
          break
        case 'unsubscribed':
          this.emit('unsubscribed', message)
          break
        case 'kline_update':
          try {
            this.handleKlineUpdate(message as KlineUpdate)
          } catch (klineError: any) {
            // Log kline update errors but don't break the flow
            console.error('[KlineWS] ❌ Kline update processing failed:', {
              error: klineError.message,
              tokenAddress: message.data?.tokenAddress,
              interval: message.data?.interval,
              timestamp: message.timestamp,
            })
          }
          break
        case 'trade_update':
          this.handleTradeUpdate(message as TradeUpdate)
          break
        case 'data':
          this.handleData(message as DataMessage)
          break
        case 'error':
          this.handleErrorMessage(message as ErrorMessage)
          break
        default:
          console.warn(
            '[KlineWS] Unknown or unhandled message type:',
            message.type
          )
          console.log('[KlineWS] Full message:', message)
          // Emit a generic event for unknown message types
          this.emit('unknown-message', message)
      }
    } catch (error: any) {
      // Improved error handling with better context
      if (originalRawData.includes('"type":"kline_update"')) {
        console.warn(
          '[KlineWS] ⚠️ Kline update message caused error (skipping):',
          {
            error: error.message,
            rawData: originalRawData,
          }
        )
      } else {
        console.error('[KlineWS] ❌ Message processing error:', error)
        console.error('[KlineWS] Original raw data:', originalRawData)
        console.error('[KlineWS] Parsed data:', data)
        this.emit('error', error)
      }
    }
  }

  // Handle connection response with connectionId
  private handleConnectionResponse(message: ConnectionResponse): void {
    const oldConnectionId = this.connectionId
    this.connectionId = message.connectionId

    // Cache connectionId in sessionStorage for page-level persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('kline_ws_connection_id', this.connectionId)
    }

    console.log('[KlineWS] 🎯 Connection ID received:', this.connectionId)
    console.log('[KlineWS] 🚀 WebSocket now ready for subscriptions!')
    this.emit('connectionId', this.connectionId)

    // If this is a new connection ID, we're fully ready
    if (oldConnectionId !== this.connectionId) {
      this.isReady = true
      console.log('[KlineWS] ✅ isReady set to true, emitting ready event')
      this.emit('ready')
    }
  }

  // Handle pong message
  private handlePong(message: PongMessage): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer)
      this.pongTimer = null
    }

    const latency = Date.now() - message.data.clientTime
    // Only log high latency
    if (latency > 1000) {
      console.warn('[KlineWS] High latency detected:', latency, 'ms')
    }
    this.emit('pong', { latency, serverTime: message.data.serverTime })
  }

  // Handle kline update message
  private handleKlineUpdate(message: KlineUpdate): void {
    // 🎯 添加详细日志 - 确保每次kline_update都有输出
    console.log('[KlineWS000] 📈 KLINE UPDATE RECEIVED:', {
      timestamp: new Date().toISOString(),
      tokenAddress: message.data?.tokenAddress,
      interval: message.data?.interval,
      price: message.data?.data?.c,
      volume: message.data?.data?.v,
      time: message.data?.data?.t,
      listenerCount: this.listenerCount('kline_update'),
      messageId: Date.now() % 10000, // 消息ID用于追踪
    })

    // Emit the complete message object for proper handling in datafeed
    try {
      this.emit('kline_update', message)
      console.log(
        '[KlineWS] ✅ Emitted kline_update to',
        this.listenerCount('kline_update'),
        'listeners'
      )
    } catch (listenerError: any) {
      // If a listener throws an error, catch it and log details
      console.error('[KlineWS] ❌ Listener error during kline_update emit:', {
        error: listenerError.message,
        listenerCount: this.listenerCount('kline_update'),
        tokenAddress: message.data?.tokenAddress,
        interval: message.data?.interval,
      })
      // Re-throw to let the outer catch handler deal with it
      throw listenerError
    }
  }

  // Handle trade update message
  private handleTradeUpdate(message: TradeUpdate): void {
    // Remove console log for frequent updates
    this.emit('trade_update', message.data)
  }

  // Handle data message (legacy support)
  private handleData(message: DataMessage): void {
    if (message.channel === 'kline') {
      this.emit('kline', message.data)
    } else if (message.channel === 'trade') {
      this.emit('trade', message.data)
    }
    this.emit('data', message)
  }

  // Handle error message
  private handleErrorMessage(message: ErrorMessage): void {
    console.error('[KlineWS] Server error:', message.error)
    this.emit('serverError', message.error)
  }

  // Handle WebSocket error
  private handleError(event: Event): void {
    console.error('[KlineWS] WebSocket error:', event)
    this.emit('error', event)
  }

  // Handle connection close
  private handleClose(event: CloseEvent): void {
    console.log('[KlineWS] Connection closed:', event.code, event.reason)
    this.isReady = false
    this.stopHealthMonitoring()
    this.emit('disconnected', { code: event.code, reason: event.reason })

    if (!this.isIntentionallyClosed) {
      this.handleReconnect()
    }
  }

  // Handle reconnection with exponential backoff
  private handleReconnect(): void {
    if (this.currentReconnectAttempts >= this.reconnectAttempts) {
      console.error('[KlineWS] Max reconnection attempts reached')
      this.emit('reconnectFailed')
      return
    }

    this.currentReconnectAttempts++
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.currentReconnectAttempts - 1),
      30000 // Max 30 seconds
    )

    console.log(
      `[KlineWS] Reconnecting in ${delay}ms (attempt ${this.currentReconnectAttempts}/${this.reconnectAttempts})`
    )
    this.emit('reconnecting', { attempt: this.currentReconnectAttempts, delay })

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  // Start health monitoring with ping/pong
  private startHealthMonitoring(): void {
    this.stopHealthMonitoring()

    this.pingTimer = setInterval(() => {
      this.sendPing()
    }, this.pingInterval)
  }

  // Stop health monitoring
  private stopHealthMonitoring(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer)
      this.pongTimer = null
    }
  }

  // Send ping message
  private sendPing(): void {
    const ping: PingMessage = {
      type: 'ping',
      requestId: `ping_${++this.requestCounter}`,
      timestamp: Math.floor(Date.now() / 1000),
      data: {
        clientTime: Date.now(),
      },
    }

    this.send(ping)

    // Set pong timeout
    this.pongTimer = setTimeout(() => {
      console.warn('[KlineWS] Pong timeout, connection may be lost')
      this.emit('pongTimeout')
      // Force reconnect on pong timeout
      this.ws?.close()
    }, this.pongTimeout)
  }

  // Send message
  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log(`[KlineWS] ⚠️ Cannot send message - WebSocket not ready:`, {
        hasWs: !!this.ws,
        readyState: this.ws?.readyState,
        messageType: message.type,
        queueing:
          message.type === 'subscribe' || message.type === 'unsubscribe',
      })
      if (message.type === 'subscribe' || message.type === 'unsubscribe') {
        this.messageQueue.push(message)
        console.log(
          `[KlineWS] 📋 Message queued. Queue size: ${this.messageQueue.length}`
        )
      }
      return
    }

    try {
      const data = JSON.stringify(message)
      this.ws.send(data)
      // Log subscription and important messages
      if (message.type === 'subscribe') {
        console.log(`[KlineWS] 📤 SUBSCRIBE message sent:`, {
          type: message.type,
          tokens: message.data?.tokens,
          channels: message.data?.channels,
          intervals: message.data?.intervals,
        })
      } else if (message.type !== 'ping') {
        console.log('[KlineWS] 📤 Sent:', message.type)
      }
    } catch (error) {
      console.error('[KlineWS] Send error:', error)
      this.emit('error', error)
    }
  }

  // Process queued messages
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.send(message)
      }
    }
  }

  // Subscribe to channels with reference counting
  subscribe(
    token: string,
    channels: Array<'kline' | 'trade'>,
    intervals?: string[],
    realTimeOnly = false
  ): void {
    // Create subscription key for reference counting
    const subscriptionKey = `${token}:${channels.sort().join(',')}:${intervals?.join(',') || ''}`

    // Check reference count
    const currentCount = this.subscriptionRefCount.get(subscriptionKey) || 0
    this.subscriptionRefCount.set(subscriptionKey, currentCount + 1)

    // Only send subscribe message on first subscription
    if (currentCount === 0) {
      const message: SubscribeMessage = {
        type: 'subscribe',
        requestId: `sub_${++this.requestCounter}`,
        timestamp: Math.floor(Date.now() / 1000),
        data: {
          tokens: [token], // Single token subscription
          channels,
          ...(intervals && { intervals: intervals as any }),
          options: {
            realTimeOnly,
          },
        },
      }

      // Track subscription
      if (!this.subscriptions.has(token)) {
        this.subscriptions.set(token, new Set())
      }
      channels.forEach((channel) => {
        this.subscriptions.get(token)?.add(channel)
      })

      this.send(message)
      console.log(
        `[KlineWS] New subscription created: ${subscriptionKey} (refs: 1)`
      )
    } else {
      console.log(
        `[KlineWS] Subscription reference incremented: ${subscriptionKey} (refs: ${currentCount + 1})`
      )
    }
  }

  // Unsubscribe from channels with reference counting
  unsubscribe(
    token: string,
    channels: Array<'kline' | 'trade'>,
    intervals?: string[]
  ): void {
    // Create subscription key for reference counting
    const subscriptionKey = `${token}:${channels.sort().join(',')}:${intervals?.join(',') || ''}`

    // Check reference count
    const currentCount = this.subscriptionRefCount.get(subscriptionKey) || 0

    if (currentCount <= 0) {
      console.warn(
        `[KlineWS] Attempting to unsubscribe from non-existent subscription: ${subscriptionKey}`
      )
      return
    }

    // Decrement reference count
    const newCount = currentCount - 1

    if (newCount === 0) {
      // Last subscriber, actually unsubscribe
      this.subscriptionRefCount.delete(subscriptionKey)

      const message: UnsubscribeMessage = {
        type: 'unsubscribe',
        requestId: `unsub_${++this.requestCounter}`,
        timestamp: Math.floor(Date.now() / 1000),
        data: {
          tokens: [token], // Single token unsubscription
          channels,
        },
      }

      // Update subscriptions
      const tokenChannels = this.subscriptions.get(token)
      if (tokenChannels) {
        channels.forEach((channel) => {
          tokenChannels.delete(channel)
        })
        if (tokenChannels.size === 0) {
          this.subscriptions.delete(token)
        }
      }

      this.send(message)
      console.log(`[KlineWS] Subscription removed: ${subscriptionKey}`)
    } else {
      this.subscriptionRefCount.set(subscriptionKey, newCount)
      console.log(
        `[KlineWS] Subscription reference decremented: ${subscriptionKey} (refs: ${newCount})`
      )
    }
  }

  // Unsubscribe from all
  unsubscribeAll(): void {
    // Clear all reference counts
    this.subscriptionRefCount.clear()

    const allSubscriptions: { [token: string]: string[] } = {}

    this.subscriptions.forEach((channels, token) => {
      allSubscriptions[token] = Array.from(channels)
    })

    // Force unsubscribe all without checking ref counts
    Object.entries(allSubscriptions).forEach(([token, channels]) => {
      const message: UnsubscribeMessage = {
        type: 'unsubscribe',
        requestId: `unsub_${++this.requestCounter}`,
        timestamp: Math.floor(Date.now() / 1000),
        data: {
          tokens: [token],
          channels: channels as Array<'kline' | 'trade'>,
        },
      }
      this.send(message)
    })

    this.subscriptions.clear()
    console.log('[KlineWS] All subscriptions cleared')
  }

  // Restore subscriptions after reconnect
  private restoreSubscriptions(): void {
    const subscriptionGroups = new Map<
      string,
      { tokens: string[]; channels: Set<string> }
    >()

    // Group subscriptions by channels for efficient resubscription
    this.subscriptions.forEach((channels, token) => {
      const channelKey = Array.from(channels).sort().join(',')
      if (!subscriptionGroups.has(channelKey)) {
        subscriptionGroups.set(channelKey, { tokens: [], channels })
      }
      subscriptionGroups.get(channelKey)?.tokens.push(token)
    })

    // Resubscribe in groups (subscribe one by one for single token approach)
    subscriptionGroups.forEach(({ tokens, channels }) => {
      tokens.forEach((token) => {
        this.subscribe(token, Array.from(channels) as Array<'kline' | 'trade'>)
      })
    })
  }

  // Disconnect WebSocket
  disconnect(): void {
    console.log('[KlineWS] Disconnecting')
    this.isIntentionallyClosed = true
    this.stopHealthMonitoring()

    if (this.ws) {
      this.unsubscribeAll()
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.isReady = false
    this.emit('disconnected', { code: 1000, reason: 'Client disconnect' })
  }

  // Load connection ID from cache
  loadConnectionId(): void {
    if (typeof window !== 'undefined') {
      const cachedId = sessionStorage.getItem('kline_ws_connection_id')
      if (cachedId) {
        this.connectionId = cachedId
        console.log(
          '[KlineWS] Loaded connection ID from cache:',
          this.connectionId
        )
      }
    }
  }

  // Clear connection ID cache
  clearConnectionId(): void {
    this.connectionId = null
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('kline_ws_connection_id')
    }
  }

  // Getters
  getConnectionId(): string | null {
    return this.connectionId
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // Check if WebSocket is fully ready for subscriptions
  isReadyForSubscriptions(): boolean {
    return this.isConnected() && this.isReady && !!this.connectionId
  }

  // Get ready state
  getIsReady(): boolean {
    return this.isReady
  }

  getSubscriptions(): Map<string, Set<string>> {
    return new Map(this.subscriptions)
  }

  getSubscriptionRefCounts(): Map<string, number> {
    return new Map(this.subscriptionRefCount)
  }

  // Override EventEmitter methods to track listener counts
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    const eventName = String(event)
    const currentCount = this.eventListenerCount.get(eventName) || 0
    this.eventListenerCount.set(eventName, currentCount + 1)

    // Warn if too many listeners
    if (currentCount > 10) {
      console.warn(
        `[KlineWS] High listener count for event '${eventName}': ${currentCount + 1}`
      )
    }

    return super.on(event, listener)
  }

  off(event: string | symbol, listener: (...args: any[]) => void): this {
    const eventName = String(event)
    const currentCount = this.eventListenerCount.get(eventName) || 0
    if (currentCount > 0) {
      this.eventListenerCount.set(eventName, currentCount - 1)
    }

    return super.off(event, listener)
  }
}

// Singleton instance
let instance: KlineWebSocketClient | null = null

export function getKlineWebSocketClient(): KlineWebSocketClient {
  if (!instance) {
    instance = new KlineWebSocketClient()
  }
  return instance
}

export function resetKlineWebSocketClient(): void {
  if (instance) {
    instance.disconnect()
    instance = null
  }
}
