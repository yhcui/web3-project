import { z } from 'zod'
import {
  VOLUME_STATISTICS_TYPE_VALUES,
  ADVANCED_SORT_TYPE_VALUES,
} from '@/enums/advanced'

// helper: build a zod number enum from a readonly number[]
const numberEnum = (values: readonly number[]) =>
  z
    .number()
    .int()
    .refine((v) => values.includes(v), {
      message: 'Invalid enum value',
    })

// Query params schema (all optional)
export const AdvancedQueryParamsSchema = z.object({
  pn: z.number().int().positive().optional(),
  ps: z.number().int().positive().optional(),
  volumeStatisticsType: numberEnum(VOLUME_STATISTICS_TYPE_VALUES).optional(),
  marketCapMin: z.number().optional(),
  marketCapMax: z.number().optional(),
  holdersMin: z.number().optional(),
  holdersMax: z.number().optional(),
  volumeMin: z.number().optional(),
  volumeMax: z.number().optional(),
  tokenIssuanceMode: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .optional(),
  isTop10: z.boolean().optional(),
  isSign: z.boolean().optional(),
  isPancakeV3: z.boolean().optional(),
  sortType: numberEnum(ADVANCED_SORT_TYPE_VALUES).optional(),
})

// Response item schema
export const AdvancedTokenItemSchema = z.object({
  tokenID: z.number().default(0), // API 可能返回 0
  creatorID: z.number().default(0), // API 可能返回 0
  creatorAddress: z.string().default(''), // API 可能返回空字符串
  tokenName: z.string().default(''), // API 可能返回空字符串
  tokenSymbol: z.string().default(''), // API 可能返回空字符串
  tokenDescription: z.string().default('').nullable(),
  tokenContractAddress: z.string().default('').nullable(),
  tokenLaunchMode: z.number().default(0),
  tokenLogo: z.string().url().catch('').nullable(), // 非 URL 时回退空字符串
  website: z.string().default('').nullable(),
  twitter: z.string().default('').nullable(),
  whitepaper: z.string().default('').nullable(),
  telegram: z.string().default('').nullable(),
  discord: z.string().default('').nullable(),
  graduationTime: z.number().default(0),
  tokenCurrentPrice: z
    .union([z.string(), z.number()])
    .transform(String)
    .default('0'),
  tokenMarketCap: z
    .union([z.string(), z.number()])
    .transform(String)
    .default('0'),
  holdersCount: z.number().default(0),
  // 百分比字段（API 返回字符串但可能是数字）
  progressPct: z
    .union([z.string(), z.number()])
    .transform((v) => String(Number(v)))
    .default('0'), // 确保转换为标准字符串格式
  voteCount: z.number().default(0),
  totalVolume24h: z
    .union([z.string(), z.number()])
    .transform(String)
    .default('0'),
  priceChange24h: z
    .union([z.string(), z.number()])
    .transform(String)
    .default('0'),
  priceChangePercentage24h: z
    .union([z.string(), z.number()])
    .transform(String)
    .default('0')
    .nullable(),
  marginBnbNum: z
    .union([z.string(), z.number()])
    .transform(Number)
    .default(0)
    .nullable(),
  bnbTarget: z
    .union([z.string(), z.number()])
    .transform(Number)
    .default(0)
    .nullable(),
  bnbCurrent: z
    .union([z.string(), z.number()])
    .transform(Number)
    .default(0)
    .nullable(),
  preBuyPercent: z
    .union([z.string(), z.number()])
    .transform(Number)
    .default(0)
    .nullable(),
  buyCount24h: z.number().default(0).nullable(),
  sellCount24h: z.number().default(0).nullable(),
  tokenRank: z.number().default(0).nullable(),
  tokenLv: z.number().default(0).nullable(),
  sortPoints: z.number().default(0).nullable(),
  top10SupplyPercent: z
    .union([z.string(), z.number()])
    .transform(Number)
    .default(0)
    .nullable(),
})

export const AdvancedListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    list: z.array(AdvancedTokenItemSchema), // mock 数据使用 list 字段
  }),
})

export type AdvancedQueryParams = z.infer<typeof AdvancedQueryParamsSchema>
export type AdvancedTokenItem = z.infer<typeof AdvancedTokenItemSchema>
export type AdvancedListResponse = z.infer<typeof AdvancedListResponseSchema>
