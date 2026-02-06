import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import { notify } from '@/stores/useUIStore'
import { tokenKeys } from './queries'
import {
  CreateTokenInputSchema,
  CreateTokenResponseSchema,
  CalculateAddressInputSchema,
  CalculateAddressResponseSchema,
  CalculateFavoriteInputSchema,
  CalculateFavoriteResponseSchema,
  FavoriteTokenInputSchema,
  FavoriteTokenResponseSchema,
  UnfavoriteTokenInputSchema,
  UnfavoriteTokenResponseSchema,
  type CreateTokenInput,
  type CreateTokenResponse,
  type CalculateAddressInput,
  type CalculateAddressResponse,
  type CalculateFavoriteInput,
  type CalculateFavoriteResponse,
  type FavoriteTokenInput,
  type FavoriteTokenResponse,
  type UnfavoriteTokenInput,
  type UnfavoriteTokenResponse,
} from '@/api/schemas/token.schema'

// API函数：创建代币
async function createToken(
  data: CreateTokenInput
): Promise<CreateTokenResponse> {
  // 验证输入数据
  const validated = CreateTokenInputSchema.parse(data)

  console.log('[Token API] Creating token with data:', validated)

  // 发起创建请求
  const response = await kyClient
    .post('token/create-token', {
      json: validated,
    })
    .json()

  console.log('[Token API] Create token response:', response)

  // 验证响应数据
  return parseApiResponse(response, CreateTokenResponseSchema)
}

// API函数：计算代币地址
async function calculateAddress(
  data: CalculateAddressInput
): Promise<CalculateAddressResponse> {
  // 验证输入数据
  const validated = CalculateAddressInputSchema.parse(data)

  console.log('[Token API] Calculating address for:', validated)

  // 发起计算请求
  const response = await kyClient
    .post('token/calculate-address', {
      json: validated,
    })
    .json()

  console.log('[Token API] Calculate address response:', response)

  // 验证响应数据
  return parseApiResponse(response, CalculateAddressResponseSchema)
}

// API函数：代币收藏
async function favoriteToken(
  data: FavoriteTokenInput
): Promise<FavoriteTokenResponse> {
  // 验证输入数据
  const validated = FavoriteTokenInputSchema.parse(data)

  console.log('[Token API] Adding token to favorites:', validated)

  // 发起收藏请求
  const response = await kyClient
    .post('token/favorite', {
      json: validated,
    })
    .json()

  console.log('[Token API] Favorite token response:', response)

  // 验证响应数据
  return parseApiResponse(response, FavoriteTokenResponseSchema)
}

// API函数：代币取消收藏
async function unfavoriteToken(
  data: UnfavoriteTokenInput
): Promise<UnfavoriteTokenResponse> {
  // 验证输入数据
  const validated = UnfavoriteTokenInputSchema.parse(data)

  console.log('[Token API] Removing token from favorites:', validated)

  // 发起取消收藏请求
  const response = await kyClient
    .post('token/unfavorite', {
      json: validated,
    })
    .json()

  console.log('[Token API] Unfavorite token response:', response)

  // 验证响应数据
  return parseApiResponse(response, UnfavoriteTokenResponseSchema)
}

/**
 * Hook: 创建代币
 * 用于创建新的代币（支持普通代币和IDO代币）
 *
 * @example
 * ```tsx
 * const createTokenMutation = useCreateToken()
 *
 * const handleCreateToken = async () => {
 *   const result = await createTokenMutation.mutateAsync({
 *     name: "Demo Token",
 *     symbol: "DEMO",
 *     description: "A demo token",
 *     launchMode: "1",
 *     launchTime: 0,
 *     logo: "https://example.com/logo.png",
 *     banner: "https://example.com/banner.png",
 *     // ... other required fields
 *   })
 *
 *   console.log('Token created:', result.data?.tokenAddress)
 * }
 * ```
 */
export const useCreateToken = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createToken,

    onSuccess: (response) => {
      // 验证响应
      if (response.code !== 200) {
        throw new Error(response.message || 'Failed to create token')
      }
    },

    onError: (error: any) => {
      // 错误处理
      console.error('Token creation failed:', error)

      // 显示错误通知
      notify.error(
        'Token Creation Failed',
        error?.message || 'Failed to create token. Please try again.'
      )
    },
  })
}

/**
 * Hook: 计算代币地址
 * 用于在创建代币前预先计算代币地址
 *
 * @example
 * ```tsx
 * const calculateAddressMutation = useCalculateAddress()
 *
 * const handleCalculateAddress = async () => {
 *   const result = await calculateAddressMutation.mutateAsync({
 *     name: "Demo Token",
 *     symbol: "DEMO",
 *     digits: "abcd"
 *   })
 *
 *   console.log('Predicted address:', result.data?.predictedAddress)
 * }
 * ```
 */
export const useCalculateAddress = () => {
  return useMutation({
    mutationFn: calculateAddress,

    onSuccess: (response) => {
      // 验证响应
      if (response.code !== 200) {
        throw new Error(response.message || 'Failed to calculate address')
      }

      console.log(
        '[Token API] Address calculated:',
        response.data?.predictedAddress
      )
    },

    onError: (error: any) => {
      // 错误处理
      console.error('Address calculation failed:', error)

      // 显示错误通知
      notify.error(
        'Address Calculation Failed',
        error?.message || 'Failed to calculate token address. Please try again.'
      )
    },
  })
}

/**
 * Hook: 创建IDO代币
 * 专门用于创建IDO类型的代币（包含额外的IDO参数）
 *
 * @example
 * ```tsx
 * const createIDOTokenMutation = useCreateIDOToken()
 *
 * const handleCreateIDOToken = async () => {
 *   const result = await createIDOTokenMutation.mutateAsync({
 *     // 基础代币参数
 *     name: "Demo IDO Token",
 *     symbol: "DEMO_IDO",
 *     description: "An IDO token",
 *     launchMode: "2", // IDO mode
 *     // ... other base fields
 *
 *     // IDO特定参数
 *     totalFundsRaised: 50,
 *     fundraisingCycle: 60,
 *     preUserLimit: 1.3,
 *     userLockupTime: 24,
 *     addLiquidity: 0.65,
 *     protocolRevenue: 0.03,
 *     coreTeam: 0.04,
 *     communityTreasury: 0.4,
 *     buybackReserve: 0.1
 *   })
 * }
 * ```
 */
export const useCreateIDOToken = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createToken, // 使用相同的API端点

    onSuccess: (response) => {
      // 验证响应
      if (response.code !== 200) {
        throw new Error(response.message || 'Failed to create IDO token')
      }

      // 清理相关缓存
      queryClient.invalidateQueries({ queryKey: tokenKeys.lists() })

      // 显示成功通知
      notify.success(
        'IDO Token Created Successfully',
        `Your IDO token has been created${
          response.data?.tokenAddress ? ` at ${response.data.tokenAddress}` : ''
        }`
      )
    },

    onError: (error: any) => {
      // 错误处理
      console.error('IDO token creation failed:', error)

      // 显示错误通知
      notify.error(
        'IDO Token Creation Failed',
        error?.message || 'Failed to create IDO token. Please try again.'
      )
    },
  })
}

/**
 * Hook: 收藏代币
 * 用于收藏代币
 *
 * @example
 * ```tsx
 * const favoriteTokenMutation = useFavoriteToken()
 *
 * const handleFavoriteToken = async () => {
 *   const result = await favoriteTokenMutation.mutateAsync({
 *     tokenId: 1
 *   })
 * }
 */

export const useFavoriteToken = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: favoriteToken,
    onSuccess: (response) => {
      // 验证响应
      if (response.code !== 200) {
        throw new Error(response.message || 'Failed to favorite token')
      }

      // 清理相关缓存
      queryClient.invalidateQueries({ queryKey: tokenKeys.lists() })

      // 显示成功通知
      notify.success('Favorite Token Successfully')
    },
    onError: (error: any) => {
      // 错误处理
      console.error('Favorite token failed:', error)

      // 显示错误通知
      notify.error(
        'Favorite Token Failed',
        error?.message || 'Failed to favorite token. Please try again.'
      )
    },
  })
}

export const useUnfavoriteToken = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unfavoriteToken,
    onSuccess: (response) => {
      // 验证响应
      if (response.code !== 200) {
        throw new Error(response.message || 'Failed to unfavorite token')
      }

      // 清理相关缓存
      queryClient.invalidateQueries({ queryKey: tokenKeys.lists() })

      // 显示成功通知
      notify.success('Unfavorite Token Successfully')
    },
    onError: (error: any) => {
      // 错误处理
      console.error('Unfavorite token failed:', error)

      // 显示错误通知
      notify.error(
        'Unfavorite Token Failed',
        error?.message || 'Failed to unfavorite token. Please try again.'
      )
    },
  })
}
