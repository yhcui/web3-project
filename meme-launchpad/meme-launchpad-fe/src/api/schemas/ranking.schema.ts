import { z } from 'zod'
import { RANKING_TYPE_VALUES } from '@/enums/ranking'
import { LaunchMode } from '@/types/token'

// 排行榜列表查询参数
export const RankingQueryParamsSchema = z
  .object({
    pn: z.number().int().positive().optional(), // 页码 (page number)
    ps: z.number().int().positive().optional(), // 每页大小 (page size)
    platform: z.number().int().min(0).max(1).optional(), // 数据来源平台
    category: z
      .string()
      .refine(
        (val) => {
          // 将字符串转换为数字并验证范围
          const num = parseInt(val, 10)
          return !isNaN(num) && num >= 0 && num <= 10
        },
        {
          message: '代币分类必须是0到10之间的数字字符串',
        }
      )
      .optional(),
    tokenSymbol: z.string().optional(), // 代币符号
    pageType: z.number().int().min(1).max(3).optional(), // 页面类型
    sortField: z.string().optional(), // 排序字段
    sortType: z
      .string()
      .regex(/^(asc|desc)$/)
      .optional(), // 排序类型
  })
  .refine(
    (data) => {
      // 如果提供了 sortField，则必须提供 sortType，反之亦然
      if (data.sortField && !data.sortType) return false
      if (data.sortType && !data.sortField) return false
      return true
    },
    {
      message: 'sortField and sortType must be provided together',
    }
  )

export const RankingTokenItemSchema = z
  .object({
    age: z.number().default(0), // 天数
    change24h: z.coerce.number().default(0), // 24小时变化百分比（API返回字符串，自动转换为数字）
    holders: z.number().default(0), // 持有者数量
    hot: z.number().default(0), // 热度指数
    iconUrl: z.string().url().nullable().catch(null), // 图标URL
    launchMode: z.number().default(1), // 启动模式
    marketCap: z.coerce.number().default(0), // 市值（API返回字符串，自动转换为数字）
    name: z.string().default(''), // 代币全名
    price: z.coerce.number().default(0), // 当前价格（API返回字符串，自动转换为数字）
    progress: z.coerce.number().default(0), // 进度值（API返回字符串，自动转换为数字）
    progressPct: z.coerce.number().default(0), // 进度百分比(0-100)（API返回字符串，自动转换为数字）
    subName: z.string().default(''), // 代币副标题/描述
    symbol: z.string().default(''), // 代币符号
    tokenAddress: z.string().default(''), // 代币合约地址
    top10Percent: z.coerce.number().default(0), // 前10%持有比例（API返回字符串，自动转换为数字）
    txCount: z.number().default(0), // 交易数量
    volume24h: z.coerce.number().default(0), // 24小时交易量（API返回字符串，自动转换为数字）
    launchTime: z.number().default(0), // 创建时间
  })
  .passthrough()

export const RankingListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    list: z.array(RankingTokenItemSchema), // mock 数据使用 list 字段
  }),
})

export type RankingQueryParams = z.infer<typeof RankingQueryParamsSchema>
export type RankingTokenItem = z.infer<typeof RankingTokenItemSchema>
export type RankingListResponse = z.infer<typeof RankingListResponseSchema>

// 预览数据（4块）
export const OverviewRankingsQueryParamsSchema = z.object({
  top: z.number().int().min(1).max(10).optional(),
})

export const OverviewRankingsItemSchema = z.object({
  tokenAddress: z.string().default(''), // 代币合约地址
  name: z.string().default(''), // 代币全名
  symbol: z.string().default(''), // 代币符号
  subName: z.string().default(''), // 代币副标题/描述
  iconUrl: z.string().url().nullable().catch(null), // 图标URL
  price: z.coerce.number().default(0), // 当前价格（API返回字符串，自动转换为数字）
  change24h: z.coerce.number().default(0), // 24小时变化百分比（API返回字符串，自动转换为数字）
  marketCap: z.coerce.number().default(0), // 市值（API返回字符串，自动转换为数字）
  launchTime: z.number().default(0), // 创建时间
})

export const OverviewRankingsResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    hot: z.array(OverviewRankingsItemSchema).nullable().default([]),
    new: z.array(OverviewRankingsItemSchema).nullable().default([]),
    topGainer: z.array(OverviewRankingsItemSchema).nullable().default([]),
    topVolume: z.array(OverviewRankingsItemSchema).nullable().default([]),
    topMarketCap: z.array(OverviewRankingsItemSchema).nullable().default([]),
  }),
})

export type OverviewRankingsQueryParams = z.infer<
  typeof OverviewRankingsQueryParamsSchema
>
export type OverviewRankingsItem = z.infer<typeof OverviewRankingsItemSchema>
export type OverviewRankingsResponse = z.infer<
  typeof OverviewRankingsResponseSchema
>

// tranding data 数据
export const TradeRankingsListQueryParamsSchema = z.object({
  top: z.number().int().min(1).max(10).optional(),
  rankingType: z.custom<RANKING_TYPE_VALUES>(),
  platform: z.number().int().min(0).max(1),
  pn: z.number().int().min(1).max(100).optional(),
  ps: z.number().int().min(1).max(100).optional(),
})

export const TradeRankingsListItemSchema = z.object({
  tokenAddress: z.string().default(''), // 代币合约地址
  name: z.string().default(''), // 代币全名
  symbol: z.string().default(''), // 代币符号
  subName: z.string().default(''), // 代币副标题/描述
  iconUrl: z.string().url().nullable().catch(null), // 图标URL
  price: z.coerce.number().default(0), // 当前价格（API返回字符串，自动转换为数字）
  change24h: z.coerce.number().default(0), // 24小时变化百分比（API返回字符串，自动转换为数字）
  marketCap: z.coerce.number().default(0), // 市值（API返回字符串，自动转换为数字）
  launchTime: z.number().default(0), // 创建时间
  launchMode: z.custom<LaunchMode>(), // 启动模式
})

export const TradeRankingsListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    list: z.array(TradeRankingsListItemSchema).nullable().default([]),
  }),
})

export type TradeRankingsListQueryParams = z.infer<
  typeof TradeRankingsListQueryParamsSchema
>
export type TradeRankingsListItem = z.infer<typeof TradeRankingsListItemSchema>
export type TradeRankingsListResponse = z.infer<
  typeof TradeRankingsListResponseSchema
>
