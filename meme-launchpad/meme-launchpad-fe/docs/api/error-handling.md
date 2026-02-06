# API Error Handling Documentation

## Overview

This document describes the improved error handling mechanism for API responses in the Coinroll Web v2 application.

## Problem Statement

Previously, when the API returned an error response with a non-zero code, the application would throw a Zod validation error instead of displaying the actual API error message. This happened because the response structure for errors differs from success responses:

### Error Response Structure

```json
{
  "code": 40010003, // Any code !== 200 indicates an error
  "message": "User token is invalid.",
  "data": null
}
```

### Success Response Structure

```json
{
  "code": 200, // Code 200 indicates success
  "message": "Success",
  "data": {
    // ... actual response data
  }
}
```

When Zod tried to validate an error response against a schema expecting `data` to be an object, it would throw a validation error about the type mismatch, masking the actual API error message.

## Solution

We've implemented a centralized response handler that checks the API response code before attempting Zod validation.

### Response Handler (`src/api/utils/response-handler.ts`)

The `parseApiResponse` function:

1. **Checks the response code first** - If `code !== 200`, it immediately throws an `ApiError` with the actual API message
2. **Handles null data gracefully** - For successful responses (code: 200) with null data (e.g., delete operations)
3. **Validates with Zod only for successful responses** - Ensures type safety for actual data when code is 200
4. **Provides detailed error context** - Includes error code, message, and any additional details

### Usage

All API endpoint functions now use the response handler:

```typescript
import { parseApiResponse } from '@/api/utils/response-handler'
import { ResponseSchema } from '@/api/schemas/...'

async function fetchData() {
  const response = await kyClient.get('endpoint').json()

  // This will properly handle both errors and success
  return parseApiResponse(response, ResponseSchema)
}
```

## Benefits

1. **Better User Experience** - Users see the actual error message from the API (e.g., "User token is invalid") instead of cryptic Zod validation errors
2. **Consistent Error Handling** - All API responses are handled uniformly across the application
3. **Type Safety Maintained** - Zod validation still ensures type safety for successful responses
4. **Debugging Friendly** - Error details are preserved and logged for debugging

## Error Flow

```
API Response → parseApiResponse → Check Code
                                    ↓
                    Code ≠ 200 → Throw ApiError with API message
                    Code = 200 → Validate with Zod → Return typed data
```

## Updated Files

The following files have been updated to use the new error handling:

- `/src/api/endpoints/tokens/queries.ts` - Token list, detail, hot picks, trending tokens
- `/src/api/endpoints/tokens/mutations.ts` - Create token, calculate address
- `/src/api/endpoints/auth/queries.ts` - Get sign message
- `/src/api/endpoints/auth/mutations.ts` - Wallet login, refresh token
- `/src/api/endpoints/file/queries.ts` - Get presigned URLs
- `/src/api/endpoints/file/mutations.ts` - File upload confirmation

## Error Types

### ApiError

Custom error class that preserves:

- `message`: The actual error message from the API
- `status`: HTTP status code (default 400 for API errors)
- `code`: The API error code (e.g., "40010003")
- `details`: Any additional error details from the API

### Example Error Handling in Components

```typescript
import { useCreateToken } from '@/api/endpoints/tokens'

function TokenCreator() {
  const createToken = useCreateToken()

  const handleCreate = async (data) => {
    try {
      await createToken.mutateAsync(data)
    } catch (error) {
      if (error instanceof ApiError) {
        // Display the actual API error message
        console.error(`API Error ${error.code}: ${error.message}`)
      }
    }
  }
}
```

## Testing

You can test the error handling by:

1. Disconnecting your wallet (triggers auth errors)
2. Submitting invalid data (triggers validation errors)
3. Using expired tokens (triggers 401 errors)

Each scenario will now display the appropriate error message from the API instead of Zod validation errors.
