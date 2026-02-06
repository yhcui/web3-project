# Token Holders API Usage Guide

## Overview

The `useTokenHolders` hook fetches the list of token holders for a specific token address, including their balances and percentage holdings.

## API Endpoint

- **URL**: `api/v1/token/holders`
- **Method**: GET
- **Query Parameters**:
  - `tokenAddress`: The token contract address (required)

## Response Format

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "address": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd",
      "balance": "4980000",
      "percentage": "0.00498"
    },
    {
      "address": "0x1c316121044B261f81A9ef66f2e2E688aA43E442",
      "balance": "1752955.2279809035922767",
      "percentage": "0.0017529552279809"
    }
  ]
}
```

## Basic Usage

```tsx
import { useTokenHolders } from '@/api/endpoints/tokens'

function MyComponent() {
  const tokenAddress = '0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd'
  const { data, isLoading, error } = useTokenHolders(tokenAddress)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.data.map((holder) => (
        <div key={holder.address}>
          {holder.address}: {holder.percentage}
        </div>
      ))}
    </div>
  )
}
```

## Advanced Usage

### With Data Transformation

```tsx
const { data } = useTokenHolders(tokenAddress)

// Calculate top holders
const topHolders = data?.data
  .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
  .slice(0, 10)

// Calculate total percentage held by top 10
const top10Percentage = topHolders?.reduce(
  (sum, holder) => sum + parseFloat(holder.percentage),
  0
)
```

### With Conditional Loading

```tsx
// Only load when user clicks a button
const [shouldLoad, setShouldLoad] = useState(false)
const { data } = useTokenHolders(shouldLoad ? tokenAddress : undefined)
```

### With Prefetching

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { tokenKeys } from '@/api/endpoints/tokens'

const queryClient = useQueryClient()

// Prefetch on hover
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: tokenKeys.holder(tokenAddress),
    queryFn: () => fetchTokenHolders(tokenAddress),
  })
}
```

## Type Definitions

```typescript
interface TokenHolder {
  address: string // Ethereum address (0x...)
  balance: string // Token balance as string
  percentage: string // Percentage of total supply (0.01 = 1%)
}

interface TokenHoldersResponse {
  code: number
  message: string
  data: TokenHolder[]
}
```

## Configuration

The hook is configured with:

- **staleTime**: 5 minutes - Data is considered fresh for 5 minutes
- **gcTime**: 10 minutes - Cache is cleared after 10 minutes
- **refetchOnWindowFocus**: false - Doesn't refetch when window regains focus
- **enabled**: Only fetches when a valid token address is provided

## Error Handling

The hook validates the token address format before making the request:

- Must match the pattern: `/^0x[a-fA-F0-9]{40}$/`
- Returns `undefined` if the address is invalid

## Integration with Other Features

### Display in Token Detail Page

```tsx
import { useTokenDetail, useTokenHolders } from '@/api/endpoints/tokens'

function TokenDetailPage({ tokenAddress }: { tokenAddress: string }) {
  const { data: tokenDetail } = useTokenDetail(tokenAddress)
  const { data: holders } = useTokenHolders(tokenAddress)

  return (
    <div>
      <TokenInfo token={tokenDetail?.data} />
      <HoldersList holders={holders?.data} />
    </div>
  )
}
```

### Export Holders Data

```tsx
const exportHoldersToCSV = (holders: TokenHolder[]) => {
  const csv = [
    ['Address', 'Balance', 'Percentage'],
    ...holders.map((h) => [h.address, h.balance, h.percentage]),
  ]
    .map((row) => row.join(','))
    .join('\n')

  // Download CSV file
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'token-holders.csv'
  a.click()
}
```
