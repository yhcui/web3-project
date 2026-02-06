'use client'

import Tab from '@/components/Tab'
import Statistics from './components/Statistics'
import TradingData from './components/TradingData/index'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'

export default function Ranking() {
  const tTitle = useTranslations('ranking.title')
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1] || 'en'
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (tab === 'overview' || tab === 'trading') {
      setActiveTab(tab)
    } else {
      setActiveTab('overview')
    }
  }, [tab])

  const tabs = [
    {
      label: tTitle('overview'),
      key: 'overview',
      content: <Statistics />,
    },
    {
      label: tTitle('tradingData'),
      key: 'trading',
      content: <TradingData />,
    },
  ]

  return (
    <div className="mx-auto max-w-[1420px] px-4 pb-16 font-bold md:px-0">
      <p className="pb-2 text-[20px] font-bold text-[] md:hidden">
        {tTitle('ranking')}
      </p>
      <Tab
        tabs={tabs}
        activeKey={activeTab}
        tabClass="text-[16px] md:text-[20px] leading-[30px] md:leading-[46px]"
        activeTabClass="text-[16px] md:text-[26px] leading-[30px] md:leading-[54px]"
        showLine
        onChange={(key) => {
          setActiveTab(key as string)
          router.push(`/${currentLocale}/ranking?tab=${key}`)
        }}
      />
    </div>
  )
}
