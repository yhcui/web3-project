import { useMemo } from 'react'
import OverviewList from './OverviewList'
import { useOverviewRankings } from '@/api/endpoints/ranking'
import { useTranslations } from 'next-intl'

export default function Overview() {
  const tOverview = useTranslations('ranking.overview')

  const {
    data: overviewRankings,
    isLoading,
    isError,
    error,
  } = useOverviewRankings({
    top: 3,
  })

  const hotData = useMemo(() => {
    if (!overviewRankings?.data?.hot) return []
    return overviewRankings.data.hot
  }, [overviewRankings])

  const newData = useMemo(() => {
    if (!overviewRankings?.data?.new) return []
    return overviewRankings.data.new
  }, [overviewRankings])

  const topGainerData = useMemo(() => {
    if (!overviewRankings?.data?.topGainer) return []
    return overviewRankings.data.topGainer
  }, [overviewRankings])

  const topMarketCapData = useMemo(() => {
    if (!overviewRankings?.data?.topMarketCap) return []
    return overviewRankings.data.topMarketCap
  }, [overviewRankings])

  const dataList = useMemo(() => {
    return [
      {
        title: tOverview('hot'),
        data: hotData,
      },
      {
        title: tOverview('new'),
        data: newData,
      },
      {
        title: tOverview('topGainers'),
        data: topGainerData,
      },
      {
        title: tOverview('topVolume'),
        data: topMarketCapData,
      },
    ]
  }, [hotData, newData, topGainerData, topMarketCapData])

  return (
    <div className="scrollbar-hide mt-3 flex w-full flex-row gap-4 overflow-x-auto">
      {dataList.map((item) => (
        <OverviewList
          key={item.title}
          title={item.title}
          data={item.data}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}
