'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Ellipsis } from 'lucide-react'
import { ProgressBarRenderer } from './progress'
import { type TokenListItem } from '@/api/schemas/token.schema'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LaunchTimer } from './LaunchTimer'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { formatAmount } from '@/utils/format'

export function TrendingCard({ token }: { token: TokenListItem }) {
  const t = useTranslations('trending')
  const params = useParams()
  const locale = params.locale as string
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
          <button className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111319] opacity-[0.64] transition-opacity hover:opacity-100 md:ml-0">
            <Ellipsis size={14} className="text-white/80" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[156px] border-[#2B3139] bg-[#191B22]"
          align="end"
        >
          {availableLinks.map((link) => (
            <DropdownMenuItem
              key={link.label}
              className="cursor-pointer text-sm text-white hover:bg-[#252832]"
              onClick={() =>
                window.open(link.url, '_blank', 'noopener,noreferrer')
              }
            >
              {link.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Link href={`/${locale}/token/${token.tokenAddr}`}>
      <div className="border-box relative flex h-[348px] w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#2B3139] bg-[#111319] pb-4 transition select-none hover:border-[]">
        {/* Background Image */}
        <div className="absolute inset-x-0 top-0 h-[110px]">
          <Image
            src={token.banner || '/assets/images/trending-background.png'}
            alt=""
            fill
            className="object-cover"
            priority
            onError={(e) => {
              e.currentTarget.src = '/assets/images/trending-background.png'
            }}
          />
        </div>

        {/* Tags + More Options Button */}
        <div className="relative z-1 flex items-center gap-1 px-4 py-3">
          <div className="mr-auto flex gap-1">
            <div className="flex h-6 items-center gap-1 rounded-[40px] bg-[#111319]/64 px-2 text-white">
              <span className="text-xs font-semibold">
                🔥 {formatAmount(token.hot || 0)}
              </span>
            </div>
            {(token.tags || []).slice(0, 4).map(
              (tag) =>
                tag && (
                  <div
                    key={tag}
                    className="flex h-6 items-center rounded-[40px] bg-[#111319]/64 px-2"
                  >
                    <span className="font-din-pro text-xs font-medium text-white">
                      {tag}
                    </span>
                  </div>
                )
            )}
          </div>
          {renderLinksMenu()}
        </div>

        {/* Launch Time Banner - positioned on the right side */}
        <div className="absolute top-[110px] right-0 h-10 w-[191px] overflow-hidden">
          <LaunchTimer
            launchTime={token.launchTime || 0}
            launchMode={token.launchMode}
          />
        </div>
        {/* Token Logo */}
        <div className="mt-5 flex items-start gap-1 px-4">
          <div className="relative h-22 w-22 bg-[#111319] overflow-hidden rounded-xl border-4 border-[#111319]">
            <Image
              src={token.logo || '/assets/images/placeholder-token.svg'}
              alt={token.name}
              fill
              className="object-cover"
              onError={(e) => {  
                e.currentTarget.src = '/assets/images/placeholder-token.svg'
              }}
            />
          </div>
        </div>

        {/* Token Name */}
        <div className="mt-2 flex items-center gap-2 px-5 text-[22px] leading-6 font-bold tracking-[-0.02em] text-white">
          <span className="max-w-[80%] truncate">{token.symbol}</span>
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

        {/* Symbol */}
        <p className="mt-1 px-5 text-sm leading-4 font-normal tracking-[-0.02em] text-white/60">
          {token.name}
        </p>

        {/* Description */}
        <p className="mt-3 px-5 text-sm leading-[18px] font-normal text-white">
          {token.desc}
        </p>

        <div className="mt-auto px-5">
          <ProgressBarRenderer token={token} />
        </div>
      </div>
    </Link>
  )
}
