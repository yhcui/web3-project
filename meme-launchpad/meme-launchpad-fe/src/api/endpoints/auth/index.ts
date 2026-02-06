// 导出所有auth相关的hooks和工具

// 查询hooks
export { useGetSignMessage, prefetchSignMessage, authKeys } from './queries'

// 变更hooks
export { useWalletLogin, useRefreshToken, useLogout } from './mutations'

// 类型导出
export type {
  User,
  GetSignMessageQuery,
  GetSignMessageResponse,
  WalletLoginInput,
  WalletLoginResponse,
  RefreshTokenInput,
  RefreshTokenResponse,
  ApiResponse,
} from '@/api/schemas/auth.schema'
