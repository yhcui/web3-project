import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/api/schemas/auth.schema'

interface AuthState {
  // 状态
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  refreshToken: string | null

  // Actions
  login: (user: User, tokens: { access: string; refresh: string }) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  updateTokens: (tokens: { access: string; refresh: string }) => void
  setLoading: (loading: boolean) => void
  refreshAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,

      // 登录
      login: (user, tokens) => {
        set({
          user,
          isAuthenticated: true,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          isLoading: false,
        })
      },

      // 登出
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
        })
      },

      // 更新用户信息
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },

      // 更新Tokens
      updateTokens: (tokens) => {
        set({
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
        })
      },

      // 设置加载状态
      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      // 刷新认证状态
      refreshAuth: async () => {
        const { refreshToken } = get()
        if (!refreshToken) {
          get().logout()
          return
        }

        try {
          set({ isLoading: true })

          // TODO: 实现实际的刷新token API调用
          // 当后端实现refresh endpoint后，取消注释以下代码：
          // const { kyClient } = await import('@/api/client/ky-client')
          // const response = await kyClient.post('user/refresh-token', {
          //   json: { refreshToken }
          // }).json()

          // 临时模拟响应
          const response = {
            token: 'new-access-token',
            refreshToken: refreshToken,
            user: get().user,
          }

          if (response.token) {
            set({
              accessToken: response.token,
              refreshToken: response.refreshToken || refreshToken,
              user: (response.user as User) || get().user,
              isLoading: false,
            })
          }
        } catch (error) {
          console.error('Failed to refresh auth:', error)
          get().logout()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

// 监听认证事件
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout()
  })
}
