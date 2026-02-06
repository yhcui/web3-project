/**
 * Comment API Endpoints
 *
 * This module provides hooks for interacting with comment-related APIs.
 * It includes queries for fetching comments and mutations for creating/deleting comments.
 */

// Export all query hooks
export {
  // Query hooks
  useCommentList,
  useInfiniteCommentList,
  useImageUploadUrl,

  // Query utilities
  prefetchCommentList,

  // Query keys factory
  commentKeys,
} from './queries'

// Export all mutation hooks
export {
  // Mutation hooks
  usePostComment,
  usePostImageComment,
  useDeleteComment,

  // Optimistic mutation hooks
  usePostCommentOptimistic,
} from './mutations'

// Re-export types from schema for convenience
export type {
  CommentItem,
  PostCommentInput,
  PostCommentResponse,
  PostImageCommentInput,
  PostImageCommentResponse,
  CommentListQuery,
  CommentListResponse,
  DeleteCommentInput,
  DeleteCommentResponse,
  GetImageUploadUrlResponse,
} from '@/api/schemas/comment.schema'
