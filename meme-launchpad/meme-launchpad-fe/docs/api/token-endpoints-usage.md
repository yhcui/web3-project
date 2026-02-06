# Token API Endpoints Usage Guide

This guide demonstrates how to use the token-related API endpoints that have been implemented following the architecture patterns.

## Overview

The token API endpoints provide functionality for:

- Creating new tokens (regular and IDO)
- Calculating token addresses before creation
- Fetching token lists with pagination
- Getting token details
- Searching tokens

## Import

```typescript
import {
  // Mutations
  useCreateToken,
  useCalculateAddress,
  useCreateIDOToken,

  // Queries
  useTokenList,
  useInfiniteTokenList,
  useTokenDetail,
  useSearchTokens,

  // Query keys (for cache management)
  tokenKeys,

  // Types
  type CreateTokenInput,
  type TokenListItem,
} from '@/api/endpoints/tokens'
```

## Creating Tokens

### Basic Token Creation

```tsx
import { useCreateToken } from '@/api/endpoints/tokens'

function CreateTokenForm() {
  const createTokenMutation = useCreateToken()

  const handleSubmit = async (formData: CreateTokenInput) => {
    try {
      const result = await createTokenMutation.mutateAsync({
        name: 'Demo Token',
        symbol: 'DEMO',
        description: 'This is a demo token for testing',
        launchMode: '1',
        launchTime: 0,
        logo: 'https://static.coinroll.io/images/demo-logo.png',
        banner: 'https://static.coinroll.io/images/demo-banner.jpg',
        website: 'https://demo.com',
        twitter: 'https://x.com/demo',
        telegram: 'https://t.me/demo',
        discord: 'https://discord.gg/demo',
        additionalLink1: 'https://medium.com/@demo',
        additionalLink2: 'https://github.com/demo',
        tags: ['meme', 'ai'],
        preBuyPercent: 0.1456,
        preBuyUsedPercent: [0.5, 0.5],
        preBuyUsedType: [1, 2],
        preBuyUsedDesc: ['Marketing', 'Development'],
        marginBnb: 100,
        marginTime: 60,
        digits: 'abcd',
        predictedAddress: '0x422da096ffd3796e704d1b283fa4edf23b80abcd',
      })

      console.log('Token created:', result.data?.tokenAddress)
      // Navigate to token detail page
    } catch (error) {
      console.error('Failed to create token:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createTokenMutation.isPending}>
        {createTokenMutation.isPending ? 'Creating...' : 'Create Token'}
      </button>
    </form>
  )
}
```

### IDO Token Creation

```tsx
import { useCreateIDOToken } from '@/api/endpoints/tokens'

function CreateIDOTokenForm() {
  const createIDOTokenMutation = useCreateIDOToken()

  const handleSubmit = async () => {
    const result = await createIDOTokenMutation.mutateAsync({
      // All basic token fields...
      name: "Demo IDO Token",
      symbol: "DEMO_IDO",
      // ... other base fields

      // IDO-specific fields
      totalFundsRaised: 50,
      fundraisingCycle: 60, // hours
      preUserLimit: 1.3,
      userLockupTime: 24, // hours
      addLiquidity: 0.65,
      protocolRevenue: 0.03,
      coreTeam: 0.04,
      communityTreasury: 0.4,
      buybackReserve: 0.1
    })
  }

  return (
    // Form implementation
  )
}
```

## Calculating Token Address

Calculate the predicted address before creating a token:

```tsx
import { useCalculateAddress } from '@/api/endpoints/tokens'
import { useState } from 'react'

function TokenAddressCalculator() {
  const calculateAddressMutation = useCalculateAddress()
  const [predictedAddress, setPredictedAddress] = useState<string>()

  const handleCalculate = async () => {
    const result = await calculateAddressMutation.mutateAsync({
      name: 'Demo Token',
      symbol: 'DEMO',
      digits: 'abcd',
    })

    if (result.data?.predictedAddress) {
      setPredictedAddress(result.data.predictedAddress)
    }
  }

  return (
    <div>
      <button
        onClick={handleCalculate}
        disabled={calculateAddressMutation.isPending}
      >
        Calculate Address
      </button>

      {predictedAddress && <div>Predicted Address: {predictedAddress}</div>}
    </div>
  )
}
```

## Fetching Token Lists

### Basic Pagination

```tsx
import { useTokenList } from '@/api/endpoints/tokens'
import { useState } from 'react'

function TokenList() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useTokenList({
    page,
    pageSize: 20,
    sort: 'createdAt:desc',
  })

  if (isLoading) return <div>Loading tokens...</div>
  if (error) return <div>Error loading tokens</div>

  return (
    <div>
      {data?.data.result.map((token) => (
        <TokenCard key={token.id} token={token} />
      ))}

      <Pagination
        current={page}
        total={data?.data.totalPage || 1}
        onChange={setPage}
      />
    </div>
  )
}
```

### Infinite Scroll

```tsx
import { useInfiniteTokenList } from '@/api/endpoints/tokens'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'

function InfiniteTokenList() {
  const { ref, inView } = useInView()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteTokenList({
      pageSize: 20,
      sort: 'hot:desc',
    })

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {data?.pages.map((page) =>
        page.data.result.map((token) => (
          <TokenCard key={token.id} token={token} />
        ))
      )}

      <div ref={ref}>{isFetchingNextPage && 'Loading more...'}</div>
    </div>
  )
}
```

## Token Details

```tsx
import { useTokenDetail } from '@/api/endpoints/tokens'
import { useParams } from 'next/navigation'

function TokenDetailPage() {
  const { address } = useParams()
  const { data, isLoading, error } = useTokenDetail(address as string)

  if (isLoading) return <div>Loading token details...</div>
  if (error) return <div>Error loading token</div>
  if (!data?.data) return <div>Token not found</div>

  const token = data.data

  return (
    <div>
      <h1>
        {token.name} ({token.symbol})
      </h1>
      <img src={token.logo} alt={token.name} />
      <p>{token.desc}</p>

      <div>
        <span>Progress: {token.progressPct}%</span>
        <span>Current BNB: {token.currentBnb}</span>
        <span>Target BNB: {token.targetBnb}</span>
      </div>

      {/* More token details */}
    </div>
  )
}
```

## Searching Tokens

```tsx
import { useSearchTokens } from '@/api/endpoints/tokens'
import { useState, useMemo } from 'react'
import { debounce } from 'lodash'

function TokenSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading } = useSearchTokens(searchTerm)

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  )

  return (
    <div>
      <input
        type="text"
        placeholder="Search tokens..."
        onChange={(e) => debouncedSearch(e.target.value)}
      />

      {isLoading && <div>Searching...</div>}

      {data?.data.result.map((token) => (
        <SearchResult key={token.id} token={token} />
      ))}
    </div>
  )
}
```

## Cache Management

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { tokenKeys } from '@/api/endpoints/tokens'

function CacheManagement() {
  const queryClient = useQueryClient()

  // Invalidate all token queries
  const refreshAllTokens = () => {
    queryClient.invalidateQueries({ queryKey: tokenKeys.all })
  }

  // Invalidate specific token
  const refreshToken = (address: string) => {
    queryClient.invalidateQueries({
      queryKey: tokenKeys.detail(address)
    })
  }

  // Remove token from cache
  const removeFromCache = (address: string) => {
    queryClient.removeQueries({
      queryKey: tokenKeys.detail(address)
    })
  }

  // Prefetch token detail
  const prefetchToken = async (address: string) => {
    await queryClient.prefetchQuery({
      queryKey: tokenKeys.detail(address),
      queryFn: () => fetchTokenDetail(address),
      staleTime: 1000 * 60 * 2,
    })
  }

  return (
    // UI implementation
  )
}
```

## Error Handling

```tsx
import { useCreateToken } from '@/api/endpoints/tokens'
import { ApiError } from '@/api/utils/errors'

function TokenCreationWithErrorHandling() {
  const createTokenMutation = useCreateToken()

  const handleCreate = async (data: CreateTokenInput) => {
    try {
      await createTokenMutation.mutateAsync(data)
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 400:
            // Handle validation error
            console.error('Validation failed:', error.details)
            break
          case 401:
            // Handle authentication error
            console.error('Please login first')
            break
          case 429:
            // Handle rate limit
            console.error('Too many requests, please try again later')
            break
          default:
            console.error('Unknown error:', error.message)
        }
      } else {
        console.error('Unexpected error:', error)
      }
    }
  }

  return (
    // Component implementation
  )
}
```

## TypeScript Types

All endpoints are fully typed. Import types as needed:

```typescript
import type {
  CreateTokenInput,
  CreateTokenResponse,
  CalculateAddressInput,
  CalculateAddressResponse,
  TokenListItem,
  TokenListResponse,
  TokenDetailResponse,
} from '@/api/endpoints/tokens'

// Use types in your components
interface TokenCardProps {
  token: TokenListItem
}

function TokenCard({ token }: TokenCardProps) {
  // Component implementation
}
```

## Best Practices

1. **Always handle loading and error states**
2. **Use error boundaries for unexpected errors**
3. **Implement proper form validation before API calls**
4. **Use optimistic updates for better UX when appropriate**
5. **Prefetch data on hover/focus for improved performance**
6. **Implement proper retry logic for failed requests**
7. **Use suspense mode for cleaner component code when possible**

## Testing

```typescript
// Example test for token creation
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateToken } from '@/api/endpoints/tokens'
import { createQueryWrapper } from '@/test/utils'

describe('useCreateToken', () => {
  it('creates token successfully', async () => {
    const { result } = renderHook(() => useCreateToken(), {
      wrapper: createQueryWrapper(),
    })

    await result.current.mutateAsync({
      // ... token data
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })
})
```
