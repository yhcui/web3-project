import { z } from 'zod'

// Trade Item Schema - 更宽松的验证
export const TradeItemSchema = z.object({
  blockNumber: z.number().optional(),
  blockTimestamp: z.string().optional(),
  bnbAmount: z.string().optional(),
  createdAt: z.string().optional(),
  price: z.string().optional(),
  tokenAddress: z.string().optional(),
  tokenAmount: z.string().optional(),
  tradeType: z.number().optional(), // 10 = buy, 20 = sell
  transactionHash: z.string().optional(),
  userAddress: z.string().optional(),
  usdAmount: z.string().optional(), // USD value of the trade
})

// Trade List Query Parameters
export const TradeListQuerySchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  ps: z.number().optional().default(10), // page size
  pn: z.number().optional().default(1), // page number
  orderBy: z
    .enum([
      'create_at',
      'usd_amount',
      'token_amount',
      'bnb_amount',
      'event_type',
    ])
    .optional(),
  orderDesc: z.boolean().optional(),
  minUsdAmount: z.number().optional(),
  maxUsdAmount: z.number().optional(),
})

// Trade List Response Schema - 更灵活的验证
export const TradeListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z
    .union([
      z.object({
        ps: z.number().optional(), // page size
        pn: z.number().optional(), // page number
        total: z.number().optional(),
        totalPage: z.number().optional(),
        result: z.array(TradeItemSchema).optional().default([]),
      }),
      z.null(),
    ])
    .optional(),
})

// Token Holder Schema - 更宽松的验证
export const TokenHolderSchema = z.object({
  address: z.string().optional(),
  balance: z.string().optional(),
  percentage: z.string().optional(),
})

// Token Holders Query Parameters
export const TokenHoldersQuerySchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  pn: z.number().optional().default(1), // page number
  ps: z.number().optional().default(10), // page size
})

// Token Holders Response Schema - 更灵活的验证
export const TokenHoldersResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.union([z.array(TokenHolderSchema), z.null()]).optional(),
})

// Token Detail Schema - 更宽松和灵活的验证
export const TokenDetailSchema = z.object({
  additionalLink1: z.string().optional().default(''),
  additionalLink2: z.string().optional().default(''),
  banner: z.string().optional().default(''),
  bnbCurrent: z.string().optional().default('0'),
  bnbTarget: z.string().optional().default('0'),
  buyCount24H: z.number().optional().default(0),
  contactEmail: z.string().optional().default(''),
  contactTg: z.string().optional().default(''),
  creatorAddress: z.string().optional(),
  currentPrice: z.string().optional().default('0'),
  currentPriceUsdt: z.string().optional().default('0'),
  description: z.string().optional().default(''),
  discord: z.string().optional().default(''),
  holdersCount: z.number().optional().default(0),
  id: z.number().optional(),
  launchMode: z.number().optional().default(0),
  launchTime: z.number().optional().default(0),
  liquidity: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return 0
      const num = Number(val)
      return isNaN(num) ? 0 : num
    })
    .optional()
    .default(0), // API返回字符串或数字，自动转换为数字
  logo: z.string().optional().default(''),
  marketCap: z.string().optional().default('0'),
  marketCapUsdt: z.string().optional().default('0'),
  name: z.string().optional().default(''),
  nonce: z.number().optional().default(0),
  priceChangePercentage24H: z.string().optional().default('0'),
  progressPct: z.string().optional().default('0'),
  sellCount24H: z.number().optional().default(0),
  symbol: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  telegram: z.string().optional().default(''),
  tokenContractAddress: z.string().optional(),
  top10: z.string().optional().default('0'),
  totalLock: z.string().optional().default('0'),
  totalSupply: z.string().optional().default('1000000000'),
  totalVolume24H: z.string().optional().default('0'),
  turnoverRate: z.string().optional().default('0'),
  twitter: z.string().optional().default(''),
  website: z.string().optional().default(''),
  sortPoints: z.number().optional().default(0),
  isFavorite: z.boolean().optional().default(false),
})

// Token Detail Query Parameters
export const TokenDetailQuerySchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

// Token Detail Response Schema - 更灵活的验证
export const TokenDetailResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.union([TokenDetailSchema, z.null()]).optional(),
})

// Type exports
export type TradeItem = z.infer<typeof TradeItemSchema>
export type TradeListQuery = z.infer<typeof TradeListQuerySchema>
export type TradeListResponse = z.infer<typeof TradeListResponseSchema>
export type TokenHolder = z.infer<typeof TokenHolderSchema>
export type TokenHoldersQuery = z.infer<typeof TokenHoldersQuerySchema>
export type TokenHoldersResponse = z.infer<typeof TokenHoldersResponseSchema>
export type TokenDetail = z.infer<typeof TokenDetailSchema>
export type TokenDetailQuery = z.infer<typeof TokenDetailQuerySchema>
export type TokenDetailResponse = z.infer<typeof TokenDetailResponseSchema>
