import { useQuery } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import {
  GetTokenLogoPresignQuerySchema,
  GetTokenLogoPresignResponseSchema,
  GetTokenBannerPresignQuerySchema,
  GetTokenBannerPresignResponseSchema,
  type GetTokenLogoPresignQuery,
  type GetTokenLogoPresignResponse,
  type GetTokenBannerPresignQuery,
  type GetTokenBannerPresignResponse,
} from '@/api/schemas/file.schema'

// Query keys factory
export const fileKeys = {
  all: ['file'] as const,
  presigns: () => [...fileKeys.all, 'presign'] as const,
  logoPresign: (params: GetTokenLogoPresignQuery) =>
    [...fileKeys.presigns(), 'logo', params] as const,
  bannerPresign: (params: GetTokenBannerPresignQuery) =>
    [...fileKeys.presigns(), 'banner', params] as const,
}

// API函数：获取Token Logo预签名URL
async function getTokenLogoPresignUrl(
  params: GetTokenLogoPresignQuery
): Promise<GetTokenLogoPresignResponse> {
  // 验证输入参数
  const validated = GetTokenLogoPresignQuerySchema.parse(params)

  // 发起请求
  const response = await kyClient
    .get('file/token-logo-presign', {
      searchParams: validated as any,
    })
    .json()

  // 验证响应数据
  return parseApiResponse(response, GetTokenLogoPresignResponseSchema)
}

// API函数：获取Token Banner预签名URL
async function getTokenBannerPresignUrl(
  params: GetTokenBannerPresignQuery
): Promise<GetTokenBannerPresignResponse> {
  // 验证输入参数
  const validated = GetTokenBannerPresignQuerySchema.parse(params)

  // 发起请求
  const response = await kyClient
    .get('file/token-banner-presign', {
      searchParams: validated as any,
    })
    .json()

  // 验证响应数据
  return parseApiResponse(response, GetTokenBannerPresignResponseSchema)
}

/**
 * Hook: 获取Token Logo预签名URL
 * 用于获取上传Token Logo的预签名URL
 *
 * @example
 * ```tsx
 * const { data: presignData } = useTokenLogoPresignUrl({
 *   fileName: 'logo.png',
 *   contentType: 'image/png',
 *   fileSize: 1024000
 * })
 * ```
 */
export const useTokenLogoPresignUrl = (
  params: GetTokenLogoPresignQuery,
  options?: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
  }
) => {
  return useQuery({
    queryKey: fileKeys.logoPresign(params),
    queryFn: () => getTokenLogoPresignUrl(params),
    enabled: options?.enabled ?? false, // 默认不自动请求，需要手动触发
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5分钟过期
    gcTime: options?.cacheTime ?? 1000 * 60 * 10, // 10分钟缓存
  })
}

/**
 * Hook: 获取Token Banner预签名URL
 * 用于获取上传Token Banner的预签名URL
 *
 * @example
 * ```tsx
 * const { data: presignData } = useTokenBannerPresignUrl({
 *   fileName: 'banner.jpg',
 *   contentType: 'image/jpeg',
 *   fileSize: 2048000
 * })
 * ```
 */
export const useTokenBannerPresignUrl = (
  params: GetTokenBannerPresignQuery,
  options?: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
  }
) => {
  return useQuery({
    queryKey: fileKeys.bannerPresign(params),
    queryFn: () => getTokenBannerPresignUrl(params),
    enabled: options?.enabled ?? false, // 默认不自动请求，需要手动触发
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5分钟过期
    gcTime: options?.cacheTime ?? 1000 * 60 * 10, // 10分钟缓存
  })
}
