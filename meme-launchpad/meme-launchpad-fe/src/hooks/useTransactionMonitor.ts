/**
 * Generic transaction monitoring hook
 * Monitors blockchain transactions and provides UI feedback
 * Completely decoupled from any specific business logic
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { usePublicClient, useChainId } from 'wagmi'
import { type Hex, decodeErrorResult, ContractFunctionRevertedError } from 'viem'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import CoinRollCoreABI from '@/contracts/abis/CoinRollCore.json'

export interface TransactionMonitorOptions {
  onSuccess?: (receipt: any) => void
  onError?: (error: Error) => void
  onSettled?: () => void
  successMessage?: string
  errorMessage?: string
  showExplorerLink?: boolean
  autoDisableForm?: boolean
  useDialog?: boolean // Option to use dialog instead of toast
  onDialogOpen?: (receipt: any) => void // Callback when dialog should open
}

export interface TransactionMonitorResult {
  startMonitoring: (hash: Hex) => void
  isMonitoring: boolean
  receipt: any | null
  error: Error | null
}

/**
 * Hook for monitoring blockchain transactions
 * Provides toast notifications with explorer links
 */
export function useTransactionMonitor(
  options: TransactionMonitorOptions = {}
): TransactionMonitorResult {
  const {
    onSuccess,
    onError,
    onSettled,
    successMessage,
    errorMessage,
    showExplorerLink = true,
    useDialog = false,
    onDialogOpen,
  } = options

  const t = useTranslations()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  const [isMonitoring, setIsMonitoring] = useState(false)
  const [receipt, setReceipt] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const toastIdRef = useRef<string | number | null>(null)

  /**
   * Get blockchain explorer URL for transaction
   */
  const getExplorerUrl = useCallback(
    (hash: string) => {
      if (chainId === 56) {
        return `https://bscscan.com/tx/${hash}`
      }
      return `https://testnet.bscscan.com/tx/${hash}`
    },
    [chainId]
  )

  /**
   * Start monitoring a transaction
   */
  const startMonitoring = useCallback(
    async (hash: Hex) => {
      if (!publicClient || isMonitoring) return

      setIsMonitoring(true)
      setReceipt(null)
      setError(null)

      // Show loading toast
      toastIdRef.current = toast.loading(
        t('createToken.contractCall.waitingForConfirmation'),
        {
          description: `${hash.slice(0, 10)}...${hash.slice(-8)}`,
        }
      )

      try {
        // Wait for transaction receipt
        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
          timeout: 60_000, // 60 seconds
        })

        setReceipt(txReceipt)

        // Dismiss loading toast
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current)
        }

        const explorerUrl = getExplorerUrl(hash)

        if (txReceipt?.status === 'success') {
          // Use dialog if enabled, otherwise use toast
          if (useDialog && onDialogOpen) {
            // Call the dialog open callback
            onDialogOpen(txReceipt)
          } else {
            // Success notification via toast
            toast.success(successMessage || t('createToken.success.title'), {
              description: t('createToken.success.message', {
                address: hash.slice(0, 10) + '...' + hash.slice(-8),
              }),
              duration: 10000,
              action: showExplorerLink
                ? {
                    label: t('createToken.success.viewOnExplorer'),
                    onClick: () => window.open(explorerUrl, '_blank'),
                  }
                : undefined,
            })
          }

          onSuccess?.(txReceipt)
        } else {
          // Transaction failed on-chain - try to get revert reason
          let errorMessage = 'Transaction reverted on-chain'
          let errorDetails = ''
          let errorName: string | undefined

          try {
            // Try to get the transaction to decode revert reason
            const tx = await publicClient.getTransaction({ hash })
            
            console.log('[TransactionMonitor] Analyzing failed transaction:', {
              hash,
              to: tx.to,
              from: tx.from,
              value: tx.value?.toString(),
              inputLength: tx.input.length,
            })
            
            // Try to call the transaction to get revert reason
            // This will re-execute the transaction and return the error
            try {
              const result = await publicClient.call({
                to: tx.to!,
                data: tx.input,
                value: tx.value || BigInt(0),
                account: tx.from,
              })
              
              // If call succeeds, there shouldn't be an error
              console.warn('[TransactionMonitor] Call succeeded but transaction failed - state may have changed')
            } catch (callError: any) {
              console.log('[TransactionMonitor] Call error full object:', JSON.stringify(callError, null, 2))
              
              // Try multiple ways to extract error name
              // Method 1: Direct error data
              if (callError?.data?.errorName) {
                errorName = callError.data.errorName
                console.log('[TransactionMonitor] Found error name in data:', errorName)
              }
              // Method 2: Nested cause
              else if (callError?.cause?.data?.errorName) {
                errorName = callError.cause.data.errorName
                console.log('[TransactionMonitor] Found error name in cause.data:', errorName)
              }
              // Method 3: Walk error chain for ContractFunctionRevertedError
              else if (callError?.walk) {
                try {
                  const revertError = callError.walk(
                    (e: any) => e instanceof ContractFunctionRevertedError
                  )
                  if (revertError instanceof ContractFunctionRevertedError) {
                    errorName = revertError.data?.errorName
                    console.log('[TransactionMonitor] Found error name via walk:', errorName)
                  }
                } catch (walkErr) {
                  console.warn('[TransactionMonitor] Error walking error chain:', walkErr)
                }
              }
              // Method 4: Try to decode from revert data using full ABI
              else {
                const revertData = callError?.data || callError?.cause?.data
                if (revertData) {
                  // revertData might be a hex string or an object
                  let dataHex: Hex | undefined
                  if (typeof revertData === 'string') {
                    dataHex = revertData as Hex
                  } else if (revertData?.data) {
                    dataHex = revertData.data as Hex
                  }
                  
                  if (dataHex && dataHex.length >= 10) {
                    try {
                      const decoded = decodeErrorResult({
                        data: dataHex,
                        abi: CoinRollCoreABI,
                      })
                      if (decoded?.errorName) {
                        errorName = decoded.errorName
                        console.log('[TransactionMonitor] Decoded error name from revert data:', errorName)
                        console.log('[TransactionMonitor] Error args:', decoded.args)
                      }
                    } catch (decodeErr) {
                      console.warn('[TransactionMonitor] Failed to decode error from revert data:', decodeErr)
                      console.warn('[TransactionMonitor] Revert data was:', dataHex)
                    }
                  } else {
                    console.warn('[TransactionMonitor] Revert data format unexpected:', revertData)
                  }
                }
              }
              
              // Method 5: Extract from error message as last resort
              if (!errorName) {
                const errorMsg = callError?.shortMessage || callError?.message || ''
                console.log('[TransactionMonitor] Error message:', errorMsg)
                
                // Check for common error patterns in message
                const errorPatterns: Record<string, string> = {
                  'InsufficientFee': 'InsufficientFee',
                  'insufficient fee': 'InsufficientFee',
                  'InvalidSigner': 'InvalidSigner',
                  'invalid signer': 'InvalidSigner',
                  'RequestExpired': 'RequestExpired',
                  'request expired': 'RequestExpired',
                  'RequestAlreadyProcessed': 'RequestAlreadyProcessed',
                  'request already': 'RequestAlreadyProcessed',
                  'InvalidSaleParameters': 'InvalidSaleParameters',
                  'InvalidInitialBuyPercentage': 'InvalidInitialBuyPercentage',
                  'MarginReceiverNotSet': 'MarginReceiverNotSet',
                  'InvalidPair': 'InvalidPair',
                }
                
                for (const [pattern, name] of Object.entries(errorPatterns)) {
                  if (errorMsg.includes(pattern)) {
                    errorName = name
                    console.log('[TransactionMonitor] Found error name from message pattern:', errorName)
                    break
                  }
                }
              }
            }
            
            // Map error name to user-friendly message
            if (errorName) {
              errorMessage = `Transaction reverted: ${errorName}`
              
              const errorMessages: Record<string, string> = {
                InsufficientFee: 'Insufficient fee. Please check that you sent enough BNB to cover creation fee, prebuy, and margin.',
                InvalidSigner: 'Invalid signer. The backend signer may not have SIGNER_ROLE in the contract.',
                RequestExpired: 'Request expired. Please try creating the token again.',
                RequestAlreadyProcessed: 'Request already processed. This request ID has been used.',
                InvalidSaleParameters: 'Invalid sale parameters. Please check token parameters.',
                InvalidInitialBuyPercentage: 'Invalid initial buy percentage. Must be within allowed range.',
                MarginReceiverNotSet: 'Margin receiver not set in contract.',
                InvalidPair: 'Invalid pair address. Token deployment may have failed.',
              }
              
              errorDetails = errorMessages[errorName] || `Contract error: ${errorName}`
            } else {
              // Try to extract from error message patterns
              const errorMsg = txReceipt.status === 'reverted' ? 'Transaction reverted' : 'Unknown error'
              errorDetails = errorMsg
            }
          } catch (err) {
            console.error('[TransactionMonitor] Failed to get revert reason:', err)
            // Fall back to generic error message
          }

          console.error('[TransactionMonitor] Transaction failed:', {
            hash,
            status: txReceipt.status,
            errorMessage,
            errorDetails,
            receipt: txReceipt,
          })

          const txError = new Error(errorMessage)
          if (errorDetails) {
            ;(txError as any).details = errorDetails
          }
          setError(txError)

          toast.error(
            errorMessage || t('createToken.errors.transactionFailed'),
            {
              description: errorDetails || t('createToken.errors.transactionReverted'),
              duration: 15000,
              action: showExplorerLink
                ? {
                    label: t('createToken.success.viewOnExplorer'),
                    onClick: () => window.open(explorerUrl, '_blank'),
                  }
                : undefined,
            }
          )

          onError?.(txError)
        }
      } catch (err: any) {
        // Monitoring error (timeout, network issue, etc.)
        const monitorError: Error =
          err instanceof Error ? err : new Error(String(err))
        setError(monitorError)

        // Dismiss loading toast
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current)
        }

        const explorerUrl = getExplorerUrl(hash)

        toast.error(t('createToken.errors.transactionStatusUnknown'), {
          description: t('createToken.errors.checkExplorer'),
          duration: 10000,
          action: showExplorerLink
            ? {
                label: t('createToken.success.viewOnExplorer'),
                onClick: () => window.open(explorerUrl, '_blank'),
              }
            : undefined,
        })

        onError?.(monitorError)
      } finally {
        setIsMonitoring(false)
        onSettled?.()
      }
    },
    [
      publicClient,
      isMonitoring,
      t,
      getExplorerUrl,
      successMessage,
      showExplorerLink,
      useDialog,
      onDialogOpen,
      onSuccess,
      onError,
      onSettled,
    ]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
      }
    }
  }, [])

  return {
    startMonitoring,
    isMonitoring,
    receipt,
    error,
  }
}
