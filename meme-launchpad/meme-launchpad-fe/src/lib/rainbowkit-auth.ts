import { createAuthenticationAdapter } from '@rainbow-me/rainbowkit'
import { SiweMessage } from 'siwe'
import { getAccount } from 'wagmi/actions'
import { kyClient } from '@/api/client/ky-client'
import { useAuthStore } from '@/stores/useAuthStore'
import { config } from '@/config/wagmi'
import type {
  GetSignMessageResponse,
  WalletLoginResponse,
} from '@/api/schemas/auth.schema'

/**
 * RainbowKit Authentication Adapter
 *
 * 处理钱包连接后的自动认证流程：
 * 1. 获取签名挑战消息
 * 2. 请求用户签名
 * 3. 验证签名并登录
 * 4. 管理认证状态
 */
export const authenticationAdapter = createAuthenticationAdapter({
  /**
   * 获取签名消息
   * 当用户连接钱包时调用
   */
  getNonce: async () => {
    try {
      console.log('[Auth] Getting nonce...')

      // 使用wagmi的getAccount获取当前连接的钱包地址
      const account = getAccount(config)
      const address = account.address

      if (!address) {
        console.error('[Auth] No wallet address available from wagmi')
        // 返回一个默认消息，让RainbowKit继续流程
        return 'Sign this message to authenticate with Coinroll'
      }

      console.log('[Auth] Address found from wagmi:', address)

      // 从API获取签名挑战消息
      const response = await kyClient
        .get('user/sign-msg', {
          searchParams: { address: address.toLowerCase() },
        })
        .json<GetSignMessageResponse>()

      console.log('[Auth] API Response:', response)

      if (response.code !== 200) {
        console.error('[Auth] API Error:', response.message)
        // 返回默认消息而不是抛出错误
        return `Sign this message to authenticate with Coinroll\n\nAddress: ${address.toLowerCase()}\nTimestamp: ${Date.now()}`
      }

      // 返回消息内容 - API的data.message就是完整的签名消息
      const message = response.data.message
      console.log('[Auth] Returning message from API:', message)
      return message
    } catch (error) {
      console.error('[Auth] Failed to get nonce:', error)
      // 返回默认消息而不是抛出错误，让用户能继续
      return `Welcome to our platform!\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address: 0x0000000000000000000000000000000000000000\nNonce: ${Date.now()}_fallback\nTimestamp: ${Date.now()}`
    }
  },

  /**
   * 创建SIWE消息
   * 用于生成符合EIP-4361标准的签名消息
   */
  createMessage: ({ nonce, address, chainId }) => {
    console.log('[Auth] Creating message with:', { nonce, address, chainId })

    // 重要：直接使用从API返回的nonce（实际上是完整的消息）
    // API返回的nonce就是需要签名的完整消息内容
    if (nonce) {
      console.log('[Auth] Using API message directly:', nonce)
      return nonce
    }

    // 只有在没有从API获取到消息时才使用备用消息
    console.warn('[Auth] No message from API, using fallback')
    return `Welcome to our platform!\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address: ${address}\nNonce: ${Date.now()}_fallback\nTimestamp: ${Date.now()}`
  },

  /**
   * 验证签名
   * 用户签名后调用，进行服务端验证
   */
  verify: async ({ message, signature }) => {
    console.log('[Auth] Verifying signature...')
    console.log('[Auth] Message:', message)
    console.log('[Auth] Signature:', signature)

    try {
      // 从消息中提取地址
      let address: string | undefined

      // API返回的消息格式包含 "Wallet address: 0x..."
      const addressMatch = message.match(
        /Wallet address:\s*(0x[a-fA-F0-9]{40})/i
      )
      if (addressMatch) {
        address = addressMatch[1]
        console.log('[Auth] Extracted address from message:', address)
      }

      // 如果没有从消息中提取到，尝试其他方式
      if (!address) {
        // 尝试从SIWE格式提取
        if (message.includes('wants you to sign in')) {
          try {
            const siweMessage = new SiweMessage(message)
            address = siweMessage.address
            console.log('[Auth] Parsed address from SIWE:', address)
          } catch (e) {
            console.log('[Auth] Not a standard SIWE message')
          }
        }

        // 尝试匹配任何0x开头的地址
        if (!address) {
          const anyAddressMatch = message.match(/0x[a-fA-F0-9]{40}/i)
          if (anyAddressMatch) {
            address = anyAddressMatch[0]
            console.log('[Auth] Found address in message:', address)
          }
        }
      }

      // 如果还是没有地址，从wagmi获取当前连接的地址
      if (!address) {
        const account = getAccount(config)
        address = account.address
        console.log('[Auth] Got address from wagmi:', address)
      }

      if (!address) {
        console.error('[Auth] No wallet address found for verification')
        return false
      }

      console.log('[Auth] Using address for login:', address)

      // 调用登录API
      const response = await kyClient
        .post('user/wallet-login', {
          json: {
            address: address.toLowerCase(),
            signature: signature.startsWith('0x')
              ? signature
              : `0x${signature}`,
          },
        })
        .json<WalletLoginResponse>()

      console.log('[Auth] Login API response:', response)

      if (response.code !== 200) {
        console.error('[Auth] Login API error:', response.message)
        throw new Error(response.message || 'Login failed')
      }

      // 保存认证信息到store
      const { login } = useAuthStore.getState()
      const { token, refreshToken, user } = response.data

      console.log('[Auth] Saving auth data to store')
      login(
        user || {
          id: 0,
          address: address.toLowerCase(),
          username: undefined,
        },
        {
          access: token,
          refresh: refreshToken || '',
        }
      )

      console.log('[Auth] Verification successful!')
      return true
    } catch (error: any) {
      console.error('[Auth] Verification failed:', error)
      console.error('[Auth] Error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response,
      })

      // 不要清理状态，让用户可以重试
      // const { logout } = useAuthStore.getState()
      // logout()

      return false
    }
  },

  /**
   * 登出处理
   * 用户断开连接时调用
   */
  signOut: async () => {
    try {
      // 清理本地认证状态
      const { logout } = useAuthStore.getState()
      logout()

      // 可选：调用后端登出接口
      // await kyClient.post('user/logout')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  },
})

/**
 * 检查用户是否已认证
 * 用于判断是否需要触发签名流程
 */
export const checkAuthStatus = (address: string | undefined): boolean => {
  if (!address) return false

  const { isAuthenticated, user, accessToken } = useAuthStore.getState()

  // 检查是否有有效的认证状态
  return !!(
    isAuthenticated &&
    accessToken &&
    user?.address?.toLowerCase() === address.toLowerCase()
  )
}

/**
 * 手动触发认证流程
 * 用于特定场景下主动请求用户签名
 */
export const triggerAuthentication = async (
  address: string,
  signMessage: (args: { message: string }) => Promise<string>
): Promise<boolean> => {
  try {
    // 获取签名消息
    const response = await kyClient
      .get('user/sign-msg', {
        searchParams: { address: address.toLowerCase() },
      })
      .json<GetSignMessageResponse>()

    if (response.code !== 200) {
      throw new Error(response.message || 'Failed to get sign message')
    }

    // 请求用户签名
    const signature = await signMessage({
      message: response.data.message,
    })

    // 验证签名并登录
    const loginResponse = await kyClient
      .post('user/wallet-login', {
        json: {
          address: address.toLowerCase(),
          signature,
        },
      })
      .json<WalletLoginResponse>()

    if (loginResponse.code !== 200) {
      throw new Error(loginResponse.message || 'Login failed')
    }

    // 保存认证信息
    const { login } = useAuthStore.getState()
    const { token, refreshToken, user } = loginResponse.data

    login(
      user || {
        id: 0,
        address: address.toLowerCase(),
        username: undefined,
      },
      {
        access: token,
        refresh: refreshToken || '',
      }
    )

    return true
  } catch (error) {
    console.error('Authentication failed:', error)
    return false
  }
}
