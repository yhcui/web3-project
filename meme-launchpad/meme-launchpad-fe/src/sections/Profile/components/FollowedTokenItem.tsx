import BadgeLaunchMode from '@/components/BadgeLaunchMode'
import { LaunchMode } from '@/types/token'
import {
  formatTokenPrice,
  formatAmount,
  formatPercentage,
} from '@/utils/format'
import Hot from '@/components/HotIcon'
import { formatToUTC } from '@/utils/tools'
import { SimpleProgressBar } from '@/components/progress'
import { ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ellipsis } from 'lucide-react'
import { StarIcon } from '@/components/ui/star-icon'
import { MyFollowedTokenListDataItem } from '@/api/schemas/profile.schema'
import { useFavoriteToken, useUnfavoriteToken } from '@/api/endpoints/tokens'
import { useState } from 'react'

export default function FollowedTokenItem({
  token,
  pageSize,
  currentPage,
  idx,
}: {
  token: MyFollowedTokenListDataItem
  pageSize: number
  currentPage: number
  idx: number
}) {
  const [isFavorite, setIsFavorite] = useState(token.isFavorite || false)
  const { mutate: favoriteToken } = useFavoriteToken()
  const { mutate: unfavoriteToken } = useUnfavoriteToken()

  const handleFavoriteToggle = (tokenId: number) => {
    setIsFavorite(!isFavorite)

    // 根据当前状态调用不同接口
    const mutation = isFavorite ? unfavoriteToken : favoriteToken
    mutation(
      { tokenId },
      {
        onError: () => {
          // 出错时回滚状态
          setIsFavorite(!isFavorite)
        },
      }
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden cursor-pointer grid-cols-37 items-center px-2 py-2 font-normal text-white transition-colors hover:rounded-lg hover:bg-[#23262B]/60 lg:grid">
        {/* Name */}
        <div className="col-span-5 flex items-center gap-2">
          <div
            onClick={() => {
              setIsFavorite(!isFavorite)
              handleFavoriteToggle(token.tokenId)
            }}
          >
            <StarIcon filled={isFavorite || false} />
          </div>
          <div className="relative h-[40px] w-[40px]">
            <img
              src={token.iconUrl || '/assets/images/placeholder-token.svg'}
              alt="token"
              className="h-[40px] w-[40px] rounded-[8px] bg-[#656A79] object-cover"
              onError={(e) => {
                e.currentTarget.src = '/assets/images/placeholder-token.svg'
              }}
            />
            <BadgeLaunchMode
              className="absolute right-[-2px] bottom-[-2px]"
              value={token.launchMode as LaunchMode}
            />
          </div>
          <div className="leading-[1]">
            <div className="truncate font-bold text-white">{token.symbol}</div>
            <p className="mt-1 truncate text-xs text-[#ffffff]/40">
              {token.name}
            </p>
          </div>
        </div>

        {/* Hot */}
        <div className="col-span-3 flex justify-end">
          <Hot value={token.hot || 0} />
        </div>

        {/* 价格 */}
        <div className="col-span-3 text-right text-[12px]">
          {formatTokenPrice(token.price || 0)}
        </div>

        {/* 24h 涨幅 */}
        <div className="col-span-3 text-right text-[12px]">
          {formatPercentage(token.change24h || 0)}
        </div>

        {/* 24h 交易量 */}
        <div className="col-span-4 text-right text-[12px]">
          {formatAmount(token.volume24h || 0)}
        </div>

        {/* 市值 */}
        <div className="col-span-3 text-right text-[12px]">
          {formatAmount(token.marketCap || 0)}
        </div>

        {/* 交易次数 */}
        <div className="col-span-3 text-right text-[12px]">
          {token.txCount || 0}
        </div>

        {/* 持币人数 */}
        <div className="col-span-3 flex justify-end text-[12px]">
          {token.holders || 0}
        </div>

        {/* top10 */}
        <div className="col-span-3 flex justify-end text-[12px]">
          {formatPercentage(token.top10Percent || 0)}
        </div>

        {/* age */}
        <div className="col-span-3 flex justify-end text-[12px]">
          {token.age}
        </div>

        {/* 进度 */}
        <div className="col-span-4 pl-10 text-right text-[12px]">
          <SimpleProgressBar percentage={token.progressPct || 0} />
        </div>
      </div>

      {/* Mobile */}
      <div className="py-3 lg:hidden">
        <div className="grid grid-cols-24 font-normal text-white transition-colors">
          {/* Name */}
          <div className="col-span-10 flex items-center gap-2">
            <div className="relative h-[40px] w-[40px]">
              <img
                src={token.iconUrl || '/assets/images/placeholder-token.svg'}
                alt="token"
                className="h-[40px] w-[40px] rounded-[8px] bg-[#656A79] object-cover"
              />
              <BadgeLaunchMode
                className="absolute right-[-2px] bottom-[-2px]"
                value={token.launchMode as LaunchMode}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <div className="truncate text-sm font-bold text-white">
                  {token.name}
                </div>
                <Hot value={token.hot || 0} />
              </div>
              <div className="text-xs text-[#9197AA]">
                {formatTokenPrice(token.price || 0)}
              </div>
            </div>
          </div>

          {/* 市值 */}
          <div className="col-span-5 text-right text-[12px]">
            {formatAmount(token.marketCap || 0, 'BNB')}
          </div>

          {/* 24h 交易量 */}
          <div className="col-span-6 text-right text-[12px]">
            {formatPercentage(token.change24h || 0)}
          </div>

          {/* follow */}
          <div className="col-span-3 flex justify-end text-[12px]">
            <StarIcon filled={true} className="h-5 w-5" />
          </div>
        </div>
        <SimpleProgressBar
          percentage={token.progressPct || 0}
          showVolume={true}
          volume={token.marketCap || 0}
          className="mt-2 lg:hidden"
        />
      </div>
    </>
  )
}
