import { z } from 'zod'

// 用户状态和邀请码响应
export const UserStatusResponseSchema = z.object({
  isAgent: z.boolean(),
  invitationCode: z.string(),
  address: z.string(),
})

// 用户佣金信息
export const UserCommissionInfoSchema = z.object({
  address: z.string(),
  totalFee: z.number(),
  inviteUserCount: z.number(),
  tradingUserCount: z.number(),
  totalRebateFee: z.number(),
})

// 邀请用户交易统计
export const UserInviteWithTradeStatsSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userAddr: z.string(),
  inviteUserId: z.number(),
  inviteUserAddr: z.string(),
  isTrader: z.boolean(),
  createdAt: z.string(),
  rebateRate: z.number(),
  totalTradeFee: z.number(),
  currentDate: z.string(),
})

// 分页邀请用户列表响应
export const UserInvitesResponseSchema = z.object({
  list: z.array(UserInviteWithTradeStatsSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
  totalPages: z.number(),
})

// 代理用户详情信息
export const AgentUserDetailInfoSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  commissionRate: z.number(),
  level: z.number(),
  totalCommission: z.number(),
  totalDirectFee: z.number(),
  totalChildFee: z.number(),
  descendantAgentCount: z.number(),
  totalInviteUserCount: z.number(),
  tradingUserCount: z.number(),
  totalRebateFee: z.number(),
  descendantAgentAddresses: z.array(z.string()),
})

// 每日代理佣金统计
export const DailyAgentCommissionStatsSchema = z.object({
  statDate: z.string(),
  totalCommission: z.number(),
  totalDirectFee: z.number(),
  totalChildFee: z.number(),
})

// 代理每日佣金统计响应
export const AgentDailyCommissionResponseSchema = z.object({
  address: z.string(),
  dataType: z.number(),
  dailyStats: z.array(DailyAgentCommissionStatsSchema),
  totalDays: z.number(),
})

// 每日邀请用户统计
export const DailyInviteUserStatsSchema = z.object({
  statDate: z.string(),
  inviteUserCount: z.number(),
  userAddr: z.string(),
})

// 每日邀请用户统计响应
export const DailyInviteUserStatsResponseSchema = z.object({
  address: z.string(),
  dataType: z.number(),
  dailyStats: z.array(DailyInviteUserStatsSchema),
  totalDays: z.number(),
  totalInviteUsers: z.number(),
})

// 每日新增代理统计
export const DailyNewAgentStatsSchema = z.object({
  statDate: z.string(),
  newAgentCount: z.number(),
  parentAgentId: z.number(),
  parentAgentAddress: z.string(),
})

// 每日新增代理统计响应
export const DailyNewAgentStatsResponseSchema = z.object({
  address: z.string(),
  agentId: z.number(),
  dataType: z.number(),
  dailyStats: z.array(DailyNewAgentStatsSchema),
  totalDays: z.number(),
  totalNewAgents: z.number(),
})

// 每日交易量统计
export const DailyTradeAmountStatsSchema = z.object({
  statDate: z.string(),
  totalAmount: z.number(),
  agentAddress: z.string(),
})

// 每日交易量统计响应
export const DailyTradeAmountStatsResponseSchema = z.object({
  address: z.string(),
  agentId: z.number(),
  dataType: z.number(),
  dailyStats: z.array(DailyTradeAmountStatsSchema),
  totalDays: z.number(),
  totalAddresses: z.number(),
  totalTradeAmount: z.number(),
})

// 代理商后代统计
export const AgentDescendantStatsSchema = z.object({
  agentId: z.number(),
  agentName: z.string(),
  agentAddress: z.string(),
  agentLevel: z.number(),
  descendantCount: z.number(),
  descendantAddresses: z.array(z.string()),
  totalTxCount: z.number(),
  totalTradeUserCount: z.number(),
  totalCommission: z.number(),
  timeRange: z.string(),
})

// 代理商后代统计响应
export const AgentDescendantStatsResponseSchema = z.object({
  timeRange: z.string(),
  timeRangeDescription: z.string(),
  days: z.number(),
  page: z.number(),
  size: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
  agentStats: z.array(AgentDescendantStatsSchema),
})

// 返佣记录
export const RebateRecordSchema = z.object({
  id: z.number().optional(),
  userId: z.number(),
  traderId: z.number(),
  userAddr: z.string(),
  amount: z.number(),
  status: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

// 创建返佣记录响应
export const CreateRebateRecordResponseSchema = z.number()

// 检查返佣记录状态响应
export const CheckRebateRecordStatusResponseSchema = z.boolean()

// 健康检查响应
export const HealthCheckResponseSchema = z.object({
  message: z.string(),
  timestamp: z.number(),
})

// 查询参数类型
export const GetUserStatusQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
})

export const GetUserCommissionQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
})

export const GetUserInvitesQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  page: z.number().min(1).default(1),
  size: z.number().min(1).max(100).default(10),
})

export const GetAgentDetailQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
})

export const GetDailyStatsQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  dataType: z
    .number()
    .refine((val) => val === 7 || val === 30, 'DataType must be 7 or 30'),
})

export const GetAgentDescendantStatsQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  timeRange: z
    .string()
    .refine(
      (val) => ['24h', '7d', '1m', '3m', '1y'].includes(val),
      'TimeRange must be one of: 24h, 7d, 1m, 3m, 1y'
    ),
  name: z.string().optional(),
  agentAddress: z.string().optional(),
  page: z.number().min(1).default(1),
  size: z.number().min(1).max(100).default(10),
})

export const CreateRebateRecordQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
})

export const CheckRebateRecordStatusQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
})

// 导出类型
export type UserStatusResponse = z.infer<typeof UserStatusResponseSchema>
export type UserCommissionResponse = z.infer<typeof UserCommissionInfoSchema>
export type UserInvitesResponse = z.infer<typeof UserInvitesResponseSchema>
export type AgentUserDetailResponse = z.infer<typeof AgentUserDetailInfoSchema>
export type AgentDailyCommissionResponse = z.infer<
  typeof AgentDailyCommissionResponseSchema
>
export type DailyInviteUserStatsResponse = z.infer<
  typeof DailyInviteUserStatsResponseSchema
>
export type DailyNewAgentStatsResponse = z.infer<
  typeof DailyNewAgentStatsResponseSchema
>
export type DailyTradeAmountStatsResponse = z.infer<
  typeof DailyTradeAmountStatsResponseSchema
>
export type AgentDescendantStatsResponse = z.infer<
  typeof AgentDescendantStatsResponseSchema
>
export type CreateRebateRecordResponse = z.infer<
  typeof CreateRebateRecordResponseSchema
>
export type CheckRebateRecordStatusResponse = z.infer<
  typeof CheckRebateRecordStatusResponseSchema
>
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>

export type GetUserStatusQuery = z.infer<typeof GetUserStatusQuerySchema>
export type GetUserCommissionQuery = z.infer<
  typeof GetUserCommissionQuerySchema
>
export type GetUserInvitesQuery = z.infer<typeof GetUserInvitesQuerySchema>
export type GetAgentDetailQuery = z.infer<typeof GetAgentDetailQuerySchema>
export type GetDailyStatsQuery = z.infer<typeof GetDailyStatsQuerySchema>
export type GetAgentDescendantStatsQuery = z.infer<
  typeof GetAgentDescendantStatsQuerySchema
>
export type CreateRebateRecordQuery = z.infer<
  typeof CreateRebateRecordQuerySchema
>
export type CheckRebateRecordStatusQuery = z.infer<
  typeof CheckRebateRecordStatusQuerySchema
>
export type RebateRecord = z.infer<typeof RebateRecordSchema>
