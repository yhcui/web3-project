'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { FloatInput } from '@/components/ui/float-input'
import { BondingCurveProgress } from './BondingCurveProgress'
import { PeriodicBurning } from './PeriodicBurning'
import { CreatorInfo } from './CreatorInfo'
import { HoldersInfo } from './HoldersInfo'
import { IconsAddIcon } from '../icons/generated'
import { useAccount, useBalance } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { formatEther, parseEther } from 'viem'
import {
  useCalculateTokenAmountOut,
  useCalculateBNBAmountOut,
  calculateBNBAmountOutDirect,
  type BondingCurveParams,
} from '@/contracts/hooks/coinrollHelper'
import {
  useBuyTokens,
  useSellTokens,
  calculateMinTokenAmount,
  calculateMinBNBAmount,
  useBondingCurve,
} from '@/contracts/hooks/coinrollCore'
import { notify } from '@/stores/useUIStore'
import { useTokenData } from '@/providers/TokenDataProvider'
import { useFavoriteToken, useUnfavoriteToken } from '@/api/endpoints/tokens'

interface RightPanelProps {
  className?: string
  tokenAddress?: string
  tokenSymbol?: string
}

// Helper function to truncate to max 5 decimal places (no rounding up)
function truncateToDecimals(value: string, decimals: number = 5): string {
  if (!value || value === '0') return value

  const parts = value.split('.')
  if (parts.length === 1) return value // No decimals

  // If decimal part exists, truncate it
  if (parts[1] && parts[1].length > decimals) {
    return `${parts[0]}.${parts[1].slice(0, decimals)}`
  }

  return value
}

export function RightPanel({
  className,
  tokenAddress,
  tokenSymbol = 'TOKEN',
}: RightPanelProps) {
  const t = useTranslations('Token.RightPanel')
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [isPromptingWallet, setIsPromptingWallet] = useState(false)

  // Get shared token data from provider
  const {
    tokenData: tokenDataRaw,
    isLoading: isTokenDataLoading,
    refetch: refetchTokenData,
  } = useTokenData()
  const tokenData = tokenDataRaw ? { data: tokenDataRaw } : null

  // Favorite/unfavorite mutations
  const favoriteTokenMutation = useFavoriteToken()
  const unfavoriteTokenMutation = useUnfavoriteToken()

  // Get the actual token symbol from API data or fallback to prop
  const actualTokenSymbol = tokenData?.data?.symbol || tokenSymbol
  const actualTokenLogo = tokenData?.data?.logo || ''
  const [amount, setAmount] = useState('')
  const [percentage, setPercentage] = useState(0)
  const [mevProtection, setMevProtection] = useState(false)
  const [slippage, setSlippage] = useState(5) // 5% default slippage
  const [isEditingSlippage, setIsEditingSlippage] = useState(false)
  const [customSlippage, setCustomSlippage] = useState('')
  const slippageRef = useRef<HTMLDivElement>(null)

  // Check if token has launched
  const isTokenLaunched = useMemo(() => {
    if (!tokenData?.data?.launchTime) return true // Default to allowing trading if no launch time

    const now = Math.floor(Date.now() / 1000) // Current time in seconds
    return tokenData.data.launchTime <= now
  }, [tokenData])

  // Wallet connection hooks
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  // Reset prompting flag when wallet connects
  useEffect(() => {
    if (isConnected) {
      setIsPromptingWallet(false)
    }
  }, [isConnected])

  // Get BNB balance
  const {
    data: bnbBalance,
    isLoading: isBalanceLoading,
    refetch: refetchBnbBalance,
  } = useBalance({
    address: address,
    query: {
      enabled: !!address,
    },
  })

  // Get token balance
  const {
    data: tokenBalance,
    isLoading: isTokenBalanceLoading,
    refetch: refetchTokenBalance,
  } = useBalance({
    address: address,
    token: tokenAddress as `0x${string}` | undefined,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  })

  // Fetch the actual bonding curve from the contract
  const {
    bondingCurve,
    isLoading: isBondingCurveLoading,
    error: bondingCurveError,
    refetch: refetchBondingCurve,
  } = useBondingCurve({
    tokenAddress,
  })

  // Log bonding curve for debugging
  useEffect(() => {
    if (bondingCurve) {
      console.log('Fetched bonding curve:', {
        virtualBNBReserve: formatEther(bondingCurve.virtualBNBReserve),
        virtualTokenReserve: formatEther(bondingCurve.virtualTokenReserve),
        k: bondingCurve.k.toString(),
        availableTokens: formatEther(bondingCurve.availableTokens),
        collectedBNB: formatEther(bondingCurve.collectedBNB),
      })
    }
  }, [bondingCurve])

  // Calculate expected token amount for buy
  const {
    tokenAmountFormatted: expectedTokenAmount,
    priceImpact: buyPriceImpact,
    isLoading: isCalculatingBuy,
  } = useCalculateTokenAmountOut({
    bnbIn: amount || '0',
    curve: bondingCurve,
  })

  // Calculate expected BNB amount for sell
  const {
    bnbAmountFormatted: expectedBNBAmount,
    priceImpact: sellPriceImpact,
    isLoading: isCalculatingSell,
  } = useCalculateBNBAmountOut({
    tokenIn: amount || '0',
    curve: bondingCurve,
  })

  // Calculate minimum amounts with slippage
  const minTokenAmount = useMemo(() => {
    if (
      activeTab === 'buy' &&
      expectedTokenAmount &&
      parseFloat(expectedTokenAmount) > 0
    ) {
      return calculateMinTokenAmount(expectedTokenAmount, slippage)
    }
    return '0'
  }, [activeTab, expectedTokenAmount, slippage])

  const minBNBAmount = useMemo(() => {
    if (
      activeTab === 'sell' &&
      expectedBNBAmount &&
      parseFloat(expectedBNBAmount) > 0
    ) {
      return calculateMinBNBAmount(expectedBNBAmount, slippage)
    }
    return '0'
  }, [activeTab, expectedBNBAmount, slippage])

  // Calculate minimum received based on slippage - for display only
  const minimumReceived = useMemo(() => {
    if (activeTab === 'buy' && expectedTokenAmount) {
      return minTokenAmount
    } else if (activeTab === 'sell' && expectedBNBAmount) {
      return minBNBAmount
    }
    return '0'
  }, [
    activeTab,
    expectedTokenAmount,
    expectedBNBAmount,
    minTokenAmount,
    minBNBAmount,
  ])

  // Format balance for display
  const availableBalance = useMemo(() => {
    if (activeTab === 'buy') {
      return bnbBalance
        ? `${formatEther(bnbBalance.value).slice(0, 8)} BNB`
        : '0 BNB'
    } else {
      return tokenBalance
        ? `${formatEther(tokenBalance.value).slice(0, 8)} ${actualTokenSymbol}`
        : `0 ${actualTokenSymbol}`
    }
  }, [activeTab, bnbBalance, tokenBalance, actualTokenSymbol])

  const percentageOptions = [25, 50, 75, 100]

  // Handle click outside to close slippage dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        slippageRef.current &&
        !slippageRef.current.contains(event.target as Node)
      ) {
        setIsEditingSlippage(false)
      }
    }

    if (isEditingSlippage) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isEditingSlippage])

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      if (promptTimeoutRef.current) {
        clearTimeout(promptTimeoutRef.current)
        promptTimeoutRef.current = null
      }
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current)
        refetchTimeoutRef.current = null
      }
    }
  }, [])

  // Store timeout refs for cleanup
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add handler for wallet connection prompts
  const handleConnectWalletPrompt = () => {
    if (!isConnected) {
      if (!isPromptingWallet) {
        setIsPromptingWallet(true)
        // Simple toast notification
        notify.warning(t('connectWallet'), t('pleaseConnectWalletToTrade'))
        // Reset the flag to allow future prompts
        // Clear previous timeout if exists
        if (promptTimeoutRef.current) {
          clearTimeout(promptTimeoutRef.current)
        }
        promptTimeoutRef.current = setTimeout(() => {
          setIsPromptingWallet(false)
          promptTimeoutRef.current = null
        }, 5000)
      }
      return true
    }
    return false
  }

  const handlePercentageClick = (value: number) => {
    if (handleConnectWalletPrompt()) return

    setPercentage(value)

    // Calculate amount based on percentage of available balance
    if (activeTab === 'buy' && bnbBalance) {
      const bnbAmount = (bnbBalance.value * BigInt(value)) / BigInt(100)
      const formattedAmount = formatEther(bnbAmount)
      // Truncate to max 5 decimal places
      setAmount(truncateToDecimals(formattedAmount, 5))
    } else if (activeTab === 'sell' && tokenBalance) {
      const tokenAmount = (tokenBalance.value * BigInt(value)) / BigInt(100)
      const formattedAmount = formatEther(tokenAmount)
      // Truncate to max 5 decimal places
      setAmount(truncateToDecimals(formattedAmount, 5))
    }
  }

  // Buy tokens hook
  const buyTokensResult = useBuyTokens({
    tokenAddress,
    bnbAmount: activeTab === 'buy' ? amount : '0',
    minTokenAmount,
  })

  const {
    buy,
    canBuy,
    isPreparing: isPreparingBuy,
    isConfirming: isConfirmingBuy,
    isWaiting: isWaitingBuy,
    isSuccess: isBuySuccess,
    isError: isBuyError,
    error: buyError,
    hash: buyHash,
    reset: resetBuy,
  } = buyTokensResult

  // Sell tokens hook
  const sellTokensResult = useSellTokens({
    tokenAddress,
    tokenAmount: activeTab === 'sell' ? amount : '0',
    minBNBAmount,
  })

  const {
    sell,
    approve,
    canSell,
    needsApproval,
    isPreparing: isPreparingSell,
    isApproving,
    isConfirming: isConfirmingSell,
    isWaiting: isWaitingSell,
    isSuccess: isSellSuccess,
    isError: isSellError,
    error: sellError,
    hash: sellHash,
    approvalHash,
    reset: resetSell,
  } = sellTokensResult

  // Enhanced debug sell state with data freshness tracking
  useEffect(() => {
    if (activeTab === 'sell') {
      const now = new Date().toISOString()

      console.log(`=== ENHANCED SELL DEBUG @ ${now} ===`, {
        // Basic transaction info
        amount,
        expectedBNBAmount,
        minBNBAmount,
        slippage,

        // Transaction state
        needsApproval,
        canSell,
        isPreparingSell,
        isApproving,
        isConfirmingSell,
        isWaitingSell,
        approvalHash,
        sellHash,

        // User balances
        userBalances: {
          tokenBalance: tokenBalance ? formatEther(tokenBalance.value) : '0',
          bnbBalance: bnbBalance ? formatEther(bnbBalance.value) : '0',
        },

        // Pool state with freshness indicators
        poolState: bondingCurve
          ? {
              collectedBNB: formatEther(bondingCurve.collectedBNB),
              availableTokens: formatEther(bondingCurve.availableTokens),
              virtualBNBReserve: formatEther(bondingCurve.virtualBNBReserve),
              virtualTokenReserve: formatEther(
                bondingCurve.virtualTokenReserve
              ),
              k: bondingCurve.k.toString(),
              // Calculate pool health ratio
              liquidityRatio:
                (
                  (parseFloat(formatEther(bondingCurve.collectedBNB)) /
                    parseFloat(formatEther(bondingCurve.virtualBNBReserve))) *
                  100
                ).toFixed(2) + '%',
              dataFingerprint: bondingCurve.k.toString().slice(-8), // Last 8 chars of k as data fingerprint
            }
          : 'Loading...',

        // Trade timing info

        // Error information
        errors: {
          sellError: sellError?.message || sellError,
          bondingCurveError: bondingCurveError?.message || bondingCurveError,
        },

        // Critical liquidity check
        liquidityCheck:
          bondingCurve && expectedBNBAmount
            ? {
                expectedBNBWei: parseEther(expectedBNBAmount).toString(),
                availableBNBWei: bondingCurve.collectedBNB.toString(),
                hasEnoughLiquidity:
                  parseEther(expectedBNBAmount) <= bondingCurve.collectedBNB,
                liquidityShortfall:
                  parseEther(expectedBNBAmount) > bondingCurve.collectedBNB
                    ? formatEther(
                        parseEther(expectedBNBAmount) -
                          bondingCurve.collectedBNB
                      )
                    : '0',
              }
            : 'Calculating...',
      })

      // Special warnings
      if (bondingCurve && expectedBNBAmount) {
        const expectedBNBBigInt = parseEther(expectedBNBAmount)
        if (expectedBNBBigInt > bondingCurve.collectedBNB) {
          console.error('🚨 CRITICAL: Insufficient pool liquidity detected!', {
            trying_to_get: expectedBNBAmount + ' BNB',
            pool_only_has: formatEther(bondingCurve.collectedBNB) + ' BNB',
            shortfall:
              formatEther(expectedBNBBigInt - bondingCurve.collectedBNB) +
              ' BNB',
          })
        }
      }
    }
  }, [
    activeTab,
    amount,
    expectedBNBAmount,
    minBNBAmount,
    slippage,
    needsApproval,
    canSell,
    isPreparingSell,
    isApproving,
    isConfirmingSell,
    isWaitingSell,
    approvalHash,
    sellHash,
    tokenBalance,
    bnbBalance,
    bondingCurve,
    bondingCurveError,
    sellError,
  ])

  // Handle successful transactions
  useEffect(() => {
    if (isBuySuccess) {
      notify.success(
        t('transactionSuccess'),
        t('buySuccess', { amount: amount, token: actualTokenSymbol })
      )
      setAmount('')
      resetBuy()
      // Refetch balances and bonding curve after a short delay to ensure blockchain state is updated
      // Clear previous timeout if exists
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current)
      }
      refetchTimeoutRef.current = setTimeout(() => {
        refetchBnbBalance()
        refetchTokenBalance()
        refetchBondingCurve() // Force refresh bonding curve after successful buy
        refetchTimeoutRef.current = null
      }, 1000)
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current)
        refetchTimeoutRef.current = null
      }
    }
  }, [
    isBuySuccess,
    amount,
    actualTokenSymbol,
    resetBuy,
    t,
    refetchBnbBalance,
    refetchTokenBalance,
    refetchBondingCurve,
  ])

  useEffect(() => {
    if (isSellSuccess) {
      notify.success(
        t('transactionSuccess'),
        t('sellSuccess', { amount: amount, token: actualTokenSymbol })
      )
      setAmount('')
      resetSell()
      // Refetch balances and bonding curve after a short delay to ensure blockchain state is updated
      // Clear previous timeout if exists
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current)
      }
      refetchTimeoutRef.current = setTimeout(() => {
        refetchBnbBalance()
        refetchTokenBalance()
        refetchBondingCurve() // Force refresh bonding curve after successful sell
        refetchTimeoutRef.current = null
      }, 1000)
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current)
        refetchTimeoutRef.current = null
      }
    }
  }, [
    isSellSuccess,
    amount,
    actualTokenSymbol,
    resetSell,
    t,
    refetchBnbBalance,
    refetchTokenBalance,
    refetchBondingCurve,
  ])

  // Handle approval success - notify user to manually sell
  useEffect(() => {
    if (!needsApproval && approvalHash) {
      notify.success(t('approvalSuccess'), t('approvalSuccessMessage'))
    }
  }, [needsApproval, approvalHash, t])

  // Handle errors
  useEffect(() => {
    if (isBuyError && buyError) {
      notify.error(t('transactionFailed'), buyError.message || t('tryAgain'))
    }
  }, [isBuyError, buyError, t])

  useEffect(() => {
    if (isSellError && sellError) {
      notify.error(t('transactionFailed'), sellError.message || t('tryAgain'))
    }
  }, [isSellError, sellError, t])

  // Handle favorite toggle with optimistic updates
  const handleFavoriteToggle = async () => {
    if (!tokenData?.data?.id) {
      notify.error('Error', 'Token ID not found')
      return
    }

    const currentFavoriteStatus = tokenData.data.isFavorite
    const tokenId = tokenData.data.id

    // Show optimistic feedback immediately
    const optimisticMessage = currentFavoriteStatus
      ? 'Removing from favorites...'
      : 'Adding to favorites...'

    notify.info('Processing', optimisticMessage)

    try {
      if (currentFavoriteStatus) {
        // Remove from favorites
        await unfavoriteTokenMutation.mutateAsync({ tokenId })
      } else {
        // Add to favorites
        await favoriteTokenMutation.mutateAsync({ tokenId })
      }

      // Refetch token data to update the UI
      refetchTokenData()
    } catch (error: any) {
      console.error('Favorite toggle error:', error)
      notify.error(
        'Error',
        error?.message || 'Failed to update favorite status'
      )
    }
  }

  // Handle trade button click
  const handleTrade = async () => {
    if (!isConnected) {
      openConnectModal?.()
      return
    }

    if (!isTokenLaunched) {
      notify.warning(t('tradingNotAvailable'), t('waitForLaunch'))
      return
    }

    if (!amount || parseFloat(amount) === 0) {
      notify.warning(t('invalidAmount'), t('enterValidAmount'))
      return
    }

    if (!bondingCurve) {
      notify.warning(t('loadingData'), t('waitForBondingCurve'))
      return
    }

    try {
      if (activeTab === 'buy') {
        console.log('Buy attempt:', {
          tokenAddress,
          amount,
          minTokenAmount,
          canBuy,
          isPreparingBuy,
          buyError,
          buyTokensResult,
        })
        if (canBuy) {
          await buy()
        } else if (buyError) {
          // Show specific error message if available
          notify.error(
            t('cannotBuy'),
            buyError.message || t('checkBalanceAndAmount')
          )
        } else if (!tokenAddress) {
          notify.warning(t('cannotBuy'), 'Invalid token address')
        } else if (parseFloat(minTokenAmount) <= 0) {
          notify.warning(
            t('cannotBuy'),
            'Minimum token amount must be greater than 0'
          )
        } else {
          notify.warning(t('cannotBuy'), t('checkBalanceAndAmount'))
        }
      } else {
        // === SELL OPERATION ===
        console.log('🔄 Starting sell operation with fresh data refresh...')

        // Force refresh bonding curve data before sell to ensure we have latest state
        console.log('🔄 Forcing bonding curve refresh before sell...')
        await refetchBondingCurve()

        // Wait a moment for the data to be updated
        await new Promise((resolve) => {
          const timeoutId = setTimeout(resolve, 500)
          // Store timeout ID for potential cleanup (though this is in async function)
          // In practice, this is fine as it's awaited and won't cause memory leak
        })

        // Validate amount doesn't exceed balance for sell
        if (tokenBalance) {
          const tokenBalanceFormatted = formatEther(tokenBalance.value)
          if (parseFloat(amount) > parseFloat(tokenBalanceFormatted)) {
            console.error('❌ User token balance insufficient')
            notify.error(t('insufficientBalance'), t('amountExceedsBalance'))
            return
          }
          console.log('✅ User token balance check passed')
        }

        // Check pool BNB liquidity with fresh data
        if (bondingCurve && expectedBNBAmount) {
          const expectedBNBBigInt = parseEther(expectedBNBAmount)
          const availableBNB = bondingCurve.collectedBNB
          const buffer = availableBNB / BigInt(100) // 1% buffer for safety

          console.log('🔍 Pool liquidity check:', {
            expectedBNB: formatEther(expectedBNBBigInt),
            availableBNB: formatEther(availableBNB),
            bufferBNB: formatEther(buffer),
            hasEnoughWithBuffer: expectedBNBBigInt <= availableBNB - buffer,
          })

          if (expectedBNBBigInt > availableBNB - buffer) {
            const maxSellableBNB = formatEther(availableBNB - buffer)
            console.error('❌ Pool BNB liquidity insufficient')
            notify.error(
              'Insufficient Pool Liquidity',
              `Pool can only provide ~${maxSellableBNB} BNB. Try selling less tokens.`
            )
            return
          }
          console.log('✅ Pool liquidity check passed')
        }

        // Execute sell operation with fresh data validation
        if (needsApproval) {
          console.log('🔄 Approval required, initiating...')
          notify.info(t('approvalRequired'), t('approvingTokens'))
          await approve()
        } else if (canSell && !isConfirmingSell && !isWaitingSell) {
          // Final validation with the most recent bonding curve data
          console.log('🔍 Final validation before sell execution...')
          await refetchBondingCurve()

          // Use the current bondingCurve state which should be updated after refetch
          if (bondingCurve) {
            // Recalculate expected BNB with the latest bonding curve data
            try {
              const freshCalculation = calculateBNBAmountOutDirect({
                tokenIn: amount,
                curve: bondingCurve,
              })

              const freshExpectedBNB = freshCalculation.bnbAmount
              const latestAvailableBNB = bondingCurve.collectedBNB

              console.log('🔍 Final liquidity check with fresh calculation:', {
                originalExpectedBNB: expectedBNBAmount,
                freshExpectedBNB: formatEther(freshExpectedBNB),
                latestAvailableBNB: formatEther(latestAvailableBNB),
                hasEnoughLiquidity: freshExpectedBNB <= latestAvailableBNB,
                dataFingerprint: bondingCurve.k.toString().slice(-8),
                calculationDifference: expectedBNBAmount
                  ? (
                      parseFloat(formatEther(freshExpectedBNB)) -
                      parseFloat(expectedBNBAmount)
                    ).toFixed(6)
                  : 'N/A',
              })

              if (freshExpectedBNB > latestAvailableBNB) {
                const availableBNB = formatEther(latestAvailableBNB)
                const neededBNB = formatEther(freshExpectedBNB)
                console.error(
                  '❌ Final check: Pool BNB insufficient with fresh calculation'
                )
                notify.error(
                  'Pool Liquidity Insufficient',
                  `Pool has ${availableBNB} BNB, but transaction needs ${neededBNB} BNB. Try a smaller amount.`
                )
                return
              }

              // If the calculation differs significantly from the original, warn the user
              if (expectedBNBAmount) {
                const originalBNB = parseFloat(expectedBNBAmount)
                const freshBNB = parseFloat(formatEther(freshExpectedBNB))
                const difference =
                  Math.abs(freshBNB - originalBNB) / originalBNB

                if (difference > 0.05) {
                  // 5% difference threshold
                  console.warn('⚠️ Significant price change detected:', {
                    originalBNB: originalBNB.toFixed(6),
                    freshBNB: freshBNB.toFixed(6),
                    changePercent: (difference * 100).toFixed(2) + '%',
                  })
                  notify.warning(
                    'Price Changed',
                    `Expected BNB changed from ${originalBNB.toFixed(4)} to ${freshBNB.toFixed(4)} due to market movement`
                  )
                }
              }
            } catch (error: any) {
              console.error('❌ Fresh calculation failed:', error)
              if (error.message?.includes('Insufficient BNB liquidity')) {
                notify.error(
                  'Pool Liquidity Insufficient',
                  'Pool does not have enough BNB for this transaction. Try a smaller amount.'
                )
                return
              }
              // If calculation fails for other reasons, continue with original logic
              console.warn(
                '⚠️ Using original calculation due to fresh calculation error'
              )
            }
          }

          console.log('🔄 Executing sell transaction with validated data...')
          await sell()
        } else if (isConfirmingSell || isWaitingSell) {
          console.log('⏳ Transaction already in progress, waiting...')
          notify.info(
            'Transaction in Progress',
            'Please wait for the current transaction to complete'
          )
        } else {
          console.error('❌ Cannot sell - transaction not ready', {
            canSell,
            needsApproval,
            isConfirmingSell,
            isWaitingSell,
            isPreparingSell,
          })
          notify.warning(t('cannotSell'), t('checkBalanceAndAmount'))
        }
      }
    } catch (error: any) {
      console.error('Trade error:', error)

      // Parse specific error types for better user feedback
      if (
        error.message?.includes('0xf4d678b8') ||
        error.message?.includes('InsufficientBalance')
      ) {
        notify.error(
          'Insufficient Balance',
          'Not enough tokens or BNB in pool to complete transaction'
        )
      } else if (error.message?.includes('missing trie node')) {
        notify.error(
          'Network Sync Issue',
          'Blockchain node is syncing. Please try again in a moment.'
        )
      } else {
        notify.error(t('transactionFailed'), error?.message || t('tryAgain'))
      }
    }
  }

  // Determine if currently processing a transaction
  const isProcessing = useMemo(() => {
    if (isBondingCurveLoading) {
      return true
    }
    if (activeTab === 'buy') {
      return isPreparingBuy || isConfirmingBuy || isWaitingBuy
    } else {
      return isPreparingSell || isApproving || isConfirmingSell || isWaitingSell
    }
  }, [
    activeTab,
    isBondingCurveLoading,
    isPreparingBuy,
    isConfirmingBuy,
    isWaitingBuy,
    isPreparingSell,
    isApproving,
    isConfirmingSell,
    isWaitingSell,
  ])

  // Get button text based on connection and transaction status
  const getButtonText = () => {
    if (!isConnected) {
      return t('connectWallet')
    }

    if (!isTokenLaunched) {
      return t('waitingForLaunch')
    }

    if (isBondingCurveLoading) {
      return t('loadingData')
    }

    if (activeTab === 'buy') {
      if (isPreparingBuy) return t('preparing')
      if (isConfirmingBuy) return t('confirmInWallet')
      if (isWaitingBuy) return t('processing')
      return t('buyButton', { token: actualTokenSymbol })
    } else {
      if (
        needsApproval &&
        !isApproving &&
        !isConfirmingSell &&
        !isWaitingSell
      ) {
        return t('approveButton', { token: actualTokenSymbol })
      }
      if (isPreparingSell) return t('preparing')
      if (isApproving) return t('approving')
      if (isConfirmingSell) return t('confirmInWallet')
      if (isWaitingSell) return t('processing')
      return t('sellButton', { token: actualTokenSymbol })
    }
  }

  return (
    <div className={cn('flex h-full flex-col gap-2', className)}>
      {/* Trading Section */}
      <div className="flex flex-col rounded-lg bg-[#181A20] p-4">
        {/* Tab Switcher */}
        <div className="relative mb-4 flex h-10 rounded bg-[#30353E] p-1">
          {/* Active Tab Background */}
          <div
            className={cn(
              'absolute top-1 h-8 rounded transition-all duration-200',
              activeTab === 'sell'
                ? 'right-1 left-1/2 bg-gradient-to-r from-[#F84638] to-[#D32F2F] text-white hover:from-[#F84638]/90 hover:to-[#D32F2F]/90'
                : 'right-1/2 left-1 bg-gradient-to-r from-[#2EBD85] to-[#009F61] text-white hover:from-[#2EBD85]/90 hover:to-[#009F61]/90'
            )}
          />

          {/* Buy Tab */}
          <button
            onClick={() => {
              setActiveTab('buy')
              setAmount('') // Clear amount when switching tabs
              setPercentage(0) // Reset percentage
            }}
            className={cn(
              'relative z-10 flex-1 text-sm font-normal transition-colors',
              activeTab === 'buy' ? 'text-white' : 'text-[#798391]'
            )}
          >
            {t('buy')}
          </button>

          {/* Sell Tab */}
          <button
            onClick={() => {
              setActiveTab('sell')
              setAmount('') // Clear amount when switching tabs
              setPercentage(0) // Reset percentage
            }}
            className={cn(
              'relative z-10 flex-1 text-sm font-normal transition-colors',
              activeTab === 'sell' ? 'text-white' : 'text-[#798391]'
            )}
          >
            {t('sell')}
          </button>
        </div>

        {/* Amount Input Section */}
        <div className="mb-0.5">
          <label className="mb-1 block text-sm text-white">{t('amount')}</label>
          <div className="flex h-10 items-center rounded-t-md bg-[#20252E] px-3">
            <input
              type="text"
              placeholder={t('enterAmount')}
              value={amount}
              onChange={(e) => {
                // Always allow number input, regardless of wallet connection
                const value = e.target.value.replace(/[^0-9.]/g, '')

                // Check if it's a valid number format
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  // Check decimal places - allow typing but limit to 5 decimal places
                  const parts = value.split('.')
                  if (parts.length === 2 && parts[1].length > 5) {
                    // Truncate to 5 decimal places if user types more
                    const truncated = `${parts[0]}.${parts[1].slice(0, 5)}`
                    setAmount(truncated)
                  } else {
                    // Validate against balance for sell tab only if wallet is connected
                    if (
                      isConnected &&
                      activeTab === 'sell' &&
                      tokenBalance &&
                      value !== ''
                    ) {
                      const tokenBalanceFormatted = formatEther(
                        tokenBalance.value
                      )
                      if (
                        parseFloat(value) > parseFloat(tokenBalanceFormatted)
                      ) {
                        // If amount exceeds balance, set to max balance
                        setAmount(truncateToDecimals(tokenBalanceFormatted, 5))
                        notify.warning(
                          t('amountExceedsBalance'),
                          t('settingToMaxBalance')
                        )
                      } else {
                        setAmount(value)
                      }
                    } else {
                      // Always allow setting the amount if wallet not connected or other cases
                      setAmount(value)
                    }
                  }
                  setPercentage(0) // Reset percentage when manually entering
                }
              }}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[#798391] focus:outline-none"
              disabled={!isTokenLaunched}
            />
            <div className="flex items-center gap-1.5">
              {activeTab === 'buy' ? (
                <>
                  <div className="relative h-5 w-5">
                    <Image
                      src="/assets/images/bnb-icon.svg"
                      alt="BNB"
                      fill
                      className="rounded-full"
                    />
                  </div>
                  <span className="text-sm text-white">BNB</span>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative h-5 w-5">
                    <Image
                      src={actualTokenLogo}
                      alt={actualTokenSymbol}
                      fill
                      className="rounded-full"
                    />
                  </div>
                  <span className="text-sm text-white">
                    {actualTokenSymbol}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Percentage Selector */}
        <div className="mb-4 flex h-6 gap-0.5">
          {percentageOptions.map((value, index) => (
            <button
              key={value}
              onClick={() => handlePercentageClick(value)}
              disabled={!isTokenLaunched}
              className={cn(
                'flex flex-1 items-center justify-center text-sm text-[#B7BDC6] transition-colors',
                percentage === value ? 'bg-[#30353E]' : 'bg-[#202630]',
                index === 0 && 'rounded-bl',
                index === percentageOptions.length - 1 && 'rounded-br',
                !isTokenLaunched && 'cursor-not-allowed opacity-50'
              )}
            >
              {value}%
            </button>
          ))}
        </div>

        {/* Trading Info */}
        <div className="mb-4 space-y-2">
          {/* Available Balance */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#798391]">{t('available')}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-white">
                {isConnected
                  ? isBalanceLoading || isTokenBalanceLoading
                    ? 'Loading...'
                    : availableBalance
                  : '0'}
              </span>
            </div>
          </div>

          {/* Expected to Receive */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#798391]">
              {t('expectedReceive')}
            </span>
            <span className="text-xs text-white">
              {amount && bondingCurve
                ? activeTab === 'buy'
                  ? isCalculatingBuy || isBondingCurveLoading
                    ? 'Calculating...'
                    : `${expectedTokenAmount || '0'} ${actualTokenSymbol}`
                  : isCalculatingSell || isBondingCurveLoading
                    ? 'Calculating...'
                    : `${expectedBNBAmount || '0'} BNB`
                : '0'}
            </span>
          </div>

          {/* Minimum Received */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#798391]">{t('minReceived')}</span>
            <span className="text-xs text-white">
              {amount && bondingCurve
                ? activeTab === 'buy'
                  ? `${minimumReceived} ${actualTokenSymbol}`
                  : `${minimumReceived} BNB`
                : '0'}
            </span>
          </div>

          {/* MEV Protection & Slippage */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#798391]">
                {t('mevProtection')}
              </span>
              <Switch
                checked={mevProtection}
                onCheckedChange={(checked) => {
                  if (handleConnectWalletPrompt()) return
                  setMevProtection(checked)
                }}
                disabled={!isTokenLaunched}
                className="data-[state=checked]:bg-[#2EBD85] data-[state=unchecked]:bg-[#111319]"
              />
            </div>

            {/* Slippage Control */}
            <div className="relative" ref={slippageRef}>
              <div className="flex h-8 w-[106px] items-center rounded-md border border-[#2B3139] bg-[#30353E]">
                <span className="font-din-pro px-[11px] text-xs font-normal text-white">
                  {t('slippage')}
                </span>
                <div className="h-[30px] w-px bg-[#2B3139]" />
                <button
                  className="flex flex-1 items-center justify-center px-2"
                  onClick={() => {
                    if (handleConnectWalletPrompt()) return
                    setIsEditingSlippage(!isEditingSlippage)
                  }}
                  disabled={!isTokenLaunched}
                >
                  <span className="font-din-pro text-sm font-normal text-white">
                    {Number.isInteger(slippage)
                      ? slippage
                      : slippage.toFixed(1)}
                    %
                  </span>
                </button>
              </div>

              {/* Slippage Dropdown */}
              {isEditingSlippage && isConnected && (
                <div className="absolute top-9 right-0 z-10 w-[140px] rounded-md border border-[#2B3139] bg-[#30353E] p-2">
                  <div className="space-y-1">
                    {[0.5, 1, 2, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setSlippage(value)
                          setCustomSlippage('')
                          setIsEditingSlippage(false)
                        }}
                        className={cn(
                          'font-din-pro w-full rounded px-2 py-1 text-left text-sm text-white hover:bg-[#3A3F4A]',
                          slippage === value &&
                            !customSlippage &&
                            'bg-[#3A3F4A]'
                        )}
                      >
                        {value}%
                      </button>
                    ))}
                    <div className="mt-1 border-t border-[#2B3139] pt-1">
                      <div className="flex items-center gap-1">
                        <FloatInput
                          value={customSlippage}
                          onChange={(value) => {
                            // Update custom slippage input
                            setCustomSlippage(value.toString())

                            // Update actual slippage value in real-time
                            if (value === '' || value === 0) {
                              // Don't update slippage if empty or 0
                              return
                            }

                            const numValue =
                              typeof value === 'number'
                                ? value
                                : parseFloat(value.toString())
                            if (!isNaN(numValue) && numValue > 0) {
                              // Clamp value between 0.1 and 50
                              const clampedValue = Math.min(
                                Math.max(numValue, 0.1),
                                50
                              )
                              setSlippage(clampedValue)
                            }
                          }}
                          onBlur={(value) => {
                            if (value > 0) {
                              const clampedValue = Math.min(
                                Math.max(value, 0.1),
                                50
                              )
                              setSlippage(clampedValue)
                              setCustomSlippage(clampedValue.toString())
                            } else {
                              // Clear custom value and reset to default
                              setCustomSlippage('')
                              setSlippage(5)
                            }
                          }}
                          onFocus={() => {
                            // When focusing, set the current slippage as custom value if not already set
                            if (!customSlippage) {
                              setCustomSlippage(slippage.toString())
                            }
                          }}
                          min={0.1}
                          max={50}
                          placeholder={t('custom')}
                          className="flex-1"
                          inputClassName="h-7 bg-[#20252E] border-0 font-din-pro text-sm text-white placeholder:text-[#798391] focus:ring-0"
                          allowEmpty={true}
                          clearOnFocus={false}
                          formatOnBlur={true}
                        />
                        <span className="font-din-pro text-sm text-white">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Trade Button */}
        <Button
          onClick={handleTrade}
          disabled={
            isProcessing ||
            (!isConnected && !openConnectModal) ||
            (isConnected && !isTokenLaunched)
          }
          className={cn(
            'mt-10 h-10 w-full rounded-md text-base font-normal transition-all',
            !isConnected
              ? 'bg-[#BFFB06] text-black hover:bg-[#BFFB06]/90'
              : !isTokenLaunched
                ? 'cursor-not-allowed bg-[#798391] text-white opacity-60'
                : activeTab === 'buy'
                  ? 'bg-gradient-to-r from-[#2EBD85] to-[#009F61] text-white hover:from-[#2EBD85]/90 hover:to-[#009F61]/90'
                  : needsApproval &&
                      !isApproving &&
                      !isConfirmingSell &&
                      !isWaitingSell
                    ? 'bg-gradient-to-r from-[#FFA500] to-[#FF8C00] text-white hover:from-[#FFA500]/90 hover:to-[#FF8C00]/90'
                    : 'bg-gradient-to-r from-[#F84638] to-[#D32F2F] text-white hover:from-[#F84638]/90 hover:to-[#D32F2F]/90',
            isProcessing && 'cursor-wait opacity-60'
          )}
        >
          {getButtonText()}
        </Button>
      </div>

      {/* Bonding Curve Progress Section */}
      <BondingCurveProgress
        className="flex-1 rounded-lg"
        progress={
          tokenData?.data ? parseFloat(tokenData.data.progressPct) * 100 : 0
        }
        raised={tokenData?.data ? parseFloat(tokenData.data.bnbCurrent) : 0}
        target={tokenData?.data ? parseFloat(tokenData.data.bnbTarget) : 0}
      />

      {/* Periodic Burning Section - Only show for launchMode 4 */}
      {tokenData?.data?.launchMode === 4 && (
        <PeriodicBurning className="rounded-lg" />
      )}

      {/* Creator Info Section */}
      <CreatorInfo
        className="flex-1 rounded-lg"
        creatorName={tokenData?.data?.symbol}
        creatorAvatar={tokenData?.data?.logo}
        description={tokenData?.data?.description}
        heatCount={tokenData?.data?.sortPoints || 0}
        marginAmount={tokenData?.data?.marketCap || '0'}
        isFavorite={tokenData?.data?.isFavorite || false}
        onFavoriteToggle={handleFavoriteToggle}
      />

      {/* Holders Info Section */}
      <HoldersInfo
        className="flex-1 rounded-lg"
        tokenAddress={tokenAddress}
        totalSupply={tokenData?.data?.totalSupply}
      />
    </div>
  )
}
