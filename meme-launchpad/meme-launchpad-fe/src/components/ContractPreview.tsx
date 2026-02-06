'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { RotateCcw, Loader2 } from 'lucide-react'
import { useCalculateAddress } from '@/api/endpoints/tokens'
import { useTranslations } from 'next-intl'

interface ContractPreviewProps {
  tokenName?: string
  tokenSymbol?: string
  digits?: string
  className?: string
  onAddressCalculated?: (data: {
    predictedAddress?: string
    digits?: string
  }) => void
}

export function ContractPreview({
  tokenName,
  tokenSymbol,
  digits = '', // Default empty string for digits
  className,
  onAddressCalculated,
}: ContractPreviewProps) {
  const t = useTranslations()
  const [isVisible, setIsVisible] = useState(false)
  const calculateAddressMutation = useCalculateAddress()

  // Reset the mutation when key props change (e.g., when switching tabs)
  useEffect(() => {
    calculateAddressMutation.reset()
    setIsVisible(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenName, tokenSymbol, digits])

  const handlePreviewClick = async () => {
    // If already visible and has data, just toggle visibility
    if (isVisible && calculateAddressMutation.data) {
      setIsVisible(false)
      return
    }

    // If we don't have token name or symbol, don't calculate
    if (!tokenName || !tokenSymbol) {
      setIsVisible(true)
      return
    }

    // If we already have the address, just show it
    if (calculateAddressMutation.data?.data?.predictedAddress) {
      setIsVisible(true)
      return
    }

    // Calculate the address
    try {
      const result = await calculateAddressMutation.mutateAsync({
        name: tokenName,
        symbol: tokenSymbol,
        digits: digits, // Use the digits prop (defaults to empty string)
      })
      setIsVisible(true)

      // Call the callback with the calculated data
      if (onAddressCalculated && result?.data?.predictedAddress) {
        onAddressCalculated({
          predictedAddress: result.data.predictedAddress,
          digits: digits || undefined,
        })
      }
    } catch (error) {
      console.error('Failed to calculate address:', error)
      // Still show the preview area even if calculation fails
      setIsVisible(true)
    }
  }

  const handleRefresh = async () => {
    if (!tokenName || !tokenSymbol) return

    // Reset and recalculate
    calculateAddressMutation.reset()
    const result = await calculateAddressMutation.mutateAsync({
      name: tokenName,
      symbol: tokenSymbol,
      digits: digits, // Use the digits prop (defaults to empty string)
    })

    // Call the callback with the refreshed data
    if (onAddressCalculated && result?.data?.predictedAddress) {
      onAddressCalculated({
        predictedAddress: result.data.predictedAddress,
        digits: digits || undefined,
      })
    }
  }

  // Get the predicted address or show a placeholder
  const displayAddress =
    calculateAddressMutation.data?.data?.predictedAddress ||
    (!tokenName || !tokenSymbol
      ? t('createToken.preview.enterNameAndSymbol')
      : calculateAddressMutation.error
        ? t('createToken.preview.calculationFailed')
        : '...')

  return (
    <div
      className={cn(
        'w-full rounded-lg border border-[#2B3139] bg-[#191B22] transition-all hover:border-[#BFFB06]/20',
        className
      )}
    >
      <div className="flex h-full w-full flex-col gap-4 px-4 py-6">
        {/* Click to Preview Row */}
        <div
          className="flex cursor-pointer items-center gap-[10px]"
          onClick={handlePreviewClick}
        >
          <Image
            src="/icons/preview.svg"
            alt="Shield"
            width={20}
            height={20}
            className="object-contain"
          />
          <span className="text-base font-bold text-[#BFFB06]">
            {t('createToken.preview.clickToPreview')}
          </span>
          {calculateAddressMutation.isPending && (
            <Loader2 className="ml-2 size-4 animate-spin text-[#BFFB06]" />
          )}
        </div>

        {/* Contract Address */}
        {isVisible && (
          <div className="flex w-full items-center justify-between text-base font-normal text-[#FFFFFF]">
            <span
              className={cn(
                'flex-1 break-all',
                (!tokenName ||
                  !tokenSymbol ||
                  calculateAddressMutation.error) &&
                  'text-[#656A79]'
              )}
            >
              {/* Display address with bold last 4 characters if it's a valid address */}
              {displayAddress &&
              displayAddress.startsWith('0x') &&
              displayAddress.length === 42 ? (
                <>
                  <span>{displayAddress.slice(0, -4)}</span>
                  <span className="font-bold">{displayAddress.slice(-4)}</span>
                </>
              ) : (
                displayAddress
              )}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRefresh()
              }}
              disabled={
                calculateAddressMutation.isPending || !tokenName || !tokenSymbol
              }
              className="mr-6 ml-4 flex size-6 items-center justify-center rounded-full bg-[#252832] transition-colors hover:bg-[#2B3139] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {calculateAddressMutation.isPending ? (
                <Loader2 className="size-3 animate-spin text-[#FFFFFF]" />
              ) : (
                <RotateCcw className="size-3 text-[#FFFFFF]" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
