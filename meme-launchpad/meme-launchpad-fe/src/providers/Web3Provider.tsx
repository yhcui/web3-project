'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider, useAccount, useSignMessage } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/config/wagmi'
import { checkAuthStatus, triggerAuthentication } from '@/lib/rainbowkit-auth'
import { useAuthStore } from '@/stores/useAuthStore'
import { useEffect, useRef } from 'react'

const queryClient = new QueryClient()

/**
 * 自动认证组件
 * 当钱包连接后自动触发签名流程，无需显示modal
 */
function AutoAuthenticator({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { isAuthenticated, user } = useAuthStore()
  const isAuthenticatingRef = useRef(false)

  useEffect(() => {
    const authenticate = async () => {
      // 避免重复认证
      if (isAuthenticatingRef.current) {
        return
      }

      if (!isConnected || !address) {
        return
      }

      // 检查是否已有对应地址的认证token
      const hasValidAuth = checkAuthStatus(address)

      if (hasValidAuth) {
        // 已认证，无需操作
        return
      }

      // 需要认证 - 直接触发钱包签名，不显示modal
      isAuthenticatingRef.current = true

      try {
        console.log('[AutoAuth] Triggering authentication for:', address)

        // 直接调用钱包签名，不通过RainbowKit的modal
        const success = await triggerAuthentication(
          address,
          async ({ message }) => {
            const signature = await signMessageAsync({ message })
            return signature
          }
        )

        if (success) {
          console.log('[AutoAuth] Authentication successful')
        } else {
          console.error('[AutoAuth] Authentication failed')
        }
      } catch (error) {
        console.error('[AutoAuth] Authentication error:', error)
      } finally {
        isAuthenticatingRef.current = false
      }
    }

    // 延迟执行，确保钱包连接稳定
    const timer = setTimeout(authenticate, 500)
    return () => clearTimeout(timer)
  }, [isConnected, address, isAuthenticated, user, signMessageAsync])

  return <>{children}</>
}

/**
 * RainbowKit包装组件
 * 提供基本的RainbowKit配置，移除了认证Provider以避免modal
 */
function RainbowKitWrapper({ children }: { children: React.ReactNode }) {
  // 检查是否启用了认证
  const enableAuth = process.env.NEXT_PUBLIC_ENABLE_AUTH !== 'false'

  if (enableAuth) {
    return (
      <RainbowKitProvider theme={darkTheme()}>
        <AutoAuthenticator>{children}</AutoAuthenticator>
      </RainbowKitProvider>
    )
  }

  // 不启用认证时的标准模式
  return <RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitWrapper>{children}</RainbowKitWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
