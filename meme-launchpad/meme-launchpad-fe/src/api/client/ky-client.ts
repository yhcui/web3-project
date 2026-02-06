import ky from 'ky'
import type { KyInstance } from 'ky'
import { useAuthStore } from '@/stores/useAuthStore'

// API配置
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.coinroll.io/api/v1'
const API_TIMEOUT = 30000 // 30秒超时

// 自定义错误类
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 创建Ky实例
export const kyClient: KyInstance = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
  retry: {
    limit: 2,
    methods: ['get', 'put', 'delete'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    backoffLimit: 3000,
  },
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // 从Zustand store获取认证token
        const token = useAuthStore.getState().accessToken

        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }

        // 添加语言标识
        const locale =
          typeof window !== 'undefined'
            ? localStorage.getItem('locale') || 'en'
            : 'en'
        request.headers.set('Accept-Language', locale)
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        // 处理401未授权
        if (response.status === 401) {
          // 清理认证状态
          const { logout } = useAuthStore.getState()
          logout()

          // 触发登出事件
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'))
          }
        }

        // 处理非200响应
        if (!response.ok) {
          let errorMessage = `Request failed with status ${response.status}`
          let errorCode = 'UNKNOWN_ERROR'
          let errorDetails = null

          try {
            const errorBody = (await response.json()) as any
            errorMessage = errorBody.message || errorMessage
            errorCode = errorBody.code || errorCode
            errorDetails = errorBody.details || null
          } catch {
            // 如果响应不是JSON，使用默认错误消息
          }

          throw new ApiError(
            errorMessage,
            response.status,
            errorCode,
            errorDetails
          )
        }

        return response
      },
    ],
  },
})

// 创建一个无认证的客户端（用于公开API）
export const publicKyClient: KyInstance = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// 辅助函数：设置access token（已废弃，使用useAuthStore）
export const setAccessToken = (token: string) => {
  console.warn(
    'setAccessToken is deprecated. Use useAuthStore.login() instead.'
  )
  // 为了兼容性，同时更新store
  const { updateTokens } = useAuthStore.getState()
  updateTokens({ access: token, refresh: '' })
}

// 辅助函数：清除access token（已废弃，使用useAuthStore）
export const clearAccessToken = () => {
  console.warn(
    'clearAccessToken is deprecated. Use useAuthStore.logout() instead.'
  )
  // 为了兼容性，调用store的logout
  const { logout } = useAuthStore.getState()
  logout()
}

// 辅助函数：获取access token
export const getAccessToken = (): string | null => {
  return useAuthStore.getState().accessToken
}
