import { z } from 'zod'

// Comment Item Schema
export const CommentItemSchema = z.object({
  id: z.number(),
  content: z.string().optional(),
  img: z.string().url().optional(),
  holdingAmount: z.string().optional().default('0'),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/i),
  createdAt: z.string().optional(),
})

// Post Comment Input
export const PostCommentInputSchema = z.object({
  tokenId: z.number(),
  content: z.string().min(1).max(500),
})

// Post Comment Response
export const PostCommentResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z
    .object({
      commentId: z.number(),
    })
    .optional(),
})

// Post Image Comment Input
export const PostImageCommentInputSchema = z.object({
  tokenId: z.number(),
  img: z.string().url(),
})

// Post Image Comment Response
export const PostImageCommentResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z
    .object({
      commentId: z.number(),
    })
    .optional(),
})

// Comment List Query Parameters
export const CommentListQuerySchema = z.object({
  tokenId: z.number(),
  pn: z.number().min(1).optional().default(1), // page number
  ps: z.number().min(1).max(100).optional().default(20), // page size
  startTime: z.number().optional(), // timestamp for pagination
})

// Comment List Response
export const CommentListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z
    .object({
      comments: z.array(CommentItemSchema),
      total: z.number().optional(),
      hasMore: z.boolean().optional(),
    })
    .optional(),
})

// Delete Comment Input
export const DeleteCommentInputSchema = z.object({
  commentId: z.number(),
})

// Delete Comment Response
export const DeleteCommentResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.any().optional(),
})

// Get Image Upload URL Response
export const GetImageUploadUrlResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z
    .object({
      uploadUrl: z.string().url(),
      imageUrl: z.string().url(), // The final URL where the image will be accessible
      expiresAt: z.number().optional(), // Unix timestamp when the upload URL expires
    })
    .optional(),
})

// Type exports
export type CommentItem = z.infer<typeof CommentItemSchema>
export type PostCommentInput = z.infer<typeof PostCommentInputSchema>
export type PostCommentResponse = z.infer<typeof PostCommentResponseSchema>
export type PostImageCommentInput = z.infer<typeof PostImageCommentInputSchema>
export type PostImageCommentResponse = z.infer<
  typeof PostImageCommentResponseSchema
>
export type CommentListQuery = z.infer<typeof CommentListQuerySchema>
export type CommentListResponse = z.infer<typeof CommentListResponseSchema>
export type DeleteCommentInput = z.infer<typeof DeleteCommentInputSchema>
export type DeleteCommentResponse = z.infer<typeof DeleteCommentResponseSchema>
export type GetImageUploadUrlResponse = z.infer<
  typeof GetImageUploadUrlResponseSchema
>
