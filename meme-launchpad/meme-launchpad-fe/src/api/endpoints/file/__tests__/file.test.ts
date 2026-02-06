import { describe, it, expect } from '@jest/globals'
import {
  GetTokenLogoPresignQuerySchema,
  GetTokenBannerPresignQuerySchema,
  PresignUrlSchema,
} from '@/api/schemas/file.schema'

describe('File Upload Schemas', () => {
  describe('GetTokenLogoPresignQuerySchema', () => {
    it('should validate valid logo upload params', () => {
      const validData = {
        fileName: 'logo.png',
        contentType: 'image/png',
        fileSize: 1024000, // 1MB
      }

      const result = GetTokenLogoPresignQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid content type', () => {
      const invalidData = {
        fileName: 'logo.txt',
        contentType: 'text/plain',
        fileSize: 1024000,
      }

      const result = GetTokenLogoPresignQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject oversized files', () => {
      const oversizedData = {
        fileName: 'logo.png',
        contentType: 'image/png',
        fileSize: 6 * 1024 * 1024, // 6MB
      }

      const result = GetTokenLogoPresignQuerySchema.safeParse(oversizedData)
      expect(result.success).toBe(false)
    })
  })

  describe('GetTokenBannerPresignQuerySchema', () => {
    it('should validate valid banner upload params', () => {
      const validData = {
        fileName: 'banner.jpg',
        contentType: 'image/jpeg',
        fileSize: 2048000, // 2MB
      }

      const result = GetTokenBannerPresignQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject GIF for banner', () => {
      const invalidData = {
        fileName: 'banner.gif',
        contentType: 'image/gif',
        fileSize: 2048000,
      }

      const result = GetTokenBannerPresignQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('PresignUrlSchema', () => {
    it('should validate presign URL response', () => {
      const validResponse = {
        uploadUrl: 'https://storage.example.com/upload?signature=xxx',
        publicUrl: 'https://cdn.example.com/tokens/logo.png',
        key: 'tokens/logo-123.png',
        expiresAt: Date.now() + 3600000,
        uploadHeaders: {
          'x-amz-acl': 'public-read',
        },
      }

      const result = PresignUrlSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })
  })
})
