import { useQuery } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import {
  RankingListResponseSchema,
  RankingQueryParams,
  RankingListResponse,
  OverviewRankingsResponse,
  OverviewRankingsResponseSchema,
  OverviewRankingsQueryParams,
  TradeRankingsListQueryParams,
  TradeRankingsListResponse,
  TradeRankingsListResponseSchema,
} from '@/api/schemas/ranking.schema'

async function fetchRankingList(
  params?: RankingQueryParams
): Promise<RankingListResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('token/ranking-token-list', {
      searchParams,
    })
    .json()
  console.log('response response response', response)
  return parseApiResponse(response, RankingListResponseSchema)
}

export const useRankingList = (
  params: RankingQueryParams,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['rankingList', params],
    queryFn: () => fetchRankingList(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
  })
}

async function fetchOverviewRankings(
  params?: OverviewRankingsQueryParams
): Promise<OverviewRankingsResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('token/overview-rankings', {
      searchParams,
    })
    .json()

  return parseApiResponse(response, OverviewRankingsResponseSchema)
}

export const useOverviewRankings = (params: OverviewRankingsQueryParams) => {
  return useQuery({
    queryKey: ['overviewRankings', params],
    queryFn: () => fetchOverviewRankings(params),
  })
}

async function fetchTradeRankingsList(
  params?: TradeRankingsListQueryParams
): Promise<TradeRankingsListResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('token/trade-rankings-list', {
      searchParams,
    })
    .json()

  return parseApiResponse(response, TradeRankingsListResponseSchema)
}

export const useTradeRankingsList = (params: TradeRankingsListQueryParams) => {
  return useQuery({
    queryKey: ['tradeRankingsList', params],
    queryFn: () => fetchTradeRankingsList(params),
  })
}
