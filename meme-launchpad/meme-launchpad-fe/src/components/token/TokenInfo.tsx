'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Copy } from 'lucide-react'
import { XIcon } from '../icons/generated'
import { TelegramIcon } from '../icons/generated/icons/TelegramIcon'
import ReactECharts from 'echarts-for-react'
import { useTokenDetailNew } from '@/api/endpoints/trade'
import { Skeleton } from '@/components/ui/skeleton'

interface TokenInfoProps {
  tokenAddress: string
  className?: string
}

// Note: mockData labels will be replaced with translations in the data mapping
const mockData = {
  symbol: 'PEPE',
  name: 'PEPE(Pepe)',
  image: '/assets/images/placeholder-token.svg',
  description: '$PEPE是一种meme币',
  rank: 31,
  marketCap: 60.07,
  marketCapUnit: '亿',
  circulatingSupply: 4206900.0,
  circulatingSupplyUnit: '亿 PEPE',
  launchDate: '2023-04-14',
  fullyDilutedMarketCap: 7165.56,
  fullyDilutedMarketCapUnit: '万',
  totalSupply: 100,
  totalSupplyUnit: '亿',
  marketCapFDVRatio: 100,
  idoAmount: 60.07,
  idoAmountUnit: '亿',
  idoDate: '2023-04-14',
  withdrawalAddresses: 8.1,
  withdrawalAddressesUnit: '万',
  contractAddress: '0x69...1933',
  contractChain: 'ETH',
  website: 'https://www.pepe.vip/',
  explorer: 'https://etherscan.io/token',
  socialMedia: [
    { platform: 'Twitter', url: 'https://twitter.com/pepecoin' },
    { platform: 'Telegram', url: 'https://t.me/pepecoin' },
  ],
  tokenDistribution: [
    { label: '流动池', percentage: 50, color: '#2394FF' },
    { label: '社区建设', percentage: 14.5, color: '#29FFAB' },
    { label: '空投', percentage: 14.5, color: '#FFDC41' },
    { label: '团队第一期奖励', percentage: 10, color: '#00DCFD' },
    { label: '其他', percentage: 11, color: '#666666' },
  ],
}

export function TokenInfo({ tokenAddress, className }: TokenInfoProps) {
  const t = useTranslations('Token.TokenInfo')

  // Create mock data with internationalized units
  const createMockData = () => ({
    ...mockData,
    description: `$${mockData.symbol}${t('defaultDescription')}`,
    marketCapUnit: t('units.yi'),
    circulatingSupplyUnit: `${t('units.yi')} ${mockData.symbol}`,
    fullyDilutedMarketCapUnit: t('units.wan'),
    totalSupplyUnit: t('units.yi'),
    idoAmountUnit: t('units.yi'),
    withdrawalAddressesUnit: t('units.wan'),
  })

  // Fetch token details from API
  const {
    data: apiData,
    isLoading,
    error,
  } = useTokenDetailNew({ tokenAddress })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  // Map API data to component format
  const data = apiData?.data
    ? {
        symbol: apiData.data.symbol,
        name: `${apiData.data.symbol}(${apiData.data.name})`,
        image: apiData.data.logo,
        description:
          apiData.data.description ||
          `$${apiData.data.symbol}${t('defaultDescription')}`, // TODO: Add description to API
        rank: apiData.data.sortPoints || 31, // Using sortPoints as proxy for rank
        marketCap: parseFloat(apiData.data.marketCapUsdt) / 100000000, // Convert to 亿
        marketCapUnit: t('units.yi'),
        circulatingSupply: 4206900.0, // TODO: Not available from API
        circulatingSupplyUnit: `${t('units.yi')} ${apiData.data.symbol}`,
        launchDate: '2023-04-14', // TODO: Not available from API
        fullyDilutedMarketCap: 7165.56, // TODO: Not available from API
        fullyDilutedMarketCapUnit: t('units.wan'),
        totalSupply: 100, // TODO: Not available from API
        totalSupplyUnit: t('units.yi'),
        marketCapFDVRatio: 100, // TODO: Calculate from actual data
        idoAmount: 60.07, // TODO: Not available from API
        idoAmountUnit: t('units.yi'),
        idoDate: '2023-04-14', // TODO: Not available from API
        withdrawalAddresses: apiData.data.holdersCount / 10000, // Convert to 万
        withdrawalAddressesUnit: t('units.wan'),
        contractAddress: tokenAddress,
        contractChain: 'BSC', // We know it's BSC from the project
        website: apiData.data.website || 'https://www.example.com/',
        explorer: `https://bscscan.com/token/${tokenAddress}`,
        socialMedia: [
          ...(apiData.data.twitter
            ? [{ platform: 'Twitter' as const, url: apiData.data.twitter }]
            : []),
          ...(apiData.data.telegram
            ? [{ platform: 'Telegram' as const, url: apiData.data.telegram }]
            : []),
        ],
        tokenDistribution: [
          { label: t('liquidityPool'), percentage: 50, color: '#2394FF' },
          { label: t('communityBuilding'), percentage: 14.5, color: '#29FFAB' },
          { label: t('airdrop'), percentage: 14.5, color: '#FFDC41' },
          { label: t('teamFirstReward'), percentage: 10, color: '#00DCFD' },
          { label: t('other'), percentage: 11, color: '#666666' },
        ], // TODO: Not available from API, keeping mock data
      }
    : {
        ...createMockData(),
        tokenDistribution: [
          { label: t('liquidityPool'), percentage: 50, color: '#2394FF' },
          { label: t('communityBuilding'), percentage: 14.5, color: '#29FFAB' },
          { label: t('airdrop'), percentage: 14.5, color: '#FFDC41' },
          { label: t('teamFirstReward'), percentage: 10, color: '#00DCFD' },
          { label: t('other'), percentage: 11, color: '#666666' },
        ],
      }

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className={cn('h-full overflow-y-auto bg-[#191B22]', className)}>
        <div className="flex gap-[60px] p-4">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    console.error('Error fetching token details:', error)
  }

  // Format contract address for display
  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  return (
    <div className={cn('h-full overflow-y-auto bg-[#191B22]', className)}>
      <div className="flex gap-[60px] p-4">
        <div className="w-1/2">
          {/* Token Header */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-5 overflow-hidden rounded-full">
              <Image
                src={data.image}
                alt={data.symbol}
                width={20}
                height={20}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-base text-white">{data.symbol}</span>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            {/* Rank */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-[#656A79]">
                <span>{t('rank')}</span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g transform="translate(3.5, 2.5)">
                    <rect
                      x="6.5"
                      y="8"
                      width="4"
                      height="11.35"
                      fill="url(#gradient1)"
                      rx="0.25"
                    />
                    <rect
                      x="0"
                      y="12.54"
                      width="4"
                      height="6.81"
                      fill="url(#gradient1)"
                      rx="0.25"
                    />
                    <rect
                      x="13"
                      y="11.25"
                      width="4"
                      height="7.95"
                      fill="url(#gradient1)"
                      rx="0.25"
                    />
                    <rect
                      x="5.5"
                      y="0"
                      width="6"
                      height="6"
                      fill="url(#gradient1)"
                      rx="0.25"
                    />
                  </g>
                  <defs>
                    <linearGradient
                      id="gradient1"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#F6E084" />
                      <stop offset="100%" stopColor="" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-white">No. {data.rank}</span>
              </div>
            </div>

            {/* Market Cap */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#656A79]">{t('marketCap')}</span>
              <span className="text-sm text-white">
                ${data.marketCap.toFixed(2)}
                {data.marketCapUnit}
              </span>
            </div>

            {/* Circulating Supply */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#656A79]">
                {t('circulatingSupply')}
              </span>
              <span className="text-sm text-white">
                {data.circulatingSupply.toLocaleString('zh-CN')}
                {data.circulatingSupplyUnit}
              </span>
            </div>

            {/* Launch Date */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#656A79]">{t('launchDate')}</span>
              <span className="text-sm text-white">{data.launchDate}</span>
            </div>

            {/* Fully Diluted Market Cap */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#656A79]">
                {t('fullyDilutedMarketCap')}
              </span>
              <span className="text-sm text-white">
                ${data.fullyDilutedMarketCap}
                {data.fullyDilutedMarketCapUnit}
              </span>
            </div>

            {/* Total Supply */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#656A79]">{t('totalSupply')}</span>
              <span className="text-sm text-white">
                {data.totalSupply}
                {data.totalSupplyUnit}
              </span>
            </div>

            {/* Market Cap / FDV */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#656A79]">
                {t('marketCapFDVRatio')}
              </span>
              <span className="text-sm text-white">
                {data.marketCapFDVRatio}%
              </span>
            </div>

            {/* IDO Amount */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#656A79]">{t('idoAmount')}</span>
              <span className="text-sm text-white">
                ${data.idoAmount}
                {data.idoAmountUnit}
              </span>
            </div>

            {/* IDO Date */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#656A79]">{t('idoDate')}</span>
              <span className="text-sm text-white">{data.idoDate}</span>
            </div>

            {/* Withdrawal Addresses */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#656A79]">
                {t('withdrawalAddresses')}
              </span>
              <span className="text-sm text-white">
                {data.withdrawalAddresses.toFixed(1)}
                {data.withdrawalAddressesUnit}
              </span>
            </div>

            {/* Contract Address */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#656A79]">
                {t('contractAddress')}
              </span>
              <div className="flex items-center gap-1">
                <div className="h-[19px] w-[19px] overflow-hidden rounded-xl">
                  <Image
                    src="/assets/images/bsc-chain-icon.svg"
                    alt={data.contractChain}
                    width={19}
                    height={19}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-sm text-white">
                  {formatAddress(data.contractAddress)}
                </span>
                <button
                  onClick={() => copyToClipboard(data.contractAddress)}
                  className="text-[#656A79] transition-colors hover:text-white"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
            <p className="mt-8 text-xs text-[#656A79]">{t('disclaimer')}</p>
          </div>
        </div>

        <div className="w-1/2">
          {/* Token Name */}
          <h2 className="mb-4 text-base font-bold text-white">{data.name}</h2>

          {/* Token Description */}
          <p className="mb-6 text-sm text-white">{data.description}</p>
          {/* More Information Section */}
          <div className="mt-8">
            <h3 className="mb-4 text-base font-bold text-white">
              {t('moreInfo')}
            </h3>

            <div className="mb-4 flex gap-10">
              {' '}
              {/* Website */}
              <div className="min-w-0 flex-1">
                <div className="mb-2 text-sm text-[#656A79]">
                  {t('website')}
                </div>
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm break-all text-white transition-colors hover:text-[#BFFB06]"
                >
                  {data.website}
                </a>
              </div>
              {/* Blockchain Explorer */}
              <div className="min-w-0 flex-1">
                <div className="mb-2 text-sm text-[#656A79]">
                  {t('blockchainExplorer')}
                </div>
                <a
                  href={data.explorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm break-all text-white transition-colors hover:text-[#BFFB06]"
                >
                  {data.explorer}
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div className="mb-6">
              <div className="mb-2 text-sm text-[#656A79]">
                {t('socialMedia')}
              </div>
              <div className="flex gap-4">
                {data.socialMedia.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-[42px] border border-[#2B3139] px-3 py-2 transition-colors hover:border-[#BFFB06]"
                  >
                    <div className="flex h-4 w-4 items-center justify-center rounded-lg bg-[#252832]">
                      {social.platform === 'Twitter' ? (
                        <XIcon className="h-4 w-4 text-white" />
                      ) : (
                        <TelegramIcon className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className="text-xs text-white">
                      {social.platform}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
          {/* Token Distribution Section */}
          <div className="mt-8">
            <h3 className="mb-4 text-base font-bold text-white">
              {t('tokenDistribution')}
            </h3>

            <div className="flex gap-8">
              {/* Pie Chart */}
              <div className="relative mx-auto mb-4 h-[143px] w-[143px]">
                <ReactECharts
                  style={{ height: '143px', width: '143px' }}
                  option={{
                    tooltip: {
                      trigger: 'item',
                      backgroundColor: '#191B22',
                      borderColor: '#2B3139',
                      textStyle: {
                        color: '#fff',
                        fontSize: 12,
                      },
                      formatter: '{b}: {c}%',
                    },
                    series: [
                      {
                        name: 'Token Distribution',
                        type: 'pie',
                        radius: ['40%', '90%'],
                        avoidLabelOverlap: false,
                        padAngle: 2,
                        itemStyle: {
                          borderRadius: 4,
                          borderWidth: 1,
                          borderColor: '#191B22',
                        },
                        label: {
                          show: false,
                          position: 'center',
                        },
                        emphasis: {
                          label: {
                            show: false,
                          },
                          scale: false,
                        },
                        labelLine: {
                          show: false,
                        },
                        data: data.tokenDistribution.map((item) => ({
                          value: item.percentage,
                          name: item.label,
                          itemStyle: {
                            color: item.color,
                          },
                        })),
                      },
                    ],
                  }}
                  opts={{ renderer: 'svg' }}
                />
              </div>

              {/* Distribution Legend */}
              <div className="space-y-2">
                {data.tokenDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-white">
                      {item.percentage}% {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
