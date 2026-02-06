'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { IconsSortIcon, IconsFilterIcon } from '../icons/generated'
import { useTradeList } from '@/api/endpoints/trade'
import { useTokenData } from '@/providers/TokenDataProvider'
import { type TradeItem, type TokenDetail } from '@/api/schemas/trade.schema'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useTradeData } from '@/hooks/useTokenWebSocket'
import type { TradeUpdate } from '@/lib/websocket/kline/schemas'
import { ChatRoom } from './ChatRoom'

interface TransactionItem {
  date: string
  fundraisingProgress?: string
  fundraisingStatus?: string
  direction: 'buy' | 'sell'
  valueUsdt: string | '-'
  bnb: string
  token: string
  address: string
  vipLevel?: number | string
  transactionHash?: string
}

interface TransactionListProps {
  tokenAddress: string
  tokenId?: number
  className?: string
}

// Helper function to convert number to subscript
const toSubscript = (num: number): string => {
  const subscriptMap: { [key: string]: string } = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉',
  }
  return num
    .toString()
    .split('')
    .map((digit) => subscriptMap[digit] || digit)
    .join('')
}

// Helper function to format price/amount with subscript notation for zeros
const formatWithSubscript = (
  value: string | number,
  prefix: string = ''
): string => {
  if (!value || value === '0' || value === '-') return value.toString()

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue) || numValue === 0) return '0'

  // Convert to string with enough precision
  let priceStr = numValue.toFixed(18)

  // Remove trailing zeros
  priceStr = priceStr.replace(/\.?0+$/, '')

  // Check if we need to use subscript notation
  if (priceStr.includes('.')) {
    const parts = priceStr.split('.')
    const decimalPart = parts[1]

    // Count leading zeros in decimal part
    const leadingZeros = decimalPart.match(/^0+/)
    if (leadingZeros && leadingZeros[0].length >= 2) {
      // Use subscript notation for multiple zeros
      const zeroCount = leadingZeros[0].length
      const significantDigits = decimalPart.substring(zeroCount)
      // Limit significant digits for display
      const displayDigits = significantDigits.substring(0, 6)
      return `${prefix}${parts[0]}.0${toSubscript(zeroCount)}${displayDigits}`
    } else {
      // For numbers without many leading zeros, show normal format
      const displayValue =
        numValue < 1 ? numValue.toFixed(6) : numValue.toFixed(5)
      return `${prefix}${displayValue.replace(/\.?0+$/, '')}`
    }
  }

  // For whole numbers
  return `${prefix}${numValue.toFixed(2).replace(/\.?0+$/, '')}`
}

// Wrapper for price formatting with dollar sign
const formatPriceWithSubscript = (value: string | number): string => {
  return formatWithSubscript(value, '$')
}

const VipBadge = ({ level }: { level: number }) => {
  return (
    <Image
      src={`/assets/images/vip/vip-${level}.png`}
      alt={`VIP ${level}`}
      width={32}
      height={16}
      className="h-4 w-8 object-contain"
    />
  )
}

const getValueTierIcon = (value: string | '-') => {
  if (value === '-' || value === '0') {
    return '/assets/images/token-page/trading/rock.png'
  }

  const numValue = parseFloat(value.replace(',', ''))

  if (numValue < 100) {
    return '/assets/images/token-page/trading/rock.png'
  } else if (numValue < 1000) {
    return '/assets/images/token-page/trading/crystal.png'
  } else if (numValue < 3000) {
    return '/assets/images/token-page/trading/gem.png'
  } else if (numValue < 10000) {
    return '/assets/images/token-page/trading/diamond.png'
  } else {
    return '/assets/images/token-page/trading/crown.png'
  }
}

type SortField = 'date' | 'direction' | 'valueUsdt' | 'bnb' | 'token'
type SortOrder = 'asc' | 'desc' | null

type ValueTier = 'rock' | 'crystal' | 'gem' | 'diamond' | 'crown'

export function TransactionList({
  tokenAddress,
  tokenId,
  className,
}: TransactionListProps) {
  const t = useTranslations('Token.TransactionList')
  const [activeTab, setActiveTab] = useState<'transactions' | 'chat'>(
    'transactions'
  )
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<ValueTier[]>([])
  const filterRef = useRef<HTMLDivElement>(null)

  // Get shared token data from provider
  const {
    tokenData: tokenDetailFromProvider,
    isLoading: tokenDetailLoading,
    error: tokenDetailError,
  } = useTokenData()
  const tokenDetailData = tokenDetailFromProvider
    ? { data: tokenDetailFromProvider }
    : null

  // Helper function to calculate min/max USD amounts from selected filters
  const getFilterRange = (filters: ValueTier[]) => {
    if (filters.length === 0) return { min: undefined, max: undefined }

    let min = Number.MAX_VALUE
    let max = 0

    filters.forEach((tier) => {
      switch (tier) {
        case 'rock':
          min = Math.min(min, 0)
          max = Math.max(max, 100)
          break
        case 'crystal':
          min = Math.min(min, 100)
          max = Math.max(max, 1000)
          break
        case 'gem':
          min = Math.min(min, 1000)
          max = Math.max(max, 3000)
          break
        case 'diamond':
          min = Math.min(min, 3000)
          max = Math.max(max, 10000)
          break
        case 'crown':
          min = Math.min(min, 10000)
          max = Math.max(max, Number.MAX_VALUE)
          break
      }
    })

    return {
      min: min === Number.MAX_VALUE ? undefined : min,
      max: max === Number.MAX_VALUE ? undefined : max === 0 ? undefined : max,
    }
  }

  // Map component sort field to API orderBy parameter
  const mapSortFieldToApi = (field: SortField | null) => {
    switch (field) {
      case 'date':
        return 'create_at'
      case 'direction':
        return 'event_type'
      case 'valueUsdt':
        return 'usd_amount'
      case 'bnb':
        return 'bnb_amount'
      case 'token':
        return 'token_amount'
      default:
        return undefined
    }
  }

  const filterRange = getFilterRange(selectedFilters)
  const apiOrderBy = mapSortFieldToApi(sortField)

  // Fetch trading history
  const {
    data: tradeListData,
    isLoading: tradeListLoading,
    error: tradeListError,
  } = useTradeList({
    tokenAddress,
    pn: 1, // page number
    ps: 50, // page size - Get more transactions to show
    ...(apiOrderBy && { orderBy: apiOrderBy as any }),
    ...(sortOrder !== null && { orderDesc: sortOrder === 'desc' }),
    ...(filterRange.min !== undefined && { minUsdAmount: filterRange.min }),
    ...(filterRange.max !== undefined &&
      filterRange.max !== Number.MAX_VALUE && {
        maxUsdAmount: filterRange.max,
      }),
  })

  // Subscribe to real-time trade updates
  const { trades: realtimeTrades } = useTradeData(tokenAddress)

  // Clean up trades on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      // This will be handled by the hook itself now
    }
  }, [])

  // Helper function to convert Wei to Ether (18 decimals)
  const weiToEther = (weiValue: string): string => {
    if (!weiValue || weiValue === '0') return '0'

    // Remove any non-numeric characters except decimal point
    const cleanValue = weiValue.replace(/[^0-9]/g, '')

    // Pad with zeros if necessary
    const paddedValue = cleanValue.padStart(19, '0') // 18 decimals + at least 1 for integer part

    // Insert decimal point
    const etherValue = paddedValue.slice(0, -18) + '.' + paddedValue.slice(-18)

    // Parse and format to remove leading zeros and trailing zeros
    const parsed = parseFloat(etherValue)

    // Format based on value size
    if (parsed === 0) return '0'
    if (parsed >= 1) return parsed.toFixed(6)
    if (parsed >= 0.0001) return parsed.toFixed(8)
    return parsed.toFixed(18).replace(/\.?0+$/, '')
  }

  // Helper function to format timestamp to time string
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // Helper function to calculate fundraising progress
  const calculateFundraisingProgress = (tokenDetail: TokenDetail) => {
    const bnbCurrent = parseFloat(tokenDetail.bnbCurrent)
    const bnbTarget = parseFloat(tokenDetail.bnbTarget)

    if (bnbTarget > 0) {
      const progressPct = (bnbCurrent / bnbTarget) * 100
      const timeLeft = '24h' // This could be calculated from launch time if available
      return `$${bnbCurrent.toLocaleString()}/${timeLeft}`
    }
    return undefined
  }

  // Check if we should show fundraising column
  const tokenDetail = tokenDetailFromProvider
  const shouldShowFundraisingColumn = tokenDetail?.launchMode === 3

  // Helper function to convert WebSocket trade to TransactionItem
  const mapWebSocketTradeToTransaction = (
    trade: TradeUpdate['data']['data'],
    tokenDetail?: TokenDetail
  ): TransactionItem => {
    // Parse USDT value from vol field (already in USDT)
    const usdtValue = parseFloat(trade.vol || '0')

    // Determine which address to show based on trade side
    const displayAddress = trade.side === 'buy' ? trade.buyer : trade.seller

    // Format address - ensure it's a valid ethereum address format
    const formatAddress = (addr: string | undefined): string => {
      if (!addr) return '0x0000...0000'

      // Check if it's a valid ethereum address (starts with 0x and has 42 chars)
      if (addr.startsWith('0x') && addr.length === 42) {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
      }

      // If address is malformed or too long, truncate it safely
      const cleanAddr = addr.startsWith('0x') ? addr : `0x${addr}`
      const maxLength = 42
      const truncated =
        cleanAddr.length > maxLength ? cleanAddr.slice(0, maxLength) : cleanAddr

      return `${truncated.slice(0, 6)}...${truncated.slice(-4)}`
    }

    // Format BNB and Token amounts (might be in Wei or raw format)
    const formatAmount = (
      amount: string | undefined,
      decimals: number = 6
    ): string => {
      if (!amount || amount === '0') return '0'

      const num = parseFloat(amount)
      if (isNaN(num)) return '0'

      // If the number is very large (likely Wei), convert it
      if (num > 1e15) {
        // Assume it's in Wei (18 decimals)
        return (num / 1e18).toFixed(decimals)
      }

      // Otherwise, just format it normally
      return num.toFixed(decimals)
    }

    return {
      date: trade.timestamp
        ? new Date(trade.timestamp * 1000).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : '00:00:00',
      fundraisingProgress:
        shouldShowFundraisingColumn && tokenDetail
          ? calculateFundraisingProgress(tokenDetail)
          : undefined,
      fundraisingStatus:
        shouldShowFundraisingColumn &&
        tokenDetail &&
        parseFloat(tokenDetail.progressPct || '0') >= 100
          ? t('fundraisingComplete')
          : undefined,
      direction: trade.side === 'buy' ? ('buy' as const) : ('sell' as const),
      valueUsdt: usdtValue > 0 ? usdtValue.toFixed(2) : '0',
      bnb: formatAmount(trade.quoteQty, 6),
      token: formatAmount(trade.quantity, 2),
      address: formatAddress(displayAddress),
      transactionHash: trade.txHash,
      vipLevel:
        usdtValue > 10000
          ? 1
          : usdtValue > 3000
            ? 2
            : usdtValue > 1000
              ? 3
              : usdtValue > 100
                ? 4
                : usdtValue > 500
                  ? 5
                  : undefined,
    }
  }

  // Map API data to component format
  const mapApiDataToTransactions = (): TransactionItem[] => {
    if (
      !tradeListData?.data?.result ||
      !Array.isArray(tradeListData.data.result)
    )
      return []

    return tradeListData.data.result.map((trade: TradeItem) => {
      // Convert Wei to Ether for BNB and Token amounts
      const bnbEther = trade.bnbAmount ? weiToEther(trade.bnbAmount) : '0'
      const tokenEther = trade.tokenAmount ? weiToEther(trade.tokenAmount) : '0'

      // Use usdAmount from API if available, otherwise fallback to calculation
      let usdtValue = 0
      if (trade.usdAmount) {
        // Parse the usdAmount from the API
        usdtValue = parseFloat(trade.usdAmount)
      } else {
        // Fallback: Calculate USDT value using hardcoded BNB price (for backward compatibility)
        const bnbPrice = 600 // Fallback BNB price
        const bnbAmount = parseFloat(bnbEther)
        usdtValue = bnbAmount * bnbPrice
      }

      return {
        date: trade.blockTimestamp
          ? formatTimestamp(trade.blockTimestamp)
          : '00:00:00',
        fundraisingProgress:
          shouldShowFundraisingColumn && tokenDetail
            ? calculateFundraisingProgress(tokenDetail)
            : undefined,
        fundraisingStatus:
          shouldShowFundraisingColumn &&
          tokenDetail &&
          parseFloat(tokenDetail.progressPct || '0') >= 100
            ? t('fundraisingComplete')
            : undefined,
        direction:
          trade.tradeType === 10 ? ('buy' as const) : ('sell' as const),
        valueUsdt: usdtValue > 0 ? usdtValue.toFixed(2) : '0',
        bnb: bnbEther,
        token: tokenEther,
        address: trade.userAddress
          ? `${trade.userAddress.slice(0, 4)}···${trade.userAddress.slice(-5)}`
          : '0x···',
        transactionHash: trade.transactionHash,
        // VIP level based on USD amount
        vipLevel:
          usdtValue > 10000
            ? 1
            : usdtValue > 3000
              ? 2
              : usdtValue > 1000
                ? 3
                : usdtValue > 100
                  ? 4
                  : usdtValue > 500
                    ? 5
                    : undefined,
      }
    })
  }

  // Get transactions from API or fallback to mock data
  const apiTransactions = useMemo(
    () => mapApiDataToTransactions(),
    [tradeListData, shouldShowFundraisingColumn, tokenDetail]
  )

  // Convert real-time trades to transaction items
  const realtimeTransactions = useMemo(
    () =>
      realtimeTrades.map((trade) =>
        mapWebSocketTradeToTransaction(trade, tokenDetail || undefined)
      ),
    [realtimeTrades, tokenDetail]
  )

  // Merge real-time trades with API data (real-time first, avoid duplicates)
  const mergedTransactions = useMemo(() => {
    const txHashSet = new Set<string>()
    const result: TransactionItem[] = []

    // Add real-time transactions first
    for (const tx of realtimeTransactions) {
      if (tx.transactionHash && !txHashSet.has(tx.transactionHash)) {
        txHashSet.add(tx.transactionHash)
        result.push(tx)
      }
    }

    // Add API transactions that aren't duplicates
    for (const tx of apiTransactions) {
      if (tx.transactionHash && !txHashSet.has(tx.transactionHash)) {
        txHashSet.add(tx.transactionHash)
        result.push(tx)
      }
    }

    // Limit to 100 transactions to prevent excessive DOM nodes
    return result.slice(0, 100)
  }, [realtimeTransactions, apiTransactions])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilter(false)
      }
    }

    if (showFilter) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilter])

  const handleCopyAddress = (address: string) => {
    // In a real app, this would copy the full address to clipboard
    navigator.clipboard.writeText(address)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: null -> desc -> asc -> null
      if (sortOrder === null) {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortOrder('asc')
      } else {
        setSortOrder(null)
        setSortField(null)
        return
      }
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getSortIconColor = (field: SortField, position: 'up' | 'down') => {
    if (sortField !== field) return '#798391'
    if (sortOrder === 'desc' && position === 'down') return '#FBD537'
    if (sortOrder === 'asc' && position === 'up') return '#FBD537'
    return '#798391'
  }

  const toggleFilter = (tier: ValueTier) => {
    setSelectedFilters((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    )
  }

  // Use merged data (real-time + API)
  // No need for client-side filtering since it's handled server-side
  const transactions = mergedTransactions

  const filterOptions = [
    { tier: 'rock' as ValueTier, label: t('filter.rock'), range: '<$100' },
    {
      tier: 'crystal' as ValueTier,
      label: t('filter.crystal'),
      range: '$100-$1k',
    },
    { tier: 'gem' as ValueTier, label: t('filter.gem'), range: '$1k-$3k' },
    {
      tier: 'diamond' as ValueTier,
      label: t('filter.diamond'),
      range: '$3k-$10k',
    },
    { tier: 'crown' as ValueTier, label: t('filter.crown'), range: '>$10k' },
  ]

  // Show error state
  if (tradeListError || tokenDetailError) {
    console.error('Error fetching transaction data:', {
      tradeListError,
      tokenDetailError,
    })
    // Continue with mock data for graceful degradation
  }

  return (
    <div className={cn('rounded-lg bg-[#17191D]', className)}>
      {/* Tab Navigation */}
      <div className="flex h-[42px] items-center border-b border-[#333B47] px-4">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('transactions')}
            className="relative flex flex-col items-center"
          >
            <span
              className={cn(
                'text-base font-bold',
                activeTab === 'transactions' ? 'text-white' : 'text-[#798391]'
              )}
            >
              {t('tabs.transactions')}
            </span>
            {activeTab === 'transactions' && (
              <div className="absolute bottom-0 left-1/2 h-[3px] w-[14px] -translate-x-1/2 bg-[#FBD537]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className="relative flex flex-col items-center"
          >
            <span
              className={cn(
                'text-base font-bold',
                activeTab === 'chat' ? 'text-white' : 'text-[#798391]'
              )}
            >
              {t('tabs.chatRoom')}
            </span>
            {activeTab === 'chat' && (
              <div className="absolute bottom-0 left-1/2 h-[3px] w-[14px] -translate-x-1/2 bg-[#FBD537]" />
            )}
          </button>
        </div>
      </div>

      {/* Table Headers */}
      {activeTab === 'transactions' && (
        <div className="px-4 py-2">
          <div
            className={cn(
              'grid items-center gap-2 text-xs text-[#798391]',
              shouldShowFundraisingColumn
                ? 'grid-cols-[70px_110px_50px_120px_80px_100px_1fr]'
                : 'grid-cols-[70px_50px_120px_120px_150px_1fr]'
            )}
          >
            <button
              onClick={() => handleSort('date')}
              className="flex items-center justify-center gap-1 hover:text-white"
            >
              <span>{t('headers.date')}</span>
              <div className="flex flex-col">
                <IconsSortIcon
                  size={4}
                  color={getSortIconColor('date', 'up')}
                />
                <IconsSortIcon
                  size={4}
                  color={getSortIconColor('date', 'down')}
                  className="rotate-180"
                />
              </div>
            </button>
            {shouldShowFundraisingColumn && (
              <div className="text-center">
                {t('headers.fundraisingProgress')}
              </div>
            )}
            <button
              onClick={() => handleSort('direction')}
              className="flex items-center justify-center gap-1 hover:text-white"
            >
              <span>{t('headers.direction')}</span>
              <div className="flex flex-col">
                <IconsSortIcon
                  size={4}
                  color={getSortIconColor('direction', 'up')}
                />
                <IconsSortIcon
                  size={4}
                  color={getSortIconColor('direction', 'down')}
                  className="rotate-180"
                />
              </div>
            </button>
            <div
              ref={filterRef}
              className="relative flex items-center justify-center gap-1"
            >
              <button
                onClick={() => handleSort('valueUsdt')}
                className="flex items-center gap-1 hover:text-white"
              >
                <span>{t('headers.valueUsdt')}</span>
                <div className="flex flex-col">
                  <IconsSortIcon
                    size={4}
                    color={getSortIconColor('valueUsdt', 'up')}
                  />
                  <IconsSortIcon
                    size={4}
                    color={getSortIconColor('valueUsdt', 'down')}
                    className="rotate-180"
                  />
                </div>
              </button>
              <button
                className="flex items-center hover:opacity-80"
                onClick={() => setShowFilter(!showFilter)}
              >
                <IconsFilterIcon
                  size={10}
                  color={selectedFilters.length > 0 ? '#FBD537' : '#798391'}
                />
              </button>

              {/* Filter Dropdown */}
              {showFilter && (
                <div className="absolute top-8 right-0 z-50 w-44 rounded-md border border-[#2B3139] bg-[#181A20] p-3 shadow-lg">
                  {filterOptions.map((option) => (
                    <div
                      key={option.tier}
                      className="flex items-center gap-2 py-2 text-xs text-white hover:opacity-80"
                    >
                      <button
                        onClick={() => toggleFilter(option.tier)}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border',
                            selectedFilters.includes(option.tier)
                              ? 'border-[#FBD537] bg-[#FBD537]'
                              : 'border-[#4F5867] bg-[#30353E]'
                          )}
                        >
                          {selectedFilters.includes(option.tier) && (
                            <svg
                              width="10"
                              height="8"
                              viewBox="0 0 10 8"
                              fill="none"
                            >
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="#000"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </div>
                        <Image
                          src={`/assets/images/token-page/trading/${option.tier}.png`}
                          alt={option.tier}
                          width={20}
                          height={20}
                          className="h-5 w-5"
                        />
                        <span>
                          {option.label}({option.range})
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleSort('bnb')}
              className="flex items-center justify-center gap-1 hover:text-white"
            >
              <span>BNB</span>
              <div className="flex flex-col">
                <IconsSortIcon size={4} color={getSortIconColor('bnb', 'up')} />
                <IconsSortIcon
                  size={4}
                  color={getSortIconColor('bnb', 'down')}
                  className="rotate-180"
                />
              </div>
            </button>
            <button
              onClick={() => handleSort('token')}
              className="flex items-center justify-center gap-1 hover:text-white"
            >
              <span>Token</span>
              <div className="flex flex-col">
                <IconsSortIcon
                  size={4}
                  color={getSortIconColor('token', 'up')}
                />
                <IconsSortIcon
                  size={4}
                  color={getSortIconColor('token', 'down')}
                  className="rotate-180"
                />
              </div>
            </button>
            <div className="text-center">{t('headers.account')}</div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="max-h-[620px] overflow-y-scroll px-4 pb-4">
          {tradeListLoading || tokenDetailLoading ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'grid h-9 items-center gap-2 border-t border-[#333B47]/30',
                  shouldShowFundraisingColumn
                    ? 'grid-cols-[70px_110px_50px_120px_80px_100px_1fr]'
                    : 'grid-cols-[70px_50px_120px_120px_150px_1fr]'
                )}
              >
                {Array.from({
                  length: shouldShowFundraisingColumn ? 7 : 6,
                }).map((_, cellIndex) => (
                  <Skeleton key={cellIndex} className="h-4 w-full" />
                ))}
              </div>
            ))
          ) : transactions.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 text-[#798391]">
              <div className="mb-4 text-4xl">📊</div>
              <p className="text-sm">{t('noTransactions')}</p>
              <p className="mt-2 text-xs opacity-60">
                {t('transactionsWillAppearHere')}
              </p>
            </div>
          ) : (
            // Transaction list
            transactions.map((transaction: TransactionItem, index: number) => (
              <div
                key={index}
                className={cn(
                  'grid h-9 items-center gap-2 border-t border-[#333B47]/30 text-xs',
                  shouldShowFundraisingColumn
                    ? 'grid-cols-[70px_110px_50px_120px_80px_100px_1fr]'
                    : 'grid-cols-[70px_50px_120px_120px_150px_1fr]'
                )}
              >
                {/* Date */}
                <div className="text-center text-[#848E9C]">
                  {transaction.date}
                </div>

                {/* Fundraising Progress - only show if launchMode === 3 */}
                {shouldShowFundraisingColumn && (
                  <div className="text-center">
                    {transaction.fundraisingStatus ? (
                      <span className="bg-gradient-to-r from-[#F6E084] to-[] bg-clip-text text-transparent">
                        {transaction.fundraisingStatus}
                      </span>
                    ) : (
                      <span className="text-white">
                        {transaction.fundraisingProgress || '-'}
                      </span>
                    )}
                  </div>
                )}

                {/* Direction */}
                <div className="text-center">
                  <span
                    className={cn(
                      'font-normal',
                      transaction.direction === 'buy'
                        ? 'text-[#2EBD85]'
                        : 'text-[#F6465D]'
                    )}
                  >
                    {transaction.direction === 'buy' ? t('buy') : t('sell')}
                  </span>
                </div>

                {/* Value USDT */}
                <div className="flex items-center justify-center gap-1 text-white">
                  <span>{formatPriceWithSubscript(transaction.valueUsdt)}</span>
                  <Image
                    src={getValueTierIcon(transaction.valueUsdt)}
                    alt="Value tier"
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                </div>

                {/* BNB */}
                <div className="text-center text-white">
                  {formatWithSubscript(transaction.bnb)}
                </div>

                {/* Token */}
                <div className="text-center text-white">
                  {formatWithSubscript(transaction.token)}
                </div>

                {/* Account with VIP Badge */}
                <div className="flex items-center justify-end gap-1">
                  {transaction.vipLevel &&
                    typeof transaction.vipLevel === 'number' && (
                      <VipBadge level={transaction.vipLevel} />
                    )}
                  <span className="text-white">{transaction.address}</span>
                  <button
                    onClick={() => handleCopyAddress(transaction.address)}
                    className="ml-1 text-[#798391] hover:text-white"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <Link
                    href={`https://testnet.bscscan.com/tx/${transaction.transactionHash}`}
                    target="_blank"
                    className="ml-1 text-[#798391] hover:text-white"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chat Room Tab Content */}
      {activeTab === 'chat' && (
        <ChatRoom
          tokenAddress={tokenAddress}
          tokenId={tokenId}
          className="h-[690px]"
        />
      )}
    </div>
  )
}
