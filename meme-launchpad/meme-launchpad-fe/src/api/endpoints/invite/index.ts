// 导出所有invite相关的hooks和工具

// 查询hooks
export {
  useGetUserStatus,
  useGetUserCommission,
  useGetUserInvites,
  useGetAgentDetail,
  useGetAgentDailyCommission,
  useGetDailyInviteUserStats,
  useGetDailyNewAgentStats,
  useGetDailyTradeAmountStats,
  useGetAgentDescendantStats,
  inviteKeys,
} from './queries'

// 变更hooks
export { useCreateRebateRecord, useCheckRebateRecordStatus } from './mutations'

// 类型导出
export type {
  UserStatusResponse,
  UserCommissionResponse,
  UserInvitesResponse,
  AgentUserDetailResponse,
  AgentDailyCommissionResponse,
  DailyInviteUserStatsResponse,
  DailyNewAgentStatsResponse,
  DailyTradeAmountStatsResponse,
  AgentDescendantStatsResponse,
  CreateRebateRecordResponse,
  CheckRebateRecordStatusResponse,
  HealthCheckResponse,
  GetUserStatusQuery,
  GetUserCommissionQuery,
  GetUserInvitesQuery,
  GetAgentDetailQuery,
  GetDailyStatsQuery,
  GetAgentDescendantStatsQuery,
  CreateRebateRecordQuery,
  CheckRebateRecordStatusQuery,
  RebateRecord,
} from '@/api/schemas/invite.schema'
