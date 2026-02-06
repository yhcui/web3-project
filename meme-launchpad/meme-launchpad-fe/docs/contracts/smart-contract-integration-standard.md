# Smart Contract Integration Standard

## Overview

This document defines the standard architecture and implementation patterns for integrating smart contracts into the Coinroll Web v2 application using **wagmi v2** and **viem v2**. All smart contract features must follow these guidelines to ensure consistency, type safety, and maintainability.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [File Naming Conventions](#file-naming-conventions)
4. [TypeScript Patterns](#typescript-patterns)
5. [Hook Implementation Guide](#hook-implementation-guide)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)
8. [Security Best Practices](#security-best-practices)
9. [Testing Strategy](#testing-strategy)
10. [Performance Optimization](#performance-optimization)
11. [Examples](#examples)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Components                         │
│                   (React Components)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Contract Hooks Layer                      │
│              (Custom Wagmi Hooks + Viem Actions)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Contract Services                         │
│              (Complex Logic & Orchestration)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Infrastructure                       │
│         ┌──────────────┬──────────────┬──────────────┐     │
│         │    Wagmi     │     Viem     │   TanStack   │     │
│         │   (Hooks)    │  (Actions)   │    Query     │     │
│         └──────────────┴──────────────┴──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Type Safety First**: All contract interactions must be fully typed using generated types from ABIs
2. **Modular Architecture**: Each contract gets its own module with clear separation of concerns
3. **Hook-Based API**: Expose contract functionality primarily through React hooks
4. **Error Resilience**: Graceful error handling with user-friendly messages
5. **Performance Optimized**: Leverage caching, deduplication, and selective re-renders

## Directory Structure

```
src/
├── contracts/                    # Smart contract integration root
│   ├── abis/                    # Contract ABIs (JSON files)
│   │   ├── TokenFactory.json
│   │   ├── Token.json
│   │   └── ...
│   │
│   ├── addresses/               # Contract addresses by network
│   │   ├── index.ts            # Main address export
│   │   ├── bsc.ts              # BSC mainnet addresses
│   │   └── bscTestnet.ts       # BSC testnet addresses
│   │
│   ├── types/                   # Generated & custom types
│   │   ├── generated/          # Auto-generated from ABIs
│   │   │   ├── TokenFactory.ts
│   │   │   └── Token.ts
│   │   ├── common.ts           # Shared contract types
│   │   └── index.ts            # Type exports
│   │
│   ├── hooks/                   # Contract-specific hooks
│   │   ├── token/              # Token contract hooks
│   │   │   ├── useToken.ts
│   │   │   ├── useTokenBalance.ts
│   │   │   ├── useTokenTransfer.ts
│   │   │   └── index.ts
│   │   ├── factory/            # Factory contract hooks
│   │   │   ├── useCreateToken.ts
│   │   │   ├── useFactoryFee.ts
│   │   │   └── index.ts
│   │   └── index.ts            # Hook exports
│   │
│   ├── services/               # Complex contract logic
│   │   ├── TokenService.ts
│   │   ├── FactoryService.ts
│   │   └── index.ts
│   │
│   ├── utils/                  # Contract utilities
│   │   ├── formatting.ts       # Format addresses, amounts
│   │   ├── validation.ts       # Validate inputs
│   │   ├── gas.ts             # Gas estimation helpers
│   │   └── index.ts
│   │
│   └── config/                 # Contract configuration
│       ├── chains.ts           # Supported chains config
│       ├── tokens.ts           # Token lists
│       └── index.ts
```

## File Naming Conventions

### Contract Files

- **ABIs**: `ContractName.json` (PascalCase)
- **Hooks**: `useContractAction.ts` (camelCase with 'use' prefix)
- **Services**: `ContractNameService.ts` (PascalCase with 'Service' suffix)
- **Types**: `contractName.types.ts` or in `types/` directory
- **Utils**: `utilityName.ts` (camelCase)

### Hook Naming

```typescript
// Read operations
useTokenBalance() // Get token balance
useTokenAllowance() // Get allowance
useFactoryFee() // Get factory fee

// Write operations
useTokenTransfer() // Transfer tokens
useTokenApprove() // Approve spending
useCreateToken() // Create new token

// Event subscriptions
useTokenTransferEvents() // Watch transfer events
useFactoryEvents() // Watch factory events

// Complex operations
useTokenSwap() // Multi-step swap operation
useTokenLiquidity() // Liquidity management
```

## TypeScript Patterns

### 1. Type Generation from ABIs

```typescript
// scripts/generate-types.ts
import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import TokenFactoryABI from '../src/contracts/abis/TokenFactory.json'
import TokenABI from '../src/contracts/abis/Token.json'

export default defineConfig({
  out: 'src/contracts/types/generated.ts',
  contracts: [
    {
      name: 'TokenFactory',
      abi: TokenFactoryABI as const,
    },
    {
      name: 'Token',
      abi: TokenABI as const,
    },
  ],
  plugins: [react()],
})
```

### 2. Contract Address Management

```typescript
// src/contracts/addresses/index.ts
import { Address } from 'viem'
import { bsc, bscTestnet } from 'wagmi/chains'
import { bscAddresses } from './bsc'
import { bscTestnetAddresses } from './bscTestnet'

export type ContractAddresses = {
  tokenFactory: Address
  multicall: Address
  // Add more contracts as needed
}

export const contractAddresses: Record<number, ContractAddresses> = {
  [bsc.id]: bscAddresses,
  [bscTestnet.id]: bscTestnetAddresses,
}

export function getContractAddress(
  chainId: number,
  contractName: keyof ContractAddresses
): Address {
  const addresses = contractAddresses[chainId]
  if (!addresses) {
    throw new Error(`No addresses configured for chain ${chainId}`)
  }
  return addresses[contractName]
}
```

### 3. Common Type Definitions

```typescript
// src/contracts/types/common.ts
import { Address, Hash } from 'viem'

export type TransactionResult = {
  hash: Hash
  wait: () => Promise<void>
  status: 'pending' | 'success' | 'failed'
}

export type ContractCallOptions = {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  onSettled?: () => void
}

export type TokenMetadata = {
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
  address: Address
}

export type GasEstimate = {
  gasLimit: bigint
  gasPrice: bigint
  totalCost: bigint
}
```

## Hook Implementation Guide

### 1. Read Hook Pattern

```typescript
// src/contracts/hooks/token/useTokenBalance.ts
import { useReadContract } from 'wagmi'
import { Address, formatUnits } from 'viem'
import { TokenABI } from '@/contracts/abis'
import { useCallback } from 'react'

export function useTokenBalance(
  tokenAddress: Address | undefined,
  accountAddress: Address | undefined
) {
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: TokenABI,
    functionName: 'balanceOf',
    args: accountAddress ? [accountAddress] : undefined,
    enabled: Boolean(tokenAddress && accountAddress),
    // Cache for 10 seconds
    staleTime: 10_000,
  })

  const formattedBalance = useCallback(
    (decimals: number = 18) => {
      if (!data) return '0'
      return formatUnits(data, decimals)
    },
    [data]
  )

  return {
    balance: data,
    formattedBalance,
    isLoading,
    isError,
    error,
    refetch,
  }
}
```

### 2. Write Hook Pattern

```typescript
// src/contracts/hooks/token/useTokenTransfer.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, parseUnits } from 'viem'
import { TokenABI } from '@/contracts/abis'
import { toast } from '@/lib/toast'
import { useCallback } from 'react'

export function useTokenTransfer(tokenAddress: Address | undefined) {
  const {
    writeContract,
    data: hash,
    isPending: isWriting,
    error: writeError,
    reset,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const transfer = useCallback(
    async (to: Address, amount: string, decimals: number = 18) => {
      if (!tokenAddress) {
        toast.error('Token address not provided')
        return
      }

      try {
        const value = parseUnits(amount, decimals)

        await writeContract({
          address: tokenAddress,
          abi: TokenABI,
          functionName: 'transfer',
          args: [to, value],
        })

        toast.success('Transaction submitted')
      } catch (error) {
        console.error('Transfer failed:', error)
        toast.error('Transfer failed')
      }
    },
    [tokenAddress, writeContract]
  )

  return {
    transfer,
    isLoading: isWriting || isConfirming,
    isSuccess,
    error: writeError || confirmError,
    hash,
    reset,
  }
}
```

### 3. Event Hook Pattern

```typescript
// src/contracts/hooks/token/useTokenTransferEvents.ts
import { useWatchContractEvent } from 'wagmi'
import { Address } from 'viem'
import { TokenABI } from '@/contracts/abis'
import { useCallback, useState } from 'react'

export type TransferEvent = {
  from: Address
  to: Address
  value: bigint
  transactionHash: string
  blockNumber: bigint
}

export function useTokenTransferEvents(
  tokenAddress: Address | undefined,
  account: Address | undefined
) {
  const [events, setEvents] = useState<TransferEvent[]>([])

  useWatchContractEvent({
    address: tokenAddress,
    abi: TokenABI,
    eventName: 'Transfer',
    args: {
      from: account,
    },
    onLogs(logs) {
      const newEvents = logs.map((log) => ({
        from: log.args.from!,
        to: log.args.to!,
        value: log.args.value!,
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
      }))
      setEvents((prev) => [...newEvents, ...prev])
    },
    enabled: Boolean(tokenAddress && account),
  })

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return {
    events,
    clearEvents,
  }
}
```

### 4. Complex Operation Hook Pattern

```typescript
// src/contracts/hooks/factory/useCreateToken.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { usePublicClient } from 'wagmi'
import { Address, parseEther } from 'viem'
import { TokenFactoryABI } from '@/contracts/abis'
import { getContractAddress } from '@/contracts/addresses'
import { useCallback, useState } from 'react'
import { toast } from '@/lib/toast'

export type CreateTokenParams = {
  name: string
  symbol: string
  totalSupply: string
  decimals: number
  tradingTax: number
  liquidityTax: number
}

export function useCreateToken(chainId: number) {
  const publicClient = usePublicClient()
  const [isEstimatingGas, setIsEstimatingGas] = useState(false)

  const {
    writeContract,
    data: hash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const estimateGas = useCallback(
    async (params: CreateTokenParams) => {
      if (!publicClient) return null

      setIsEstimatingGas(true)
      try {
        const factoryAddress = getContractAddress(chainId, 'tokenFactory')

        const gasEstimate = await publicClient.estimateContractGas({
          address: factoryAddress,
          abi: TokenFactoryABI,
          functionName: 'createToken',
          args: [
            params.name,
            params.symbol,
            parseEther(params.totalSupply),
            params.decimals,
            params.tradingTax,
            params.liquidityTax,
          ],
          value: parseEther('0.1'), // Creation fee
        })

        return gasEstimate
      } catch (error) {
        console.error('Gas estimation failed:', error)
        return null
      } finally {
        setIsEstimatingGas(false)
      }
    },
    [publicClient, chainId]
  )

  const createToken = useCallback(
    async (params: CreateTokenParams) => {
      try {
        const factoryAddress = getContractAddress(chainId, 'tokenFactory')

        // First estimate gas
        const gasEstimate = await estimateGas(params)
        if (!gasEstimate) {
          toast.error('Failed to estimate gas')
          return
        }

        // Execute transaction
        await writeContract({
          address: factoryAddress,
          abi: TokenFactoryABI,
          functionName: 'createToken',
          args: [
            params.name,
            params.symbol,
            parseEther(params.totalSupply),
            params.decimals,
            params.tradingTax,
            params.liquidityTax,
          ],
          value: parseEther('0.1'),
          gas: gasEstimate,
        })

        toast.success('Token creation initiated')
      } catch (error) {
        console.error('Token creation failed:', error)
        toast.error('Failed to create token')
      }
    },
    [chainId, estimateGas, writeContract]
  )

  // Parse token address from receipt
  const getCreatedTokenAddress = useCallback((): Address | null => {
    if (!receipt) return null

    // Parse logs to find TokenCreated event
    const event = receipt.logs.find(
      (log) => log.topics[0] === '0x...' // TokenCreated event signature
    )

    if (event && event.topics[1]) {
      return `0x${event.topics[1].slice(26)}` as Address
    }

    return null
  }, [receipt])

  return {
    createToken,
    estimateGas,
    isLoading: isWriting || isConfirming || isEstimatingGas,
    isSuccess,
    error: writeError,
    hash,
    tokenAddress: getCreatedTokenAddress(),
  }
}
```

## State Management

### 1. Contract State Store (Zustand)

```typescript
// src/stores/useContractStore.ts
import { create } from 'zustand'
import { Address } from 'viem'
import { persist } from 'zustand/middleware'

type ContractStore = {
  // Selected token for operations
  selectedToken: Address | null
  setSelectedToken: (address: Address | null) => void

  // Recent transactions
  recentTransactions: Array<{
    hash: string
    type: 'transfer' | 'approve' | 'swap' | 'create'
    timestamp: number
    status: 'pending' | 'success' | 'failed'
  }>
  addTransaction: (tx: any) => void
  updateTransactionStatus: (hash: string, status: string) => void

  // User preferences
  slippage: number
  setSlippage: (value: number) => void

  gasPrice: 'slow' | 'standard' | 'fast'
  setGasPrice: (value: 'slow' | 'standard' | 'fast') => void
}

export const useContractStore = create<ContractStore>()(
  persist(
    (set) => ({
      selectedToken: null,
      setSelectedToken: (address) => set({ selectedToken: address }),

      recentTransactions: [],
      addTransaction: (tx) =>
        set((state) => ({
          recentTransactions: [tx, ...state.recentTransactions].slice(0, 50),
        })),
      updateTransactionStatus: (hash, status) =>
        set((state) => ({
          recentTransactions: state.recentTransactions.map((tx) =>
            tx.hash === hash ? { ...tx, status } : tx
          ),
        })),

      slippage: 0.5,
      setSlippage: (value) => set({ slippage: value }),

      gasPrice: 'standard',
      setGasPrice: (value) => set({ gasPrice: value }),
    }),
    {
      name: 'contract-storage',
      partialize: (state) => ({
        slippage: state.slippage,
        gasPrice: state.gasPrice,
        recentTransactions: state.recentTransactions,
      }),
    }
  )
)
```

### 2. Query Cache Management

```typescript
// src/contracts/utils/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const contractQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache contract reads for 30 seconds
      staleTime: 30_000,
      // Keep cache for 5 minutes
      gcTime: 5 * 60_000,
      // Retry failed queries 3 times
      retry: 3,
      // Retry delay exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

// Invalidation helpers
export const invalidateTokenBalance = (address: string) => {
  contractQueryClient.invalidateQueries({
    queryKey: ['tokenBalance', address],
  })
}

export const invalidateAllTokenData = () => {
  contractQueryClient.invalidateQueries({
    queryKey: ['token'],
  })
}
```

## Error Handling

### 1. Error Types and Messages

```typescript
// src/contracts/utils/errors.ts
import { BaseError, ContractFunctionRevertedError } from 'viem'

export enum ContractErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_ALLOWANCE = 'INSUFFICIENT_ALLOWANCE',
  USER_REJECTED = 'USER_REJECTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  CONTRACT_PAUSED = 'CONTRACT_PAUSED',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

export function parseContractError(error: unknown): {
  code: ContractErrorCode
  message: string
  details?: any
} {
  if (error instanceof BaseError) {
    const revertError = error.walk(
      (e) => e instanceof ContractFunctionRevertedError
    )

    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? ''

      // Map contract errors to user-friendly messages
      switch (errorName) {
        case 'InsufficientBalance':
          return {
            code: ContractErrorCode.INSUFFICIENT_BALANCE,
            message: 'Insufficient token balance for this operation',
            details: revertError.data,
          }
        case 'InsufficientAllowance':
          return {
            code: ContractErrorCode.INSUFFICIENT_ALLOWANCE,
            message: 'Please approve tokens before this operation',
            details: revertError.data,
          }
        case 'ContractPaused':
          return {
            code: ContractErrorCode.CONTRACT_PAUSED,
            message: 'Contract is temporarily paused',
            details: revertError.data,
          }
        default:
          return {
            code: ContractErrorCode.UNKNOWN,
            message: `Contract error: ${errorName}`,
            details: revertError.data,
          }
      }
    }

    // Check for user rejection
    if (error.message.includes('User rejected')) {
      return {
        code: ContractErrorCode.USER_REJECTED,
        message: 'Transaction was rejected',
      }
    }
  }

  return {
    code: ContractErrorCode.UNKNOWN,
    message: 'An unexpected error occurred',
    details: error,
  }
}
```

### 2. Error Boundary for Contract Operations

```typescript
// src/components/ContractErrorBoundary.tsx
import { Component, ReactNode } from 'react'
import { parseContractError } from '@/contracts/utils/errors'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ContractErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Contract error caught:', error, errorInfo)

    // Parse and log contract-specific errors
    const parsed = parseContractError(error)
    console.error('Parsed error:', parsed)

    // Could send to error tracking service here
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 font-bold">Contract Error</h2>
          <p className="text-red-600">{this.state.error.message}</p>
          <button
            onClick={this.reset}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Security Best Practices

### 1. Input Validation

```typescript
// src/contracts/utils/validation.ts
import { isAddress, getAddress } from 'viem'

export function validateAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error('Invalid Ethereum address')
  }
  // Return checksummed address
  return getAddress(address)
}

export function validateAmount(
  amount: string,
  decimals: number,
  max?: bigint
): void {
  const num = parseFloat(amount)

  if (isNaN(num) || num <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  if (num.toString().split('.')[1]?.length > decimals) {
    throw new Error(`Maximum ${decimals} decimal places allowed`)
  }

  if (max) {
    const value = parseUnits(amount, decimals)
    if (value > max) {
      throw new Error('Amount exceeds maximum')
    }
  }
}

export function validateSlippage(slippage: number): void {
  if (slippage < 0 || slippage > 50) {
    throw new Error('Slippage must be between 0 and 50%')
  }
}
```

### 2. Safe Contract Calls

```typescript
// src/contracts/utils/safe.ts
import { Address, PublicClient } from 'viem'

export async function safeContractCall<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number
    retryDelay?: number
    onError?: (error: Error) => void
  }
): Promise<T | null> {
  const maxRetries = options?.maxRetries ?? 3
  const retryDelay = options?.retryDelay ?? 1000

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      console.error(`Contract call failed (attempt ${i + 1}):`, error)

      if (options?.onError) {
        options.onError(error as Error)
      }

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      }
    }
  }

  return null
}

export async function checkContractExists(
  client: PublicClient,
  address: Address
): Promise<boolean> {
  try {
    const code = await client.getBytecode({ address })
    return code !== undefined && code !== '0x'
  } catch {
    return false
  }
}
```

### 3. Reentrancy Protection

```typescript
// src/contracts/hooks/useContractMutex.ts
import { useRef, useCallback } from 'react'

export function useContractMutex() {
  const mutexRef = useRef(false)

  const withMutex = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      if (mutexRef.current) {
        console.warn('Operation already in progress')
        return null
      }

      mutexRef.current = true
      try {
        return await fn()
      } finally {
        mutexRef.current = false
      }
    },
    []
  )

  return { withMutex, isLocked: mutexRef.current }
}
```

## Testing Strategy

### 1. Hook Testing

```typescript
// src/contracts/hooks/__tests__/useTokenBalance.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useTokenBalance } from '../token/useTokenBalance'
import { createWrapper } from '@/test/utils'

describe('useTokenBalance', () => {
  it('should fetch token balance', async () => {
    const { result } = renderHook(
      () => useTokenBalance('0x...' as Address, '0x...' as Address),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.balance).toBeDefined()
    expect(result.current.formattedBalance()).toMatch(/^\d+\.?\d*$/)
  })

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useTokenBalance(undefined, undefined), {
      wrapper: createWrapper(),
    })

    expect(result.current.balance).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })
})
```

### 2. Service Testing

```typescript
// src/contracts/services/__tests__/TokenService.test.ts
import { TokenService } from '../TokenService'
import { createMockClient } from '@/test/mocks'

describe('TokenService', () => {
  let service: TokenService
  let mockClient: any

  beforeEach(() => {
    mockClient = createMockClient()
    service = new TokenService(mockClient)
  })

  it('should validate token metadata', async () => {
    const metadata = await service.getTokenMetadata('0x...')

    expect(metadata).toMatchObject({
      name: expect.any(String),
      symbol: expect.any(String),
      decimals: expect.any(Number),
      totalSupply: expect.any(BigInt),
    })
  })
})
```

## Performance Optimization

### 1. Multicall for Batch Reads

```typescript
// src/contracts/hooks/useMulticall.ts
import { useReadContracts } from 'wagmi'
import { Address } from 'viem'
import { TokenABI } from '@/contracts/abis'

export function useTokenMulticall(tokenAddress: Address, accounts: Address[]) {
  const contracts = accounts.flatMap((account) => [
    {
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'balanceOf',
      args: [account],
    },
    {
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'allowance',
      args: [account, SPENDER_ADDRESS],
    },
  ])

  const { data, isLoading } = useReadContracts({
    contracts,
    enabled: accounts.length > 0,
    // Batch calls with multicall
    multicall: true,
  })

  // Parse results
  const results = accounts.map((account, i) => ({
    account,
    balance: data?.[i * 2]?.result,
    allowance: data?.[i * 2 + 1]?.result,
  }))

  return { results, isLoading }
}
```

### 2. Optimistic Updates

```typescript
// src/contracts/hooks/useOptimisticTransfer.ts
import { useQueryClient } from '@tanstack/react-query'
import { useTokenTransfer } from './useTokenTransfer'

export function useOptimisticTransfer(tokenAddress: Address) {
  const queryClient = useQueryClient()
  const { transfer, ...rest } = useTokenTransfer(tokenAddress)

  const optimisticTransfer = useCallback(
    async (to: Address, amount: string) => {
      // Optimistically update balance
      queryClient.setQueryData(
        ['tokenBalance', tokenAddress, account],
        (old: bigint) => old - parseUnits(amount, 18)
      )

      try {
        await transfer(to, amount)
      } catch (error) {
        // Revert on error
        queryClient.invalidateQueries({
          queryKey: ['tokenBalance', tokenAddress],
        })
        throw error
      }
    },
    [transfer, queryClient, tokenAddress]
  )

  return { transfer: optimisticTransfer, ...rest }
}
```

## Examples

### 1. Token Transfer Component

```typescript
// src/components/TokenTransfer.tsx
import { useState } from 'react'
import { Address, isAddress } from 'viem'
import { useAccount } from 'wagmi'
import { useTokenBalance, useTokenTransfer } from '@/contracts/hooks'
import { validateAddress, validateAmount } from '@/contracts/utils'

export function TokenTransfer({ tokenAddress }: { tokenAddress: Address }) {
  const { address: account } = useAccount()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  const { balance, formattedBalance } = useTokenBalance(tokenAddress, account)
  const { transfer, isLoading, isSuccess } = useTokenTransfer(tokenAddress)

  const handleTransfer = async () => {
    try {
      const validAddress = validateAddress(recipient)
      validateAmount(amount, 18, balance)

      await transfer(validAddress as Address, amount)

      // Reset form on success
      if (isSuccess) {
        setRecipient('')
        setAmount('')
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label>Balance: {formattedBalance()} tokens</label>
      </div>

      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <button
        onClick={handleTransfer}
        disabled={isLoading || !isAddress(recipient) || !amount}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isLoading ? 'Transferring...' : 'Transfer'}
      </button>
    </div>
  )
}
```

### 2. Token Creation Form

```typescript
// src/components/CreateToken.tsx
import { useState } from 'react'
import { useCreateToken } from '@/contracts/hooks'
import { useChainId } from 'wagmi'

export function CreateToken() {
  const chainId = useChainId()
  const { createToken, estimateGas, isLoading, isSuccess, tokenAddress } =
    useCreateToken(chainId)

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: '1000000',
    decimals: 18,
    tradingTax: 2,
    liquidityTax: 3,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Estimate gas first
    const gasEstimate = await estimateGas(formData)
    if (!gasEstimate) {
      alert('Gas estimation failed')
      return
    }

    // Show estimated cost to user
    const estimatedCost = formatEther(gasEstimate * 20n) // 20 gwei
    if (!confirm(`Estimated gas cost: ${estimatedCost} BNB. Continue?`)) {
      return
    }

    await createToken(formData)
  }

  if (isSuccess && tokenAddress) {
    return (
      <div className="p-4 bg-green-50 rounded">
        <h3 className="font-bold">Token Created Successfully!</h3>
        <p>Token Address: {tokenAddress}</p>
        <a
          href={`https://bscscan.com/token/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          View on BSCScan
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isLoading ? 'Creating...' : 'Create Token'}
      </button>
    </form>
  )
}
```

## Migration Guide

For integrating new smart contracts, follow these steps:

1. **Add ABI**: Place the contract ABI in `src/contracts/abis/`
2. **Generate Types**: Run `pnpm wagmi generate` to create TypeScript types
3. **Add Addresses**: Update `src/contracts/addresses/` with deployment addresses
4. **Create Hooks**: Implement read/write/event hooks in `src/contracts/hooks/`
5. **Add Services**: For complex logic, create a service in `src/contracts/services/`
6. **Write Tests**: Add tests for hooks and services
7. **Document**: Update this standard if new patterns emerge

## Checklist for New Contract Integration

- [ ] ABI added to `src/contracts/abis/`
- [ ] Types generated with `wagmi generate`
- [ ] Addresses configured for all networks
- [ ] Read hooks implemented
- [ ] Write hooks implemented with error handling
- [ ] Event hooks implemented if needed
- [ ] Service layer created for complex operations
- [ ] Input validation utilities added
- [ ] Error messages are user-friendly
- [ ] Tests written with >80% coverage
- [ ] Performance optimizations considered (multicall, caching)
- [ ] Security best practices followed
- [ ] Documentation updated

## References

- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [TanStack Query](https://tanstack.com/query)
- [Ethereum JSON-RPC](https://ethereum.org/en/developers/docs/apis/json-rpc/)
