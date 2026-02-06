import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { toast } from 'sonner'

// Note: Internal notification state is deprecated - we use Sonner toast notifications now
// These interfaces and methods are kept for potential future use or migration
interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  timestamp: number
}

interface Modal {
  id: string
  component: React.ComponentType<any>
  props?: Record<string, any>
  onClose?: () => void
}

interface UIState {
  // 侧边栏状态
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // 通知
  notifications: Notification[]

  // 模态框
  modals: Modal[]

  // 全局加载状态
  globalLoading: boolean
  loadingMessage?: string

  // LeftPanel tab状态
  leftPanelActiveTab: string

  // 设置抽屉状态
  settingsDrawerOpen: boolean

  // K线颜色设置: 'red-up-green-down' | 'green-up-red-down'
  klineColorScheme: 'red-up-green-down' | 'green-up-red-down'

  // LeftPanel 显示/隐藏状态
  leftPanelVisible: boolean

  // Actions - 侧边栏
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapse: () => void

  // Actions - 通知
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // Actions - 模态框
  openModal: (modal: Omit<Modal, 'id'>) => string
  closeModal: (id: string) => void
  closeAllModals: () => void

  // Actions - 加载状态
  setGlobalLoading: (loading: boolean, message?: string) => void

  // Actions - LeftPanel tab
  setLeftPanelActiveTab: (tab: string) => void

  // Actions - 设置抽屉
  toggleSettingsDrawer: () => void
  setSettingsDrawerOpen: (open: boolean) => void

  // Actions - K线颜色设置
  toggleKlineColorScheme: () => void
  setKlineColorScheme: (
    scheme: 'red-up-green-down' | 'green-up-red-down'
  ) => void

  // Actions - LeftPanel 显示/隐藏
  toggleLeftPanelVisible: () => void
  setLeftPanelVisible: (visible: boolean) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        sidebarOpen: false,
        sidebarCollapsed: false,
        notifications: [],
        modals: [],
        globalLoading: false,
        loadingMessage: undefined,
        leftPanelActiveTab: 'popular', // 默认为"热门"
        settingsDrawerOpen: false,
        klineColorScheme: 'green-up-red-down', // 默认绿涨红跌
        leftPanelVisible: true, // 默认显示LeftPanel

        // 侧边栏操作
        toggleSidebar: () =>
          set((state) => ({
            sidebarOpen: !state.sidebarOpen,
          })),

        setSidebarOpen: (open) =>
          set({
            sidebarOpen: open,
          }),

        toggleSidebarCollapse: () =>
          set((state) => ({
            sidebarCollapsed: !state.sidebarCollapsed,
          })),

        // 通知操作
        addNotification: (notification) => {
          const id = Math.random().toString(36).substring(7)
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp: Date.now(),
          }

          set((state) => ({
            notifications: [...state.notifications, newNotification],
          }))

          // 自动移除通知
          const duration = notification.duration ?? 5000
          if (duration > 0) {
            setTimeout(() => {
              get().removeNotification(id)
            }, duration)
          }

          return id
        },

        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),

        clearNotifications: () =>
          set({
            notifications: [],
          }),

        // 模态框操作
        openModal: (modal) => {
          const id = Math.random().toString(36).substring(7)
          const newModal: Modal = {
            ...modal,
            id,
          }

          set((state) => ({
            modals: [...state.modals, newModal],
          }))

          return id
        },

        closeModal: (id) => {
          const modal = get().modals.find((m) => m.id === id)
          if (modal?.onClose) {
            modal.onClose()
          }

          set((state) => ({
            modals: state.modals.filter((m) => m.id !== id),
          }))
        },

        closeAllModals: () => {
          const modals = get().modals
          modals.forEach((modal) => {
            if (modal.onClose) {
              modal.onClose()
            }
          })

          set({ modals: [] })
        },

        // 全局加载状态
        setGlobalLoading: (loading, message) =>
          set({
            globalLoading: loading,
            loadingMessage: message,
          }),

        // LeftPanel tab状态
        setLeftPanelActiveTab: (tab) =>
          set({
            leftPanelActiveTab: tab,
          }),

        // 设置抽屉操作
        toggleSettingsDrawer: () =>
          set((state) => ({
            settingsDrawerOpen: !state.settingsDrawerOpen,
          })),

        setSettingsDrawerOpen: (open) =>
          set({
            settingsDrawerOpen: open,
          }),

        // K线颜色设置操作
        toggleKlineColorScheme: () =>
          set((state) => ({
            klineColorScheme:
              state.klineColorScheme === 'green-up-red-down'
                ? 'red-up-green-down'
                : 'green-up-red-down',
          })),

        setKlineColorScheme: (scheme) =>
          set({
            klineColorScheme: scheme,
          }),

        // LeftPanel 显示/隐藏操作
        toggleLeftPanelVisible: () =>
          set((state) => ({
            leftPanelVisible: !state.leftPanelVisible,
          })),

        setLeftPanelVisible: (visible) =>
          set({
            leftPanelVisible: visible,
          }),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          leftPanelActiveTab: state.leftPanelActiveTab,
          klineColorScheme: state.klineColorScheme,
          leftPanelVisible: state.leftPanelVisible,
        }),
      }
    ),
    {
      name: 'UIStore',
    }
  )
)

// 便捷的通知函数 - 使用 Sonner toast
export const notify = {
  success: (title: string, message?: string) => {
    toast.success(title, {
      description: message,
      duration: 5000,
    })
  },

  error: (title: string, message?: string) => {
    toast.error(title, {
      description: message,
      duration: 5000,
    })
  },

  warning: (title: string, message?: string) => {
    toast.warning(title, {
      description: message,
      duration: 5000,
    })
  },

  info: (title: string, message?: string) => {
    toast.info(title, {
      description: message,
      duration: 5000,
    })
  },
}
