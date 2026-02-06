# Smart Contract Integration Quick Start Guide

## Overview

This guide provides a quick reference for implementing smart contracts following our standard architecture. For detailed specifications, see [smart-contract-integration-standard.md](./smart-contract-integration-standard.md).

## Quick Setup (5 Minutes)

### 1. Install Required Dependencies

```bash
# Core dependencies (already installed)
pnpm add wagmi viem @tanstack/react-query

# Development dependencies for type generation
pnpm add -D @wagmi/cli
```

### 2. Create Directory Structure

```bash
# Run this command from project root
mkdir -p src/contracts/{abis,addresses,hooks,services,types,utils,config}
```

### 3. Configure Type Generation

Create `wagmi.config.ts` in project root:

```typescript
import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import { readdirSync } from 'fs'
import { join } from 'path'

// Auto-detect all ABI files
const abisPath = join(__dirname, 'src/contracts/abis')
const abiFiles = readdirSync(abisPath).filter((f) => f.endsWith('.json'))

const contracts = abiFiles.map((file) => ({
  name: file.replace('.json', ''),
  abi: require(`./src/contracts/abis/${file}`),
}))

export default defineConfig({
  out: 'src/contracts/types/generated.ts',
  contracts,
  plugins: [react()],
})
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "wagmi:generate": "wagmi generate"
  }
}
```

## Common Implementation Patterns

### Pattern 1: Simple Token Balance Hook

```typescript
// src/contracts/hooks/useQuickBalance.ts
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import ERC20_ABI from '@/contracts/abis/ERC20.json'

export function useQuickBalance(token: `0x${string}`, account: `0x${string}`) {
  const { data, isLoading } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account],
    enabled: Boolean(token && account),
  })

  return {
    balance: data ? formatUnits(data as bigint, 18) : '0',
    isLoading,
  }
}
```

### Pattern 2: Token Approval + Transfer

```typescript
// src/contracts/hooks/useQuickTransfer.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import ERC20_ABI from '@/contracts/abis/ERC20.json'

export function useQuickTransfer(token: `0x${string}`) {
  const { writeContract, data: hash } = useWriteContract()
  const { isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = (spender: `0x${string}`, amount: string) =>
    writeContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, parseUnits(amount, 18)],
    })

  const transfer = (to: `0x${string}`, amount: string) =>
    writeContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to, parseUnits(amount, 18)],
    })

  return { approve, transfer, isSuccess }
}
```

### Pattern 3: Factory Contract Deployment

```typescript
// src/contracts/hooks/useQuickDeploy.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import FACTORY_ABI from '@/contracts/abis/Factory.json'

const FACTORY_ADDRESS = '0x...' // Your factory address

export function useQuickDeploy() {
  const { writeContract, data: hash } = useWriteContract()
  const { data: receipt } = useWaitForTransactionReceipt({ hash })

  const deploy = (name: string, symbol: string, supply: string) =>
    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'createToken',
      args: [name, symbol, parseUnits(supply, 18)],
      value: parseEther('0.1'), // Deploy fee
    })

  // Parse deployed address from receipt
  const deployedAddress = receipt?.logs?.[0]?.address

  return { deploy, deployedAddress }
}
```

## BSC-Specific Configuration

### 1. Chain Configuration

```typescript
// src/contracts/config/chains.ts
import { bsc, bscTestnet } from 'wagmi/chains'

export const SUPPORTED_CHAINS =
  process.env.NEXT_PUBLIC_CHAIN_ENV === 'mainnet' ? [bsc] : [bscTestnet, bsc]

export const DEFAULT_CHAIN =
  process.env.NEXT_PUBLIC_CHAIN_ENV === 'mainnet' ? bsc : bscTestnet
```

### 2. BSC Contract Addresses

```typescript
// src/contracts/addresses/index.ts
const addresses = {
  [bsc.id]: {
    tokenFactory: '0x...',
    pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    wbnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  },
  [bscTestnet.id]: {
    tokenFactory: '0x...',
    pancakeRouter: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
    wbnb: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
  },
}
```

## Component Integration Examples

### Example 1: Token Balance Display

```tsx
// src/components/TokenBalance.tsx
import { useAccount } from 'wagmi'
import { useQuickBalance } from '@/contracts/hooks/useQuickBalance'

export function TokenBalance({
  tokenAddress,
}: {
  tokenAddress: `0x${string}`
}) {
  const { address } = useAccount()
  const { balance, isLoading } = useQuickBalance(tokenAddress, address!)

  if (!address) return <div>Connect wallet</div>
  if (isLoading) return <div>Loading...</div>

  return <div>Balance: {balance} tokens</div>
}
```

### Example 2: Send Token Form

```tsx
// src/components/SendToken.tsx
import { useState } from 'react'
import { useQuickTransfer } from '@/contracts/hooks/useQuickTransfer'

export function SendToken({ tokenAddress }: { tokenAddress: `0x${string}` }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const { transfer, isSuccess } = useQuickTransfer(tokenAddress)

  const handleSend = () => transfer(to as `0x${string}`, amount)

  return (
    <div>
      <input
        placeholder="Recipient"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <input
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSend}>Send</button>
      {isSuccess && <div>Success!</div>}
    </div>
  )
}
```

## Error Handling Quick Reference

### Common Errors & Solutions

| Error                    | Cause                     | Solution                       |
| ------------------------ | ------------------------- | ------------------------------ |
| `User rejected`          | User declined transaction | Show friendly message          |
| `Insufficient balance`   | Not enough tokens         | Show balance & suggest top-up  |
| `Insufficient allowance` | Need approval first       | Trigger approve flow           |
| `Gas estimation failed`  | Contract will revert      | Check inputs & contract state  |
| `Network error`          | RPC issues                | Retry with exponential backoff |

### Quick Error Handler

```typescript
// src/contracts/utils/handleError.ts
export function handleContractError(error: any): string {
  if (error.message?.includes('User rejected')) {
    return 'Transaction cancelled'
  }
  if (error.message?.includes('Insufficient')) {
    return 'Insufficient balance'
  }
  if (error.message?.includes('Gas')) {
    return 'Transaction would fail - check inputs'
  }
  return 'Transaction failed - please try again'
}
```

## Performance Tips

### 1. Enable Multicall

```typescript
// Already configured in wagmi config
export const config = getDefaultConfig({
  // ... other config
  batch: { multicall: true }, // Batch read calls
})
```

### 2. Cache Contract Reads

```typescript
// Set stale time for frequently accessed data
useReadContract({
  // ... contract config
  staleTime: 30_000, // Cache for 30 seconds
  gcTime: 5 * 60_000, // Keep in cache for 5 minutes
})
```

### 3. Optimistic Updates

```typescript
// Update UI immediately, revert on error
const queryClient = useQueryClient()

const handleTransfer = async () => {
  // Optimistic update
  queryClient.setQueryData(['balance'], (old) => old - amount)

  try {
    await transfer(to, amount)
  } catch {
    // Revert on error
    queryClient.invalidateQueries(['balance'])
  }
}
```

## Security Checklist

- ✅ Always validate addresses with `isAddress()`
- ✅ Validate amounts are positive numbers
- ✅ Check allowances before transfers
- ✅ Show gas estimates to users
- ✅ Implement slippage protection for swaps
- ✅ Never store private keys
- ✅ Use checksummed addresses
- ✅ Verify contract addresses from official sources

## Testing Your Integration

### 1. Quick Test Setup

```typescript
// src/contracts/__tests__/quick.test.ts
import { renderHook } from '@testing-library/react'
import { useQuickBalance } from '../hooks/useQuickBalance'

test('balance hook works', async () => {
  const { result } = renderHook(() => useQuickBalance('0x...', '0x...'))

  expect(result.current.isLoading).toBe(true)
  // Wait and check result
})
```

### 2. Mock Contract Calls

```typescript
// Use wagmi's mock client for testing
import { createConfig } from 'wagmi'
import { mock } from 'wagmi/connectors'

const mockConfig = createConfig({
  chains: [bscTestnet],
  connectors: [mock({ accounts: ['0x...'] })],
})
```

## Deployment Checklist

Before deploying contract features:

- [ ] ABIs added and types generated
- [ ] Addresses configured for mainnet/testnet
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Transaction confirmations handled
- [ ] Gas estimates displayed
- [ ] Tested on testnet
- [ ] Security review completed

## Need Help?

- **Full Documentation**: See [smart-contract-integration-standard.md](./smart-contract-integration-standard.md)
- **Wagmi Docs**: https://wagmi.sh
- **Viem Docs**: https://viem.sh
- **Example Implementations**: Check `src/contracts/hooks/` for reference implementations

## Quick Commands

```bash
# Generate types from ABIs
pnpm wagmi:generate

# Test contract integration
pnpm test:contracts

# Check for type errors
pnpm tsc --noEmit

# Format contract code
pnpm prettier "src/contracts/**/*.{ts,tsx}"
```
