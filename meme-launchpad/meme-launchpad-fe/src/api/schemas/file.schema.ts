import { z } from 'zod'

// 通用的预签名URL响应模型
export const PresignUrlSchema = z.object({
  uploadUrl: z.string().url(),
  uploadHeaders: z.record(z.string(), z.string()).optional(),
  publicUrl: z.string().url(),
  expiresAt: z.number().optional(),
  key: z.string(),
})

// 获取Token Logo预签名URL请求参数
export const GetTokenLogoPresignQuerySchema = z.object({
  fileName: z.string().min(1),
  contentType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|gif)$/i, 'Invalid image type'),
  fileSize: z
    .number()
    .positive()
    .max(5 * 1024 * 1024, 'File size must be less than 5MB'),
})

// 获取Token Logo预签名URL响应
export const GetTokenLogoPresignResponseSchema = z.object({
  code: z.number().default(200),
  message: z.string().default('success'),
  data: PresignUrlSchema,
})

// 获取Token Banner预签名URL请求参数
export const GetTokenBannerPresignQuerySchema = z.object({
  fileName: z.string().min(1),
  contentType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png)$/i, 'Invalid image type'),
  fileSize: z
    .number()
    .positive()
    .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
})

// 获取Token Banner预签名URL响应
export const GetTokenBannerPresignResponseSchema = z.object({
  code: z.number().default(200),
  message: z.string().default('success'),
  data: PresignUrlSchema,
})

// 文件上传成功确认请求参数
export const FileUploadConfirmInputSchema = z.object({
  key: z.string().min(1),
  uploadedUrl: z.string().url(),
  metadata: z.record(z.string(), z.any()).optional(),
})

// 文件上传成功确认响应
export const FileUploadConfirmResponseSchema = z.object({
  code: z.number().default(200),
  message: z.string().default('success'),
  data: z.object({
    success: z.boolean(),
    publicUrl: z.string().url(),
  }),
})

// 类型导出
export type PresignUrl = z.infer<typeof PresignUrlSchema>
export type GetTokenLogoPresignQuery = z.infer<
  typeof GetTokenLogoPresignQuerySchema
>
export type GetTokenLogoPresignResponse = z.infer<
  typeof GetTokenLogoPresignResponseSchema
>
export type GetTokenBannerPresignQuery = z.infer<
  typeof GetTokenBannerPresignQuerySchema
>
export type GetTokenBannerPresignResponse = z.infer<
  typeof GetTokenBannerPresignResponseSchema
>
export type FileUploadConfirmInput = z.infer<
  typeof FileUploadConfirmInputSchema
>
export type FileUploadConfirmResponse = z.infer<
  typeof FileUploadConfirmResponseSchema
>
