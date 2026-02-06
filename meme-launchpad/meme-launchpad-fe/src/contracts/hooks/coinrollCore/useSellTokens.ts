/**
 * Hook for selling tokens for BNB on CoinRollCore
 * Following the smart contract integration standard
 */

import { useMemo, useCallback, useEffect, useState } from 'react'
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi'
import { parseEther, formatEther, Address, erc20Abi } from 'viem'
import { getCoinRollCoreAddress } from '@/contracts/addresses'
import CoinRollCoreABI from '@/contracts/abis/CoinRollCore.json'

export interface SellTokensParams {
  tokenAddress?: string
  tokenAmount: string
  minBNBAmount: string
  deadline?: number
}

export interface SellTokensResult {
  // Transaction functions
  sell: () => Promise<void>
  approve: () => Promise<void>
  canSell: boolean
  needsApproval: boolean

  // Transaction state
  isPreparing: boolean
  isApproving: boolean
  isConfirming: boolean
  isWaiting: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null

  // Transaction data
  hash?: `0x${string}`
  approvalHash?: `0x${string}`
  receipt?: any

  // Helper functions
  reset: () => void
}

/**
 * Hook for selling tokens for BNB
 */
export function useSellTokens(params: SellTokensParams): SellTokensResult {
  const { address: userAddress } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const contractAddress = useMemo(
    () => getCoinRollCoreAddress(publicClient?.chain?.id || 97), // Default to BSC testnet
    [publicClient?.chain?.id]
  )

  // First, setup a state to track if we're waiting for approval (will be set later)
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false)

  // Check token allowance
  const { data: allowance = BigInt(0), refetch: refetchAllowance } =
    useReadContract({
      address: params.tokenAddress as Address,
      abi: erc20Abi,
      functionName: 'allowance',
      args:
        userAddress && params.tokenAddress
          ? [userAddress, contractAddress]
          : undefined,
      query: {
        enabled: Boolean(userAddress && params.tokenAddress),
        // Refetch allowance every 2 seconds if we're waiting for approval
        refetchInterval: isWaitingForApproval ? 2000 : false,
      },
    })

  // These will be set after approval hooks are initialized
  const [approvalSuccess, setApprovalSuccess] = useState(false)

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (!params.tokenAmount || parseFloat(params.tokenAmount) === 0) {
      return false
    }

    const requiredAmount = parseEther(params.tokenAmount)
    const needsNewApproval = allowance < requiredAmount

    console.log('🔍 Approval check:', {
      tokenAmount: params.tokenAmount,
      requiredAmount: requiredAmount.toString(),
      currentAllowance: allowance.toString(),
      needsNewApproval,
      approvalSuccess,
      allowanceFormatted: formatEther(allowance),
      requiredFormatted: formatEther(requiredAmount),
    })

    return needsNewApproval
  }, [allowance, params.tokenAmount])

  // Skip approval simulation - directly execute
  const isPreparingApproval = false
  const approvalPrepareError = null
  const approvalSimulateData = useMemo(() => {
    if (!params.tokenAddress || !params.tokenAmount || !userAddress) return null

    // Approve a large amount to avoid frequent re-approvals
    // Use max uint256 for unlimited approval (common practice)
    const maxApproval = BigInt(
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    )

    console.log('🔧 Preparing approval for unlimited amount:', {
      tokenAddress: params.tokenAddress,
      spender: contractAddress,
      amount: 'MAX_UINT256 (unlimited)',
    })

    return {
      request: {
        address: params.tokenAddress as Address,
        abi: erc20Abi,
        functionName: 'approve' as const,
        args: [contractAddress, maxApproval],
        account: userAddress,
      },
    }
  }, [params.tokenAddress, contractAddress, userAddress])

  // Write approval
  const {
    writeContract: writeApproval,
    data: approvalHash,
    isPending: isApprovingWrite,
    isSuccess: isApprovalWriteSuccess,
    isError: isApprovalWriteError,
    error: approvalWriteError,
    reset: resetApproval,
  } = useWriteContract()

  // Wait for approval
  const {
    isLoading: isWaitingApproval,
    isSuccess: isApprovalSuccess,
    isError: isApprovalReceiptError,
    error: approvalReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  })

  // Update waiting state
  useEffect(() => {
    setIsWaitingForApproval(isWaitingApproval)
  }, [isWaitingApproval])

  // Update approval success state
  useEffect(() => {
    setApprovalSuccess(isApprovalSuccess)
  }, [isApprovalSuccess])

  // Refetch allowance when approval is successful
  useEffect(() => {
    if (isApprovalSuccess) {
      refetchAllowance()
    }
  }, [isApprovalSuccess, refetchAllowance])

  // Prepare contract arguments for sell
  const contractArgs = useMemo(() => {
    if (!params.tokenAddress || !params.tokenAmount || !params.minBNBAmount) {
      return undefined
    }

    const deadlineTimestamp =
      params.deadline || Math.floor(Date.now() / 1000) + 300 // 5 minutes default

    return [
      params.tokenAddress as Address,
      parseEther(params.tokenAmount),
      parseEther(params.minBNBAmount),
      BigInt(deadlineTimestamp),
    ] as const
  }, [
    params.tokenAddress,
    params.tokenAmount,
    params.minBNBAmount,
    params.deadline,
  ])

  // Skip simulation - directly execute transactions
  const isPreparing = false
  const prepareError = null
  const simulateData = useMemo(() => {
    if (!contractArgs || !userAddress) return null
    return {
      request: {
        address: contractAddress,
        abi: CoinRollCoreABI,
        functionName: 'sell' as const,
        args: contractArgs,
        account: userAddress,
      },
    }
  }, [contractArgs, contractAddress, userAddress])

  // Write sell contract
  const {
    writeContract,
    data: hash,
    isPending: isConfirming,
    isSuccess: isWriteSuccess,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  // Wait for sell transaction
  const {
    isLoading: isWaiting,
    isSuccess,
    isError: isReceiptError,
    error: receiptError,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Approve function
  const approve = useCallback(async () => {
    if (!approvalSimulateData?.request) {
      throw new Error('Approval not prepared')
    }

    await writeApproval(approvalSimulateData.request as any)
  }, [approvalSimulateData, writeApproval])

  // Sell function
  const sell = useCallback(async () => {
    // Handle approval first if needed
    if (needsApproval && !isApprovalSuccess) {
      await approve()
      return
    }

    if (!simulateData?.request) {
      throw new Error('Transaction not prepared')
    }

    // 详细输出传给合约的参数
    const contractArgs = simulateData.request.args as [
      string,
      bigint,
      bigint,
      bigint,
    ]
    const [tokenAddress, tokenAmount, minBNBAmount, deadline] = contractArgs

    console.log('🚀 === SELL CONTRACT CALL PARAMETERS ===')
    console.log('📋 Contract Details:', {
      contractAddress: simulateData.request.address,
      functionName: simulateData.request.functionName,
    })

    console.log('📊 Function Parameters:')
    console.log('  token (address):', tokenAddress)
    console.log('  tokenAmount (wei):', tokenAmount.toString())
    console.log('  tokenAmount (formatted):', formatEther(tokenAmount))
    console.log('  minBNBAmount (wei):', minBNBAmount.toString())
    console.log('  minBNBAmount (formatted):', formatEther(minBNBAmount))
    console.log('  deadline (timestamp):', deadline.toString())
    console.log(
      '  deadline (readable):',
      new Date(Number(deadline) * 1000).toISOString()
    )

    // 计算时间相关信息
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const timeUntilDeadline = Number(deadline) - currentTimestamp

    console.log('⏰ Timing Information:')
    console.log('  Current timestamp:', currentTimestamp)
    console.log('  Time until deadline:', timeUntilDeadline, 'seconds')
    console.log(
      '  Deadline status:',
      timeUntilDeadline > 60 ? '✅ Safe' : '⚠️ Too close'
    )

    // 计算滑点信息
    const minBNBFormatted = formatEther(minBNBAmount)
    const slippageFromMin =
      minBNBAmount > BigInt(0)
        ? ((parseEther('1') - (minBNBAmount * BigInt(100)) / parseEther('1')) *
            BigInt(100)) /
          BigInt(1)
        : BigInt(0)

    console.log('💰 Slippage Analysis:')
    console.log('  Min BNB Amount (wei):', minBNBAmount.toString())
    console.log('  Min BNB Amount (formatted):', minBNBFormatted)
    console.log('  Token amount being sold:', formatEther(tokenAmount))

    console.log('🔄 Executing sell transaction...')

    try {
      await writeContract(simulateData.request as any)
    } catch (error: any) {
      console.error('❌ Sell transaction failed:', error)

      // Enhanced error handling for specific contract errors
      if (
        error.message?.includes('0xf4d678b8') ||
        error.message?.includes('InsufficientBalance')
      ) {
        throw new Error(
          'Pool liquidity changed during transaction. Please refresh and try with a smaller amount.'
        )
      } else if (error.message?.includes('missing trie node')) {
        throw new Error(
          'Network synchronization issue. Please wait a moment and try again.'
        )
      } else if (
        error.message?.includes('User rejected') ||
        error.message?.includes('User denied')
      ) {
        throw new Error('Transaction was cancelled by user.')
      } else {
        throw error // Re-throw original error if we don't recognize it
      }
    }
  }, [
    simulateData,
    writeContract,
    needsApproval,
    isApprovalSuccess,
    approve,
    params,
  ])

  // Can sell check - indicates if we can initiate a new sell transaction
  const canSell = useMemo(() => {
    if (needsApproval) {
      return Boolean(
        userAddress &&
          walletClient &&
          approvalSimulateData?.request &&
          !isPreparingApproval &&
          !approvalPrepareError
      )
    }

    return Boolean(
      userAddress &&
        walletClient &&
        simulateData?.request &&
        !isPreparing &&
        !prepareError
    )
  }, [
    userAddress,
    walletClient,
    simulateData,
    approvalSimulateData,
    isPreparing,
    isPreparingApproval,
    prepareError,
    approvalPrepareError,
    needsApproval,
  ])

  // Combined error
  const error =
    prepareError ||
    writeError ||
    receiptError ||
    approvalPrepareError ||
    approvalWriteError ||
    approvalReceiptError

  // Combined states
  const isApproving = isApprovingWrite || isWaitingApproval

  // Reset function
  const reset = useCallback(() => {
    resetWrite()
    resetApproval()
  }, [resetWrite, resetApproval])

  return {
    sell,
    approve,
    canSell,
    needsApproval,
    isPreparing: isPreparing || isPreparingApproval,
    isApproving,
    isConfirming,
    isWaiting,
    isSuccess,
    isError: Boolean(error),
    error: error as Error | null,
    hash,
    approvalHash,
    receipt,
    reset,
  }
}

/**
 * Calculate minimum BNB to receive based on slippage
 */
export function calculateMinBNBAmount(
  expectedAmount: string,
  slippagePercent: number
): string {
  if (!expectedAmount || parseFloat(expectedAmount) === 0) {
    return '0'
  }

  // Add a small buffer (0.1%) to account for rounding differences
  const effectiveSlippage = slippagePercent + 0.1
  const slippageMultiplier = (100 - effectiveSlippage) / 100
  const minAmount = parseFloat(expectedAmount) * slippageMultiplier

  console.log('calculateMinBNBAmount:', {
    expectedAmount,
    slippagePercent,
    effectiveSlippage,
    slippageMultiplier,
    minAmount,
  })

  // Always return decimal format (not scientific notation) for viem's parseEther
  // Use 18 decimal places to match ETH/BNB precision
  // This prevents InvalidDecimalNumberError when parsing very small amounts
  if (minAmount === 0) {
    return '0'
  }

  // For very small amounts, use more decimal places to preserve precision
  if (minAmount < 0.0001) {
    return minAmount.toFixed(18)
  }

  // For larger amounts, use reasonable precision
  return minAmount.toFixed(6)
}
