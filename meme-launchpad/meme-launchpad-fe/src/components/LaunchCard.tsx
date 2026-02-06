'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Ellipsis } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LaunchTimer } from './LaunchTimer'
import { TokenListItem } from '@/api/schemas/token.schema'
import { ProgressBarRenderer } from './progress'
import Hot from './HotIcon'
import { formatAmount } from '@/utils/format'

interface LaunchCardProps {
  token: TokenListItem
}

export function LaunchCard({ token }: LaunchCardProps) {
  const params = useParams()
  const locale = params.locale as string

  // 安全检查，确保 token 对象存在
  if (!token) {
    return null
  }

  const renderLinksMenu = () => {
    const availableLinks = [
      { label: 'Official Website', url: token.website || '' },
      { label: 'Twitter', url: token.twitter || '' },
      { label: 'Telegram', url: token.telegram || '' },
      { label: 'Discord', url: token.discord || '' },
      {
        label: 'Whitepaper',
        url: token.whitepaper || '',
      },
      {
        label: 'Additional Link 2',
        url: token.additionalLink2 || '',
      },
    ]
      .filter((link) => {
        // 过滤掉空字符串、null、undefined 和只包含空格的字符串
        return (
          link.url &&
          link.url.trim() !== '' &&
          link.url !== 'null' &&
          link.url !== 'undefined'
        )
      })
      .map((link) => {
        // 优化链接标签显示
        let displayLabel = link.label
        if (link.label === 'Whitepaper' && token.whitepaper) {
          // Keep the label as 'Whitepaper'
          displayLabel = 'Whitepaper'
        } else if (
          link.label === 'Additional Link 2' &&
          token.additionalLink2
        ) {
          try {
            const url = new URL(token.additionalLink2)
            displayLabel = url.hostname.replace('www.', '')
          } catch {
            displayLabel = 'Link 2'
          }
        }
        return { ...link, label: displayLabel }
      })

    if (availableLinks.length === 0) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-full border border-[#2B3139] bg-[#111319A3] opacity-[0.64] transition-opacity hover:opacity-100 md:ml-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Ellipsis size={14} className="text-white/80" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[156px] border-[#2B3139] bg-[#191B22]"
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          {availableLinks.map((link) => (
            <DropdownMenuItem
              key={link.label}
              className="cursor-pointer text-sm text-white hover:bg-[#252832]"
              onClick={(e) => {
                e.stopPropagation()
                window.open(link.url, '_blank', 'noopener,noreferrer')
              }}
            >
              {link.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Link href={`/${locale}/token/${token.tokenAddr}`} className="block">
      <div className="group relative flex min-h-[295px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[#2B3139] bg-[#111319] p-3 transition-all duration-300 hover:border-[#BEFA0A] md:px-4">
        {/* Background Image Banner */}
        <div className="absolute top-0 left-0 h-[89px] w-full overflow-hidden rounded-t-[20px] opacity-10">
          <Image
            src={token.banner || '/assets/images/launch-card-bg.png'}
            alt=""
            fill
            className="object-cover"
            onError={(e) => {
              e.currentTarget.src = '/assets/images/launch-card-bg.png'
            }}
          />
          {/* Gradient Overlay - matching Figma */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111319] to-[#11131900]" />
        </div>

        {/* Top Right Badges */}
        <div className="flex items-center gap-1 md:justify-end">
          {/* Comment Badge */}
          {token.marginBnb && Number(token.marginBnb) > 0 && (
            <div className="flex h-6 items-center gap-[2px] rounded-[40px] border border-[#282D3599] bg-[#11131999] px-[10px]">
              <div className="flex h-3 w-3 items-center justify-center">
                <Image
                  src="/assets/images/comment-icon.svg"
                  alt="Comments"
                  width={11}
                  height={10}
                  className="text-[#BEFA0A]"
                />
              </div>
              <span className="text-xs leading-[18px] font-normal text-white/80">
                {formatAmount(token.marginBnb || 0)}
              </span>
            </div>
          )}

          {/* Fire Badge */}
          <div className="flex h-6 items-center gap-[2px] rounded-[40px] border border-[#282D3599] bg-[#11131999] px-[10px]">
            <Hot value={token.hot || 0} />
          </div>

          {/* More Options */}
          {renderLinksMenu()}
        </div>

        <div className="mt-2 flex items-center justify-between gap-4 md:-mt-3.5 md:items-end">
          {/* Token Image */}
          <div className="relative z-10 h-[60px] w-[60px] shrink-0 md:h-[64px] md:w-[64px]">
            <Image
              src={token.logo || '/assets/images/launch-card-bg.png'}
              alt={token.name}
              fill
              className="rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = '/assets/images/placeholder-token.svg'
              }}
            />
          </div>

          {/* Launch Time Banner - positioned on the right side */}
          <div className="-mr-3 h-12 w-[191px] overflow-hidden md:-mr-4 md:h-8">
            <LaunchTimer
              launchTime={token.launchTime || 0}
              launchMode={token.launchMode}
            />
          </div>
        </div>

        {/* Token Info */}
        <div className="relative z-10 mt-2.5">
          <div className="flex items-center gap-[6px]">
            <h3 className="max-w-[80%] truncate text-lg leading-5 font-bold tracking-[-0.02em] text-[#F0F1F5]">
              {token.symbol}
            </h3>
            {token.tokenRank != null &&
              !isNaN(Number(token.tokenRank)) &&
              Number(token.tokenRank) > 0 &&
              Number(token.tokenRank) < 7 && (
                <Image
                  src={`/assets/images/ranks/medal-${Number(token.tokenRank)}.svg`}
                  alt={`Rank ${token.tokenRank}`}
                  width={22}
                  height={22}
                />
              )}
          </div>
          <p className="font-din-pro mt-1 text-xs leading-4 font-normal tracking-[-0.02em] text-[#F0F1F5]/40">
            {token.name}
          </p>
        </div>

        {/* Description */}
        <div className="relative z-10 mt-2">
          <p className="font-din-pro line-clamp-2 text-sm leading-5 font-normal text-white/80">
            {token.desc}
          </p>
        </div>

        {/* Tags */}
        <div className="mt-2 mb-auto flex gap-1">
          {(token.tags || []).map(
            (tag) =>
              tag && (
                <span
                  key={tag}
                  className="font-din-pro flex h-6 items-center rounded-[40px] border border-[#2B3139] bg-[#111319A3] px-3 text-xs leading-4 font-normal text-white/80"
                >
                  {tag}
                </span>
              )
          )}
        </div>

        <ProgressBarRenderer token={token} className="mt-auto min-h-[48px]" />
      </div>
    </Link>
  )
}
