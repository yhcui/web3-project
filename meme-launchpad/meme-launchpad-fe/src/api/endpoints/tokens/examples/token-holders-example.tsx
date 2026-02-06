/**
 * Example usage of useTokenHolders hook
 * This file demonstrates how to use the token holders API endpoint
 */

import { useTokenHolders } from '@/api/endpoints/tokens'

// Example 1: Basic usage in a component
export function TokenHoldersList({ tokenAddress }: { tokenAddress: string }) {
  const { data, isLoading, error } = useTokenHolders(tokenAddress)

  if (isLoading) {
    return <div>Loading holders...</div>
  }

  if (error) {
    return <div>Error loading holders: {error.message}</div>
  }

  if (!data?.data || data.data.length === 0) {
    return <div>No holders found</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Token Holders</h2>
      <div className="grid gap-2">
        {data.data.map((holder) => (
          <div
            key={holder.address}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex flex-col">
              <span className="font-mono text-sm">{holder.address}</span>
              <span className="text-xs text-gray-500">
                Balance: {holder.balance}
              </span>
            </div>
            <div className="text-right">
              <span className="font-semibold">
                {(parseFloat(holder.percentage) * 100).toFixed(4)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Example 2: Usage with data transformation
export function TopHoldersPieChart({ tokenAddress }: { tokenAddress: string }) {
  const { data, isLoading } = useTokenHolders(tokenAddress)

  if (isLoading || !data?.data) {
    return null
  }

  // Transform data for chart visualization
  const chartData = data.data
    .slice(0, 10) // Top 10 holders
    .map((holder) => ({
      name: `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`,
      value: parseFloat(holder.percentage) * 100,
      balance: holder.balance,
    }))

  return (
    <div>
      {/* Render chart with chartData */}
      {chartData.map((item) => (
        <div key={item.name}>
          {item.name}: {item.value.toFixed(2)}%
        </div>
      ))}
    </div>
  )
}

// Example 3: Usage with conditional fetching
export function ConditionalHoldersLoad({
  tokenAddress,
  shouldLoad,
}: {
  tokenAddress?: string
  shouldLoad: boolean
}) {
  // The hook will only fetch data when tokenAddress is valid and shouldLoad is true
  const { data, isLoading, refetch } = useTokenHolders(
    shouldLoad ? tokenAddress : undefined
  )

  return (
    <div>
      {!shouldLoad && <button onClick={() => refetch()}>Load Holders</button>}
      {isLoading && <div>Loading...</div>}
      {data?.data && <div>Found {data.data.length} holders</div>}
    </div>
  )
}
