import { z } from 'zod'

// 用户对象模型
export const UserSchema = z.object({
  id: z.number(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  username: z.string().optional(),
  email: z.email().optional(),
  avatar: z.url().optional(),
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
})

// 获取签名消息请求参数
export const GetSignMessageQuerySchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
    .transform((addr) => addr.toLowerCase()),
})

// 获取签名消息响应
export const GetSignMessageResponseSchema = z
  .object({
    code: z.number().optional().default(200),
    message: z.string().optional().default('success'),
    data: z
      .union([
        z.object({
          message: z.string(),
          nonce: z.string().optional(),
          expiry: z.number().optional(),
        }),
        z.string(), // 有时API可能直接返回字符串
      ])
      .optional(),
  })
  .transform((val) => {
    // 标准化响应格式
    if (typeof val.data === 'string') {
      return {
        code: val.code || 200,
        message: val.message || 'success',
        data: {
          message: val.data,
          nonce: undefined,
          expiry: undefined,
        },
      }
    }
    // 如果没有data，创建默认消息
    if (!val.data) {
      return {
        code: val.code || 200,
        message: val.message || 'success',
        data: {
          message: 'Sign this message to authenticate with Coinroll',
          nonce: undefined,
          expiry: undefined,
        },
      }
    }
    return val as any
  })

// 钱包登录请求体
export const WalletLoginInputSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
    .transform((addr) => addr.toLowerCase()),
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$|^[a-fA-F0-9]+$/, 'Invalid signature format'),
})

// 钱包登录响应
export const WalletLoginResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    token: z.string(),
    refreshToken: z.string().optional(),
    expiresIn: z.number().optional(),
    tokenType: z.string().optional().default('Bearer'),
    user: UserSchema.optional(),
  }),
})

// 刷新Token请求
export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string(),
})

// 刷新Token响应
export const RefreshTokenResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    token: z.string(),
    refreshToken: z.string().optional(),
    expiresIn: z.number().optional(),
    tokenType: z.string().optional().default('Bearer'),
  }),
})

// 通用API响应
export const ApiResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.any().optional(),
})

// 类型导出
export type User = z.infer<typeof UserSchema>
export type GetSignMessageQuery = z.infer<typeof GetSignMessageQuerySchema>
export type GetSignMessageResponse = z.infer<
  typeof GetSignMessageResponseSchema
>
export type WalletLoginInput = z.infer<typeof WalletLoginInputSchema>
export type WalletLoginResponse = z.infer<typeof WalletLoginResponseSchema>
export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>
export type ApiResponse = z.infer<typeof ApiResponseSchema>
