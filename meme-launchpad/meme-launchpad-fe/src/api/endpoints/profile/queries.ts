import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import { useQuery } from '@tanstack/react-query'
import {
  type MyOverviewStatsQueryParams,
  MyOverviewStatsResponse,
  MyOverviewStatsResponseSchema,
  type MyIDOListQueryParams,
  type MyIDOListResponse,
  MyIDOListResponseSchema,
  type MyCreateTokenListQueryParams,
  type MyCreateTokenListResponse,
  MyCreateTokenListResponseSchema,
  type MyFollowingListQueryParams,
  type MyFollowingListResponse,
  MyFollowingListResponseSchema,
  type MyOwnedTokenListQueryParams,
  type MyOwnedTokenListResponse,
  MyOwnedTokenListResponseSchema,
  type MyFollowersListQueryParams,
  type MyFollowersListResponse,
  MyFollowersListResponseSchema,
  type MyJoinedActivitiesListQueryParams,
  type MyJoinedActivitiesListResponse,
  MyJoinedActivitiesListResponseSchema,
  type MyCreatedActivitiesListQueryParams,
  type MyCreatedActivitiesListResponse,
  MyCreatedActivitiesListResponseSchema,
  type MyFollowedTokenListQueryParams,
  type MyFollowedTokenListResponse,
  MyFollowedTokenListResponseSchema,
} from '@/api/schemas/profile.schema'

/**
 * --------- 我的概览统计数据 ---------
 */
async function fetchMyOverviewStats(
  params?: MyOverviewStatsQueryParams
): Promise<MyOverviewStatsResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('user/overview-stats', { searchParams })
    .json()
  return parseApiResponse(response, MyOverviewStatsResponseSchema)
}

export const useMyOverviewStats = (params?: MyOverviewStatsQueryParams) => {
  return useQuery({
    queryKey: ['user-overview-stats', params],
    queryFn: () => fetchMyOverviewStats(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  })
}

/**
 * --------- 我的IDO代币列表 ---------
 */
async function fetchMyIDOList(
  params?: MyIDOListQueryParams
): Promise<MyIDOListResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('token/my-ido-list', { searchParams })
    .json()
  return parseApiResponse(response, MyIDOListResponseSchema)
}

export const useMyIDOList = (
  params?: MyIDOListQueryParams,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['user-ido-list', params],
    queryFn: () => fetchMyIDOList(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
  })
}

/**
 * --------- 我的创建代币列表 ---------
 */
async function fetchMyCreateTokenList(
  params?: MyCreateTokenListQueryParams
): Promise<MyCreateTokenListResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('token/my-created-token-list', { searchParams })
    .json()
  return parseApiResponse(response, MyCreateTokenListResponseSchema)
}

export const useMyCreateTokenList = (
  params?: MyCreateTokenListQueryParams,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['user-created-token-list', params],
    queryFn: () => fetchMyCreateTokenList(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
  })
}

/**
 * --------- 已拥有的代币列表 ---------
 */
async function fetchMyOwnedTokenList(
  params?: MyOwnedTokenListQueryParams
): Promise<MyOwnedTokenListResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('token/my-owned-token-list', { searchParams })
    .json()
  return parseApiResponse(response, MyOwnedTokenListResponseSchema)
}

export const useMyOwnedTokenList = (
  params?: MyOwnedTokenListQueryParams,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['user-owned-token-list', params],
    queryFn: () => fetchMyOwnedTokenList(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
  })
}

/**
 * --------- 我关注的代币列表 ---------
 */
async function fetchMyFollowedTokenList(
  params?: MyFollowedTokenListQueryParams
): Promise<MyFollowedTokenListResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('token/my-favorite-tokens', { searchParams })
    .json()
  return parseApiResponse(response, MyFollowedTokenListResponseSchema)
}

export const useMyFollowedTokenList = (
  params?: MyFollowedTokenListQueryParams,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['user-followed-token-list', params],
    queryFn: () => fetchMyFollowedTokenList(params),
    enabled: options?.enabled !== false,
  })
}

/**
 * --------- 我关注的用户列表 ---------
 */
async function fetchMyFollowingList(
  params?: MyFollowingListQueryParams
): Promise<MyFollowingListResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('user/following-list', { searchParams })
    .json()
  return parseApiResponse(response, MyFollowingListResponseSchema)
}

export const useMyFollowingList = (
  params?: MyFollowingListQueryParams,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['user-following-list', params],
    queryFn: () => fetchMyFollowingList(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
  })
}

/**
 * --------- 我的关注者列表 ---------
 */
async function fetchMyFollowersList(
  params?: MyFollowersListQueryParams
): Promise<MyFollowersListResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('user/followers-list', { searchParams })
    .json()
  return parseApiResponse(response, MyFollowersListResponseSchema)
}

export const useMyFollowersList = (
  params?: MyFollowersListQueryParams,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['user-followers-list', params],
    queryFn: () => fetchMyFollowersList(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
  })
}

/**
 * --------- 参与的活动列表 ---------
 */
async function fetchMyJoinedActivitiesList(
  params?: MyJoinedActivitiesListQueryParams
): Promise<MyJoinedActivitiesListResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('act/user-participated', { searchParams })
    .json()
  return parseApiResponse(response, MyJoinedActivitiesListResponseSchema)
}

export const useMyJoinedActivitiesList = (
  params?: MyJoinedActivitiesListQueryParams,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['user-joined-activities-list', params],
    queryFn: () => fetchMyJoinedActivitiesList(params),
    enabled: options?.enabled !== false,
  })
}

/**
 * --------- 创建的活动列表 ---------
 */
async function fetchMyCreatedActivitiesList(
  params?: MyCreatedActivitiesListQueryParams
): Promise<MyCreatedActivitiesListResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('act/user-created', { searchParams })
    .json()
  return parseApiResponse(response, MyCreatedActivitiesListResponseSchema)
}

export function useMyCreatedActivitiesList(
  params?: MyCreatedActivitiesListQueryParams,
  options?: {
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: ['user-created-activities-list', params],
    queryFn: () => fetchMyCreatedActivitiesList(params),
    enabled: options?.enabled !== false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  })
}
