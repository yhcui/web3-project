# Smart Contract Implementation Example: CoinRoll Token

This example demonstrates how to implement a complete token contract integration following our standard.

## Step 1: Add Contract ABI

```json
// src/contracts/abis/CoinRollToken.json
{
  "abi": [
    {
      "inputs": [],
      "name": "name",
      "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "account", "type": "address" }
      ],
      "name": "balanceOf",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "to", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "transfer",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "spender", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "approve",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "owner", "type": "address" },
        { "internalType": "address", "name": "spender", "type": "address" }
      ],
      "name": "allowance",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    }
  ]
}
```

## Step 2: Configure Contract Addresses

```typescript
// src/contracts/addresses/coinroll.ts
import { Address } from 'viem'
import { bsc, bscTestnet } from 'wagmi/chains'

export const coinrollTokenAddresses: Record<number, Address> = {
  [bsc.id]: '0x1234567890123456789012345678901234567890', // Replace with actual
  [bscTestnet.id]: '0x0987654321098765432109876543210987654321', // Replace with actual
}

export function getCoinrollTokenAddress(chainId: number): Address {
  const address = coinrollTokenAddresses[chainId]
  if (!address) {
    throw new Error(`CoinRoll token not deployed on chain ${chainId}`)
  }
  return address
}
```

## Step 3: Create Type Definitions

```typescript
// src/contracts/types/coinroll.ts
import { Address, Hash } from 'viem'

export interface CoinrollTokenInfo {
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
  address: Address
  chainId: number
}

export interface TransferParams {
  to: Address
  amount: string
  decimals?: number
}

export interface ApprovalParams {
  spender: Address
  amount: string
  decimals?: number
}

export interface TokenTransaction {
  hash: Hash
  from: Address
  to: Address
  value: bigint
  timestamp: number
  status: 'pending' | 'success' | 'failed'
}
```

## Step 4: Implement Read Hooks

```typescript
// src/contracts/hooks/coinroll/useCoinrollBalance.ts
import { useReadContract } from 'wagmi'
import { Address, formatUnits } from 'viem'
import { useChainId } from 'wagmi'
import CoinRollTokenABI from '@/contracts/abis/CoinRollToken.json'
import { getCoinrollTokenAddress } from '@/contracts/addresses/coinroll'

export function useCoinrollBalance(account: Address | undefined) {
  const chainId = useChainId()
  const tokenAddress = getCoinrollTokenAddress(chainId)

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: CoinRollTokenABI.abi,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    enabled: Boolean(account),
    staleTime: 10_000, // 10 seconds
  })

  return {
    balance: data as bigint | undefined,
    balanceFormatted: data ? formatUnits(data as bigint, 18) : '0',
    isLoading,
    isError,
    error,
    refetch,
  }
}
```

```typescript
// src/contracts/hooks/coinroll/useCoinrollTokenInfo.ts
import { useReadContracts } from 'wagmi'
import { useChainId } from 'wagmi'
import CoinRollTokenABI from '@/contracts/abis/CoinRollToken.json'
import { getCoinrollTokenAddress } from '@/contracts/addresses/coinroll'
import { CoinrollTokenInfo } from '@/contracts/types/coinroll'

export function useCoinrollTokenInfo() {
  const chainId = useChainId()
  const tokenAddress = getCoinrollTokenAddress(chainId)

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: tokenAddress,
        abi: CoinRollTokenABI.abi,
        functionName: 'name',
      },
      {
        address: tokenAddress,
        abi: CoinRollTokenABI.abi,
        functionName: 'symbol',
      },
      {
        address: tokenAddress,
        abi: CoinRollTokenABI.abi,
        functionName: 'decimals',
      },
      {
        address: tokenAddress,
        abi: CoinRollTokenABI.abi,
        functionName: 'totalSupply',
      },
    ],
    multicall: true,
  })

  const tokenInfo: CoinrollTokenInfo | null = data
    ? {
        name: data[0].result as string,
        symbol: data[1].result as string,
        decimals: data[2].result as number,
        totalSupply: data[3].result as bigint,
        address: tokenAddress,
        chainId,
      }
    : null

  return {
    tokenInfo,
    isLoading,
  }
}
```

## Step 5: Implement Write Hooks

```typescript
// src/contracts/hooks/coinroll/useCoinrollTransfer.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, parseUnits } from 'viem'
import { useChainId } from 'wagmi'
import { useCallback } from 'react'
import { toast } from 'sonner'
import CoinRollTokenABI from '@/contracts/abis/CoinRollToken.json'
import { getCoinrollTokenAddress } from '@/contracts/addresses/coinroll'
import { TransferParams } from '@/contracts/types/coinroll'
import { validateAddress, validateAmount } from '@/contracts/utils/validation'

export function useCoinrollTransfer() {
  const chainId = useChainId()
  const tokenAddress = getCoinrollTokenAddress(chainId)

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
    async ({ to, amount, decimals = 18 }: TransferParams) => {
      try {
        // Validate inputs
        const validAddress = validateAddress(to)
        validateAmount(amount, decimals)

        const value = parseUnits(amount, decimals)

        await writeContract({
          address: tokenAddress,
          abi: CoinRollTokenABI.abi,
          functionName: 'transfer',
          args: [validAddress, value],
        })

        toast.success('Transfer initiated')
      } catch (error) {
        console.error('Transfer failed:', error)
        toast.error(error instanceof Error ? error.message : 'Transfer failed')
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

```typescript
// src/contracts/hooks/coinroll/useCoinrollApprove.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, parseUnits, maxUint256 } from 'viem'
import { useChainId } from 'wagmi'
import { useCallback } from 'react'
import { toast } from 'sonner'
import CoinRollTokenABI from '@/contracts/abis/CoinRollToken.json'
import { getCoinrollTokenAddress } from '@/contracts/addresses/coinroll'
import { ApprovalParams } from '@/contracts/types/coinroll'

export function useCoinrollApprove() {
  const chainId = useChainId()
  const tokenAddress = getCoinrollTokenAddress(chainId)

  const {
    writeContract,
    data: hash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = useCallback(
    async ({ spender, amount, decimals = 18 }: ApprovalParams) => {
      try {
        const value =
          amount === 'max' ? maxUint256 : parseUnits(amount, decimals)

        await writeContract({
          address: tokenAddress,
          abi: CoinRollTokenABI.abi,
          functionName: 'approve',
          args: [spender, value],
        })

        toast.success('Approval initiated')
      } catch (error) {
        console.error('Approval failed:', error)
        toast.error('Approval failed')
      }
    },
    [tokenAddress, writeContract]
  )

  return {
    approve,
    isLoading: isWriting || isConfirming,
    isSuccess,
    error: writeError,
    hash,
  }
}
```

## Step 6: Create Service Layer

```typescript
// src/contracts/services/CoinrollTokenService.ts
import { Address, PublicClient } from 'viem'
import CoinRollTokenABI from '@/contracts/abis/CoinRollToken.json'
import { CoinrollTokenInfo, TokenTransaction } from '@/contracts/types/coinroll'

export class CoinrollTokenService {
  constructor(
    private client: PublicClient,
    private tokenAddress: Address
  ) {}

  async getTokenInfo(): Promise<CoinrollTokenInfo> {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      this.client.readContract({
        address: this.tokenAddress,
        abi: CoinRollTokenABI.abi,
        functionName: 'name',
      }),
      this.client.readContract({
        address: this.tokenAddress,
        abi: CoinRollTokenABI.abi,
        functionName: 'symbol',
      }),
      this.client.readContract({
        address: this.tokenAddress,
        abi: CoinRollTokenABI.abi,
        functionName: 'decimals',
      }),
      this.client.readContract({
        address: this.tokenAddress,
        abi: CoinRollTokenABI.abi,
        functionName: 'totalSupply',
      }),
    ])

    return {
      name: name as string,
      symbol: symbol as string,
      decimals: decimals as number,
      totalSupply: totalSupply as bigint,
      address: this.tokenAddress,
      chainId: this.client.chain?.id ?? 0,
    }
  }

  async getTransferHistory(
    account: Address,
    fromBlock: bigint = 0n
  ): Promise<TokenTransaction[]> {
    const logs = await this.client.getLogs({
      address: this.tokenAddress,
      event: {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { indexed: true, name: 'from', type: 'address' },
          { indexed: true, name: 'to', type: 'address' },
          { indexed: false, name: 'value', type: 'uint256' },
        ],
      },
      args: {
        from: account,
      },
      fromBlock,
    })

    return logs.map((log) => ({
      hash: log.transactionHash!,
      from: log.args.from as Address,
      to: log.args.to as Address,
      value: log.args.value as bigint,
      timestamp: Number(log.blockNumber),
      status: 'success',
    }))
  }

  async checkAllowance(owner: Address, spender: Address): Promise<bigint> {
    const allowance = await this.client.readContract({
      address: this.tokenAddress,
      abi: CoinRollTokenABI.abi,
      functionName: 'allowance',
      args: [owner, spender],
    })

    return allowance as bigint
  }
}
```

## Step 7: Create UI Components

```tsx
// src/components/coinroll/CoinrollBalance.tsx
'use client'

import { useAccount } from 'wagmi'
import { useCoinrollBalance } from '@/contracts/hooks/coinroll/useCoinrollBalance'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'

export function CoinrollBalance() {
  const t = useTranslations()
  const { address } = useAccount()
  const { balanceFormatted, isLoading, refetch } = useCoinrollBalance(address)

  if (!address) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">
          {t('wallet.connectToViewBalance')}
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            {t('token.coinrollBalance')}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-2xl font-bold">{balanceFormatted} ROLL</p>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="text-primary text-sm hover:underline"
        >
          {t('common.refresh')}
        </button>
      </div>
    </Card>
  )
}
```

```tsx
// src/components/coinroll/CoinrollTransfer.tsx
'use client'

import { useState } from 'react'
import { isAddress } from 'viem'
import { useCoinrollTransfer } from '@/contracts/hooks/coinroll/useCoinrollTransfer'
import { useCoinrollBalance } from '@/contracts/hooks/coinroll/useCoinrollBalance'
import { useAccount } from 'wagmi'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTranslations } from 'next-intl'

export function CoinrollTransfer() {
  const t = useTranslations()
  const { address } = useAccount()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  const { balanceFormatted } = useCoinrollBalance(address)
  const { transfer, isLoading, isSuccess, error, reset } = useCoinrollTransfer()

  const handleTransfer = async () => {
    if (!isAddress(recipient)) {
      alert(t('errors.invalidAddress'))
      return
    }

    await transfer({
      to: recipient as `0x${string}`,
      amount,
    })

    // Reset form on success
    if (isSuccess) {
      setRecipient('')
      setAmount('')
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <h3 className="text-lg font-semibold">{t('token.transfer')}</h3>

      <div className="space-y-2">
        <label className="text-muted-foreground text-sm">
          {t('token.balance')}: {balanceFormatted} ROLL
        </label>
      </div>

      <Input
        placeholder={t('token.recipientAddress')}
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />

      <Input
        type="number"
        placeholder={t('token.amount')}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <Button
        onClick={handleTransfer}
        disabled={isLoading || !recipient || !amount}
        className="w-full"
      >
        {isLoading ? t('common.sending') : t('common.send')}
      </Button>

      {isSuccess && (
        <Alert>
          <AlertDescription>{t('token.transferSuccess')}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
    </Card>
  )
}
```

## Step 8: Add Utilities

```typescript
// src/contracts/utils/validation.ts
import { isAddress, getAddress } from 'viem'

export function validateAddress(address: string): `0x${string}` {
  if (!isAddress(address)) {
    throw new Error('Invalid Ethereum address')
  }
  return getAddress(address)
}

export function validateAmount(amount: string, decimals: number): void {
  const num = parseFloat(amount)

  if (isNaN(num) || num <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  const decimalPlaces = amount.split('.')[1]?.length || 0
  if (decimalPlaces > decimals) {
    throw new Error(`Maximum ${decimals} decimal places allowed`)
  }
}
```

```typescript
// src/contracts/utils/formatting.ts
import { formatUnits, parseUnits } from 'viem'

export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  displayDecimals: number = 4
): string {
  const formatted = formatUnits(amount, decimals)
  const [whole, decimal] = formatted.split('.')

  if (!decimal) return whole

  const trimmed = decimal.slice(0, displayDecimals)
  return `${whole}.${trimmed}`
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  return parseUnits(amount, decimals)
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
```

## Step 9: Write Tests

```typescript
// src/contracts/hooks/coinroll/__tests__/useCoinrollBalance.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useCoinrollBalance } from '../useCoinrollBalance'
import { createTestWrapper } from '@/test/utils'

describe('useCoinrollBalance', () => {
  const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'

  it('should fetch balance for valid address', async () => {
    const { result } = renderHook(
      () => useCoinrollBalance(testAddress as `0x${string}`),
      { wrapper: createTestWrapper() }
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.balance).toBeDefined()
    expect(result.current.balanceFormatted).toMatch(/^\d+\.?\d*$/)
  })

  it('should return zero balance for undefined address', () => {
    const { result } = renderHook(() => useCoinrollBalance(undefined), {
      wrapper: createTestWrapper(),
    })

    expect(result.current.balance).toBeUndefined()
    expect(result.current.balanceFormatted).toBe('0')
    expect(result.current.isLoading).toBe(false)
  })
})
```

## Step 10: Integration with Existing Components

```tsx
// src/app/[locale]/dashboard/page.tsx
import { CoinrollBalance } from '@/components/coinroll/CoinrollBalance'
import { CoinrollTransfer } from '@/components/coinroll/CoinrollTransfer'

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CoinrollBalance />
        <CoinrollTransfer />
      </div>
    </div>
  )
}
```

## Deployment Checklist

- [ ] Contract deployed on testnet
- [ ] Contract verified on BSCScan
- [ ] ABI exported and added to project
- [ ] Addresses configured for all networks
- [ ] Types generated with `pnpm wagmi:generate`
- [ ] Hooks implemented and tested
- [ ] Components integrated with i18n
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Tested on testnet with real transactions
- [ ] Gas estimates shown to users
- [ ] Security review completed

## Common Issues & Solutions

### Issue 1: Type Generation Fails

```bash
# Solution: Ensure ABI is valid JSON
pnpm wagmi:generate --debug
```

### Issue 2: Transaction Fails Silently

```typescript
// Solution: Add comprehensive error handling
try {
  await writeContract(...)
} catch (error) {
  console.error('Full error:', error)
  const parsed = parseContractError(error)
  toast.error(parsed.message)
}
```

### Issue 3: Balance Not Updating

```typescript
// Solution: Invalidate queries after transaction
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()
// After successful transaction
queryClient.invalidateQueries({ queryKey: ['balance'] })
```

## Next Steps

1. Extend with more complex contracts (DEX, Staking, etc.)
2. Add event listening for real-time updates
3. Implement transaction history
4. Add gas price optimization
5. Create admin functions for contract owners

This complete example demonstrates all aspects of the smart contract integration standard.
