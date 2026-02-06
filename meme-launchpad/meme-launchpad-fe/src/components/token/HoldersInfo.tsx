'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useTokenHolders } from '@/api/endpoints/tokens'

interface HoldersInfoProps {
  className?: string
  tokenAddress?: string
  totalSupply?: string
}

export function HoldersInfo({
  className,
  tokenAddress,
  totalSupply = '1,000,000,000',
}: HoldersInfoProps) {
  const t = useTranslations('Token.HoldersInfo')

  // Fetch token holders data
  const { data: holdersData, isLoading, error } = useTokenHolders(tokenAddress)

  // Process holders data
  const processedHolders = useMemo(() => {
    if (!holdersData?.data || holdersData.data.length === 0) {
      return {
        holders: [],
        top10Percentage: 0,
      }
    }

    // Take first 10 holders
    const top10 = holdersData.data.slice(0, 10)

    // Calculate top 10 percentage
    const top10Percentage = top10.reduce((sum, holder) => {
      return sum + parseFloat(holder.percentage) * 100 // Convert to percentage
    }, 0)

    // Format holders for display
    const formattedHolders = top10.map((holder) => ({
      // Truncate address to show first 8 characters after 0x
      address: holder.address.slice(0, 10),
      // Convert percentage string to number and multiply by 100 for display
      percentage: parseFloat(holder.percentage) * 100,
    }))

    return {
      holders: formattedHolders,
      top10Percentage: top10Percentage,
    }
  }, [holdersData])

  // Format total supply with commas
  const formattedTotalSupply = useMemo(() => {
    if (!totalSupply) return '1,000,000,000'

    // Remove any existing commas and parse number
    const num = parseFloat(totalSupply.replace(/,/g, ''))
    if (isNaN(num)) return totalSupply

    // Format with commas
    return num.toLocaleString('en-US')
  }, [totalSupply])

  return (
    <div className={cn('bg-[#181A20]', className)}>
      {/* Header with Total Supply */}
      <div className="relative flex h-[42px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm leading-[22px] font-bold text-white">
            {t('totalSupply')}
          </span>
          <span className="text-sm leading-[22px] font-normal text-[#798391]">
            {formattedTotalSupply}
          </span>
        </div>

        {/* Icon Button */}
        <button className="flex h-6 items-center justify-center gap-2 rounded-[48px] border border-[#333B47] bg-[#30353E] px-3 py-1">
          <div className="relative h-3 w-3">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Three circles forming a triangle pattern */}
              <circle cx="8.625" cy="3.375" r="3.375" fill="#FBD537" />
              <circle cx="3" cy="6.75" r="2.25" fill="#FBD537" />
              <circle cx="8.25" cy="9.75" r="1.5" fill="#FBD537" />
            </svg>
          </div>
        </button>
      </div>

      {/* Holders Section */}
      <div className="px-4 pt-2 pb-4">
        {/* Holders Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs leading-5 font-normal text-[#798391]">
              {t('holders')}
            </span>
            <span className="text-xs leading-5 font-normal text-white">
              (
              {t('top10', {
                percentage: processedHolders.top10Percentage.toFixed(2),
              })}
              )
            </span>
          </div>
          <span className="text-xs leading-5 font-normal text-[#798391]">
            {t('percentage')}
          </span>
        </div>

        {/* Divider */}
        <div className="mb-4 h-px w-full bg-[#333B47]" />

        {/* Holders List */}
        <div className="flex flex-col gap-2">
          {isLoading ? (
            // Loading state
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-[#798391]">Loading holders...</span>
            </div>
          ) : error ? (
            // Error state
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-[#798391]">
                Failed to load holders
              </span>
            </div>
          ) : processedHolders.holders.length === 0 ? (
            // Empty state
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-[#798391]">No holders found</span>
            </div>
          ) : (
            // Display holders
            processedHolders.holders.map((holder, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm leading-[22px] font-normal text-white">
                  {holder.address}
                </span>
                <span className="text-sm leading-[22px] font-normal text-[#FBD537]">
                  {holder.percentage.toFixed(3)}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
