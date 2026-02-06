# API Usage Guide

## Table of Contents

- [Quick Start](#quick-start)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Installation

```bash
# Core dependencies (already installed)
pnpm add @tanstack/react-query ky zod zustand

# Development dependencies
pnpm add -D @types/node
```

### Basic Setup

The API layer is already configured in your project. To use it:

```tsx
import { useTokens } from '@/api/endpoints/tokens'

function MyComponent() {
  const { data, isLoading, error } = useTokens()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error occurred</div>

  return <div>{/* Render data */}</div>
}
```

## Basic Usage

### 1. Fetching Data (Queries)

#### Simple Query

```tsx
import { useTokens } from '@/api/endpoints/tokens'

function TokenList() {
  const { data, isLoading, error, refetch } = useTokens({
    page: 1,
    limit: 20,
    sort: 'marketCap',
  })

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      {data?.data.map((token) => (
        <TokenCard key={token.id} token={token} />
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  )
}
```

#### Query with Parameters

```tsx
function TokenDetail({ tokenId }: { tokenId: string }) {
  const { data: token } = useToken(tokenId, {
    // Only fetch if tokenId exists
    enabled: !!tokenId,
    // Refetch every 30 seconds
    refetchInterval: 30000,
    // Keep previous data while fetching
    keepPreviousData: true,
  })

  return <div>{token?.name}</div>
}
```

### 2. Modifying Data (Mutations)

#### Create Operation

```tsx
import { useCreateToken } from '@/api/endpoints/tokens'
import { notify } from '@/stores/useUIStore'

function CreateTokenForm() {
  const createToken = useCreateToken()

  const handleSubmit = async (formData: CreateTokenInput) => {
    try {
      const result = await createToken.mutateAsync(formData)
      notify.success('Token created', `${result.name} has been created`)
      // Navigate to token page
      router.push(`/tokens/${result.id}`)
    } catch (error) {
      notify.error('Creation failed', error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createToken.isPending}>
        {createToken.isPending ? 'Creating...' : 'Create Token'}
      </button>
    </form>
  )
}
```

#### Update Operation

```tsx
function UpdateTokenForm({ token }: { token: Token }) {
  const updateToken = useUpdateToken()

  const handleUpdate = (updates: Partial<Token>) => {
    updateToken.mutate(
      { id: token.id, data: updates },
      {
        onSuccess: () => notify.success('Token updated'),
        onError: (error) => notify.error('Update failed'),
      }
    )
  }

  return <form>{/* Update form */}</form>
}
```

### 3. Using Stores

#### Authentication Store

```tsx
import { useAuthStore } from '@/stores/useAuthStore'

function UserProfile() {
  // Select specific state
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  // Or select multiple with shallow comparison
  const { user, isAuthenticated } = useAuthStore(
    (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    }),
    shallow
  )

  return (
    <div>
      <h1>Welcome, {user?.username}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

#### UI Store

```tsx
import { useUIStore, notify } from '@/stores/useUIStore'

function ThemeToggle() {
  const theme = useUIStore((state) => state.theme)
  const setTheme = useUIStore((state) => state.setTheme)

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    notify.success('Theme changed', `Switched to ${newTheme} mode`)
  }

  return <button onClick={toggleTheme}>{theme === 'dark' ? '🌙' : '☀️'}</button>
}
```

#### Preferences Store

```tsx
// Example: Managing favorites in your own store

function FavoriteButton({ tokenId }: { tokenId: string }) {
  const { isFavorite, toggleFavorite } = useFavoriteTokens()

  return (
    <button onClick={() => toggleFavorite(tokenId)}>
      {isFavorite(tokenId) ? '★' : '☆'}
    </button>
  )
}
```

## Advanced Usage

### 1. Infinite Scrolling

```tsx
import { useInfiniteTokens } from '@/api/endpoints/tokens'
import { useInView } from 'react-intersection-observer'

function InfiniteTokenList() {
  const { ref, inView } = useInView()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteTokens({ limit: 20 })

  // Auto-fetch next page when scrolling
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      {data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.data.map((token) => (
            <TokenCard key={token.id} token={token} />
          ))}
        </Fragment>
      ))}

      {/* Loading trigger */}
      <div ref={ref} className="h-10">
        {isFetchingNextPage && <Spinner />}
        {!hasNextPage && <p>No more tokens</p>}
      </div>
    </div>
  )
}
```

### 2. Optimistic Updates

```tsx
import { useToggleFavoriteToken } from '@/api/endpoints/tokens'

function OptimisticFavoriteButton({ token }: { token: Token }) {
  const toggleFavorite = useToggleFavoriteToken()
  const queryClient = useQueryClient()

  const handleToggle = () => {
    toggleFavorite.mutate(
      { id: token.id, isFavorite: token.isFavorite },
      {
        // Optimistically update the UI
        onMutate: async ({ id }) => {
          // Cancel in-flight queries
          await queryClient.cancelQueries({
            queryKey: tokenKeys.detail(id),
          })

          // Save current state
          const previousToken = queryClient.getQueryData(tokenKeys.detail(id))

          // Optimistically update
          queryClient.setQueryData(tokenKeys.detail(id), (old) => ({
            ...old,
            isFavorite: !old.isFavorite,
          }))

          return { previousToken }
        },
        // Rollback on error
        onError: (err, variables, context) => {
          if (context?.previousToken) {
            queryClient.setQueryData(
              tokenKeys.detail(variables.id),
              context.previousToken
            )
          }
        },
        // Refetch after success or error
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: tokenKeys.detail(token.id),
          })
        },
      }
    )
  }

  return <button onClick={handleToggle}>{token.isFavorite ? '★' : '☆'}</button>
}
```

### 3. Dependent Queries

```tsx
function TokenWithStats({ tokenId }: { tokenId: string }) {
  // First query
  const { data: token } = useToken(tokenId)

  // Second query depends on first
  const { data: stats } = useTokenStats(
    tokenId,
    // Only run if token exists
    { enabled: !!token }
  )

  // Third query depends on second
  const { data: holders } = useTokenHolders(tokenId, {
    enabled: !!stats && stats.holders > 0,
  })

  return (
    <div>
      <h1>{token?.name}</h1>
      <p>Price: ${stats?.price}</p>
      <p>Holders: {holders?.length}</p>
    </div>
  )
}
```

### 4. Parallel Queries

```tsx
function Dashboard() {
  const results = useQueries({
    queries: [
      {
        queryKey: tokenKeys.trending(),
        queryFn: fetchTrendingTokens,
      },
      {
        queryKey: ['stats'],
        queryFn: fetchStats,
      },
      {
        queryKey: ['news'],
        queryFn: fetchNews,
      },
    ],
  })

  const isLoading = results.some((result) => result.isLoading)
  const hasError = results.some((result) => result.error)

  if (isLoading) return <Spinner />
  if (hasError) return <ErrorMessage />

  const [trending, stats, news] = results.map((r) => r.data)

  return (
    <div>
      <TrendingSection data={trending} />
      <StatsSection data={stats} />
      <NewsSection data={news} />
    </div>
  )
}
```

### 5. Data Prefetching

```tsx
function TokenListWithPrefetch() {
  const queryClient = useQueryClient()
  const { data: tokens } = useTokens()

  const handleMouseEnter = (tokenId: string) => {
    // Prefetch token details on hover
    queryClient.prefetchQuery({
      queryKey: tokenKeys.detail(tokenId),
      queryFn: () => fetchTokenDetail(tokenId),
      staleTime: 1000 * 60 * 5, // 5 minutes
    })
  }

  return (
    <div>
      {tokens?.map((token) => (
        <div key={token.id} onMouseEnter={() => handleMouseEnter(token.id)}>
          <Link href={`/tokens/${token.id}`}>{token.name}</Link>
        </div>
      ))}
    </div>
  )
}
```

### 6. Suspense Mode

```tsx
import { Suspense } from 'react'
import { useTokenSuspense } from '@/api/endpoints/tokens'

function TokenDetailSuspense({ tokenId }: { tokenId: string }) {
  const token = useTokenSuspense(tokenId)
  return <div>{token.name}</div>
}

function TokenPage({ tokenId }: { tokenId: string }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <TokenDetailSuspense tokenId={tokenId} />
    </Suspense>
  )
}
```

## State Management

### Store Patterns

#### 1. Computed Values

```typescript
const useAuthStore = create((set, get) => ({
  user: null,
  // Computed value
  get isAdmin() {
    return get().user?.role === 'admin'
  },
}))
```

#### 2. Async Actions

```typescript
const useAuthStore = create((set, get) => ({
  user: null,

  fetchUser: async () => {
    const response = await kyClient.get('user').json()
    set({ user: response })
  },
}))
```

#### 3. Middleware Usage

```typescript
// With persist middleware
const useStore = create(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'my-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

// With immer for immutable updates
const useStore = create(
  immer((set) => ({
    users: [],
    addUser: (user) =>
      set((state) => {
        state.users.push(user) // Direct mutation with Immer
      }),
  }))
)
```

### Store Composition

```tsx
// Combine multiple stores
function useAppState() {
  const auth = useAuthStore()
  const ui = useUIStore()
  // Example: Access store state

  return {
    isAuthenticated: auth.isAuthenticated,
    theme: ui.theme,
    currency: prefs.display.currency,
  }
}

// Or create a root store
const useRootStore = create(() => ({
  auth: useAuthStore.getState(),
  ui: useUIStore.getState(),
  // Example: Get store state non-reactively
}))
```

## Error Handling

### Global Error Handler

```tsx
// Handle errors directly in components

function GlobalErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <pre>{error.message}</pre>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
      onError={(error) => {
        handleError(error)
        // Log to error reporting service
        console.error('Global error:', error)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### Query Error Handling

```tsx
function TokenListWithErrorHandling() {
  const { data, error, refetch } = useTokens()

  if (error) {
    // Type-safe error handling
    if (error?.message) {
      switch (error.status) {
        case 404:
          return <NotFound />
        case 429:
          return <RateLimited />
        case 500:
          return <ServerError onRetry={refetch} />
        default:
          return <GenericError error={error} />
      }
    }

    return <UnknownError />
  }

  return <TokenList tokens={data} />
}
```

### Mutation Error Handling

```tsx
function CreateTokenWithErrorHandling() {
  const createToken = useCreateToken()

  const handleSubmit = (data: CreateTokenInput) => {
    createToken.mutate(data, {
      onError: (error) => {
        if (error?.message) {
          // Show specific error message
          if (error.code === 'DUPLICATE_SYMBOL') {
            notify.error('Symbol already exists')
          } else if (error.code === 'INSUFFICIENT_BALANCE') {
            notify.error('Insufficient balance')
          } else {
            notify.error(error.message)
          }
        } else {
          notify.error('An unexpected error occurred')
        }
      },
    })
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>
}
```

## Performance Optimization

### 1. Query Key Management

```typescript
// Good: Consistent query keys
export const tokenKeys = {
  all: ['tokens'] as const,
  lists: () => [...tokenKeys.all, 'list'] as const,
  list: (filters) => [...tokenKeys.lists(), filters] as const,
  detail: (id) => [...tokenKeys.all, 'detail', id] as const,
  stats: (id) => [...tokenKeys.detail(id), 'stats'] as const,
}

// Usage
queryClient.invalidateQueries({ queryKey: tokenKeys.all })
queryClient.invalidateQueries({ queryKey: tokenKeys.lists() })
queryClient.setQueryData(tokenKeys.detail(id), newData)
```

### 2. Selective Re-rendering

```typescript
// Bad: Re-renders on any store change
const store = useAuthStore()

// Good: Re-renders only when user changes
const user = useAuthStore((state) => state.user)

// Best: Shallow comparison for multiple values
const { user, isAuthenticated } = useAuthStore(
  (state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  }),
  shallow
)
```

### 3. Cache Configuration

```typescript
const { data } = useTokens(filters, {
  // Data considered fresh for 5 minutes
  staleTime: 1000 * 60 * 5,

  // Keep in cache for 10 minutes
  gcTime: 1000 * 60 * 10,

  // Refetch every 30 seconds
  refetchInterval: 1000 * 30,

  // Don't refetch on window focus
  refetchOnWindowFocus: false,

  // Keep previous data while fetching
  keepPreviousData: true,

  // Use cached data if available
  initialData: () => {
    return queryClient.getQueryData(tokenKeys.lists())
  },
})
```

### 4. Code Splitting

```typescript
// Lazy load heavy components
const TokenChart = lazy(() => import('./TokenChart'))

// Lazy load API endpoints
const { useTokenAnalytics } = lazy(() =>
  import('@/api/endpoints/analytics')
)

// Use with Suspense
function TokenDetails() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <TokenChart />
    </Suspense>
  )
}
```

## Testing

### Testing Queries

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTokens } from '@/api/endpoints/tokens'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useTokens', () => {
  it('fetches tokens successfully', async () => {
    const { result } = renderHook(() => useTokens(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data.data).toHaveLength(20)
  })

  it('handles errors', async () => {
    // Mock error response
    server.use(
      rest.get('/api/tokens', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    const { result } = renderHook(() => useTokens(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})
```

### Testing Mutations

```typescript
describe('useCreateToken', () => {
  it('creates token successfully', async () => {
    const { result } = renderHook(() => useCreateToken(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        name: 'Test Token',
        symbol: 'TEST',
        totalSupply: 1000000,
        initialPrice: 0.001,
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toMatchObject({
      name: 'Test Token',
      symbol: 'TEST',
    })
  })
})
```

### Testing Stores

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/stores/useAuthStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      accessToken: null,
    })
  })

  it('handles login', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.login(
        { id: '1', address: '0x...', username: 'test' },
        { access: 'token123', refresh: 'refresh123' }
      )
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.username).toBe('test')
    expect(result.current.accessToken).toBe('token123')
  })

  it('handles logout', () => {
    const { result } = renderHook(() => useAuthStore())

    // Login first
    act(() => {
      result.current.login(
        { id: '1', address: '0x...', username: 'test' },
        { access: 'token123', refresh: 'refresh123' }
      )
    })

    // Then logout
    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
  })
})
```

## Best Practices

### 1. Type Safety

Always validate API responses:

```typescript
// Good: Runtime validation
const response = await kyClient.get('tokens').json()
const tokens = TokenSchema.array().parse(response)

// Bad: Type assertion
const tokens = response as Token[]
```

### 2. Error Recovery

Implement retry strategies:

```typescript
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error.status >= 400 && error.status < 500) {
      return false
    }
    // Retry up to 3 times for other errors
    return failureCount < 3
  },
  retryDelay: (attemptIndex) => {
    // Exponential backoff
    return Math.min(1000 * 2 ** attemptIndex, 30000)
  },
})
```

### 3. Cache Management

Keep cache consistent:

```typescript
// After mutation, update cache
onSuccess: (newData) => {
  // Update single item
  queryClient.setQueryData(tokenKeys.detail(newData.id), newData)

  // Update list
  queryClient.setQueriesData({ queryKey: tokenKeys.lists() }, (old) => {
    if (!old) return { data: [newData] }
    return {
      ...old,
      data: [newData, ...old.data],
    }
  })

  // Or invalidate to refetch
  queryClient.invalidateQueries({
    queryKey: tokenKeys.lists(),
  })
}
```

### 4. Component Organization

```typescript
// Separate data fetching from presentation
function TokenListContainer() {
  const { data, isLoading, error } = useTokens()

  if (isLoading) return <TokenListSkeleton />
  if (error) return <TokenListError error={error} />

  return <TokenListView tokens={data} />
}

// Pure presentation component
function TokenListView({ tokens }: { tokens: Token[] }) {
  return (
    <div>
      {tokens.map(token => (
        <TokenCard key={token.id} token={token} />
      ))}
    </div>
  )
}
```

## Troubleshooting

### Common Issues

#### 1. Hydration Mismatch

**Problem**: SSR content doesn't match client

```typescript
// Solution: Use client-only hooks
'use client'

function Component() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Client-only content
  return <ClientOnlyComponent />
}
```

#### 2. Stale Closures

**Problem**: Mutations using old state

```typescript
// Bad: Stale closure
const count = useStore((state) => state.count)
const increment = useStore((state) => state.increment)

const handleClick = () => {
  setTimeout(() => {
    // Uses old count value
    console.log(count)
  }, 1000)
}

// Good: Get fresh state
const handleClick = () => {
  setTimeout(() => {
    const freshCount = useStore.getState().count
    console.log(freshCount)
  }, 1000)
}
```

#### 3. Token Expiration

**Problem**: 401 errors after token expires

```typescript
// Solution: Automatic token refresh
const kyClient = ky.create({
  hooks: {
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          const newToken = await refreshToken()
          if (newToken) {
            // Retry with new token
            request.headers.set('Authorization', `Bearer ${newToken}`)
            return ky(request)
          }
        }
        return response
      },
    ],
  },
})
```

#### 4. Memory Leaks

**Problem**: Subscriptions not cleaned up

```typescript
// Bad: No cleanup
useEffect(() => {
  const unsubscribe = store.subscribe(handleChange)
  // Missing cleanup!
})

// Good: Proper cleanup
useEffect(() => {
  const unsubscribe = store.subscribe(handleChange)
  return unsubscribe // Cleanup on unmount
}, [])
```

### Debug Tools

#### React Query DevTools

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

#### Zustand DevTools

```typescript
const useStore = create(
  devtools(
    (set) => ({
      // store implementation
    }),
    {
      name: 'MyStore', // Shows in DevTools
    }
  )
)
```

#### Custom Logging

```typescript
// Log all queries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey, ...args }) => {
        console.log('Fetching:', queryKey)
        const result = await defaultQueryFn({ queryKey, ...args })
        console.log('Result:', result)
        return result
      },
    },
  },
})
```

## Migration Guides

### From SWR to TanStack Query

```typescript
// SWR
const { data, error, mutate } = useSWR('/api/tokens', fetcher)

// TanStack Query
const { data, error, refetch } = useQuery({
  queryKey: ['tokens'],
  queryFn: () => fetcher('/api/tokens'),
})
```

### From Redux to Zustand

```typescript
// Redux
const dispatch = useDispatch()
const user = useSelector((state) => state.user)
dispatch(setUser(userData))

// Zustand
const user = useAuthStore((state) => state.user)
const setUser = useAuthStore((state) => state.setUser)
setUser(userData)
```

### From Axios to Ky

```typescript
// Axios
try {
  const { data } = await axios.post('/api/tokens', payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
  }
  throw error
}

// Ky
try {
  const data = await kyClient
    .post('tokens', {
      json: payload,
    })
    .json()
  return data
} catch (error) {
  if (error instanceof HTTPError && error.response.status === 401) {
    // Handle unauthorized
  }
  throw error
}
```

## Resources

### Documentation

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Ky Documentation](https://github.com/sindresorhus/ky)
- [Zod Documentation](https://zod.dev)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

### Examples

- [Example Components](../src/components/examples/)
- [API Endpoints](../src/api/endpoints/)
- [Store Implementations](../src/stores/)

### Tools

- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Zustand DevTools](https://github.com/pmndrs/zustand#redux-devtools)
- [TypeScript Playground](https://www.typescriptlang.org/play)

## Summary

This API architecture provides:

- ✅ **Type Safety**: End-to-end type safety with TypeScript and Zod
- ✅ **Performance**: Smart caching, request deduplication, optimistic updates
- ✅ **Developer Experience**: Clear patterns, great tooling, comprehensive docs
- ✅ **Scalability**: Modular design ready for growth
- ✅ **Reliability**: Robust error handling and recovery strategies
