import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import { notify } from '@/stores/useUIStore'
import { commentKeys } from './queries'
import {
  PostCommentInputSchema,
  PostCommentResponseSchema,
  PostImageCommentInputSchema,
  PostImageCommentResponseSchema,
  DeleteCommentInputSchema,
  DeleteCommentResponseSchema,
  type PostCommentInput,
  type PostCommentResponse,
  type PostImageCommentInput,
  type PostImageCommentResponse,
  type DeleteCommentInput,
  type DeleteCommentResponse,
} from '@/api/schemas/comment.schema'

// API function: Post a comment
async function postComment(
  data: PostCommentInput
): Promise<PostCommentResponse> {
  // Validate input data
  const validated = PostCommentInputSchema.parse(data)

  console.log('[Comment API] Posting comment:', validated)

  // Make request
  const response = await kyClient
    .post('comment/post-comment', {
      json: validated,
    })
    .json()

  console.log('[Comment API] Post comment response:', response)

  // Validate response
  return parseApiResponse(response, PostCommentResponseSchema)
}

// API function: Post an image comment
async function postImageComment(
  data: PostImageCommentInput
): Promise<PostImageCommentResponse> {
  // Validate input data
  const validated = PostImageCommentInputSchema.parse(data)

  console.log('[Comment API] Posting image comment:', validated)

  // Make request
  const response = await kyClient
    .post('comment/post-img-comment', {
      json: validated,
    })
    .json()

  console.log('[Comment API] Post image comment response:', response)

  // Validate response
  return parseApiResponse(response, PostImageCommentResponseSchema)
}

// API function: Delete a comment
async function deleteComment(
  data: DeleteCommentInput
): Promise<DeleteCommentResponse> {
  // Validate input data
  const validated = DeleteCommentInputSchema.parse(data)

  console.log('[Comment API] Deleting comment:', validated)

  // Make request
  const response = await kyClient
    .post('comment/delete', {
      json: validated,
    })
    .json()

  console.log('[Comment API] Delete comment response:', response)

  // Validate response
  return parseApiResponse(response, DeleteCommentResponseSchema)
}

/**
 * Hook: Post a comment
 * Used to post a text comment on a token
 *
 * @example
 * ```tsx
 * const postCommentMutation = usePostComment()
 *
 * const handlePostComment = async () => {
 *   const result = await postCommentMutation.mutateAsync({
 *     tokenId: 123,
 *     content: "This is a great token!"
 *   })
 *
 *   console.log('Comment posted with ID:', result.data?.commentId)
 * }
 * ```
 */
export const usePostComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postComment,

    onSuccess: (response, variables) => {
      // Validate response
      if (response.code !== 200) {
        throw new Error(response.message || 'Failed to post comment')
      }

      // Invalidate comment list cache for this token
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.tokenId),
      })

      // Show success notification
      notify.success(
        'Comment Posted',
        'Your comment has been posted successfully'
      )
    },

    onError: (error: any) => {
      // Error handling
      console.error('Comment posting failed:', error)

      // Show error notification
      notify.error(
        'Comment Failed',
        error?.message || 'Failed to post comment. Please try again.'
      )
    },
  })
}

/**
 * Hook: Post an image comment
 * Used to post an image comment on a token
 *
 * @example
 * ```tsx
 * const postImageCommentMutation = usePostImageComment()
 *
 * const handlePostImageComment = async (imageUrl: string) => {
 *   const result = await postImageCommentMutation.mutateAsync({
 *     tokenId: 123,
 *     img: imageUrl
 *   })
 *
 *   console.log('Image comment posted with ID:', result.data?.commentId)
 * }
 * ```
 */
export const usePostImageComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postImageComment,

    onSuccess: (response, variables) => {
      // Validate response
      if (response.code !== 200) {
        throw new Error(response.message || 'Failed to post image comment')
      }

      // Invalidate comment list cache for this token
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.tokenId),
      })

      // Show success notification
      notify.success(
        'Image Comment Posted',
        'Your image comment has been posted successfully'
      )
    },

    onError: (error: any) => {
      // Error handling
      console.error('Image comment posting failed:', error)

      // Show error notification
      notify.error(
        'Image Comment Failed',
        error?.message || 'Failed to post image comment. Please try again.'
      )
    },
  })
}

/**
 * Hook: Delete a comment
 * Used to delete a comment by its ID
 *
 * @example
 * ```tsx
 * const deleteCommentMutation = useDeleteComment()
 *
 * const handleDeleteComment = async (commentId: number) => {
 *   await deleteCommentMutation.mutateAsync({
 *     commentId
 *   })
 *
 *   console.log('Comment deleted successfully')
 * }
 * ```
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteComment,

    onSuccess: (response) => {
      // Validate response
      if (response.code !== 200) {
        throw new Error(response.message || 'Failed to delete comment')
      }

      // Invalidate all comment lists (since we don't know which token)
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      })

      // Show success notification
      notify.success(
        'Comment Deleted',
        'The comment has been deleted successfully'
      )
    },

    onError: (error: any) => {
      // Error handling
      console.error('Comment deletion failed:', error)

      // Show error notification
      notify.error(
        'Delete Failed',
        error?.message || 'Failed to delete comment. Please try again.'
      )
    },
  })
}

/**
 * Hook: Post comment with optimistic update
 * Provides optimistic UI updates for better UX
 *
 * @example
 * ```tsx
 * const postCommentMutation = usePostCommentOptimistic(tokenId)
 *
 * const handlePostComment = async () => {
 *   await postCommentMutation.mutateAsync({
 *     tokenId: 123,
 *     content: "Great project!"
 *   })
 * }
 * ```
 */
export const usePostCommentOptimistic = (tokenId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postComment,

    // Optimistic update
    onMutate: async (newComment) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({
        queryKey: commentKeys.list(tokenId),
      })

      // Get current data
      const previousComments = queryClient.getQueryData(
        commentKeys.list(tokenId)
      )

      // Optimistically update cache
      queryClient.setQueryData(commentKeys.list(tokenId), (old: any) => {
        if (!old?.data?.comments) return old

        const optimisticComment = {
          id: Date.now(), // Temporary ID
          content: newComment.content,
          walletAddress: '0x...', // Will be replaced with actual address
          holdingAmount: '0',
          createdAt: new Date().toISOString(),
        }

        return {
          ...old,
          data: {
            ...old.data,
            comments: [optimisticComment, ...old.data.comments],
          },
        }
      })

      // Return context for rollback
      return { previousComments }
    },

    // Rollback on error
    onError: (err, newComment, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          commentKeys.list(tokenId),
          context.previousComments
        )
      }

      // Show error notification
      notify.error(
        'Comment Failed',
        'Failed to post comment. Please try again.'
      )
    },

    // Refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(tokenId),
      })
    },
  })
}
