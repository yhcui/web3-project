'use client'
import { useTokenDetail } from '@/api/endpoints/tokens'
import BadgeLaunchMode from '@/components/BadgeLaunchMode'
import { LaunchMode } from '@/types/token'
import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function TokenInfo({
  address,
  onCoverImageChange,
  onTokenIdChange,
}: {
  address: string
  onCoverImageChange: (coverImage: string) => void
  onTokenIdChange: (tokenId: number) => void
}) {
  const handleCoverImageChange = (coverImage: string) => {
    onCoverImageChange(coverImage)
  }

  const handleTokenIdChange = (tokenId: number) => {
    onTokenIdChange(tokenId)
  }

  const { data, isLoading } = useTokenDetail(address)

  const tokenDetail = useMemo(() => {
    handleCoverImageChange(data?.data?.banner || '')
    handleTokenIdChange(data?.data?.id || 0)
    return data?.data
  }, [data])

  return (
    <div className="relative mt-4 flex items-center gap-4 overflow-hidden rounded-lg border border-[#2B3139] bg-[#15181E] p-2 text-white md:px-6 md:py-5">
      {/* 图片 */}
      <img
        src={tokenDetail?.logo || '/assets/images/placeholder-token.svg'}
        alt="logo"
        className="absolute top-1/2 left-0 z-0 h-[360px] w-[360px] -translate-y-1/2 rounded-lg"
      />
      <div className="absolute inset-0 z-10 h-full w-full bg-[linear-gradient(90deg,#15181E99_0%,#15181E_20%,#15181E_80%,#15181E_100%)]"></div>

      {/* Token 信息 */}
      <div className="relative z-10 h-20 w-20 shrink-0">
        {isLoading ? (
          <Skeleton className="h-20 w-20 rounded-lg" />
        ) : (
          <img
            src={tokenDetail?.logo || '/assets/images/placeholder-token.svg'}
            alt="logo"
            className="h-20 w-20 rounded-lg"
          />
        )}

        <BadgeLaunchMode
          className="absolute right-[-2px] bottom-[-2px]"
          value={tokenDetail?.launchMode as LaunchMode}
        />
      </div>
      <div className="relative z-10 mr-4 flex-1 space-y-2">
        {isLoading ? (
          <Skeleton className="h-6 w-30 rounded-lg" />
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-white">
              {tokenDetail?.symbol}
            </p>
            <p className="text-base text-[#ffffff]/40">{tokenDetail?.name}</p>
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-6 w-80 rounded-lg" />
        ) : (
          <p className="flex flex-col text-xs text-[#656A79] md:text-base md:text-white lg:flex-row lg:items-center">
            <span>合约地址:</span>
            <span> {address}</span>
          </p>
        )}
      </div>
      <p className="relative z-10 ml-auto text-sm text-[#656A79]">
        {tokenDetail?.description}
      </p>
    </div>
  )
}
