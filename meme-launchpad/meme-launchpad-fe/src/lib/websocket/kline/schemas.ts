import { z } from 'zod'

// Base message structure - make fields optional to be more flexible
const BaseMessageSchema = z.object({
  type: z.string(), // Changed from strict enum to allow unknown types initially
  requestId: z.string().optional(), // Made optional
  timestamp: z.number().optional(), // Made optional
})

// Ping message
export const PingMessageSchema = z.object({
  type: z.literal('ping'),
  requestId: z.string(),
  timestamp: z.number(),
  data: z.object({
    clientTime: z.number(),
  }),
})

// Subscribe message
export const SubscribeMessageSchema = z.object({
  type: z.literal('subscribe'),
  requestId: z.string(),
  timestamp: z.number(),
  data: z.object({
    tokens: z.array(z.string()),
    channels: z.array(z.enum(['kline', 'trade'])),
    intervals: z.array(z.string()).optional(), // More flexible than strict enum
    options: z
      .object({
        realTimeOnly: z.boolean().default(false),
      })
      .optional(),
  }),
})

// Unsubscribe message
export const UnsubscribeMessageSchema = z.object({
  type: z.literal('unsubscribe'),
  requestId: z.string(),
  timestamp: z.number(),
  data: z.object({
    tokens: z.array(z.string()),
    channels: z.array(z.enum(['kline', 'trade'])),
  }),
})

// Server response schemas - more flexible
export const ConnectionResponseSchema = z.object({
  type: z.literal('connected'),
  connectionId: z.string(),
  timestamp: z.number().optional(), // Made optional
  requestId: z.string().optional(), // Made optional
})

export const PongMessageSchema = z.object({
  type: z.literal('pong'),
  requestId: z.string().optional(),
  timestamp: z.number().optional(),
  data: z.object({
    serverTime: z.number(),
    clientTime: z.number(),
  }),
})

export const SubscribedMessageSchema = z.object({
  type: z.literal('subscribed'),
  requestId: z.string().optional(),
  timestamp: z.number().optional(),
  data: z
    .object({
      tokens: z.array(z.string()),
      channels: z.array(z.string()),
      intervals: z.array(z.string()).optional(),
    })
    .optional(), // Made the whole data object optional
})

export const UnsubscribedMessageSchema = z.object({
  type: z.literal('unsubscribed'),
  requestId: z.string().optional(),
  timestamp: z.number().optional(),
  data: z
    .object({
      tokens: z.array(z.string()),
      channels: z.array(z.string()),
    })
    .optional(),
})

// Kline update response from server
export const KlineUpdateSchema = z.object({
  type: z.literal('kline_update'),
  requestId: z.string().optional(), // Made optional to match server response
  timestamp: z.number(),
  success: z.boolean(),
  data: z.object({
    tokenAddress: z.string(),
    channel: z.literal('kline'),
    interval: z.string(),
    data: z.object({
      t: z.number(), // timestamp
      o: z.string(), // open
      h: z.string(), // high
      l: z.string(), // low
      c: z.string(), // close
      v: z.string(), // volume
    }),
  }),
})

// Trade update response from server
export const TradeUpdateSchema = z.object({
  type: z.literal('trade_update'),
  timestamp: z.number(),
  success: z.boolean(),
  data: z.object({
    tokenAddress: z.string(),
    channel: z.literal('trade'),
    data: z.object({
      tokenAddress: z.string(),
      tradeId: z.number(),
      txHash: z.string(),
      price: z.string(),
      quantity: z.string(),
      quoteQty: z.string(),
      vol: z.string(),
      side: z.enum(['buy', 'sell']),
      timestamp: z.number(),
      buyer: z.string(),
      seller: z.string(),
      progressPct: z.string(),
    }),
  }),
})

// Legacy schemas for backwards compatibility (if needed)
export const KlineDataSchema = z.object({
  token: z.string(),
  interval: z.string(),
  timestamp: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  quoteVolume: z.number().optional(),
  trades: z.number().optional(),
  taker_buy_base_volume: z.number().optional(),
  taker_buy_quote_volume: z.number().optional(),
})

export const TradeDataSchema = z.object({
  token: z.string(),
  price: z.number(),
  quantity: z.number(),
  timestamp: z.number(),
  isBuyerMaker: z.boolean().optional(),
  tradeId: z.string(),
})

export const DataMessageSchema = z.object({
  type: z.literal('data'),
  requestId: z.string().optional(),
  timestamp: z.number().optional(),
  channel: z.enum(['kline', 'trade']),
  data: z.union([KlineDataSchema, TradeDataSchema]),
})

// Error message from server
export const ErrorMessageSchema = z.object({
  type: z.literal('error'),
  requestId: z.string().optional(),
  timestamp: z.number().optional(),
  error: z.object({
    code: z.string().optional(),
    message: z.string(),
    details: z.any().optional(),
  }),
})

// Flexible message validation - try to parse as discriminated union first
// If that fails, we'll handle it more gracefully
export const WebSocketMessageSchema = z.union([
  PingMessageSchema,
  SubscribeMessageSchema,
  UnsubscribeMessageSchema,
  ConnectionResponseSchema,
  PongMessageSchema,
  SubscribedMessageSchema,
  UnsubscribedMessageSchema,
  KlineUpdateSchema,
  TradeUpdateSchema,
  DataMessageSchema, // Keep for backwards compatibility
  ErrorMessageSchema,
  // Fallback for unknown message types
  z.object({
    type: z.string(),
    data: z.any().optional(),
    error: z.any().optional(),
    connectionId: z.string().optional(),
    requestId: z.string().optional(),
    timestamp: z.number().optional(),
    success: z.boolean().optional(),
  }),
])

// Alternative: More lenient parser for initial validation
export const LenientWebSocketMessageSchema = z
  .object({
    type: z.string(),
  })
  .passthrough() // This allows any additional fields

// Type exports
export type PingMessage = z.infer<typeof PingMessageSchema>
export type SubscribeMessage = z.infer<typeof SubscribeMessageSchema>
export type UnsubscribeMessage = z.infer<typeof UnsubscribeMessageSchema>
export type ConnectionResponse = z.infer<typeof ConnectionResponseSchema>
export type PongMessage = z.infer<typeof PongMessageSchema>
export type SubscribedMessage = z.infer<typeof SubscribedMessageSchema>
export type UnsubscribedMessage = z.infer<typeof UnsubscribedMessageSchema>
export type KlineUpdate = z.infer<typeof KlineUpdateSchema>
export type TradeUpdate = z.infer<typeof TradeUpdateSchema>
export type KlineData = z.infer<typeof KlineDataSchema>
export type TradeData = z.infer<typeof TradeDataSchema>
export type DataMessage = z.infer<typeof DataMessageSchema>
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>
