import { useQuery } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import {
  AdvancedListResponseSchema,
  type AdvancedListResponse,
  type AdvancedQueryParams,
} from '@/api/schemas/advanced.schema'
import { safeParse } from 'zod'

export const advancedKeys = {
  all: ['advanced'] as const,
  lists: () => [...advancedKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...advancedKeys.lists(), filters] as const,
}

async function fetchAdvancedList(
  params?: AdvancedQueryParams
): Promise<AdvancedListResponse> {
  const searchParams: Record<string, any> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      searchParams[key] = value
    })
  }
  const response = await kyClient
    .get('token/advanced-token-list', { searchParams })
    .json()

  return parseApiResponse(response, AdvancedListResponseSchema)
}

export const useAdvancedList = (params?: AdvancedQueryParams) => {
  return useQuery({
    queryKey: advancedKeys.list(params),
    queryFn: () => fetchAdvancedList(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  })
}
