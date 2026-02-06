import TokenPanel from './TokenPanel'
import { useOverviewRankings } from '@/api/endpoints/ranking'
import { useMemo } from 'react'
import { type RANKING_TYPE_VALUES, RANKING_TYPE } from '@/enums/ranking'
import { useTranslations } from 'next-intl'

export default function TradingData() {
  const tOverview = useTranslations('ranking.overview')
  const tTitle = useTranslations('ranking.title')
  const rankingTypeValues = [
    {
      title: tOverview('hotCoin'),
      rankingType: RANKING_TYPE.HOT,
    },
    {
      title: tOverview('topGainers'),
      rankingType: RANKING_TYPE.TOP_GAINER,
    },
    {
      title: tOverview('topLosers'),
      rankingType: RANKING_TYPE.TOP_LOSER,
    },
    {
      title: tOverview('topVolume'),
      rankingType: RANKING_TYPE.TOP_VOLUME,
    },
    {
      title: tOverview('topMarketCap'),
      rankingType: RANKING_TYPE.TOP_MARKET_CAP,
    },
  ]

  return (
    <div className="mt-[20px]">
      <div className="text-sm text-white md:text-[20px] md:font-bold">
        {tTitle('ranking')}
      </div>
      <div className="scrollbar-hide mt-4 flex w-full flex-row flex-nowrap gap-4 overflow-x-auto md:grid md:grid-cols-3 md:overflow-x-hidden">
        {rankingTypeValues.map((item) => (
          <TokenPanel
            key={item.rankingType}
            title={item.title}
            rankingType={item.rankingType}
          />
        ))}
      </div>
    </div>
  )
}
