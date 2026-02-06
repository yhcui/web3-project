import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import { useAuthStore } from '@/stores/useAuthStore'
import { notify } from '@/stores/useUIStore'
import { authKeys } from './queries'
import {
  WalletLoginInputSchema,
  WalletLoginResponseSchema,
  RefreshTokenInputSchema,
  RefreshTokenResponseSchema,
  type WalletLoginInput,
  type WalletLoginResponse,
  type RefreshTokenInput,
  type RefreshTokenResponse,
} from '@/api/schemas/auth.schema'

// API函数：钱包登录
async function walletLogin(
  data: WalletLoginInput
): Promise<WalletLoginResponse> {
  // 验证输入数据
  const validated = WalletLoginInputSchema.parse(data)

  // 发起登录请求
  const response = await kyClient
    .post('user/wallet-login', {
      json: validated,
    })
    .json()

  // 验证响应数据
  return parseApiResponse(response, WalletLoginResponseSchema)
}

// API函数：刷新Token
async function refreshToken(
  data: RefreshTokenInput
): Promise<RefreshTokenResponse> {
  // 验证输入数据
  const validated = RefreshTokenInputSchema.parse(data)

  // 发起刷新请求
  const response = await kyClient
    .post('user/refresh-token', {
      json: validated,
    })
    .json()

  // 验证响应数据
  return parseApiResponse(response, RefreshTokenResponseSchema)
}

/**
 * Hook: 钱包登录
 * 处理Web3钱包签名登录流程
 *
 * @example
 * ```tsx
 * const walletLoginMutation = useWalletLogin()
 *
 * const handleLogin = async () => {
 *   // 1. 获取签名消息
 *   const message = await getSignMessage(address)
 *
 *   // 2. 用钱包签名
 *   const signature = await signMessage(message)
 *
 *   // 3. 提交登录
 *   await walletLoginMutation.mutateAsync({
 *     address,
 *     signature
 *   })
 * }
 * ```
 */
export const useWalletLogin = () => {
  const queryClient = useQueryClient()
  const { login } = useAuthStore()

  return useMutation({
    mutationFn: walletLogin,

    onSuccess: (response) => {
      // 验证响应
      if (response.code !== 200) {
        throw new Error(response.message || 'Login failed')
      }

      const { token, refreshToken: refresh, user } = response.data

      // 保存认证信息到store
      login(
        user || {
          id: 0,
          address: '',
          username: undefined,
        },
        {
          access: token,
          refresh: refresh || '',
        }
      )

      // 清理相关缓存
      queryClient.invalidateQueries({ queryKey: authKeys.all })

      // 显示成功通知
      notify.success(
        'Login Successful',
        'You have successfully connected your wallet'
      )
    },

    onError: (error: any) => {
      // 错误处理
      console.error('Wallet login failed:', error)

      // 显示错误通知
      notify.error(
        'Login Failed',
        error?.message || 'Failed to authenticate with wallet'
      )
    },
  })
}

/**
 * Hook: 刷新访问令牌
 * 用于Token过期时自动刷新
 *
 * @example
 * ```tsx
 * const refreshMutation = useRefreshToken()
 *
 * // 在401响应时自动刷新
 * if (error.status === 401) {
 *   await refreshMutation.mutateAsync({
 *     refreshToken: store.refreshToken
 *   })
 * }
 * ```
 */
export const useRefreshToken = () => {
  const { updateTokens } = useAuthStore()

  return useMutation({
    mutationFn: refreshToken,

    onSuccess: (response) => {
      // 验证响应
      if (response.code !== 200) {
        throw new Error(response.message || 'Token refresh failed')
      }

      const { token, refreshToken: refresh } = response.data

      // 更新store中的tokens
      updateTokens({
        access: token,
        refresh: refresh || '',
      })
    },

    onError: (error: any) => {
      console.error('Token refresh failed:', error)

      // 刷新失败，需要重新登录
      const { logout } = useAuthStore.getState()
      logout()

      notify.error('Session Expired', 'Please reconnect your wallet')
    },
  })
}

/**
 * Hook: 登出
 * 清理本地认证状态
 *
 * @example
 * ```tsx
 * const logoutMutation = useLogout()
 *
 * const handleLogout = () => {
 *   logoutMutation.mutate()
 * }
 * ```
 */
export const useLogout = () => {
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      // 可选：调用后端登出接口
      // await kyClient.post('user/logout')
      return Promise.resolve()
    },

    onSuccess: () => {
      // 清理认证状态
      logout()

      // 清理所有缓存
      queryClient.clear()

      // 显示通知
      notify.info('Logged Out', 'You have been successfully logged out')
    },
  })
}
