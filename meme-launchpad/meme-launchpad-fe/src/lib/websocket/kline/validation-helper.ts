import { z } from 'zod'

/**
 * Helper function to validate WebSocket messages with detailed error reporting
 */
export function validateWebSocketMessage(data: unknown, schema: z.ZodSchema) {
  try {
    return { success: true, data: schema.parse(data), error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      const errorDetails = {
        message: 'Validation failed',
        errors: zodError.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          expected: err.code,
          received:
            err.code === 'invalid_type' ? (err as any).received : undefined,
        })),
        fullError: error,
      }

      console.group('[WebSocket] Validation Error Details')
      console.error('Failed to validate message against schema')
      console.error('Raw data:', JSON.stringify(data, null, 2))
      console.table(errorDetails.errors)
      console.error('Full Zod error:', error)
      console.groupEnd()

      return { success: false, data: null, error: errorDetails }
    }

    return { success: false, data: null, error }
  }
}

/**
 * Attempts to identify message type and validate accordingly
 */
export function identifyAndValidateMessage(data: any) {
  // First, check if it has a type field
  if (!data || typeof data !== 'object' || !data.type) {
    return {
      success: false,
      error: 'Message missing type field',
      data: null,
    }
  }

  console.log(`[WebSocket] Attempting to validate message type: ${data.type}`)

  // Return the data with type information for routing
  // The actual validation can happen in specific handlers
  return {
    success: true,
    type: data.type,
    data: data,
    error: null,
  }
}

/**
 * Debug helper to compare expected vs actual message structure
 */
export function debugMessageStructure(actual: any, schemaName: string) {
  console.group(`[WebSocket] Debug: ${schemaName}`)
  console.log('Actual message structure:')
  console.log(JSON.stringify(actual, null, 2))

  // Log the keys present in the actual message
  if (actual && typeof actual === 'object') {
    console.log('Message keys:', Object.keys(actual))

    // Check for nested objects
    Object.keys(actual).forEach((key) => {
      if (actual[key] && typeof actual[key] === 'object') {
        console.log(`  ${key} keys:`, Object.keys(actual[key]))
      }
    })
  }

  console.groupEnd()
}
