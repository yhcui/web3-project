import { z } from 'zod'
import { LaunchMode } from '@/types/token'
import { ActivityPlayType, ActivityRewardTokenType } from '@/enums/activities'
import dayjs from '@/utils/tools'

/**
 * --------- 概览统计数据 ---------
 */
export const MyOverviewStatsQueryParamsSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  pageNo: z.number().optional(),
})

export const MyOverviewStatsDataSchema = z.object({
  createdTokens: z.number().default(0),
  heatedTokens: z.number().default(0),
  ownedTokens: z.number().default(0),
  pendingUnlockTokens: z.number().default(0),
  totalTradeBnb: z.string().default('0'),
})

export const MyOverviewStatsResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: MyOverviewStatsDataSchema,
})

export type MyOverviewStatsQueryParams = z.infer<
  typeof MyOverviewStatsQueryParamsSchema
>
export type MyOverviewStatsData = z.infer<typeof MyOverviewStatsDataSchema>
export type MyOverviewStatsResponse = z.infer<
  typeof MyOverviewStatsResponseSchema
>

/**
 * --------- IDO代币列表 ---------
 */
export const MyIDOListQueryParamsSchema = z.object({
  pn: z.number(),
  ps: z.number(),
  sortField: z.string().optional().default(''),
  sortType: z.string().optional().default(''),
})

export const MyIDOListDataItemSchema = z.object({
  tokenAddress: z.string().default(''), // 代币合约地址
  name: z.string().default(''), // 代币全名
  symbol: z.string().default(''), // 代币符号
  subName: z.string().default(''), // 代币副标题/描述
  iconUrl: z.string().url().nullable().catch(null), // 图标URL
  hot: z.number().default(0), // 热度指数
  progressPct: z.number().default(0), // 进度百分比(0-100)
  bnbCurrent: z.number().default(0), // 当前BNB价格
  bnbTarget: z.number().default(0), // 目标BNB价格
  totalLockedToken: z.number().default(0), // 总锁仓量
  totalLockDays: z.number().default(0), // 总锁仓天数
  remainLockTime: z.number().default(0), // 剩余锁仓时间
  myBalance: z.number().default(0), // 我的锁仓量
  launchMode: z.custom<LaunchMode>(),
})

export const MyIDOListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    list: z.array(MyIDOListDataItemSchema),
  }),
})

export type MyIDOListQueryParams = z.infer<typeof MyIDOListQueryParamsSchema>
export type MyIDOListDataItem = z.infer<typeof MyIDOListDataItemSchema>
export type MyIDOListResponse = z.infer<typeof MyIDOListResponseSchema>

/**
 * --------- 我的创建代币列表 ---------
 */
export const MyCreateTokenListQueryParamsSchema = z.object({
  pn: z.number(),
  ps: z.number(),
  sortField: z.string().optional().default(''),
  sortType: z.string().optional().default(''),
  search: z.string().optional().default(''),
})

export const MyCreateTokenListDataItemSchema = z.object({
  addLiquidity: z.number(),
  age: z.number(),
  bnbCurrent: z.number(),
  bnbTarget: z.number(),
  claimedAmount: z.number(),
  createdAt: z.number(),
  fundApplyStatus: z.number(),
  holders: z.number(),
  hot: z.number(),
  iconUrl: z.string().url(),
  launchMode: z.number(),
  marketCap: z.number(),
  myLockedAmount: z.number(),
  name: z.string(),
  pendingAmount: z.number(),
  preBuyPercent: z.number(),
  preBuyToken: z.number(),
  price: z.number(),
  progressPct: z.number(),
  projectApplyStatus: z.number(),
  reservationCount: z.number(),
  status: z.number(),
  subName: z.string(),
  symbol: z.string(),
  tokenAddress: z.string(),
  userLockupTime: z.number(),
})

export const MyCreateTokenListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    list: z.array(MyCreateTokenListDataItemSchema),
  }),
})

export type MyCreateTokenListQueryParams = z.infer<
  typeof MyCreateTokenListQueryParamsSchema
>
export type MyCreateTokenListDataItem = z.infer<
  typeof MyCreateTokenListDataItemSchema
>
export type MyCreateTokenListResponse = z.infer<
  typeof MyCreateTokenListResponseSchema
>

/**
 * --------- 已拥有的代币列表 ---------
 */
export const MyOwnedTokenListQueryParamsSchema = z.object({
  pn: z.number(),
  ps: z.number(),
  search: z.string().optional().default(''),
  sortField: z.string().optional().default(''),
  sortType: z.string().optional().default(''),
})

export const MyOwnedTokenListDataItemSchema = z.object({
  age: z.number().default(0),
  change24h: z.number().default(0),
  holders: z.number().default(0),
  hot: z.number().default(0),
  iconUrl: z.string().url().nullable().catch(null),
  launchMode: z.number().default(1),
  marketCap: z.number().default(0),
  name: z.string().default(''),
  price: z.number().default(0),
  progress: z.number().default(0),
  progressPct: z.number().default(0),
  subName: z.string().default(''),
  symbol: z.string().default(''),
  tokenAddress: z.string().default(''),
  top10Percent: z.number().default(0),
  txCount: z.number().default(0),
  volume24h: z.number().default(0),
  launchTime: z.number().default(0),
})

export const MyOwnedTokenListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    list: z.array(MyOwnedTokenListDataItemSchema),
  }),
})

export type MyOwnedTokenListQueryParams = z.infer<
  typeof MyOwnedTokenListQueryParamsSchema
>
export type MyOwnedTokenListDataItem = z.infer<
  typeof MyOwnedTokenListDataItemSchema
>
export type MyOwnedTokenListResponse = z.infer<
  typeof MyOwnedTokenListResponseSchema
>

/**
 * --------- 我关注的代币列表 ---------
 */
export const MyFollowedTokenListQueryParamsSchema = z.object({
  pn: z.number(),
  ps: z.number(),
  search: z.string().optional().default(''),
  sortField: z.string().optional().default(''),
  sortType: z.string().optional().default(''),
})

export const MyFollowedTokenListDataItemSchema = z.object({
  age: z.number().optional(),
  change24h: z.number().optional(),
  holders: z.number().optional(),
  hot: z.number().optional(),
  iconUrl: z.string().url().optional(),
  launchMode: z.number().optional(),
  launchTime: z.number().optional(),
  marketCap: z.number().optional(),
  name: z.string().optional(),
  price: z.number().optional(),
  progress: z.number().optional(),
  progressPct: z.number().optional(),
  subName: z.string().optional(),
  symbol: z.string().optional(),
  tokenAddress: z.string().optional(),
  top10Percent: z.number().optional(),
  txCount: z.number().optional(),
  volume24h: z.number().optional(),
  isFavorite: z.boolean().optional().default(true),
  tokenId: z.number().optional().default(0),
})

export const MyFollowedTokenListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    list: z.array(MyFollowedTokenListDataItemSchema),
  }),
})

export type MyFollowedTokenListQueryParams = z.infer<
  typeof MyFollowedTokenListQueryParamsSchema
>
export type MyFollowedTokenListDataItem = z.infer<
  typeof MyFollowedTokenListDataItemSchema
>
export type MyFollowedTokenListResponse = z.infer<
  typeof MyFollowedTokenListResponseSchema
>

/**
 * --------- 我关注的用户列表 ---------
 */
export const MyFollowingListQueryParamsSchema = z.object({
  pn: z.number(),
  ps: z.number(),
})

export const MyFollowingListDataItemSchema = z.object({
  address: z.string().default(''),
  avatar: z.string().url().nullable().catch(null),
  createdTokens: z.number().default(0),
  heatTokens: z.number().default(0),
  id: z.number().default(0),
  name: z.string().default(''),
  totalTradeBnb: z.string().default('0'),
  totalTradeCount: z.number().default(0),
  totalTradeVolume: z.string().default('0'),
  totalVolume: z.string().default('0'),
})

export const MyFollowingListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    list: z.array(MyFollowingListDataItemSchema),
  }),
})

export type MyFollowingListQueryParams = z.infer<
  typeof MyFollowingListQueryParamsSchema
>
export type MyFollowingListDataItem = z.infer<
  typeof MyFollowingListDataItemSchema
>
export type MyFollowingListResponse = z.infer<
  typeof MyFollowingListResponseSchema
>

/**
 * --------- 我的关注者列表 ---------
 */
export const MyFollowersListQueryParamsSchema = z.object({
  pn: z.number(),
  ps: z.number(),
  search: z.string().optional().default(''),
})

export const MyFollowersListDataItemSchema = z.object({
  address: z.string().default(''),
  avatar: z.string().url().nullable().catch(null),
  createdTokens: z.number().default(0),
  heatTokens: z.number().default(0),
  id: z.number().default(0),
  name: z.string().default(''),
  totalTradeBnb: z.string().default('0'),
  totalTradeCount: z.number().default(0),
  totalTradeVolume: z.string().default('0'),
  totalVolume: z.string().default('0'),
})

export const MyFollowersListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    list: z.array(MyFollowersListDataItemSchema),
  }),
})

export type MyFollowersListQueryParams = z.infer<
  typeof MyFollowersListQueryParamsSchema
>
export type MyFollowersListDataItem = z.infer<
  typeof MyFollowersListDataItemSchema
>
export type MyFollowersListResponse = z.infer<
  typeof MyFollowersListResponseSchema
>

// --------- 参与的活动列表 ---------
export const MyJoinedActivitiesListQueryParamsSchema = z.object({
  pn: z.number(),
  ps: z.number(),
  userId: z.number(),
  status: z.number(),
  sortField: z.string().optional().default(''),
  sortType: z.string().optional().default(''),
})

const dateSchema = z
  .union([z.string().datetime(), z.date()])
  .transform((val) => new Date(val))
export const MyJoinedActivitiesListDataItemSchema = z.object({
  activityId: z.number().int().positive(),
  activityName: z.string().min(1),
  activityStatus: z.number().int().min(0),
  cancelAt: dateSchema.nullable(),
  categoryType: z.number().int(),
  coverImage: z.string().url(),
  endAt: dateSchema,
  isNewUser: z.union([z.literal(0), z.literal(1)]),
  rewardAmount: z.string().regex(/^\d+\.\d+$/),
  rewardTokenType: z.number().int().positive(),
  ruleType: z.number().int().positive(),
  signupId: z.number().int().positive(),
  signupStatus: z.number().int().min(0),
  signupTime: dateSchema,
  startAt: dateSchema,
})

export const MyJoinedActivitiesListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    list: z.array(MyJoinedActivitiesListDataItemSchema),
  }),
})

export type MyJoinedActivitiesListQueryParams = z.infer<
  typeof MyJoinedActivitiesListQueryParamsSchema
>
export type MyJoinedActivitiesListDataItem = z.infer<
  typeof MyJoinedActivitiesListDataItemSchema
>
export type MyJoinedActivitiesListResponse = z.infer<
  typeof MyJoinedActivitiesListResponseSchema
>

// --------- 创建的活动列表 ---------
export const MyCreatedActivitiesListQueryParamsSchema = z.object({
  pn: z.number(),
  ps: z.number(),
  userId: z.number(),
  status: z.number(),
  sortField: z.string().optional().default(''),
  sortType: z.string().optional().default(''),
})

export const MyCreatedActivitiesListDataItemSchema = z.object({
  categoryType: z.number().optional(),
  coverImage: z.string().url().optional(),
  createdAt: z.string().datetime().optional(), // ISO 8601 datetime validation
  endAt: z.string().datetime().optional(),
  id: z.number().optional(),
  name: z.string().optional(),
  rewardAmountBnb: z.string().optional(), // Could also use z.number() if it should be numeric
  startAt: z.string().datetime().optional(),
  status: z.number().optional(),
  tokenAddress: z.string().optional(),
  tokenLogo: z.string().url().optional(),
  rewardTokenType: z.number().optional(),
  rewardTokenSymbol: z.string().optional().default(''),
})

export const MyCreatedActivitiesListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    list: z.array(MyCreatedActivitiesListDataItemSchema),
  }),
})

export type MyCreatedActivitiesListQueryParams = z.infer<
  typeof MyCreatedActivitiesListQueryParamsSchema
>
export type MyCreatedActivitiesListDataItem = z.infer<
  typeof MyCreatedActivitiesListDataItemSchema
>
export type MyCreatedActivitiesListResponse = z.infer<
  typeof MyCreatedActivitiesListResponseSchema
>

// --------- 创建活动 ---------
export const CreateEventInputSchema = z
  .object({
    name: z.string().min(1, { message: '请填写活动名称' }),
    description: z.string().min(1, { message: '请填写活动描述' }),
    categoryType: z.number().min(1, '请选择'),
    playType: z.number().min(1, '请选择'),
    rewardTokenType: z.number().min(1, '请选择'),
    rewardAmount: z.string().min(1, '请填写空投总量'),
    rewardSlots: z.string().min(1, '奖励总份数'),
    startAt: z
      .string()
      .min(1, '请选择开始时间')
      .refine((val) => dayjs(val).isAfter(dayjs()), {
        message: '开始时间必须大于当前时间',
      }),

    endAt: z.string().min(1, '请选择结束时间'),
    coverImage: z.string().min(1, '请上传封面图'),
    tokenId: z.number(),
    initiatorType: z.number(),
    audienceType: z.number(),
    // 条件字段，默认允许 undefined
    minDailyTradeAmount: z.string().optional(),
    inviteMinCount: z.string().optional(),
    inviteeMinTradeAmount: z.string().optional(),
    heatVoteTarget: z.string().optional(),
    commentMinCount: z.string().optional(),
    rewardTokenId: z.number().optional(),
    rewardTokenAddress: z.string().optional(),
  })
  .refine((data) => dayjs(data.endAt).isAfter(dayjs(data.startAt)), {
    message: '结束时间必须大于开始时间',
    path: ['endAt'],
  })
  .refine(
    (data) => {
      if (data.rewardTokenType === ActivityRewardTokenType.Token) {
        return !!data.rewardTokenId && !!data.rewardTokenAddress
      }
      return true
    },
    {
      path: ['rewardTokenId', 'rewardTokenAmount'],
      message: '请填写代币信息',
    }
  )
  .refine(
    (data) => {
      if (data.playType === ActivityPlayType.Trade) {
        return !!data.minDailyTradeAmount
      }
      return true
    },
    {
      path: ['minDailyTradeAmount'],
      message: '请填写单个用户每日基础交易量标准',
    }
  )
  .refine(
    (data) => {
      if (data.playType === ActivityPlayType.Invite) {
        return !!data.inviteMinCount && !!data.inviteeMinTradeAmount
      }
      return true
    },
    { path: ['inviteMinCount'], message: '请填写邀请空投条件' }
  )
  .refine(
    (data) => {
      if (data.playType === ActivityPlayType.HeatVote) {
        return !!data.heatVoteTarget
      }
      return true
    },
    { path: ['heatVoteTarget'], message: '请填写目标票数' }
  )
  .refine(
    (data) => {
      if (data.playType === ActivityPlayType.Comment) {
        return !!data.commentMinCount
      }
      return true
    },
    { path: ['commentMinCount'], message: '请填写评论区门槛' }
  )

export const CreateEventResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    activityId: z.number(),
    status: z.number(),
  }),
})

export type CreateEventInput = z.infer<typeof CreateEventInputSchema>
export type CreateEventResponse = z.infer<typeof CreateEventResponseSchema>
