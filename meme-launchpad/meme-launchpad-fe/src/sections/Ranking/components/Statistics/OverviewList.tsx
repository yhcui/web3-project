import { OverviewRankingsItem } from '@/api/endpoints/ranking'
import { formatTokenPrice, formatPercentage } from '@/utils/format'
import { ChevronRight } from 'lucide-react'
import { DataWrapper } from '@/components/DataWrapper'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function OverviewList({
  title,
  data,
  isLoading,
}: {
  title: string
  data: OverviewRankingsItem[]
  isLoading: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1] || 'en'

  return (
    <div className="min-h-[200px] min-w-[250px] flex-1 shrink-0 rounded-[12px] border border-[#2B3139] px-3 py-[12px] font-normal">
      <div className="flex items-center justify-between px-2 pt-1 pb-2 text-[14px] text-white">
        <div className="font-bold">{title}</div>
        <Link href={`/${currentLocale}/ranking?tab=trading`}>
          <div className="flex cursor-pointer items-center gap-[2px] text-[#656A79] hover:text-white">
            <span>More</span>
            <ChevronRight size={13} />
          </div>
        </Link>
      </div>
      <DataWrapper
        list={data}
        loading={isLoading}
        className="mt-1 min-h-[130px] space-y-1"
        emptyText="No data"
      >
        {data.map((item, index) => (
          <div
            key={index}
            className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 hover:bg-[#191B22]"
          >
            <div className="flex items-center gap-2">
              <img
                src={item.iconUrl || '/assets/images/placeholder-token.svg'}
                alt="token"
                className="h-9 w-9 rounded-full bg-[#191B22]"
                onError={(e) => {
                  e.currentTarget.src = '/assets/images/placeholder-token.svg'
                }}
              />
              <span className="text-[14px] text-white">{item.symbol}</span>
            </div>
            <div className="text-[14px] text-white">
              {formatTokenPrice(item.price)}
            </div>
            <div className="text-[14px] text-[#FF6767]">
              {formatPercentage(item.change24h)}
            </div>
          </div>
        ))}
      </DataWrapper>
    </div>
  )
}
