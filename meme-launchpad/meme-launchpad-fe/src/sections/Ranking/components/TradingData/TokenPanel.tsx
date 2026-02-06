import { formatPercentage, formatTokenPrice } from '@/utils/format'
import { LoadingButton } from '@/components/Loading'
import useIsMobile from '@/hooks/use-is-mobile'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useMemo, useState } from 'react'
import {
  useTradeRankingsList,
  type TradeRankingsListItem,
} from '@/api/endpoints/ranking'
import { type RANKING_TYPE_VALUES } from '@/enums/ranking'
import BadgeLaunchMode from '@/components/BadgeLaunchMode'
import { LaunchMode } from '@/types/token'
import { DataWrapper } from '@/components/DataWrapper'

export default function TokenPanel({
  title,
  rankingType,
}: {
  title: string
  rankingType: RANKING_TYPE_VALUES
}) {
  const isMobile = useIsMobile()
  const [enabledV3, setEnabledV3] = useState(false)

  const params = useMemo(() => {
    return {
      top: 10,
      platform: enabledV3 ? 1 : 0,
      rankingType: rankingType,
    }
  }, [rankingType, enabledV3])

  const {
    data: tradeRankingsList,
    isLoading,
    isError,
  } = useTradeRankingsList(params)

  const data = useMemo(() => {
    return tradeRankingsList?.data?.list || []
  }, [tradeRankingsList])

  return (
    <div className="min-h-[300px] min-w-[323px] rounded-[12px] border border-[#2B3139] p-4 text-white md:px-[30px] md:pt-[20px] md:pb-[30px]">
      <div className="flex items-center justify-between">
        <div className="text-[20px] font-bold text-white">{title}</div>
        {/* V3 Badge */}
        <Label className="ml-auto flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#2B3139] p-3 px-4 py-0 hover:border-[] has-[[aria-checked=true]]:border-[]">
          <Checkbox
            id="v3check"
            checked={enabledV3}
            onCheckedChange={(checked) => setEnabledV3(!!checked)}
            className="hidden"
          />
          <span className="text-sm leading-5 font-medium text-[#F3F3F3]">
            Pancake V3
          </span>
        </Label>
      </div>
      <DataWrapper
        list={data}
        loading={isLoading}
        className="mt-4 min-h-[440px]"
      >
        <table className="w-full text-left">
          <thead>
            <tr className="text-[14px] text-[#656A79]">
              {isMobile ? (
                <th colSpan={2} className="py-2 font-normal md:pl-2">
                  Mane
                </th>
              ) : (
                <>
                  <th className=""></th>
                  <th className="py-2 font-normal md:pl-2">Mane</th>
                </>
              )}
              <th className="py-2 font-normal">Price</th>
              <th className="py-2 pr-2 text-right font-normal">24h Change</th>
            </tr>
          </thead>
          <tbody>
            {data.map((token: TradeRankingsListItem, idx: number) => {
              return (
                <tr key={idx} className="text-[15px]">
                  <td className="font-normal">{idx + 1}</td>
                  <td className="flex items-center gap-2 py-2 pl-2">
                    <div className="relative h-7 w-7">
                      <img
                        src={
                          token.iconUrl ||
                          '/assets/images/placeholder-token.svg'
                        }
                        alt="token"
                        className="h-7 w-7 rounded-full"
                        style={{ background: '#2B3139' }}
                      />
                      <BadgeLaunchMode
                        className="absolute right-[-2px] bottom-[-2px] h-3 w-3"
                        value={token.launchMode as LaunchMode}
                      />
                    </div>
                    <span className="font-medium text-white">
                      {token.symbol}
                    </span>
                  </td>
                  <td className="py-2">{formatTokenPrice(token.price)}</td>
                  <td
                    className={`py-2 pr-2 text-right font-medium ${
                      Number(token.change24h)
                        ? 'text-[#00E2AC]'
                        : 'text-[#FF6767]'
                    }`}
                  >
                    {formatPercentage(token.change24h)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </DataWrapper>
      {/* <div className="mt-4">
        {isLoading ? (
          <div className="flex h-[300px] flex-col items-center justify-center">
            <LoadingButton className="h-10 w-10" />
          </div>
        ) : data.length > 0 ? (
          
        ) : (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-base text-white/50">No data</p>
          </div>
        )}
      </div> */}
    </div>
  )
}
