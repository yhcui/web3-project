'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { PopoverContent } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { StarIcon } from '@/components/ui/star-icon'

interface Token {
  id: string
  symbol: string
  name: string
  logo: string
  marketCap: string
  marketCapUsdt: string
  price: string
  priceChange: number
  burnProgress?: number
  isBurning?: boolean
  fireCount?: number
  checkCount?: number
  isSelected?: boolean
  countdownTime?: {
    hours: number
    minutes: number
    seconds: number
  }
}

interface TokenSelectorPopoverProps {
  onSelect?: (token: Token) => void
  currentTokenAddress?: string
}

const tabs = [
  { id: 'favorites', label: 'favorites' },
  { id: 'popular', label: 'popular' },
  { id: 'ready', label: 'readyToLaunch', active: true },
  { id: 'new', label: 'newCoins' },
  { id: 'nearly', label: 'nearlyFull' },
  { id: 'graduating', label: 'graduatingToday' },
]

// Mock data - replace with actual API data
const mockTokens: Token[] = [
  {
    id: '1',
    symbol: 'BTC',
    name: 'BTC',
    logo: '/assets/images/mock-trending/2-token.png',
    marketCap: '$7.5K',
    marketCapUsdt: '$8K',
    price: '$928.40',
    priceChange: 7.24,
    burnProgress: 75,
    isBurning: true,
    fireCount: 25,
    checkCount: 158,
  },
  {
    id: '2',
    symbol: 'BTC',
    name: 'BTC',
    logo: '/assets/images/mock-trending/2-token.png',
    marketCap: '$7.5K',
    marketCapUsdt: '$8K',
    price: '$928.40',
    priceChange: 7.24,
    burnProgress: 75,
    isBurning: true,
    fireCount: 25,
    checkCount: 158,
  },
  {
    id: '3',
    symbol: 'BTC',
    name: 'BTC',
    logo: '/assets/images/mock-trending/2-token.png',
    marketCap: '$7.5K',
    marketCapUsdt: '$8K',
    price: '$928.40',
    priceChange: 7.24,
    burnProgress: 75,
    isBurning: true,
    fireCount: 25,
    checkCount: 158,
    isSelected: true,
    countdownTime: {
      hours: 1,
      minutes: 2,
      seconds: 5,
    },
  },
]

function CountdownTimer({
  time,
}: {
  time: { hours: number; minutes: number; seconds: number }
}) {
  const [countdown, setCountdown] = useState(time)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        const totalSeconds =
          prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1
        if (totalSeconds <= 0) {
          clearInterval(timer)
          return { hours: 0, minutes: 0, seconds: 0 }
        }
        return {
          hours: Math.floor(totalSeconds / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60),
          seconds: totalSeconds % 60,
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [time])

  return (
    <div className="absolute inset-0 z-10">
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background:
            'linear-gradient(90deg, rgba(38, 35, 28, 0.43) 0%, rgba(255, 208, 16, 1) 100%)',
        }}
      />
      {/* Countdown timer */}
      <div className="absolute top-1/2 right-[26px] flex -translate-y-1/2 items-end gap-1">
        {/* Hours */}
        <div className="flex h-[30px] items-center justify-center gap-0.5 rounded px-0.5">
          <span className="font-din-pro text-lg font-bold text-[]">
            {countdown.hours.toString().padStart(1, '0')}
          </span>
        </div>
        <span className="font-din-pro text-xs text-white/50">H</span>

        {/* Minutes */}
        <div className="flex h-[30px] items-center justify-center gap-0.5 rounded px-0.5">
          <span className="font-din-pro text-lg font-bold text-[]">
            {countdown.minutes.toString().padStart(2, '0')}
          </span>
        </div>
        <span className="font-din-pro text-xs text-white/50">M</span>

        {/* Seconds */}
        <div className="flex h-[30px] items-center justify-center gap-0.5 rounded px-0.5">
          <span className="font-din-pro text-lg font-bold text-[]">
            {countdown.seconds.toString().padStart(2, '0')}
          </span>
        </div>
        <span className="font-din-pro text-xs text-white/50">S</span>
      </div>
    </div>
  )
}

function TokenListItem({ token }: { token: Token }) {
  return (
    <div className="relative flex h-[50px] items-center justify-between px-5 hover:bg-white/5">
      {/* Countdown timer overlay for selected token */}
      {token.isSelected && token.countdownTime && (
        <CountdownTimer time={token.countdownTime} />
      )}

      {/* Left: Token info */}
      <div className="flex items-center gap-1">
        {/* BSC Chain Icon */}
        <div className="flex size-4 items-center justify-center rounded-[6px] border border-[#333B47]">
          <StarIcon className="h-3 w-3" />
        </div>

        {/* Token Logo with Progress Circle */}
        <div className="relative">
          <svg className="absolute -inset-0.5 h-7 w-7" viewBox="0 0 28 28">
            <circle
              cx="14"
              cy="14"
              r="13"
              fill="none"
              stroke="rgba(101, 106, 121, 1)"
              strokeWidth="1.125"
            />
            {token.burnProgress && (
              <circle
                cx="14"
                cy="14"
                r="13"
                fill="none"
                stroke=""
                strokeWidth="1.125"
                strokeDasharray={`${(2 * Math.PI * 13 * token.burnProgress) / 100} ${2 * Math.PI * 13}`}
                strokeLinecap="round"
                transform="rotate(-90 14 14)"
              />
            )}
          </svg>
          <div className="relative h-[26px] w-[26px]">
            <Image
              src={token.logo}
              alt={token.symbol}
              width={26}
              height={26}
              className="rounded-full object-cover"
            />
          </div>
          {/* Burn Badge */}
          {token.isBurning && (
            <div className="absolute -right-0.5 -bottom-0.5">
              <div className="relative h-2 w-2">
                <div className="absolute inset-0 rounded-full bg-[#111319]" />
                <div className="absolute inset-0 scale-[0.8] rounded-full bg-[#FF7E1C]" />
              </div>
            </div>
          )}
        </div>

        {/* Token Symbol and Badges */}
        <div className="flex flex-col">
          <span className="font-din-pro text-xs text-white">
            {token.symbol}
          </span>
          <div className="flex items-center gap-2">
            {/* Fire badge */}
            {token.fireCount && (
              <div className="flex items-center gap-0.5">
                <div className="flex h-3 w-3 items-center justify-center rounded-[2px] bg-white">
                  <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
                    <path
                      d="M2 1L1 3.5L2 6L1 8.5M5 1L4 3.5L5 6L4 8.5"
                      stroke="#F69414"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="font-din-pro text-[10px] text-[#F69414]">
                  {token.fireCount}
                </span>
              </div>
            )}
            {/* Check badge */}
            {token.checkCount && (
              <div className="flex items-center gap-0.5">
                <div className="flex h-3 w-3 items-center justify-center rounded-[2px] bg-white">
                  <svg width="11" height="10" viewBox="0 0 11 10" fill="none">
                    <path
                      d="M0.51 5.95L3.51 8.95L10.51 0.95"
                      stroke=""
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="font-din-pro text-[10px] text-white/80">
                  {token.checkCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Market Cap */}
      {!token.countdownTime && (
        <div className="flex flex-col items-end">
          <span className="font-din-pro text-xs text-white">
            {token.marketCap}
          </span>
          <span className="font-din-pro text-xs text-[#656A79]">
            {token.marketCapUsdt}
          </span>
        </div>
      )}

      {/* Right: Price and Change */}
      {!token.countdownTime && (
        <div className="flex flex-col items-end">
          <span className="font-din-pro text-xs text-white">{token.price}</span>
          <span
            className={cn(
              'font-din-pro text-xs',
              token.priceChange >= 0 ? 'text-[#2EBD85]' : 'text-[#F6465D]'
            )}
          >
            {token.priceChange > 0 ? '+' : ''}
            {token.priceChange}%
          </span>
        </div>
      )}
    </div>
  )
}

export function TokenSelectorPopover({
  onSelect,
  currentTokenAddress,
}: TokenSelectorPopoverProps) {
  const t = useTranslations('TokenPage')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('ready')
  const [tokens, setTokens] = useState(mockTokens)

  return (
    <PopoverContent
      className="w-[400px] rounded-2xl border-0 bg-[#191B22] p-0 shadow-2xl"
      align="start"
      sideOffset={8}
    >
      <div className="flex h-[507px] flex-col">
        {/* Search Bar */}
        <div className="px-5 pt-5">
          <div className="relative">
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-md border border-[#2B3139] bg-transparent pr-10 pl-3 text-sm text-white placeholder:text-[#656A79]"
            />
            <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#B7BDC6]" />
          </div>
        </div>

        {/* Tabs */}
        <div className="relative mt-4 flex items-center px-5">
          <div className="flex gap-3 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'font-din-pro text-sm transition-colors',
                  activeTab === tab.id ? 'text-white' : 'text-[#656A79]'
                )}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>
          {/* Scroll buttons */}
          {/* <button className="absolute right-11 flex h-[22px] w-4 items-center justify-center">
            <ChevronLeft className="h-3 w-2 text-[#798391]" />
          </button>
          <button className="absolute right-5 flex h-[22px] w-4 items-center justify-center">
            <ChevronRight className="h-3 w-2 text-[#798391]" />
          </button> */}
        </div>

        {/* Header */}
        <div className="mt-4 px-5">
          <span className="font-din-pro text-xs text-[#798391]">NAME</span>
        </div>

        {/* Token List */}
        <div className="mt-3 flex-1 overflow-y-auto">
          {tokens.map((token) => (
            <TokenListItem key={token.id} token={token} />
          ))}
        </div>
      </div>
    </PopoverContent>
  )
}
