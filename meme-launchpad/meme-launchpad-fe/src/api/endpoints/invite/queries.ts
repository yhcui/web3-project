import { useQuery } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import {
  GetUserStatusQuerySchema,
  GetUserCommissionQuerySchema,
  GetUserInvitesQuerySchema,
  GetAgentDetailQuerySchema,
  GetDailyStatsQuerySchema,
  GetAgentDescendantStatsQuerySchema,
  UserStatusResponseSchema,
  UserCommissionInfoSchema,
  UserInvitesResponseSchema,
  AgentUserDetailInfoSchema,
  AgentDailyCommissionResponseSchema,
  DailyInviteUserStatsResponseSchema,
  DailyNewAgentStatsResponseSchema,
  DailyTradeAmountStatsResponseSchema,
  AgentDescendantStatsResponseSchema,
  HealthCheckResponseSchema,
  type GetUserStatusQuery,
  type GetUserCommissionQuery,
  type GetUserInvitesQuery,
  type GetAgentDetailQuery,
  type GetDailyStatsQuery,
  type GetAgentDescendantStatsQuery,
  type UserStatusResponse,
  type UserCommissionResponse,
  type UserInvitesResponse,
  type AgentUserDetailResponse,
  type AgentDailyCommissionResponse,
  type DailyInviteUserStatsResponse,
  type DailyNewAgentStatsResponse,
  type DailyTradeAmountStatsResponse,
  type AgentDescendantStatsResponse,
  type HealthCheckResponse,
} from '@/api/schemas/invite.schema'
import ky, { KyInstance } from 'ky'

// export const kyClient: KyInstance = ky.create({
//   prefixUrl: 'http://localhost:8080/api/',
//   timeout: 10000,
//   retry: {
//     limit: 2,
//     methods: ['get'],
//     statusCodes: [408, 413, 429, 500, 502, 503, 504],
//   },
//   headers: {
//     'Content-Type': 'application/json',
//     Accept: 'application/json',
//     "Authorization": `Bearer 123456789abcdefghijklmnopqrstuvwxyz`
//   },
// })

// Query keys factory
export const inviteKeys = {
  all: ['invite'] as const,
  health: () => [...inviteKeys.all, 'health'] as const,
  userStatus: (address: string) =>
    [...inviteKeys.all, 'user-status', address] as const,
  userCommission: (address: string) =>
    [...inviteKeys.all, 'user-commission', address] as const,
  userInvites: (address: string, page: number, size: number) =>
    [...inviteKeys.all, 'user-invites', address, page, size] as const,
  agentDetail: (address: string) =>
    [...inviteKeys.all, 'agent-detail', address] as const,
  agentDailyCommission: (address: string, dataType: number) =>
    [...inviteKeys.all, 'agent-daily-commission', address, dataType] as const,
  dailyInviteUserStats: (address: string, dataType: number) =>
    [...inviteKeys.all, 'daily-invite-user-stats', address, dataType] as const,
  dailyNewAgentStats: (address: string, dataType: number) =>
    [...inviteKeys.all, 'daily-new-agent-stats', address, dataType] as const,
  dailyTradeAmountStats: (address: string, dataType: number) =>
    [...inviteKeys.all, 'daily-trade-amount-stats', address, dataType] as const,
  agentDescendantStats: (
    address: string,
    timeRange: string,
    page: number,
    size: number
  ) =>
    [
      ...inviteKeys.all,
      'agent-descendant-stats',
      address,
      timeRange,
      page,
      size,
    ] as const,
}

// API函数：获取用户状态和邀请码
async function fetchUserStatus(
  query: GetUserStatusQuery
): Promise<UserStatusResponse> {
  try {
    const validated = GetUserStatusQuerySchema.parse(query)

    console.log('[Invite API] Fetching user status for:', validated.address)

    const response = await kyClient
      .get('back/user-status', {
        searchParams: validated,
      })
      .json()

    console.log('[Invite API] User status response:', response)

    // 直接返回data部分
    return (response as any).data
  } catch (error: any) {
    console.error('[Invite API] Failed to fetch user status:', error)
    throw error
  }
}

// API函数：获取用户佣金信息
async function fetchUserCommission(
  query: GetUserCommissionQuery
): Promise<UserCommissionResponse> {
  try {
    const validated = GetUserCommissionQuerySchema.parse(query)

    console.log('[Invite API] Fetching user commission for:', validated.address)

    const response = await kyClient
      .get('back/user-commission', {
        searchParams: validated,
      })
      .json()

    console.log('[Invite API] User commission response:', response)

    // 直接返回data部分
    return (response as any).data
  } catch (error: any) {
    console.error('[Invite API] Failed to fetch user commission:', error)
    throw error
  }
}

// API函数：获取用户邀请列表
async function fetchUserInvites(
  query: GetUserInvitesQuery
): Promise<UserInvitesResponse> {
  try {
    const validated = GetUserInvitesQuerySchema.parse(query)

    console.log(
      '[Invite API] Fetching user invites for:',
      validated.address,
      'page:',
      validated.page,
      'size:',
      validated.size
    )

    const response = await kyClient
      .get('back/user-invites', {
        searchParams: validated,
      })
      .json()

    console.log('[Invite API] User invites response:', response)

    // 直接返回data部分
    return (response as any).data
  } catch (error: any) {
    console.error('[Invite API] Failed to fetch user invites:', error)
    throw error
  }
}

// API函数：获取代理用户详情
async function fetchAgentDetail(
  query: GetAgentDetailQuery
): Promise<AgentUserDetailResponse> {
  try {
    const validated = GetAgentDetailQuerySchema.parse(query)

    console.log('[Invite API] Fetching agent detail for:', validated.address)

    const response = await kyClient
      .get('back/agent-detail', {
        searchParams: validated,
      })
      .json()

    console.log('[Invite API] Agent detail response:', response)

    // 直接返回data部分
    return (response as any).data
  } catch (error: any) {
    console.error('[Invite API] Failed to fetch agent detail:', error)
    throw error
  }
}

// API函数：获取代理每日佣金统计
async function fetchAgentDailyCommission(
  query: GetDailyStatsQuery
): Promise<AgentDailyCommissionResponse> {
  try {
    const validated = GetDailyStatsQuerySchema.parse(query)

    console.log(
      '[Invite API] Fetching agent daily commission for:',
      validated.address,
      'dataType:',
      validated.dataType
    )

    const response = await kyClient
      .get('back/agent-daily-commission', {
        searchParams: validated,
      })
      .json()

    console.log('[Invite API] Agent daily commission response:', response)

    // 直接返回data部分
    return (response as any).data
  } catch (error: any) {
    console.error('[Invite API] Failed to fetch agent daily commission:', error)
    throw error
  }
}

// API函数：获取每日邀请用户统计
async function fetchDailyInviteUserStats(
  query: GetDailyStatsQuery
): Promise<DailyInviteUserStatsResponse> {
  try {
    const validated = GetDailyStatsQuerySchema.parse(query)

    console.log(
      '[Invite API] Fetching daily invite user stats for:',
      validated.address,
      'dataType:',
      validated.dataType
    )

    const response = await kyClient
      .get('back/user-invites', {
        searchParams: validated,
      })
      .json()

    console.log('[Invite API] Daily invite user stats response:', response)

    // 直接返回data部分
    return (response as any).data
  } catch (error: any) {
    console.error(
      '[Invite API] Failed to fetch daily invite user stats:',
      error
    )
    throw error
  }
}

// API函数：获取每日新增代理统计
async function fetchDailyNewAgentStats(
  query: GetDailyStatsQuery
): Promise<DailyNewAgentStatsResponse> {
  try {
    const validated = GetDailyStatsQuerySchema.parse(query)

    console.log(
      '[Invite API] Fetching daily new agent stats for:',
      validated.address,
      'dataType:',
      validated.dataType
    )

    const response = await kyClient
      .get('back/agent-daily-new-agents', {
        searchParams: validated,
      })
      .json()

    console.log('[Invite API] Daily new agent stats response:', response)

    // 直接返回data部分
    return (response as any).data
  } catch (error: any) {
    console.error('[Invite API] Failed to fetch daily new agent stats:', error)
    throw error
  }
}

// API函数：获取每日交易量统计
async function fetchDailyTradeAmountStats(
  query: GetDailyStatsQuery
): Promise<DailyTradeAmountStatsResponse> {
  try {
    const validated = GetDailyStatsQuerySchema.parse(query)

    console.log(
      '[Invite API] Fetching daily trade amount stats for:',
      validated.address,
      'dataType:',
      validated.dataType
    )

    const response = await kyClient
      .get('back/agent-daily-trade-amount', {
        searchParams: validated,
      })
      .json()

    console.log('[Invite API] Daily trade amount stats response:', response)

    // 直接返回data部分
    return (response as any).data
  } catch (error: any) {
    console.error(
      '[Invite API] Failed to fetch daily trade amount stats:',
      error
    )
    throw error
  }
}

// API函数：获取代理商后代统计
async function fetchAgentDescendantStats(
  query: GetAgentDescendantStatsQuery
): Promise<AgentDescendantStatsResponse> {
  try {
    const validated = GetAgentDescendantStatsQuerySchema.parse(query)

    console.log(
      '[Invite API] Fetching agent descendant stats for:',
      validated.address,
      'timeRange:',
      validated.timeRange
    )

    const response = await kyClient
      .get('back/agent-descendant-stats', {
        searchParams: validated,
      })
      .json()

    console.log('[Invite API] Agent descendant stats response:', response)

    // 直接返回data部分
    return (response as any).data
  } catch (error: any) {
    console.error('[Invite API] Failed to fetch agent descendant stats:', error)
    throw error
  }
}

/**
 * Hook: 获取用户状态和邀请码
 * 根据钱包地址查询是否为代理用户，并获取邀请码
 */
export const useGetUserStatus = (address: string | undefined) => {
  return useQuery({
    queryKey: inviteKeys.userStatus(address || ''),
    queryFn: () => fetchUserStatus({ address: address! }),
    enabled: !!address && /^0x[a-fA-F0-9]{40}$/.test(address),
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook: 获取用户佣金信息
 * 根据钱包地址查询用户的佣金情况
 */
export const useGetUserCommission = (address: string | undefined) => {
  return useQuery({
    queryKey: inviteKeys.userCommission(address || ''),
    queryFn: () => fetchUserCommission({ address: address! }),
    enabled: !!address && /^0x[a-fA-F0-9]{40}$/.test(address),
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook: 获取用户邀请列表
 * 分页查询邀请用户列表并统计交易费用
 */
export const useGetUserInvites = (
  address: string | undefined,
  page: number = 1,
  size: number = 10
) => {
  return useQuery({
    queryKey: inviteKeys.userInvites(address || '', page, size),
    queryFn: () => fetchUserInvites({ address: address!, page, size }),
    enabled:
      !!address && /^0x[a-fA-F0-9]{40}$/.test(address) && page > 0 && size > 0,
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook: 获取代理用户详情
 * 根据钱包地址查询代理用户的详细信息
 */
export const useGetAgentDetail = (address: string | undefined) => {
  return useQuery({
    queryKey: inviteKeys.agentDetail(address || ''),
    queryFn: () => fetchAgentDetail({ address: address! }),
    enabled: !!address && /^0x[a-fA-F0-9]{40}$/.test(address),
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook: 获取代理每日佣金统计
 * 根据钱包地址和数据类型查询代理用户的每日佣金统计
 */
export const useGetAgentDailyCommission = (
  address: string | undefined,
  dataType: number | undefined
) => {
  return useQuery({
    queryKey: inviteKeys.agentDailyCommission(address || '', dataType || 7),
    queryFn: () =>
      fetchAgentDailyCommission({ address: address!, dataType: dataType! }),
    enabled:
      !!address &&
      /^0x[a-fA-F0-9]{40}$/.test(address) &&
      (dataType === 7 || dataType === 30),
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook: 获取每日邀请用户统计
 * 根据钱包地址和数据类型查询最近的新增邀请人数
 */
export const useGetDailyInviteUserStats = (
  address: string | undefined,
  dataType: number | undefined
) => {
  return useQuery({
    queryKey: inviteKeys.dailyInviteUserStats(address || '', dataType || 7),
    queryFn: () =>
      fetchDailyInviteUserStats({ address: address!, dataType: dataType! }),
    enabled:
      !!address &&
      /^0x[a-fA-F0-9]{40}$/.test(address) &&
      (dataType === 7 || dataType === 30),
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook: 获取每日新增代理统计
 * 根据钱包地址查询代理用户，然后统计新增的下级代理数量
 */
export const useGetDailyNewAgentStats = (
  address: string | undefined,
  dataType: number | undefined
) => {
  return useQuery({
    queryKey: inviteKeys.dailyNewAgentStats(address || '', dataType || 7),
    queryFn: () =>
      fetchDailyNewAgentStats({ address: address!, dataType: dataType! }),
    enabled:
      !!address &&
      /^0x[a-fA-F0-9]{40}$/.test(address) &&
      (dataType === 7 || dataType === 30),
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook: 获取每日交易量统计
 * 根据钱包地址查询代理所有后代，然后统计交易量
 */
export const useGetDailyTradeAmountStats = (
  address: string | undefined,
  dataType: number | undefined
) => {
  return useQuery({
    queryKey: inviteKeys.dailyTradeAmountStats(address || '', dataType || 7),
    queryFn: () =>
      fetchDailyTradeAmountStats({ address: address!, dataType: dataType! }),
    enabled:
      !!address &&
      /^0x[a-fA-F0-9]{40}$/.test(address) &&
      (dataType === 7 || dataType === 30),
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook: 获取代理商后代统计
 * 根据代理商地址查询所有后代代理商，支持筛选和时间范围统计
 */
export const useGetAgentDescendantStats = (
  address: string | undefined,
  timeRange: string | undefined,
  page: number = 1,
  size: number = 10,
  name?: string,
  agentAddress?: string
) => {
  return useQuery({
    queryKey: inviteKeys.agentDescendantStats(
      address || '',
      timeRange || '7d',
      page,
      size
    ),
    queryFn: () =>
      fetchAgentDescendantStats({
        address: address!,
        timeRange: timeRange!,
        page,
        size,
        name,
        agentAddress,
      }),
    enabled:
      !!address &&
      /^0x[a-fA-F0-9]{40}$/.test(address) &&
      !!timeRange &&
      ['24h', '7d', '1m', '3m', '1y'].includes(timeRange),
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    retry: 2,
    refetchOnWindowFocus: false,
  })
}
