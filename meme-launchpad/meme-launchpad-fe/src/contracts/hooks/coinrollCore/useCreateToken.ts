/**
 * Hook for creating tokens via CoinRollCore contract
 * Following the smart contract integration standard
 */

import {
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi'
import { useChainId, useAccount } from 'wagmi'
import { useCallback, useState } from 'react'
import {
  Address,
  parseEther,
  Hex,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
} from 'viem'
import { toast } from 'sonner'
import CoinRollCoreABI from '@/contracts/abis/CoinRollCore.json'
import { getCoinRollCoreAddress } from '@/contracts/addresses'
import {
  CreateTokenResult,
  TokenCreatedEvent,
  GasEstimate,
  CreateTokenParams,
  CreateTokenData,
  COINROLL_CORE_CONSTANTS,
} from '@/contracts/types/coinrollCore'
import { calculateInitialBuyBNBDirect } from './useCalculateInitialBuyBNB'

/**
 * Hook for creating tokens on CoinRollCore
 */
export function useCreateToken() {
  const chainId = useChainId()
  const { address: account } = useAccount()
  const publicClient = usePublicClient()

  const [isEstimatingGas, setIsEstimatingGas] = useState(false)
  const [lastGasEstimate, setLastGasEstimate] = useState<GasEstimate | null>(
    null
  )

  const contractAddress = getCoinRollCoreAddress(chainId)

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
    data: receipt,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  /**
   * Encode token creation data for signature
   */
  const encodeTokenData = useCallback((params: CreateTokenParams): Hex => {
    const data: CreateTokenData = {
      requestId: params.requestId,
      timestamp: params.timestamp,
      creator: params.creator,
      name: params.name,
      symbol: params.symbol,
      totalSupply: parseEther(params.totalSupply),
      virtualBNBReserve: params.virtualBNBReserve
        ? parseEther(params.virtualBNBReserve)
        : COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_BNB_RESERVE,
      virtualTokenReserve: params.virtualTokenReserve
        ? parseEther(params.virtualTokenReserve)
        : COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_TOKEN_RESERVE,
      initialBuyPercentageBP: params.initialBuyPercentageBP || 0,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    }

    // Encode the data according to the contract's expected format
    // This will depend on how the contract expects the data to be encoded
    const encoded = encodeAbiParameters(
      parseAbiParameters(
        'bytes32 requestId, uint256 timestamp, address creator, string name, string symbol, uint256 totalSupply, uint256 virtualBNBReserve, uint256 virtualTokenReserve, uint256 initialBuyPercentageBP, string metadata'
      ),
      [
        keccak256(Buffer.from(data.requestId)) as Hex,
        BigInt(data.timestamp),
        data.creator,
        data.name,
        data.symbol,
        data.totalSupply,
        data.virtualBNBReserve,
        data.virtualTokenReserve,
        BigInt(data.initialBuyPercentageBP),
        data.metadata || '',
      ]
    )

    return encoded
  }, [])

  /**
   * Get signature from backend API
   * This should be replaced with actual API call
   */
  const getSignature = useCallback(async (data: Hex): Promise<Hex> => {
    // TODO: Replace with actual API call to get signature
    // const response = await fetch('/api/v1/tokens/sign', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ data }),
    // })
    // const { signature } = await response.json()
    // return signature

    // For now, return a placeholder
    console.warn(
      'getSignature: Using placeholder signature - replace with actual API call'
    )
    return ('0x' + '00'.repeat(65)) as Hex // 65 bytes for signature
  }, [])

  /**
   * Calculate the required BNB value for the transaction
   */
  const calculateRequiredValue = useCallback(
    (params: CreateTokenParams): bigint => {
      let totalValue = BigInt(0)

      // Add creation fee if any (this might be defined in the contract)
      // For now assuming no creation fee

      // Add initial buy BNB if specified
      if (params.initialBuyPercentageBP && params.initialBuyPercentageBP > 0) {
        const initialBuyResult = calculateInitialBuyBNBDirect({
          saleAmount: params.totalSupply,
          virtualBNBReserve:
            params.virtualBNBReserve ||
            COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_BNB_RESERVE.toString(),
          virtualTokenReserve:
            params.virtualTokenReserve ||
            COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_TOKEN_RESERVE.toString(),
          percentageBP: params.initialBuyPercentageBP,
        })

        totalValue += initialBuyResult.bnbRequired
      }

      return totalValue
    },
    []
  )

  /**
   * Estimate gas for token creation
   */
  const estimateGas = useCallback(
    async (params: CreateTokenParams): Promise<GasEstimate | null> => {
      if (!publicClient || !account) {
        toast.error('Wallet not connected')
        return null
      }

      setIsEstimatingGas(true)

      try {
        // Encode data and get signature
        const data = encodeTokenData(params)
        const signature = await getSignature(data)

        // Calculate required value
        const value = calculateRequiredValue(params)

        // Estimate gas
        const gasEstimate = await publicClient.estimateContractGas({
          address: contractAddress,
          abi: CoinRollCoreABI,
          functionName: 'createToken',
          args: [data, signature],
          value,
          account,
        })

        // Get current gas price
        const gasPrice = await publicClient.getGasPrice()

        // Calculate total cost
        const totalCostBNB = gasEstimate * gasPrice + value

        const estimate: GasEstimate = {
          gasLimit: gasEstimate,
          gasPrice,
          totalCostBNB,
          totalCostFormatted: `${(Number(totalCostBNB) / 1e18).toFixed(6)} BNB`,
        }

        setLastGasEstimate(estimate)
        return estimate
      } catch (error) {
        console.error('Gas estimation failed:', error)
        toast.error('Failed to estimate gas')
        return null
      } finally {
        setIsEstimatingGas(false)
      }
    },
    [
      publicClient,
      account,
      contractAddress,
      encodeTokenData,
      getSignature,
      calculateRequiredValue,
    ]
  )

  /**
   * Create token with all validations
   */
  const createToken = useCallback(
    async (params: CreateTokenParams) => {
      try {
        if (!account) {
          toast.error('Please connect your wallet')
          return
        }

        // Validate parameters
        if (!params.name || !params.symbol || !params.totalSupply) {
          toast.error('Missing required token parameters')
          return
        }

        // Ensure creator address matches connected account
        if (params.creator.toLowerCase() !== account.toLowerCase()) {
          toast.error('Creator address must match connected wallet')
          return
        }

        // Estimate gas first
        const gasEstimate = await estimateGas(params)
        if (!gasEstimate) {
          return
        }

        // Show gas estimate to user
        const confirmTx = window.confirm(
          `Token Creation Cost Estimate:\n` +
            `Gas: ${(Number(gasEstimate.gasLimit) / 1e9).toFixed(4)} Gwei\n` +
            `Total: ${gasEstimate.totalCostFormatted}\n\n` +
            `Proceed with token creation?`
        )

        if (!confirmTx) {
          return
        }

        // Encode data and get signature
        const data = encodeTokenData(params)
        const signature = await getSignature(data)

        // Calculate required value
        const value = calculateRequiredValue(params)

        // Execute transaction
        await writeContract({
          address: contractAddress,
          abi: CoinRollCoreABI,
          functionName: 'createToken',
          args: [data, signature],
          value,
          gas: gasEstimate.gasLimit,
        })

        toast.success('Token creation initiated')
      } catch (error) {
        console.error('Token creation failed:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to create token'
        )
      }
    },
    [
      account,
      estimateGas,
      encodeTokenData,
      getSignature,
      calculateRequiredValue,
      writeContract,
      contractAddress,
    ]
  )

  /**
   * Parse created token address from receipt
   */
  const getCreatedTokenAddress = useCallback((): Address | null => {
    if (!receipt) return null

    // Find TokenCreated event in logs
    const tokenCreatedTopic = keccak256(
      Buffer.from('TokenCreated(address,address,string,string,uint256,bytes32)')
    )

    const event = receipt.logs.find(
      (log) => log.topics[0] === tokenCreatedTopic
    )

    if (event && event.topics[1]) {
      // Token address is the first indexed parameter
      return `0x${event.topics[1].slice(26)}` as Address
    }

    return null
  }, [receipt])

  /**
   * Parse token creation events from receipt
   */
  const getTokenCreatedEvent = useCallback((): TokenCreatedEvent | null => {
    if (!receipt) return null

    const tokenAddress = getCreatedTokenAddress()
    if (!tokenAddress) return null

    // Parse full event data
    // This would need proper ABI decoding
    // For now, return basic info
    return {
      token: tokenAddress,
      creator: account!,
      name: '', // Would need to decode from logs
      symbol: '', // Would need to decode from logs
      totalSupply: BigInt(0), // Would need to decode from logs
      requestId: '0x' as Hex, // Would need to decode from logs
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    }
  }, [receipt, account, getCreatedTokenAddress])

  /**
   * Reset the hook state
   */
  const resetState = useCallback(() => {
    reset()
    setLastGasEstimate(null)
  }, [reset])

  return {
    // Main functions
    createToken,
    estimateGas,

    // Transaction state
    isLoading: isWriting || isConfirming || isEstimatingGas,
    isPending: isWriting,
    isConfirming,
    isSuccess,

    // Data
    hash,
    receipt,
    tokenAddress: getCreatedTokenAddress(),
    tokenCreatedEvent: getTokenCreatedEvent(),
    lastGasEstimate,

    // Errors
    error: writeError || confirmError,

    // Utilities
    reset: resetState,
    encodeTokenData,
    calculateRequiredValue,
  }
}
