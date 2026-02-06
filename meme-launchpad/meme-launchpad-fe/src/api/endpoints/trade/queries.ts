import { useQuery } from '@tanstack/react-query'
import { kyClient, ApiError } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import {
  TradeListResponseSchema,
  TokenHoldersResponseSchema,
  TokenDetailResponseSchema,
  type TradeListQuery,
  type TradeListResponse,
  type TokenHoldersQuery,
  type TokenHoldersResponse,
  type TokenDetailQuery,
  type TokenDetailResponse,
} from '@/api/schemas/trade.schema'
import {
  TokenListResponseSchema,
  type TokenListResponse,
} from '@/api/schemas/token.schema'

// Query keys factory
export const tradeKeys = {
  all: ['trades'] as const,
  lists: () => [...tradeKeys.all, 'list'] as const,
  list: (params: TradeListQuery) => [...tradeKeys.lists(), params] as const,
  holders: (tokenAddress: string) =>
    [...tradeKeys.all, 'holders', tokenAddress] as const,
  tokenDetail: (tokenAddress: string) =>
    [...tradeKeys.all, 'token-detail', tokenAddress] as const,
  upcomingTokens: (params?: Record<string, any>) =>
    [...tradeKeys.all, 'upcoming-tokens', params] as const,
  almostFullTokens: (params?: Record<string, any>) =>
    [...tradeKeys.all, 'almost-full-tokens', params] as const,
  todayLaunchingTokens: (params?: Record<string, any>) =>
    [...tradeKeys.all, 'today-launching-tokens', params] as const,
}

// API函数：获取交易记录列表
async function fetchTradeList(
  params: TradeListQuery
): Promise<TradeListResponse> {
  console.log('[Trade API] Fetching trade list for:', params.tokenAddress)

  const searchParams: Record<string, any> = {
    tokenAddress: params.tokenAddress,
  }

  if (params.ps) searchParams.ps = params.ps
  if (params.pn) searchParams.pn = params.pn
  if (params.orderBy) searchParams.orderBy = params.orderBy
  if (params.orderDesc !== undefined) searchParams.orderDesc = params.orderDesc
  if (params.minUsdAmount !== undefined)
    searchParams.minUsdAmount = params.minUsdAmount
  if (params.maxUsdAmount !== undefined)
    searchParams.maxUsdAmount = params.maxUsdAmount

  try {
    const response = await kyClient
      .get('trade/list', {
        searchParams,
      })
      .json()

    console.log('[Trade API] Trade list response:', response)

    // 直接使用 parseApiResponse 进行验证，因为 schema 已经更宽松了
    return parseApiResponse(response, TradeListResponseSchema)
  } catch (error) {
    console.error('[Trade API] Error fetching trade list:', error)
    throw error
  }
}

// API函数：获取代币持有者列表
async function fetchTokenHolders(
  params: TokenHoldersQuery
): Promise<TokenHoldersResponse> {
  console.log('[Trade API] Fetching token holders for:', params.tokenAddress)

  const searchParams: Record<string, any> = {
    tokenAddress: params.tokenAddress,
    pn: params.pn || 1,
    ps: params.ps || 10,
  }

  try {
    const response = await kyClient
      .get('token/holders', {
        searchParams,
      })
      .json()

    console.log('[Trade API] Token holders response:', response)

    // 验证响应数据
    return parseApiResponse(response, TokenHoldersResponseSchema)
  } catch (error) {
    console.error('[Trade API] Error fetching token holders:', error)
    throw error
  }
}

// API函数：获取代币详情（新版本）
async function fetchTokenDetailNew(
  params: TokenDetailQuery
): Promise<TokenDetailResponse> {
  console.log('[Trade API] Fetching token detail for:', params.tokenAddress)

  const searchParams = {
    tokenAddress: params.tokenAddress,
  }

  try {
    const response = await kyClient
      .get('token/detail', {
        searchParams,
      })
      .json()

    console.log('[Trade API] Token detail response:', response)

    // 直接使用 parseApiResponse 进行验证，因为 schema 已经更宽松了
    return parseApiResponse(response, TokenDetailResponseSchema)
  } catch (error) {
    console.error('[Trade API] Error fetching token detail:', error)
    throw error
  }
}

// API函数：获取即将上线的代币
async function fetchUpcomingTokens(params?: {
  pn?: number
  ps?: number
}): Promise<TokenListResponse> {
  console.log('[Trade API] Fetching upcoming tokens with params:', params)

  const searchParams: Record<string, any> = {
    pn: params?.pn || 1,
    ps: params?.ps || 30,
  }

  try {
    const response = await kyClient
      .get('trade/upcoming-token', {
        searchParams,
      })
      .json()

    console.log('[Trade API] Upcoming tokens response:', response)

    // 验证响应数据
    return parseApiResponse(response, TokenListResponseSchema)
  } catch (error) {
    console.error('[Trade API] Error fetching upcoming tokens:', error)
    throw error
  }
}

// API函数：获取即将满额的代币
async function fetchAlmostFullTokens(params?: {
  pn?: number
  ps?: number
}): Promise<TokenListResponse> {
  console.log('[Trade API] Fetching almost full tokens with params:', params)

  const searchParams: Record<string, any> = {
    pn: params?.pn || 1,
    ps: params?.ps || 30,
  }

  try {
    const response = await kyClient
      .get('trade/almost-full-token', {
        searchParams,
      })
      .json()

    console.log('[Trade API] Almost full tokens response:', response)

    // 验证响应数据
    return parseApiResponse(response, TokenListResponseSchema)
  } catch (error) {
    console.error('[Trade API] Error fetching almost full tokens:', error)
    throw error
  }
}

// API函数：获取今日上线的代币
async function fetchTodayLaunchingTokens(params?: {
  pn?: number
  ps?: number
  lunchMode?: number
}): Promise<TokenListResponse> {
  console.log(
    '[Trade API] Fetching today launching tokens with params:',
    params
  )

  const searchParams: Record<string, any> = {
    pn: params?.pn || 1,
    ps: params?.ps || 30,
  }

  if (params?.lunchMode !== undefined) searchParams.lunchMode = params.lunchMode

  try {
    const response = await kyClient
      .get('trade/today-launching-token', {
        searchParams,
      })
      .json()

    console.log('[Trade API] Today launching tokens response:', response)

    // 验证响应数据
    return parseApiResponse(response, TokenListResponseSchema)
  } catch (error) {
    console.error('[Trade API] Error fetching today launching tokens:', error)
    throw error
  }
}

/**
 * Hook: 获取交易记录列表
 * 用于获取指定代币的交易历史记录
 *
 * @param params - 查询参数（代币地址、页码、每页数量）
 * @returns 交易记录列表数据
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTradeList({
 *   tokenAddress: '0x...',
 *   pn: 1,
 *   ps: 20
 * })
 *
 * // 渲染交易记录列表
 * data?.data.result.map(trade => (
 *   <TradeItem key={trade.transactionHash} trade={trade} />
 * ))
 * ```
 */
export const useTradeList = (params: TradeListQuery) => {
  return useQuery({
    queryKey: tradeKeys.list(params),
    queryFn: () => fetchTradeList(params),
    enabled:
      !!params.tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(params.tokenAddress),
    staleTime: 1000 * 30, // 30秒内认为数据是新鲜的
    gcTime: 1000 * 60 * 5, // 5分钟后清理缓存
    refetchOnWindowFocus: true, // 窗口获得焦点时重新获取
  })
}

/**
 * Hook: 获取代币持有者列表
 * 用于获取指定代币的持有者信息
 *
 * @param params - 查询参数（代币地址、页码、每页数量）
 * @returns 持有者列表数据
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTokenHolders({
 *   tokenAddress: '0x...',
 *   pn: 1,
 *   ps: 10
 * })
 *
 * // 渲染持有者列表
 * data?.data.map(holder => (
 *   <HolderItem key={holder.address} holder={holder} />
 * ))
 * ```
 */
export const useTokenHolders = (params: TokenHoldersQuery) => {
  return useQuery({
    queryKey: tradeKeys.holders(params.tokenAddress),
    queryFn: () => fetchTokenHolders(params),
    enabled:
      !!params.tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(params.tokenAddress),
    staleTime: 1000 * 60 * 2, // 2分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    refetchOnWindowFocus: false, // 持有者信息不需要频繁刷新
  })
}

/**
 * Hook: 获取代币详情（新版本）
 * 用于获取更详细的代币信息，包括24小时交易量、价格变化等
 *
 * @param params - 查询参数（代币地址）
 * @returns 代币详情数据
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTokenDetailNew({
 *   tokenAddress: '0x...'
 * })
 *
 * if (data?.data) {
 *   // 渲染代币详情
 *   <TokenDetailCard token={data.data} />
 * }
 * ```
 */
export const useTokenDetailNew = (
  params: TokenDetailQuery,
  options?: {
    refetchOnWindowFocus?: boolean
    refetchOnReconnect?: boolean
    staleTime?: number
    gcTime?: number
  }
) => {
  return useQuery({
    queryKey: tradeKeys.tokenDetail(params.tokenAddress),
    queryFn: () => fetchTokenDetailNew(params),
    enabled:
      !!params.tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(params.tokenAddress),
    staleTime: options?.staleTime ?? 1000 * 60 * 2, // 2分钟内认为数据是新鲜的
    gcTime: options?.gcTime ?? 1000 * 60 * 10, // 10分钟后清理缓存
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false, // 详情页不需要频繁刷新
    refetchOnReconnect: options?.refetchOnReconnect ?? true,
  })
}

/**
 * Hook: 获取即将上线的代币
 * 用于获取即将上线的代币列表
 *
 * @param params - 查询参数（页码、每页数量）
 * @returns 即将上线的代币列表
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useUpcomingTokens({
 *   pn: 1,
 *   ps: 30
 * })
 *
 * // 渲染即将上线的代币列表
 * data?.data.result.map(token => (
 *   <TokenCard key={token.tokenAddr} token={token} />
 * ))
 * ```
 */
export const useUpcomingTokens = (params?: { pn?: number; ps?: number }) => {
  return useQuery({
    queryKey: tradeKeys.upcomingTokens(params),
    queryFn: () => fetchUpcomingTokens(params),
    staleTime: 1000 * 30, // 30秒内认为数据是新鲜的
    gcTime: 1000 * 60 * 5, // 5分钟后清理缓存
    refetchOnWindowFocus: true, // 窗口获得焦点时重新获取
  })
}

/**
 * Hook: 获取即将满额的代币
 * 用于获取即将满额的代币列表
 *
 * @param params - 查询参数（页码、每页数量）
 * @returns 即将满额的代币列表
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAlmostFullTokens({
 *   pn: 1,
 *   ps: 30
 * })
 *
 * // 渲染即将满额的代币列表
 * data?.data.result.map(token => (
 *   <TokenCard key={token.tokenAddr} token={token} />
 * ))
 * ```
 */
export const useAlmostFullTokens = (params?: { pn?: number; ps?: number }) => {
  return useQuery({
    queryKey: tradeKeys.almostFullTokens(params),
    queryFn: () => fetchAlmostFullTokens(params),
    staleTime: 1000 * 30, // 30秒内认为数据是新鲜的
    gcTime: 1000 * 60 * 5, // 5分钟后清理缓存
    refetchOnWindowFocus: true, // 窗口获得焦点时重新获取
  })
}

/**
 * Hook: 获取今日上线的代币
 * 用于获取今日上线的代币列表
 *
 * @param params - 查询参数（页码、每页数量、启动模式）
 * @returns 今日上线的代币列表
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTodayLaunchingTokens({
 *   pn: 1,
 *   ps: 30,
 *   lunchMode: 1
 * })
 *
 * // 渲染今日上线的代币列表
 * data?.data.result.map(token => (
 *   <TokenCard key={token.tokenAddr} token={token} />
 * ))
 * ```
 */
export const useTodayLaunchingTokens = (params?: {
  pn?: number
  ps?: number
  lunchMode?: number
}) => {
  return useQuery({
    queryKey: tradeKeys.todayLaunchingTokens(params),
    queryFn: () => fetchTodayLaunchingTokens(params),
    staleTime: 1000 * 30, // 30秒内认为数据是新鲜的
    gcTime: 1000 * 60 * 5, // 5分钟后清理缓存
    refetchOnWindowFocus: true, // 窗口获得焦点时重新获取
  })
}
