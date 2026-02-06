'use client'

import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWalletLogin, useLogout } from '@/api/endpoints/auth'
import { triggerAuthentication } from '@/lib/rainbowkit-auth'
import { useEffect, useCallback } from 'react'
import { notify } from '@/stores/useUIStore'

/**
 * Custom Hook: 钱包认证管理
 *
 * 功能：
 * 1. 监听钱包连接状态
 * 2. 自动检查认证状态
 * 3. 提供手动触发认证的方法
 * 4. 处理登出和清理
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isAuthenticated,
 *     isAuthenticating,
 *     authenticate,
 *     logout
 *   } = useWalletAuth()
 *
 *   // 手动触发认证
 *   const handleAuthenticate = async () => {
 *     const success = await authenticate()
 *     if (success) {
 *       console.log('Authenticated!')
 *     }
 *   }
 * }
 * ```
 */
export function useWalletAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()
  const walletLogin = useWalletLogin()
  const logoutMutation = useLogout()

  const {
    isAuthenticated,
    user,
    accessToken,
    logout: clearAuth,
  } = useAuthStore()

  /**
   * 检查当前认证状态是否有效
   */
  const isValidAuth = useCallback(() => {
    if (!address || !isConnected) return false

    return !!(
      isAuthenticated &&
      accessToken &&
      user?.address?.toLowerCase() === address.toLowerCase()
    )
  }, [address, isConnected, isAuthenticated, accessToken, user])

  /**
   * 手动触发认证流程
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!address || !isConnected) {
      // Don't show notification here, let the caller handle it
      return false
    }

    // 检查是否已认证
    if (isValidAuth()) {
      // Silently return true if already authenticated
      return true
    }

    try {
      // 使用辅助函数触发认证
      const success = await triggerAuthentication(address, signMessageAsync)

      if (!success) {
        notify.error(
          'Authentication Failed',
          'Failed to authenticate your wallet'
        )
      }
      // Remove success notification - let the action complete silently

      return success
    } catch (error: any) {
      console.error('Authentication error:', error)

      // 用户拒绝签名
      if (error?.message?.includes('User rejected') || error?.code === 4001) {
        notify.warning(
          'Signature Required',
          'Please sign the message to continue'
        )
      } else {
        notify.error(
          'Authentication Error',
          error?.message || 'An unexpected error occurred'
        )
      }

      return false
    }
  }, [address, isConnected, isValidAuth, signMessageAsync])

  /**
   * 登出处理
   */
  const logout = useCallback(async () => {
    try {
      // 清理认证状态
      await logoutMutation.mutateAsync()

      // 断开钱包连接（可选）
      // disconnect()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [logoutMutation])

  /**
   * 监听钱包断开连接
   */
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      // 钱包断开连接时清理认证状态
      clearAuth()
    }
  }, [isConnected, isAuthenticated, clearAuth])

  /**
   * 监听地址变化
   */
  useEffect(() => {
    if (
      address &&
      user?.address &&
      address.toLowerCase() !== user.address.toLowerCase()
    ) {
      // 切换钱包地址时清理旧的认证状态
      clearAuth()
      notify.info('Wallet Changed', 'Please authenticate with your new wallet')
    }
  }, [address, user?.address, clearAuth])

  return {
    // 状态
    isConnected,
    address,
    isAuthenticated: isValidAuth(),
    isAuthenticating: walletLogin.isPending,
    user,

    // 方法
    authenticate,
    logout,
    disconnect,

    // 错误状态
    error: walletLogin.error,
  }
}

/**
 * Hook: 自动认证
 *
 * 在组件挂载时自动检查并触发认证
 *
 * @example
 * ```tsx
 * function ProtectedComponent() {
 *   useAutoAuth() // 自动处理认证
 *
 *   return <div>Protected Content</div>
 * }
 * ```
 */
export function useAutoAuth() {
  const { isConnected, address, isAuthenticated, authenticate } =
    useWalletAuth()

  useEffect(() => {
    // 自动触发认证的条件：
    // 1. 钱包已连接
    // 2. 有钱包地址
    // 3. 尚未认证
    if (isConnected && address && !isAuthenticated) {
      // 延迟触发，避免与RainbowKit的内置流程冲突
      const timer = setTimeout(() => {
        authenticate()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isConnected, address, isAuthenticated, authenticate])
}

/**
 * Hook: 认证保护
 *
 * 用于保护需要认证的页面或组件
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { isAuthenticated, isLoading } = useAuthGuard({
 *     redirectTo: '/login',
 *     requireAuth: true
 *   })
 *
 *   if (isLoading) return <Loading />
 *   if (!isAuthenticated) return null
 *
 *   return <div>Protected Content</div>
 * }
 * ```
 */
export function useAuthGuard(options?: {
  requireAuth?: boolean
  redirectTo?: string
  autoAuth?: boolean
}) {
  const { requireAuth = true, redirectTo, autoAuth = true } = options || {}
  const { isAuthenticated, authenticate, isAuthenticating } = useWalletAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (requireAuth && !isAuthenticated) {
        if (autoAuth) {
          // 尝试自动认证
          await authenticate()
        } else if (redirectTo) {
          // 重定向到指定页面
          window.location.href = redirectTo
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [requireAuth, isAuthenticated, autoAuth, authenticate, redirectTo])

  return {
    isAuthenticated,
    isLoading: isLoading || isAuthenticating,
    authenticate,
  }
}

import { useState } from 'react'
