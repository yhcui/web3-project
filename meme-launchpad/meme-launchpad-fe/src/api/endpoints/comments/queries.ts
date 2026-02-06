import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import {
  CommentListResponseSchema,
  GetImageUploadUrlResponseSchema,
  type CommentListQuery,
  type CommentListResponse,
  type GetImageUploadUrlResponse,
} from '@/api/schemas/comment.schema'

// Query keys factory
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (tokenId: number, filters?: Record<string, any>) =>
    [...commentKeys.lists(), tokenId, filters] as const,
  uploadUrl: () => [...commentKeys.all, 'upload-url'] as const,
}

// API function: Get comment list
async function fetchCommentList(
  params: CommentListQuery
): Promise<CommentListResponse> {
  const searchParams: Record<string, any> = {
    tokenId: params.tokenId,
    pn: params.pn || 1,
    ps: params.ps || 20,
  }

  if (params.startTime !== undefined) {
    searchParams.startTime = params.startTime
  }

  const response = await kyClient
    .get('comment/list', {
      searchParams,
    })
    .json()

  return parseApiResponse(response, CommentListResponseSchema)
}

// API function: Get image upload URL
async function fetchImageUploadUrl(): Promise<GetImageUploadUrlResponse> {
  const response = await kyClient.get('comment/get-upload-url').json()
  return parseApiResponse(response, GetImageUploadUrlResponseSchema)
}

/**
 * Hook: Get comment list
 * Fetches paginated comments for a specific token
 *
 * @param tokenId - The token ID to fetch comments for
 * @param params - Query parameters (page number, page size, start time)
 * @returns Comment list data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCommentList(123, {
 *   pn: 1,
 *   ps: 20
 * })
 *
 * // Render comment list
 * data?.data?.comments.map(comment => (
 *   <CommentCard key={comment.id} comment={comment} />
 * ))
 * ```
 */
export const useCommentList = (
  tokenId: number | undefined,
  params?: Omit<CommentListQuery, 'tokenId'>
) => {
  return useQuery({
    queryKey: commentKeys.list(tokenId || 0, params),
    queryFn: () =>
      fetchCommentList({
        tokenId: tokenId!,
        pn: params?.pn || 1,
        ps: params?.ps || 20,
        ...(params?.startTime !== undefined && { startTime: params.startTime }),
      }),
    enabled: !!tokenId && tokenId > 0,
    staleTime: 1000 * 10, // 10 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook: Get comment list (infinite scroll)
 * Used for implementing infinite scroll loading of comments
 *
 * @param tokenId - The token ID to fetch comments for
 * @param params - Base query parameters
 * @returns Infinite query data
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useInfiniteCommentList(123, {
 *   ps: 20
 * })
 *
 * // Load more
 * if (hasNextPage) {
 *   fetchNextPage()
 * }
 * ```
 */
export const useInfiniteCommentList = (
  tokenId: number | undefined,
  params?: Omit<CommentListQuery, 'tokenId' | 'pn'>
) => {
  return useInfiniteQuery({
    queryKey: commentKeys.list(tokenId || 0, { ...params, infinite: true }),
    queryFn: ({ pageParam = 1 }) =>
      fetchCommentList({
        tokenId: tokenId!,
        pn: pageParam,
        ps: params?.ps || 20,
        ...(params?.startTime !== undefined && { startTime: params.startTime }),
      }),
    getNextPageParam: (lastPage, allPages) => {
      // If the API returns hasMore flag, use it
      if (lastPage.data?.hasMore === false) {
        return undefined
      }
      // Otherwise, check if we got any comments
      const comments = lastPage.data?.comments || []
      if (comments.length === 0 || comments.length < (params?.ps || 20)) {
        return undefined
      }
      // Return next page number
      return allPages.length + 1
    },
    initialPageParam: 1,
    enabled: !!tokenId && tokenId > 0,
    staleTime: 1000 * 10, // 10 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook: Get image upload URL
 * Fetches a pre-signed URL for uploading comment images
 *
 * @returns Upload URL data
 *
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = useImageUploadUrl()
 *
 * // Get upload URL when user selects an image
 * const handleImageSelect = async (file: File) => {
 *   const { data } = await refetch()
 *   if (data?.data?.uploadUrl) {
 *     // Upload file to the URL
 *     await uploadFile(data.data.uploadUrl, file)
 *   }
 * }
 * ```
 */
export const useImageUploadUrl = () => {
  return useQuery({
    queryKey: commentKeys.uploadUrl(),
    queryFn: fetchImageUploadUrl,
    enabled: false, // Manual fetch only
    staleTime: 0, // Always fetch fresh URL
    gcTime: 1000 * 60, // 1 minute cache
  })
}

/**
 * Prefetch comment list
 * Used to preload comments for better user experience
 *
 * @example
 * ```tsx
 * const queryClient = useQueryClient()
 *
 * // Prefetch on hover
 * onMouseEnter={() => prefetchCommentList(queryClient, tokenId)}
 * ```
 */
export const prefetchCommentList = async (
  queryClient: any,
  tokenId: number,
  params?: Omit<CommentListQuery, 'tokenId'>
) => {
  await queryClient.prefetchQuery({
    queryKey: commentKeys.list(tokenId, params),
    queryFn: () =>
      fetchCommentList({
        tokenId,
        pn: params?.pn || 1,
        ps: params?.ps || 20,
        ...(params?.startTime !== undefined && { startTime: params.startTime }),
      }),
    staleTime: 1000 * 10,
  })
}
