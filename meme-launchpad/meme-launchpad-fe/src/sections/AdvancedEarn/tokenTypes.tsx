import { ADVANCED_SORT_TYPE } from '@/enums/advanced'
import IconLatestLaunched from '@/assets/advanced/icon-latest.svg'
import IconAboutToLaunch from '@/assets/advanced/icon-launch.svg'
import IconAboutToFill from '@/assets/advanced/icon-fill.svg'
import IconHot from '@/assets/advanced/icon-hot.svg'
import IconTradingVolume from '@/assets/advanced/icon-volume.svg'
import IconMarketCap from '@/assets/advanced/icon-marketcap.svg'
import IconHolders from '@/assets/advanced/icon-holders.svg'
import IconTransactions from '@/assets/advanced/icon-transactions.svg'
import IconGraduated from '@/assets/advanced/icon-graduated.svg'
import Image from 'next/image'

export interface TokenTypeConfig {
  id: string
  icon: React.ReactNode
  titleKey: string
  sortKey?: string
  statusKey?: string
  progressColor?: string
  value?: number
}

export const TOKEN_TYPES: TokenTypeConfig[] = [
  {
    id: 'latest-launched',
    icon: (
      <Image src={IconLatestLaunched} className="w-5" alt="latest-launched" />
    ),
    titleKey: 'tokenTypes.latestLaunched',
    sortKey: 'newest',
    statusKey: 'launched',
    progressColor: '',
    value: ADVANCED_SORT_TYPE.LATEST_LAUNCHED,
  },
  {
    id: 'about-to-launch',
    icon: (
      <Image src={IconAboutToLaunch} className="w-5" alt="about-to-launch" />
    ),
    titleKey: 'tokenTypes.aboutToLaunch',
    sortKey: 'newest',
    statusKey: 'upcoming',
    progressColor: '#ff7f3a',
    value: ADVANCED_SORT_TYPE.ABOUT_TO_LAUNCH,
  },
  {
    id: 'about-to-fill',
    icon: <Image src={IconAboutToFill} className="w-5" alt="about-to-fill" />,
    titleKey: 'tokenTypes.aboutToFill',
    sortKey: 'raised',
    statusKey: 'upcoming',
    progressColor: '#38BDF8',
    value: ADVANCED_SORT_TYPE.ABOUT_TO_FILL,
  },
  {
    id: 'hot',
    icon: <Image src={IconHot} className="w-5" alt="hot" />,
    titleKey: 'tokenTypes.hot',
    sortKey: 'hot',
    progressColor: '#F87171',
    value: ADVANCED_SORT_TYPE.HOT,
  },
  {
    id: 'trading-volume',
    icon: (
      <Image src={IconTradingVolume} className="w-5" alt="trading-volume" />
    ),
    titleKey: 'tokenTypes.tradingVolume',
    sortKey: 'tradingVolume',
    progressColor: '#60A5FA',
    value: ADVANCED_SORT_TYPE.TRADING_VOLUME,
  },
  {
    id: 'market-cap',
    icon: <Image src={IconMarketCap} className="w-5" alt="market-cap" />,
    titleKey: 'tokenTypes.marketCap',
    sortKey: 'marketCap',
    progressColor: '#34D399',
    value: ADVANCED_SORT_TYPE.MARKET_CAP,
  },
  {
    id: 'holders',
    icon: <Image src={IconHolders} className="w-5" alt="holders" />,
    titleKey: 'tokenTypes.holders',
    sortKey: 'holders',
    progressColor: '#A78BFA',
    value: ADVANCED_SORT_TYPE.HOLDERS,
  },
  {
    id: 'transactions',
    icon: <Image src={IconTransactions} className="w-5" alt="transactions" />,
    titleKey: 'tokenTypes.transactions',
    sortKey: 'transactions',
    progressColor: '#FF7DA4',
    value: ADVANCED_SORT_TYPE.TRANSACTIONS,
  },
  {
    id: 'graduated',
    icon: <Image src={IconGraduated} className="w-5" alt="graduated" />,
    titleKey: 'tokenTypes.graduated',
    statusKey: 'graduated',
    progressColor: '#c93aff',
    value: ADVANCED_SORT_TYPE.GRADUATED,
  },
]
