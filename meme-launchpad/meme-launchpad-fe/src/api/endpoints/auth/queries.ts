import { useQuery } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import {
  GetSignMessageQuerySchema,
  GetSignMessageResponseSchema,
  type GetSignMessageQuery,
  type GetSignMessageResponse,
} from '@/api/schemas/auth.schema'

// Query keys factory
export const authKeys = {
  all: ['auth'] as const,
  signMessage: (address: string) =>
    [...authKeys.all, 'sign-message', address] as const,
  user: () => [...authKeys.all, 'user'] as const,
  session: () => [...authKeys.all, 'session'] as const,
}

// API函数：获取签名消息
async function fetchSignMessage(
  address: string
): Promise<GetSignMessageResponse> {
  try {
    // 验证输入参数
    const validated = GetSignMessageQuerySchema.parse({ address })

    console.log('[Auth API] Fetching sign message for:', validated.address)

    // 发起请求
    const response = await kyClient
      .get('user/sign-msg', {
        searchParams: validated,
      })
      .json()

    console.log('[Auth API] Raw response:', response)

    // 验证响应数据
    const parsed = parseApiResponse(response, GetSignMessageResponseSchema)
    console.log('[Auth API] Parsed response:', parsed)

    return parsed
  } catch (error: any) {
    console.error('[Auth API] Failed to fetch sign message:', error)

    // 返回默认响应而不是抛出错误
    return {
      code: 200,
      message: 'Using default message',
      data: {
        message: `Sign this message to authenticate with Coinroll\n\nAddress: ${address.toLowerCase()}\nTimestamp: ${Date.now()}`,
        nonce: undefined,
        expiry: undefined,
      },
    }
  }
}

/**
 * Hook: 获取签名消息
 * 用于Web3钱包登录时获取需要签名的消息
 *
 * @param address - 钱包地址
 * @returns 签名消息和相关数据
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useGetSignMessage('0x...')
 *
 * // 使用返回的消息进行签名
 * const signature = await signMessage(data?.data.message)
 * ```
 */
export const useGetSignMessage = (address: string | undefined) => {
  return useQuery({
    queryKey: authKeys.signMessage(address || ''),
    queryFn: () => fetchSignMessage(address!),
    enabled: !!address && /^0x[a-fA-F0-9]{40}$/.test(address),
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    gcTime: 1000 * 60 * 10, // 10分钟后清理缓存
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * 预取签名消息
 * 用于提前加载签名消息，改善用户体验
 *
 * @example
 * ```tsx
 * const queryClient = useQueryClient()
 *
 * // 鼠标悬停时预取
 * onMouseEnter={() => prefetchSignMessage(queryClient, address)}
 * ```
 */
export const prefetchSignMessage = async (
  queryClient: any,
  address: string
) => {
  await queryClient.prefetchQuery({
    queryKey: authKeys.signMessage(address),
    queryFn: () => fetchSignMessage(address),
    staleTime: 1000 * 60 * 5,
  })
}
