import { ZodSchema } from 'zod'
import { ApiError } from '@/api/client/ky-client'

/**
 * API Response structure from backend
 */
interface ApiResponse<T = any> {
  code: number
  message: string
  data: T | null
}

/**
 * Validates and parses API response with proper error handling
 *
 * This function checks the response code first before attempting to parse the data.
 * If the API returns an error (code !== 200), it throws an ApiError with the actual
 * API error message instead of a Zod validation error.
 *
 * @param response - The raw API response
 * @param schema - The Zod schema to validate the response
 * @returns The parsed and validated response
 * @throws {ApiError} When the API returns an error or validation fails
 */
export function parseApiResponse<T>(
  response: unknown,
  schema: ZodSchema<T>
): T {
  // First, check if the response has the expected structure
  const apiResponse = response as ApiResponse

  // Check if response has error code (code !== 200 indicates error)
  if (apiResponse?.code !== undefined && apiResponse.code !== 200) {
    // API returned an error, throw the actual API error message
    throw new ApiError(
      apiResponse.message || 'API request failed',
      400, // Default to 400 for API errors
      String(apiResponse.code),
      apiResponse.data
    )
  }

  // If code is 200 (success) but data is null/undefined, handle gracefully
  if (
    apiResponse?.code === 200 &&
    (apiResponse.data === null || apiResponse.data === undefined)
  ) {
    // Some endpoints might return null data on success (e.g., delete operations)
    // Check if the schema expects an optional data field
    try {
      return schema.parse(response)
    } catch (zodError) {
      // If schema doesn't allow null data, throw a more informative error
      throw new ApiError(
        'API returned null data when object was expected',
        500,
        'NULL_DATA_ERROR',
        { originalError: zodError }
      )
    }
  }

  // Normal flow: parse the entire response with Zod
  try {
    return schema.parse(response)
  } catch (zodError) {
    // Log the actual response and error for debugging
    console.error('[parseApiResponse] Zod validation failed:', {
      error: zodError,
      response: JSON.stringify(response, null, 2),
    })

    // If Zod parsing fails for other reasons, wrap it in ApiError
    throw new ApiError('Response validation failed', 500, 'VALIDATION_ERROR', {
      originalError: zodError,
      response: apiResponse,
    })
  }
}

/**
 * Type guard to check if a value is an API response
 */
export function isApiResponse(value: unknown): value is ApiResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'data' in value
  )
}
