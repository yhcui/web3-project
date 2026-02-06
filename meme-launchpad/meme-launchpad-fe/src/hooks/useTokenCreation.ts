/**
 * Token creation business logic hook
 * Handles API calls and contract interactions
 * No UI concerns, just pure business logic
 */

import { useState, useCallback } from 'react'
import { type Hex, parseEther } from 'viem'
import { useCreateToken } from '@/api/endpoints/tokens'
import { useCreateTokenContract } from '@/contracts/hooks/coinrollCore'
import { calculateInitialBuyBNBDirect } from '@/contracts/hooks/coinrollCore/useCalculateInitialBuyBNB'
import { COINROLL_CORE_CONSTANTS } from '@/contracts/types/coinrollCore'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { LaunchMode } from '@/types/token'
import { usePublicClient, useChainId } from 'wagmi'
import { getCoinRollCoreAddress } from '@/contracts/addresses'
import MetaNodeCoreArtifact from '@/contracts/abis/MetaNodeCore.json'

// Extract ABI from artifact (Foundry output format)
const MetaNodeCoreABI = (MetaNodeCoreArtifact as any).abi || MetaNodeCoreArtifact

export interface TokenCreationData {
  // Basic token info
  name: string
  symbol: string
  description?: string

  // Launch configuration
  launchMode: LaunchMode | string // Can be either type for flexibility
  launchTime: number // Required, defaults to 0

  // Media URLs
  logo: string
  banner?: string

  // Social links
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  whitepaper?: string

  // Tags
  tags?: string[]

  // Financial parameters (required with defaults)
  preBuyPercent: number // Defaults to 0
  marginBnb: number // Defaults to 0
  marginTime: number // Defaults to 0

  // Contract address customization
  predictedAddress?: string
  digits?: string

  // Official contact information
  contractTg?: string
  contractEmail?: string

  // PreBuy utility allocation (arrays must be same length)
  preBuyUsedPercent?: number[]
  preBuyUsedType?: number[]
  preBuyLockTime?: number[]
  preBuyUsedName?: string[]
  preBuyUsedDesc?: string[]
}

export interface TokenCreationResult {
  createToken: (data: TokenCreationData) => Promise<CreateTokenResult | null>
  isCreating: boolean
  error: Error | null
  reset: () => void
}

export interface CreateTokenResult {
  transactionHash: Hex
  predictedAddress?: string
  tokenAddress?: string
}

/**
 * Hook for token creation business logic
 * Handles API call to get parameters and contract execution
 * Returns transaction hash for monitoring
 */
export function useTokenCreation(): TokenCreationResult {
  const t = useTranslations()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // API and contract hooks
  const createTokenMutation = useCreateToken()
  const createTokenContract = useCreateTokenContract()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const contractAddress = getCoinRollCoreAddress(chainId)

  /**
   * Create token through API and contract
   */
  const createToken = useCallback(
    async (data: TokenCreationData): Promise<CreateTokenResult | null> => {
      setIsCreating(true)
      setError(null)

      try {
        // Step 1: Call API to get contract parameters
        // Convert launchMode string to LaunchMode number if needed
        const apiData = {
          ...data,
          launchMode:
            typeof data.launchMode === 'string'
              ? (parseInt(data.launchMode, 10) as LaunchMode)
              : (data.launchMode as LaunchMode),
        }
        console.log('Calling API with data:', apiData)
        const apiResult = await createTokenMutation.mutateAsync(apiData)

        if (!apiResult.data?.createArg || !apiResult.data?.signature) {
          throw new Error('API did not return contract parameters')
        }

        const { createArg, signature, predictedAddress } = apiResult.data

        // Use default bonding curve parameters
        // Note: Backend uses fixed default values:
        // - DefaultTotalSupply = 1,000,000,000 * 10^18
        // - DefaultSaleAmount = 800,000,000 * 10^18
        // - DefaultVirtualBNBReserve = ~8.22 BNB
        // - DefaultVirtualTokenReserve = 1,073,972,602 * 10^18
        // IMPORTANT: Contract uses totalSupply (not saleAmount) for initial buy calculation (MEMECore.sol:1064)
        const totalSupply = parseEther('1000000000') // 1,000,000,000 tokens (matches backend DefaultTotalSupply)
        const saleAmount = COINROLL_CORE_CONSTANTS.DEFAULT_SALE_AMOUNT
        const virtualBNBReserve = COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_BNB_RESERVE
        const virtualTokenReserve = COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_TOKEN_RESERVE

        console.log('Using default bonding curve parameters:', {
          totalSupply: totalSupply.toString(),
          virtualBNBReserve: virtualBNBReserve.toString(),
          virtualTokenReserve: virtualTokenReserve.toString(),
          saleAmount: saleAmount.toString(),
        })

        // Step 1.5: Read contract fees
        if (!publicClient || !contractAddress) {
          throw new Error('Public client or contract address not available')
        }

        // Read creationFee and preBuyFeeRate from contract
        console.log('[useTokenCreation] Reading contract fees from:', contractAddress)
        let creationFee: bigint
        let preBuyFeeRate: bigint
        
        try {
          const results = await Promise.all([
            publicClient.readContract({
              address: contractAddress,
              abi: MetaNodeCoreABI,
              functionName: 'creationFee',
              args: [],
            }) as Promise<bigint>,
            publicClient.readContract({
              address: contractAddress,
              abi: MetaNodeCoreABI,
              functionName: 'preBuyFeeRate',
              args: [],
            }) as Promise<bigint>,
          ])
          creationFee = results[0]
          preBuyFeeRate = results[1]
        } catch (error) {
          console.error('[useTokenCreation] Failed to read contract fees:', error)
          throw new Error(`Failed to read contract fees: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        console.log('[useTokenCreation] Contract fees read successfully:', {
          creationFee: creationFee.toString(),
          creationFeeBNB: (Number(creationFee) / 1e18).toFixed(6),
          preBuyFeeRate: preBuyFeeRate.toString(),
          preBuyFeeRatePercent: (Number(preBuyFeeRate) / 100).toFixed(2) + '%',
        })
        
        // Validate creationFee is not zero
        if (creationFee === BigInt(0)) {
          console.error('[useTokenCreation] ERROR: creationFee is 0! This will cause InsufficientFee error.')
          throw new Error('Failed to read creationFee from contract. Please check contract connection.')
        }
        
        // Validate creationFee is reasonable (should be around 0.05 BNB = 50000000000000000 wei)
        const expectedCreationFee = BigInt('50000000000000000') // 0.05 BNB
        if (creationFee < expectedCreationFee / BigInt(2) || creationFee > expectedCreationFee * BigInt(2)) {
          console.warn('[useTokenCreation] WARNING: creationFee seems unusual:', {
            expected: expectedCreationFee.toString(),
            actual: creationFee.toString(),
          })
        }

        // Calculate total BNB value needed
        // According to contract logic (MEMECore.sol:403-430):
        // totalPaymentRequired = creationFee
        // if (marginBnb > 0) totalPaymentRequired += marginBnb
        // if (initialBuyPercentage > 0) {
        //   preBuyFee = (initialBNB * preBuyFeeRate) / 10000
        //   totalPaymentRequired += initialBNB + preBuyFee
        // }
        let bnbValue = creationFee // Start with creation fee
        let prebuyBNB = BigInt(0)
        let preBuyFee = BigInt(0)
        let marginBNB = BigInt(0)

        // Calculate prebuy BNB if specified
        if (data.preBuyPercent && data.preBuyPercent > 0) {
          // preBuyPercent is already a decimal (0-1), convert to basis points
          // e.g., 0.1 = 10% = 1000 BP
          const percentageBP = Math.round(data.preBuyPercent * 10000)

          // Calculate required BNB using the actual bonding curve parameters
          // IMPORTANT: Contract uses totalSupply (not saleAmount) for calculation (MEMECore.sol:1064)
          // Use contract's calculateInitialBuyBNB function for 100% accuracy
          let calculationResult
          try {
            // Contract function returns (totalPayment, preBuyFee)
            // where totalPayment = initialBNB + preBuyFee
            const contractResult = await publicClient.readContract({
              address: contractAddress,
              abi: MetaNodeCoreABI,
              functionName: 'calculateInitialBuyBNB',
              args: [totalSupply, virtualBNBReserve, virtualTokenReserve, BigInt(percentageBP)],
            }) as [bigint, bigint]
            
            const [contractTotalPayment, contractPreBuyFee] = contractResult
            // totalPayment = initialBNB + preBuyFee, so initialBNB = totalPayment - preBuyFee
            const contractInitialBNB = contractTotalPayment - contractPreBuyFee
            
            console.log('[useTokenCreation] Using contract calculateInitialBuyBNB (EXACT MATCH):', {
              totalPayment: contractTotalPayment.toString(),
              totalPaymentBNB: (Number(contractTotalPayment) / 1e18).toFixed(6),
              initialBNB: contractInitialBNB.toString(),
              initialBNBBNB: (Number(contractInitialBNB) / 1e18).toFixed(6),
              preBuyFee: contractPreBuyFee.toString(),
              preBuyFeeBNB: (Number(contractPreBuyFee) / 1e18).toFixed(6),
            })
            
            prebuyBNB = contractInitialBNB
            preBuyFee = contractPreBuyFee
            calculationResult = {
              bnbRequired: contractInitialBNB,
              bnbRequiredFormatted: (Number(contractInitialBNB) / 1e18).toFixed(6),
            }
          } catch (contractError) {
            console.warn('[useTokenCreation] Failed to use contract function, using direct calculation:', contractError)
            // Fallback to direct calculation (should match, but contract is source of truth)
            calculationResult = calculateInitialBuyBNBDirect({
              saleAmount,
              totalSupply, // Contract uses totalSupply for initial buy calculation
              virtualBNBReserve,
              virtualTokenReserve,
              percentageBP,
            })
            
            prebuyBNB = calculationResult.bnbRequired
            // Calculate preBuyFee: (initialBNB * preBuyFeeRate) / 10000
            preBuyFee = (prebuyBNB * preBuyFeeRate) / BigInt(10000)
            
            console.warn('[useTokenCreation] Using direct calculation (may have rounding differences):', {
              initialBNB: prebuyBNB.toString(),
              preBuyFee: preBuyFee.toString(),
            })
          }
          
          bnbValue += prebuyBNB + preBuyFee

          console.log(
            `Prebuy enabled: ${data.preBuyPercent * 100}% requires ${calculationResult.bnbRequiredFormatted} BNB + ${(Number(preBuyFee) / 1e18).toFixed(6)} BNB fee`
          )
        }

        // Add margin BNB if specified
        if (data.marginBnb && data.marginBnb > 0) {
          marginBNB = parseEther(data.marginBnb.toString())
          bnbValue += marginBNB

          console.log(
            `Margin enabled: ${data.marginBnb} BNB for ${data.marginTime / (24 * 60 * 60)} days`
          )
        }

        // Step 2: Execute contract transaction
        // Detailed breakdown for debugging
        const breakdown = {
          creationFee: Number(creationFee) / 1e18,
          prebuyBNB: Number(prebuyBNB) / 1e18,
          preBuyFee: Number(preBuyFee) / 1e18,
          marginBNB: Number(marginBNB) / 1e18,
          total: Number(bnbValue) / 1e18,
        }
        console.log('[useTokenCreation] Fee breakdown:', breakdown)
        console.log('[useTokenCreation] Total value (wei):', bnbValue.toString())
        console.log('[useTokenCreation] Total value (BNB):', breakdown.total.toFixed(6))
        
        // Validate total value is at least creationFee
        if (bnbValue < creationFee) {
          console.error('[useTokenCreation] ERROR: Total value is less than creationFee!', {
            bnbValue: bnbValue.toString(),
            bnbValueBNB: breakdown.total.toFixed(6),
            creationFee: creationFee.toString(),
            creationFeeBNB: breakdown.creationFee.toFixed(6),
            difference: (Number(bnbValue - creationFee) / 1e18).toFixed(6),
          })
          throw new Error(`Total value (${breakdown.total.toFixed(6)} BNB) is less than creation fee (${breakdown.creationFee.toFixed(6)} BNB)`)
        }
        
        // Additional validation: ensure we have enough for all components
        const calculatedTotal = creationFee + prebuyBNB + preBuyFee + marginBNB
        if (bnbValue !== calculatedTotal) {
          console.warn('[useTokenCreation] WARNING: bnbValue does not match calculated total!', {
            bnbValue: bnbValue.toString(),
            calculatedTotal: calculatedTotal.toString(),
            difference: (Number(bnbValue - calculatedTotal) / 1e18).toFixed(6),
          })
          // Use the calculated total to ensure accuracy
          bnbValue = calculatedTotal
          console.log('[useTokenCreation] Using calculated total:', bnbValue.toString(), 'wei', `(${(Number(bnbValue) / 1e18).toFixed(6)} BNB)`)
        }
        
        console.log('[useTokenCreation] Validation passed. Ready to send transaction with value:', bnbValue.toString(), 'wei', `(${(Number(bnbValue) / 1e18).toFixed(6)} BNB)`)
        
        const contractResult = await createTokenContract.createToken({
          createArg: createArg as Hex,
          signature: signature as Hex,
          value: bnbValue, // Pass total BNB value including all fees
          valueBreakdown: {
            creationFee,
            prebuy: prebuyBNB,
            preBuyFee,
            margin: marginBNB,
          },
        })

        // If user cancelled or error occurred, contractResult will be null
        if (!contractResult) {
          setIsCreating(false)
          return null
        }

        console.log('Transaction submitted:', contractResult.hash)

        // Return transaction details for monitoring
        return {
          transactionHash: contractResult.hash,
          predictedAddress,
          tokenAddress: contractResult.tokenAddress,
        }
      } catch (err) {
        const error = err as Error
        setError(error)

        // Handle specific error cases
        if (
          error.message.includes('User rejected') ||
          error.message.includes('User denied')
        ) {
          toast.error(t('createToken.errors.transactionCancelled'), {
            description: t('createToken.errors.userCancelled'),
          })
        } else if (!error.message.includes('notify')) {
          // Only show error if not already handled
          toast.error(t('createToken.errors.creationFailed'), {
            description: error.message || t('createToken.errors.unexpected'),
          })
        }

        return null
      } finally {
        setIsCreating(false)
      }
    },
    [createTokenMutation, createTokenContract, t, publicClient, contractAddress]
  )

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsCreating(false)
    setError(null)
  }, [])

  return {
    createToken,
    isCreating,
    error,
    reset,
  }
}
