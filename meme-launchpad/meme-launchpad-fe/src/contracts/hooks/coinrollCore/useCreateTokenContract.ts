/**
 * Hook for calling the CoinRollCore contract's createToken method
 * Uses the createArg and signature from the API response
 */

import { useCallback, useState } from 'react'
import {
  useChainId,
  useAccount,
  usePublicClient,
  useWalletClient,
  useBalance,
} from 'wagmi'
import { Address, Hex } from 'viem'
import { toast } from 'sonner'
import MetaNodeCoreArtifact from '@/contracts/abis/MetaNodeCore.json'

// Extract ABI from artifact (Foundry output format)
const MetaNodeCoreABI = (MetaNodeCoreArtifact as any).abi || MetaNodeCoreArtifact
import { getCoinRollCoreAddress } from '@/contracts/addresses'
import { handleContractError } from '@/contracts/utils/errors'

export interface CreateTokenContractParams {
  createArg: Hex // Encoded arguments from API
  signature: Hex // Signature from API
  value?: bigint // Optional BNB value to send with transaction
  valueBreakdown?: {
    creationFee?: bigint
    prebuy?: bigint
    preBuyFee?: bigint // Prebuy fee (calculated from prebuyBNB * preBuyFeeRate / 10000)
    margin?: bigint
  } // Optional breakdown of the value for display purposes
}

export interface CreateTokenContractResult {
  hash: Hex
  tokenAddress?: Address
}

/**
 * Hook for calling the smart contract to create a token
 * This should be called after getting the createArg and signature from the API
 */
export function useCreateTokenContract() {
  const chainId = useChainId()
  const { address: account } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { data: balance } = useBalance({ address: account })

  const [isEstimatingGas, setIsEstimatingGas] = useState(false)
  const [isWriting, setIsWriting] = useState(false)

  // Get the contract address from environment variables
  const contractAddress = getCoinRollCoreAddress(chainId)

  /**
   * Estimate gas for the transaction
   */
  const estimateGas = useCallback(
    async (params: CreateTokenContractParams): Promise<bigint | null> => {
      if (!publicClient || !account) {
        toast.error('Wallet not connected')
        return null
      }

      setIsEstimatingGas(true)

      try {
        // Validate value parameter
        const txValue = params.value || BigInt(0)
     
        if (txValue === BigInt(0)) {
          throw new Error('Transaction value is 0. Cannot estimate gas. Please check fee calculation.')
        }
        
        // Validate value is at least 0.05 BNB (expected creationFee)
        const minExpectedFee = BigInt('50000000000000000') // 0.05 BNB
        if (txValue < minExpectedFee) {
          throw new Error('Transaction value is less than expected creationFee (0.05 BNB). Please check fee calculation.')
        }

        // First, try to simulate the transaction to get detailed error info
        // If simulation succeeds, estimate gas
        const gasEstimate = await publicClient.estimateContractGas({
          address: contractAddress,
          abi: MetaNodeCoreABI,
          functionName: 'createToken',
          args: [params.createArg, params.signature],
          value: txValue,
          account,
        })
        
        console.log('[GasEstimate] Gas estimate:', gasEstimate.toString())

        return gasEstimate
      } catch (error) {
        console.error('Gas estimation failed:', error)
        
        // Try to extract more details from the error
        const errorDetails: any = error
        if (errorDetails?.cause?.data) {
          console.error('Error details:', {
            errorName: errorDetails.cause.data.errorName,
            args: errorDetails.cause.data.args,
            data: errorDetails.cause.data,
          })
          
          // Show specific error messages
          const errorName = errorDetails.cause.data.errorName
          if (errorName === 'InvalidSigner') {
            toast.error('Invalid Signer', {
              description: 'The signer address does not have SIGNER_ROLE. Please check backend configuration and contract permissions.',
            })
          } else if (errorName === 'RequestExpired') {
            toast.error('Request Expired', {
              description: 'The request timestamp has expired. Please try creating the token again.',
            })
          } else if (errorName === 'RequestAlreadyProcessed') {
            toast.error('Request Already Processed', {
              description: 'This request ID has already been used. Please try creating the token again.',
            })
          } else if (errorName === 'InsufficientFee') {
            const feeAmount = params.valueBreakdown?.creationFee
              ? (Number(params.valueBreakdown.creationFee) / 1e18).toFixed(4)
              : '0.05'
            toast.error('Insufficient Fee', {
              description: `Please ensure you send at least the creation fee (${feeAmount} BNB).`,
            })
          } else if (errorName) {
            toast.error(`Contract Error: ${errorName}`, {
              description: 'Please check the contract state and try again.',
            })
          }
        } else {
          // Generic error with troubleshooting tips
          toast.error('Transaction Failed', {
            description: 'Please check: 1) Signer has SIGNER_ROLE, 2) Request not expired, 3) Request ID not used, 4) Sufficient fee sent',
          })
        }
        
        handleContractError(error)
        return null
      } finally {
        setIsEstimatingGas(false)
      }
    },
    [publicClient, account, contractAddress]
  )

  /**
   * Execute the createToken transaction on the blockchain
   */
  const createToken = useCallback(
    async (
      params: CreateTokenContractParams
    ): Promise<CreateTokenContractResult | null> => {
      try {
        if (!account) {
          toast.error('Please connect your wallet')
          return null
        }

        // Validate contract address
        if (
          !contractAddress ||
          contractAddress === '0x0000000000000000000000000000000000000000'
        ) {
          toast.error(
            'Contract address not configured. Please set NEXT_PUBLIC_COINROLL_CORE_ADDRESS in environment'
          )
          return null
        }

        // Validate value parameter BEFORE gas estimation
        const txValue = params.value || BigInt(0)
        console.log('[CreateToken] ==========================================')
        console.log('[CreateToken] Starting createToken execution')
        console.log('[CreateToken] Received value parameter:', txValue.toString(), 'wei', `(${(Number(txValue) / 1e18).toFixed(6)} BNB)`)
        console.log('[CreateToken] Value breakdown:', params.valueBreakdown)
        console.log('[CreateToken] Contract address:', contractAddress)
        
        if (txValue === BigInt(0)) {
          const errorMsg = 'Transaction value is 0. Cannot proceed with token creation.'
          console.error('[CreateToken] ERROR:', errorMsg)
          console.error('[CreateToken] Value breakdown:', params.valueBreakdown)
          console.error('[CreateToken] params.value:', params.value)
          toast.error('Transaction Value Error', {
            description: 'Transaction value is 0. Please check fee calculation and try again.',
          })
          return null
        }
        
        // Validate value is at least 0.05 BNB (expected creationFee)
        const minExpectedFee = BigInt('50000000000000000') // 0.05 BNB
        if (txValue < minExpectedFee) {
          console.error('[CreateToken] WARNING: Transaction value is less than expected creationFee (0.05 BNB)!', {
            txValue: txValue.toString(),
            txValueBNB: (Number(txValue) / 1e18).toFixed(6),
            minExpectedFee: minExpectedFee.toString(),
            minExpectedFeeBNB: (Number(minExpectedFee) / 1e18).toFixed(6),
          })
        }

        // Try to estimate gas, but use default if it fails
        // This allows us to proceed even if gas estimation fails due to contract state issues
        let gasEstimate: bigint
        try {
          const estimatedGas = await estimateGas(params)
          if (estimatedGas) {
            gasEstimate = estimatedGas
            console.log('[CreateToken] Using estimated gas:', gasEstimate.toString())
          } else {
            // Gas estimation returned null, use default
            gasEstimate = BigInt(3000000) // Default 3M gas for createToken
            console.warn('[CreateToken] Gas estimation returned null, using default:', gasEstimate.toString())
          }
        } catch (error) {
          // Gas estimation failed, use default gas limit
          // This is common when contract simulation fails due to state issues
          gasEstimate = BigInt(3000000) // Default 3M gas for createToken
          console.warn('[CreateToken] Gas estimation failed, using default gas limit:', gasEstimate.toString())
          console.warn('[CreateToken] Error was:', error)
          // Don't show error toast here, as we're proceeding with default gas
        }

        // Calculate total cost including gas and any additional value
        const gasPrice = await publicClient?.getGasPrice()
        const totalGasCost = gasEstimate * (gasPrice || BigInt(5000000000)) // Default 5 Gwei
        const additionalValue = params.value || BigInt(0)
        const totalCost = totalGasCost + additionalValue

        // Check if user has enough balance
        if (balance && balance.value < totalCost) {
          const formatBNB = (value: bigint) => {
            return (Number(value) / 1e18).toFixed(4)
          }
          toast.error('Insufficient BNB balance', {
            description: `Required: ${formatBNB(totalCost)} BNB, Available: ${formatBNB(balance.value)} BNB`,
          })
          return null
        }

        // Show detailed cost breakdown if additional value is included
        if (additionalValue > BigInt(0)) {
          const formatBNB = (value: bigint) => {
            return (Number(value) / 1e18).toFixed(4)
          }

          console.log('Transaction cost breakdown:')
          console.log(`- Gas cost: ${formatBNB(totalGasCost)} BNB`)

          // Show detailed breakdown if provided
          if (params.valueBreakdown) {
            if (
              params.valueBreakdown.creationFee &&
              params.valueBreakdown.creationFee > BigInt(0)
            ) {
              console.log(
                `- Creation fee: ${formatBNB(params.valueBreakdown.creationFee)} BNB`
              )
            }
            if (
              params.valueBreakdown.prebuy &&
              params.valueBreakdown.prebuy > BigInt(0)
            ) {
              console.log(
                `- Prebuy amount: ${formatBNB(params.valueBreakdown.prebuy)} BNB`
              )
            }
            if (
              params.valueBreakdown.preBuyFee &&
              params.valueBreakdown.preBuyFee > BigInt(0)
            ) {
              console.log(
                `- Prebuy fee: ${formatBNB(params.valueBreakdown.preBuyFee)} BNB`
              )
            }
            if (
              params.valueBreakdown.margin &&
              params.valueBreakdown.margin > BigInt(0)
            ) {
              console.log(
                `- Margin amount: ${formatBNB(params.valueBreakdown.margin)} BNB`
              )
            }
          } else {
            console.log(`- Additional value: ${formatBNB(additionalValue)} BNB`)
          }

          console.log(`- Total cost: ${formatBNB(totalCost)} BNB`)

          // Create description based on what's included
          let description = 'Includes:'
          if (params.valueBreakdown) {
            const parts = []
            if (
              params.valueBreakdown.creationFee &&
              params.valueBreakdown.creationFee > BigInt(0)
            ) {
              parts.push(
                `${formatBNB(params.valueBreakdown.creationFee)} BNB creation fee`
              )
            }
            if (
              params.valueBreakdown.prebuy &&
              params.valueBreakdown.prebuy > BigInt(0)
            ) {
              parts.push(
                `${formatBNB(params.valueBreakdown.prebuy)} BNB for prebuy`
              )
            }
            if (
              params.valueBreakdown.preBuyFee &&
              params.valueBreakdown.preBuyFee > BigInt(0)
            ) {
              parts.push(
                `${formatBNB(params.valueBreakdown.preBuyFee)} BNB prebuy fee`
              )
            }
            if (
              params.valueBreakdown.margin &&
              params.valueBreakdown.margin > BigInt(0)
            ) {
              parts.push(
                `${formatBNB(params.valueBreakdown.margin)} BNB for margin`
              )
            }
            description =
              parts.length > 0 ? `Includes: ${parts.join(' + ')}` : ''
          } else {
            description = `Includes ${formatBNB(additionalValue)} BNB additional value`
          }

          toast.info(`Total transaction cost: ${formatBNB(totalCost)} BNB`, {
            description,
          })
        }

        if (!walletClient) {
          toast.error('Wallet not connected')
          return null
        }

        setIsWriting(true)

        try {
          // Validate value parameter before sending
          const txValue = params.value || BigInt(0)
          console.log('[CreateToken] Sending transaction with value:', txValue.toString(), 'wei', `(${(Number(txValue) / 1e18).toFixed(6)} BNB)`)
          
          if (txValue === BigInt(0)) {
            console.error('[CreateToken] ERROR: Transaction value is 0! This will cause InsufficientFee error.')
            toast.error('Transaction Value Error', {
              description: 'Transaction value is 0. Please check fee calculation.',
            })
            return null
          }

          // Send transaction using wallet client
          const hash = await walletClient.writeContract({
            address: contractAddress,
            abi: MetaNodeCoreABI,
            functionName: 'createToken',
            args: [params.createArg, params.signature],
            value: txValue,
            gas: gasEstimate,
            account: account!,
          })

          console.log('[CreateToken] Transaction sent with hash:', hash)

          return { hash, tokenAddress: undefined }
        } catch (writeError) {
          console.error('Transaction failed:', writeError)
          handleContractError(writeError)
          return null
        } finally {
          setIsWriting(false)
        }
      } catch (error) {
        console.error('Token creation failed:', error)
        handleContractError(error)
        return null
      }
    },
    [account, balance, contractAddress, estimateGas, publicClient, walletClient]
  )

  return {
    // Main function
    createToken,
    estimateGas,

    // Transaction state
    isLoading: isWriting || isEstimatingGas,
    isPending: isWriting,
  }
}
