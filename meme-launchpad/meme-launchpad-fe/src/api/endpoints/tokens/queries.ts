import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import {
  TokenListResponseSchema,
  TokenDetailResponseSchema,
  HotPickResponseSchema,
  TrendingTokenResponseSchema,
  TokenHoldersResponseSchema,
  type TokenListResponse,
  type TokenDetailResponse,
  type HotPickResponse,
  type TrendingTokenResponse,
  type TokenHoldersResponse,
} from '@/api/schemas/token.schema'

// Query keys factory
export const tokenKeys = {
  all: ['tokens'] as const,
  lists: () => [...tokenKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) =>
    [...tokenKeys.lists(), filters] as const,
  details: () => [...tokenKeys.all, 'detail'] as const,
  detail: (tokenAddress: string) =>
    [...tokenKeys.details(), tokenAddress] as const,
  holders: () => [...tokenKeys.all, 'holders'] as const,
  holder: (tokenAddress: string) =>
    [...tokenKeys.holders(), tokenAddress] as const,
}

// API函数：获取代币列表
async function fetchTokenList(params?: {
  pn?: number
  ps?: number
  sort?: string
  lunchMode?: number
  status?: string
  launchTimeStart?: number
  launchTimeEnd?: number
}): Promise<TokenListResponse> {
  const searchParams: Record<string, any> = {
    pn: params?.pn || 1,
    ps: params?.ps || 10,
  }

  if (params?.sort) searchParams.sort = params.sort
  if (params?.lunchMode) searchParams.lunchMode = params.lunchMode
  if (params?.status !== undefined) searchParams.status = params.status
  if (params?.launchTimeStart !== undefined)
    searchParams.launchTimeStart = params.launchTimeStart
  if (params?.launchTimeEnd !== undefined)
    searchParams.launchTimeEnd = params.launchTimeEnd

  // 发起请求
  const response = await kyClient
    .get('token/token-list', {
      searchParams,
    })
    .json()

  console.log('[Token API] Token list response:', response)

  // 验证响应数据
  return parseApiResponse(response, TokenListResponseSchema)
}

// API函数：获取代币详情
async function fetchTokenDetail(
  tokenAddress: string
): Promise<TokenDetailResponse> {
  console.log('[Token API] Fetching token detail for:', tokenAddress)

  // 发起请求
  const response = await kyClient
    .get('token/detail', {
      searchParams: {
        tokenAddress,
      },
    })
    .json()

  console.log('[Token API] Token detail response:', response)

  // 验证响应数据
  return parseApiResponse(response, TokenDetailResponseSchema)
}

// API函数：获取热门代币
async function fetchHotPickTokens(): Promise<HotPickResponse> {
  console.log('[Token API] Fetching hot pick tokens')

  // 发起请求
  const response = await kyClient.get('token/hot-pick').json()

  console.log('[Token API] Hot pick tokens response:', response)

  // 验证响应数据
  return parseApiResponse(response, HotPickResponseSchema)
}

// API函数：获取趋势代币
async function fetchTrendingTokens(params?: {
  pn?: number
  ps?: number
  lunchMode?: number
  launchTimeStart?: number
  launchTimeEnd?: number
}): Promise<TrendingTokenResponse> {
  console.log('[Token API] Fetching trending tokens with params:', params)

  const searchParams: Record<string, any> = {
    pn: params?.pn || 1,
    ps: params?.ps || 10,
  }

  if (params?.lunchMode) searchParams.lunchMode = params.lunchMode
  if (params?.launchTimeStart !== undefined)
    searchParams.launchTimeStart = params.launchTimeStart
  if (params?.launchTimeEnd !== undefined)
    searchParams.launchTimeEnd = params.launchTimeEnd

  console.log('[Token API] Search params:', searchParams)

  try {
    // 发起请求
    const response = await kyClient
      .get('token/trending-token', {
        searchParams,
      })
      .json()

    console.log(
      'API函数：获取趋势代币 [Token API] Trending tokens response:',
      response
    )

    // 验证响应数据
    const parsedResponse = parseApiResponse(
      response,
      TrendingTokenResponseSchema
    )
    console.log('[Token API] Parsed response:', parsedResponse)
    return parsedResponse
  } catch (error) {
    console.error('[Token API] Error fetching trending tokens:', error)
    throw error
  }
}

// API函数：获取代币持有者列表
async function fetchTokenHolders(
  tokenAddress: string
): Promise<TokenHoldersResponse> {
  console.log('[Token API] Fetching token holders for:', tokenAddress)

  // 发起请求
  const response = await kyClient
    .get('token/holders', {
      searchParams: {
        tokenAddress,
      },
    })
    .json()

  console.log('[Token API] Token holders response:', response)

  // 验证响应数据
  return parseApiResponse(response, TokenHoldersResponseSchema)
}

/**
 * Hook: 获取代币列表
 * 用于获取所有代币的分页列表
 *
 * @param params - 查询参数（页码、每页数量、排序、过滤等）
 * @returns 代币列表数据
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTokenList({
 *   pn: 1,
 *   ps: 20,
 *   sort: 'createdAt:desc'
 * })
 *
 * // 渲染代币列表
 * data?.data.result.map(token => (
 *   <TokenCard key={token.id} token={token} />
 * ))
 * ```
 */
export const useTokenList = (params?: {
  pn?: number
  ps?: number
  sort?: string
  lunchMode?: number
  status?: string
  launchTimeStart?: number
  launchTimeEnd?: number
  timestamp?: number
}) => {
  return useQuery({
    queryKey: ['token-list', JSON.stringify(params)],
    queryFn: () => fetchTokenList(params),
    staleTime: 1000 * 30, // 30秒内认为数据是新鲜的
    gcTime: 1000 * 60 * 5, // 5分钟后清理缓存
    refetchOnWindowFocus: true, // 窗口获得焦点时重新获取
  })
}

/**
 * Hook: 获取代币列表（无限滚动）
 * 用于实现无限滚动加载更多代币
 *
 * @param params - 基础查询参数
 * @returns 无限查询数据
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useInfiniteTokenList({
 *   ps: 20,
 *   sort: 'hot:desc'
 * })
 *
 * // 加载更多
 * if (hasNextPage) {
 *   fetchNextPage()
 * }
 * ```
 */
export const useInfiniteTokenList = (params?: {
  ps?: number
  sort?: string
  lunchMode?: number
  status?: string
  launchTimeStart?: number
  launchTimeEnd?: number
}) => {
  return useInfiniteQuery({
    queryKey: tokenKeys.list({ ...params, infinite: true }),
    queryFn: ({ pageParam = 1 }) =>
      fetchTokenList({
        ...params,
        pn: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      const { pageNo, totalPage } = lastPage.data
      return pageNo < totalPage ? pageNo + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  })
}

/**
 * Hook: 获取代币详情
 * 用于获取单个代币的详细信息
 *
 * @param tokenAddress - 代币合约地址
 * @returns 代币详情数据
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTokenDetail('0x...')
 *
 * if (data?.data) {
 *   // 渲染代币详情
 *   <TokenDetail token={data.data} />
 * }
 * ```
 */
export const useTokenDetail = (tokenAddress: string | undefined) => {
  return useQuery({
    queryKey: tokenKeys.detail(tokenAddress || ''),
    queryFn: () => fetchTokenDetail(tokenAddress!),
    enabled: !!tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress),
    staleTime: 1000 * 60 * 2, // 2分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    refetchOnWindowFocus: false, // 详情页不需要频繁刷新
  })
}

/**
 * 预取代币详情
 * 用于提前加载代币详情，改善用户体验
 *
 * @example
 * ```tsx
 * const queryClient = useQueryClient()
 *
 * // 鼠标悬停时预取
 * onMouseEnter={() => prefetchTokenDetail(queryClient, tokenAddress)}
 * ```
 */
export const prefetchTokenDetail = async (
  queryClient: any,
  tokenAddress: string
) => {
  await queryClient.prefetchQuery({
    queryKey: tokenKeys.detail(tokenAddress),
    queryFn: () => fetchTokenDetail(tokenAddress),
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * Hook: 搜索代币
 * 用于根据名称或符号搜索代币
 *
 * @param searchTerm - 搜索关键词
 * @returns 搜索结果
 *
 * @example
 * ```tsx
 * const { data } = useSearchTokens('DEMO')
 * ```
 */
export const useSearchTokens = (searchTerm: string) => {
  return useQuery({
    queryKey: [...tokenKeys.lists(), 'search', searchTerm],
    queryFn: () =>
      fetchTokenList({
        sort: searchTerm,
        ps: 50,
      }),
    enabled: searchTerm.length >= 2, // 至少输入2个字符才搜索
    staleTime: 1000 * 10, // 10秒内认为搜索结果是新鲜的
    gcTime: 1000 * 60 * 2, // 2分钟后清理缓存
  })
}

/**
 * Hook: 获取热门代币
 * 用于获取热门代币列表，用于轮播展示
 *
 * @returns 热门代币数据
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useHotPickTokens()
 *
 * if (data?.data) {
 *   // 渲染热门代币轮播
 *   <TrendingTokensCarousel tokens={data.data} />
 * }
 * ```
 */
export const useHotPickTokens = () => {
  return useQuery({
    queryKey: [...tokenKeys.all, 'hot-pick'],
    queryFn: fetchHotPickTokens,
    staleTime: 1000 * 30, // 30秒内认为数据是新鲜的
    gcTime: 1000 * 60 * 2, // 2分钟后清理缓存
    refetchOnWindowFocus: true, // 窗口获得焦点时重新获取
  })
}

/**
 * Hook: 获取趋势代币
 * 用于获取趋势代币列表，用于首页展示
 *
 * @param params - 查询参数（页码、每页数量、启动模式、时间范围）
 * @returns 趋势代币数据
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTrendingTokens({
 *   pn: 1,
 *   ps: 10,
 *   lunchMode: 1,
 *   launchTimeStart: 1234567890,
 *   launchTimeEnd: 1234567890
 * })
 *
 * if (data?.result) {
 *   // 渲染趋势代币列表
 *   data.result.map(token => (
 *     <TrendingTokenCard key={token.tokenAddr} token={token} />
 *   ))
 * }
 * ```
 */
export const useTrendingTokens = (params?: {
  pn?: number
  ps?: number
  lunchMode?: number
  launchTimeStart?: number
  launchTimeEnd?: number
  timestamp?: number
}) => {
  console.log('[useTrendingTokens] Hook called with params:', params)

  const query = useQuery({
    queryKey: [...tokenKeys.all, 'trending', params],
    queryFn: () => fetchTrendingTokens(params),
    staleTime: 1000 * 30, // 30秒内认为数据是新鲜的
    gcTime: 1000 * 60 * 5, // 5分钟后清理缓存
    refetchOnWindowFocus: true, // 窗口获得焦点时重新获取
  })

  return query
}

/**
 * Hook: 获取代币持有者列表
 * 用于获取指定代币的持有者列表，包括地址、余额和持有百分比
 *
 * @param tokenAddress - 代币合约地址
 * @returns 代币持有者数据
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTokenHolders('0x...')
 *
 * if (data?.data) {
 *   // 渲染持有者列表
 *   data.data.map(holder => (
 *     <HolderCard
 *       key={holder.address}
 *       address={holder.address}
 *       balance={holder.balance}
 *       percentage={holder.percentage}
 *     />
 *   ))
 * }
 * ```
 */
export const useTokenHolders = (tokenAddress: string | undefined) => {
  return useQuery({
    queryKey: tokenKeys.holder(tokenAddress || ''),
    queryFn: () => fetchTokenHolders(tokenAddress!),
    enabled: !!tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress),
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    refetchOnWindowFocus: false, // 不需要频繁刷新
  })
}
