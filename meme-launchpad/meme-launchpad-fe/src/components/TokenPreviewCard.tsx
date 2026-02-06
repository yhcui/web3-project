'use client'

import Image from 'next/image'
import { MoreHorizontal } from 'lucide-react'

interface TokenPreviewCardProps {
  id: string
  tokenName: string
  tokenSymbol: string
  tokenImage: string | null
  bannerImage?: string | null
  description: string
  tags: string[]
  currentVolume: string
  percentageComplete: number
  percentageChange: string
  launchTime: string
  isVerified?: boolean
  commentCount: number
  fireCount: number
}

export function TokenPreviewCard({
  tokenName,
  tokenSymbol,
  tokenImage,
  bannerImage,
  description,
  tags,
  currentVolume,
  percentageComplete,
  percentageChange,
  launchTime,
  isVerified,
  commentCount,
  fireCount,
}: TokenPreviewCardProps) {
  return (
    <div className="group relative h-[295px] w-[280px] cursor-pointer overflow-hidden rounded-[20px] border border-[#2B3139] bg-[#111319] transition-all duration-300 hover:border-[]">
      {/* Background Image Banner */}
      {bannerImage && (
        <div className="absolute top-0 left-0 h-[89px] w-full overflow-hidden rounded-t-[20px] opacity-10">
          <Image src={bannerImage} alt="" fill className="object-cover" />
          {/* Gradient Overlay - matching Figma */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#111319] to-[#11131900]" />
        </div>
      )}

      {/* Token Image */}
      <div className="relative z-10 mt-6 ml-6 h-[64px] w-[64px]">
        {tokenImage ? (
          <Image
            src={tokenImage}
            alt={tokenName}
            fill
            className="rounded-lg object-cover"
          />
        ) : (
          <div className="h-full w-full rounded-lg bg-[#252832]" />
        )}
      </div>

      {/* Launch Time Badge - positioned on the right side */}
      <div className="absolute top-14 right-0 z-10 h-8 w-[191px] overflow-hidden">
        <div className="relative h-full w-full">
          {/* Gradient background - matching Figma design */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#11131970] to-[#BBC6EA] opacity-10" />
          {/* Text */}
          <div className="absolute inset-0 flex items-center justify-end pr-[7px]">
            <span className="font-din-pro text-[10px] leading-[12px] font-normal tracking-[-0.02em] text-white/70">
              {launchTime}
            </span>
          </div>
        </div>
      </div>

      {/* Top Right Badges */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {/* Comment Badge */}
        <div className="flex h-6 items-center gap-[2px] rounded-[40px] border border-[#282D3599] bg-[#1113199A] px-[10px]">
          <div className="flex h-3 w-3 items-center justify-center">
            <Image
              src="/assets/images/comment-icon.svg"
              alt="Comments"
              width={11}
              height={10}
              className="text-[]"
            />
          </div>
          <span className="font-din-pro text-xs leading-[18px] font-normal text-white/80">
            {commentCount}
          </span>
        </div>

        {/* Fire Badge */}
        <div className="flex h-6 items-center gap-[2px] rounded-[40px] border border-[#282D3599] bg-[#1113199A] px-[10px]">
          <div className="flex h-3 w-3 items-center justify-center">
            <Image
              src="/assets/images/fire-icon.svg"
              alt="Fire"
              width={7}
              height={10}
              className="text-[#F69414]"
            />
          </div>
          <span className="font-din-pro text-xs leading-[18px] font-normal text-[#F69414]">
            {fireCount}
          </span>
        </div>

        {/* More Options */}
        <button className="ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#2B3139] bg-[#111319A3] opacity-[0.64] transition-opacity hover:opacity-100">
          <MoreHorizontal className="h-[8.57px] w-[8.57px] text-white/80" />
        </button>
      </div>

      {/* Token Info */}
      <div className="relative z-10 mt-3 px-6">
        <div className="flex items-center gap-[6px]">
          <h3 className="font-din-pro text-lg leading-5 font-bold tracking-[-0.02em] text-[#F0F1F5]">
            {tokenSymbol}
          </h3>
          {isVerified && (
            <Image
              src="/assets/images/trending-crown-56586a.png"
              alt="Rank 1"
              width={22}
              height={22}
              className=""
            />
          )}
        </div>
        <p className="font-din-pro mt-1 text-xs leading-4 font-normal tracking-[-0.02em] text-[#F0F1F5]/40">
          {tokenName}
        </p>
      </div>

      {/* Description */}
      <div className="relative z-10 mt-6 px-6">
        <p className="font-din-pro line-clamp-2 text-sm leading-5 font-normal text-white/80">
          {description}
        </p>

        {/* Tags */}
        <div className="mt-2 flex gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="font-din-pro flex h-6 items-center rounded-[40px] border border-[#2B3139] bg-[#111319A3] px-3 text-xs leading-4 font-normal text-white/80"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Progress Bar and Stats */}
      <div className="absolute right-6 bottom-6 left-6">
        <div className="flex items-center justify-between">
          <span className="font-din-pro text-sm leading-5 font-bold text-[#F0F1F5]">
            {currentVolume}
          </span>
          <span className="font-din-pro text-xs leading-5 font-normal text-[]">
            {percentageComplete}% / {percentageChange}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[#474D57]/20">
          <div
            className="h-full rounded-full bg-[] transition-all duration-300"
            style={{ width: `${percentageComplete}%` }}
          />
        </div>
      </div>
    </div>
  )
}
