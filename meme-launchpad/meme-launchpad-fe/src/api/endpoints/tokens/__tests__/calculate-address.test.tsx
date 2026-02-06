import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCalculateAddress } from '../mutations'
import { kyClient } from '@/api/client/ky-client'
import type { CalculateAddressInput } from '@/api/schemas/token.schema'

// Mock ky client
vi.mock('@/api/client/ky-client', () => ({
  kyClient: {
    post: vi.fn(),
  },
}))

// Mock UI store for notifications
vi.mock('@/stores/useUIStore', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  wrapper.displayName = 'QueryWrapper'
  return wrapper
}

describe('useCalculateAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate token address successfully', async () => {
    // Mock successful response
    const mockResponse = {
      code: 200,
      message: 'success',
      data: {
        predictedAddress: '0x422da096ffd3796e704d1b283fa4edf23b80abcd',
        salt: 'abcd',
      },
    }

    vi.mocked(kyClient.post).mockReturnValue({
      json: vi.fn().mockResolvedValue(mockResponse),
    } as any)

    const { result } = renderHook(() => useCalculateAddress(), {
      wrapper: createWrapper(),
    })

    const input: CalculateAddressInput = {
      name: 'Demo Token',
      symbol: 'DEMO',
      digits: 'abcd',
    }

    // Trigger mutation
    result.current.mutate(input)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Verify the API was called correctly
    expect(kyClient.post).toHaveBeenCalledWith('token/calculate-address', {
      json: {
        name: 'Demo Token',
        symbol: 'DEMO', // Should be uppercased by schema
        digits: 'abcd',
      },
    })

    // Verify the response data
    expect(result.current.data).toEqual(mockResponse)
    expect(result.current.data?.data?.predictedAddress).toBe(
      '0x422da096ffd3796e704d1b283fa4edf23b80abcd'
    )
  })

  it('should handle calculation error', async () => {
    // Mock error response
    const mockError = new Error('Network error')
    vi.mocked(kyClient.post).mockReturnValue({
      json: vi.fn().mockRejectedValue(mockError),
    } as any)

    const { result } = renderHook(() => useCalculateAddress(), {
      wrapper: createWrapper(),
    })

    const input: CalculateAddressInput = {
      name: 'Demo Token',
      symbol: 'DEMO',
      digits: 'abcd',
    }

    // Trigger mutation
    result.current.mutate(input)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should handle non-200 response code', async () => {
    // Mock response with error code
    const mockResponse = {
      code: 400,
      message: 'Invalid parameters',
      data: null,
    }

    vi.mocked(kyClient.post).mockReturnValue({
      json: vi.fn().mockResolvedValue(mockResponse),
    } as any)

    const { result } = renderHook(() => useCalculateAddress(), {
      wrapper: createWrapper(),
    })

    const input: CalculateAddressInput = {
      name: 'Demo Token',
      symbol: 'DEMO',
      digits: 'abcd',
    }

    // Trigger mutation
    result.current.mutate(input)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toContain('Invalid parameters')
  })

  it('should validate input schema', async () => {
    const { result } = renderHook(() => useCalculateAddress(), {
      wrapper: createWrapper(),
    })

    // Invalid input - missing required fields
    const invalidInput = {
      name: '', // Empty name should fail validation
      symbol: 'DEMO',
      digits: 'abcd',
    } as CalculateAddressInput

    // Trigger mutation with invalid input
    result.current.mutate(invalidInput)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // The error should be a validation error
    expect(result.current.error).toBeDefined()
  })

  it('should uppercase symbol automatically', async () => {
    const mockResponse = {
      code: 200,
      message: 'success',
      data: {
        predictedAddress: '0x422da096ffd3796e704d1b283fa4edf23b80abcd',
      },
    }

    vi.mocked(kyClient.post).mockReturnValue({
      json: vi.fn().mockResolvedValue(mockResponse),
    } as any)

    const { result } = renderHook(() => useCalculateAddress(), {
      wrapper: createWrapper(),
    })

    const input: CalculateAddressInput = {
      name: 'Demo Token',
      symbol: 'demo', // Lowercase symbol
      digits: 'abcd',
    }

    // Trigger mutation
    result.current.mutate(input)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Verify the symbol was uppercased in the API call
    expect(kyClient.post).toHaveBeenCalledWith('token/calculate-address', {
      json: expect.objectContaining({
        symbol: 'DEMO', // Should be uppercased
      }),
    })
  })

  it('should validate Ethereum address format in response', async () => {
    // Mock response with invalid address format
    const mockResponse = {
      code: 200,
      message: 'success',
      data: {
        predictedAddress: 'invalid-address', // Invalid format
      },
    }

    vi.mocked(kyClient.post).mockReturnValue({
      json: vi.fn().mockResolvedValue(mockResponse),
    } as any)

    const { result } = renderHook(() => useCalculateAddress(), {
      wrapper: createWrapper(),
    })

    const input: CalculateAddressInput = {
      name: 'Demo Token',
      symbol: 'DEMO',
      digits: 'abcd',
    }

    // Trigger mutation
    result.current.mutate(input)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Should fail due to invalid address format
    expect(result.current.error).toBeDefined()
  })
})
