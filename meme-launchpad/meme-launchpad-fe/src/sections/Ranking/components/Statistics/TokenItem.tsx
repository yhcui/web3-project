import { RankingTokenItem } from '@/api/endpoints/ranking'
import BadgeLaunchMode from '@/components/BadgeLaunchMode'
import { LaunchMode } from '@/types/token'
import {
  formatNumber,
  formatAmount,
  formatPercentage,
  formatTokenPrice,
} from '@/utils/format'
import Hot from '@/components/HotIcon'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatToUTC } from '@/utils/tools'

export default function TokenItem({
  token,
  pageSize,
  currentPage,
  idx,
}: {
  token: RankingTokenItem
  pageSize: number
  currentPage: number
  idx: number
}) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden cursor-pointer grid-cols-37 items-center px-2 py-2 font-normal text-white transition-colors hover:rounded-lg hover:bg-[#23262B]/60 md:grid">
        {/* Name */}
        <div className="col-span-5 flex items-center gap-2">
          <span className="w-4 text-left text-sm text-[#9197AA]">
            {pageSize * (currentPage - 1) + idx + 1}
          </span>
          <div className="relative h-[40px] w-[40px]">
            <img
              src={token.iconUrl || '/assets/images/placeholder-token.svg'}
              alt="token"
              className="h-[40px] w-[40px] rounded-[8px] bg-[#191B22] object-cover"
              onError={(e) => {
                e.currentTarget.src = '/assets/images/placeholder-token.svg'
              }}
            />
            <BadgeLaunchMode
              className="absolute right-[-2px] bottom-[-2px]"
              value={token.launchMode as LaunchMode}
            />
          </div>
          <div className="flex flex-col truncate">
            <div className="truncate font-bold text-white">{token.symbol}</div>
            <span className="truncate text-[10px] text-[#B1B5C3]">
              {token.name}
            </span>
          </div>
        </div>

        {/* Hot */}
        <div className="col-span-3 flex justify-end">
          <Hot value={token.hot} />
        </div>

        {/* Price */}
        <div className="col-span-3 text-right text-[12px]">
          {formatTokenPrice(token.price)}
        </div>

        {/* Change */}
        <div
          className={`col-span-3 text-right text-[12px] ${
            Number(token.change24h) ? 'text-[#00E2AC]' : 'text-[#FF6767]'
          }`}
        >
          {formatPercentage(token.change24h)}
        </div>

        {/* Volume */}
        <div className="col-span-3 text-right text-[12px]">
          ${formatNumber(token.volume24h, 2)}
        </div>

        {/* Market Cap */}
        <div className="col-span-3 text-right text-[12px]">
          ${formatNumber(token.marketCap, 2)}
        </div>

        {/* Tx Count */}
        <div className="col-span-3 text-right text-[12px]">
          {formatAmount(token.txCount)}
        </div>

        {/* Holders */}
        <div className="col-span-3 text-right text-[12px]">
          {formatAmount(token.holders)}
        </div>

        {/* Top 10 */}
        <div className="col-span-3 text-right text-[12px]">
          {formatPercentage(token.top10Percent)}
        </div>

        {/* Age */}
        <div className="col-span-3 text-right text-[12px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{formatAmount(token.age)}d</span>
            </TooltipTrigger>
            <TooltipContent>
              {token.launchTime ? (
                <p>{formatToUTC(token.launchTime)}</p>
              ) : (
                <p>N/A</p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Progress */}
        <div className="col-span-5 pl-8 text-right text-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#FFFFFF]">
              {formatNumber(token.marketCap)}
            </span>
            <span className="text-xs text-[#FFD166]">
              {formatPercentage(token.progressPct)}
            </span>
          </div>
          <div className="mt-[6px] h-[3px] w-full rounded bg-[#353945]">
            <div
              className="h-[3px] rounded bg-[#FFD166]"
              style={{ width: `${formatPercentage(token.progressPct)}` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="mb-4 md:hidden">
        <div className="grid grid-cols-12 items-center text-white">
          {/* col 1: index, icon, symbol, name */}
          <div className="col-span-6 flex items-center gap-2">
            <div className="w-4 shrink-0 text-left text-sm text-[#9197AA]">
              {pageSize * (currentPage - 1) + idx + 1}
            </div>
            <div className="relative h-[44px] w-[44px] shrink-0">
              <img
                src={token.iconUrl || '/assets/images/placeholder-token.svg'}
                alt="token"
                className="h-[44px] w-[44px] rounded-[8px] object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/assets/images/placeholder-token.svg'
                }}
              />
              <BadgeLaunchMode
                className="absolute right-[-2px] bottom-[-2px]"
                value={token.launchMode as LaunchMode}
              />
            </div>
            <div className="flex flex-1 flex-col truncate">
              <div className="flex items-center gap-1">
                <span>{token.symbol}</span>
                <Hot value={token.hot} />
              </div>
              <p className="truncate text-[10px] text-[#B1B5C3]">
                {token.name}
              </p>
            </div>
          </div>

          {/* col 2 */}
          <div className="col-span-3 text-center text-[12px]">
            ${formatNumber(token.marketCap, 2)}
          </div>

          {/* col 3 */}
          <div
            className={`col-span-3 text-right text-[12px] ${
              Number(token.change24h) ? 'text-[#00E2AC]' : 'text-[#FF6767]'
            }`}
          >
            {formatPercentage(token.change24h)}
          </div>

          {/* Progress */}
          <div className="col-span-12 mt-2 pl-6 text-right text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#FFFFFF]">
                {formatNumber(token.marketCap)}
              </span>
              <span className="text-xs text-[#FFD166]">
                {formatPercentage(token.progressPct)}
              </span>
            </div>
            <div className="mt-[6px] h-[3px] w-full rounded bg-[#353945]">
              <div
                className="h-[3px] rounded bg-[#FFD166]"
                style={{ width: `${formatPercentage(token.progressPct)}` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
