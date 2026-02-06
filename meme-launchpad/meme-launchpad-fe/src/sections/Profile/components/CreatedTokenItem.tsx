import BadgeLaunchMode from '@/components/BadgeLaunchMode'
import Hot from '@/components/HotIcon'
import { formatAmount, formatNumber, formatPercentage } from '@/utils/format'
import { LaunchMode } from '@/types/token'
import { SimpleProgressBar } from '@/components/progress'
import { ChevronRight, Ellipsis } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ApplyButton from './ApplyButton'
import { MyCreateTokenListDataItem } from '@/api/endpoints/profile'
import { useTranslations } from 'next-intl'

export default function CreatedTokenItem({
  token,
  onLuckUpClaim,
  onFundingApply,
}: {
  token: MyCreateTokenListDataItem
  onLuckUpClaim: () => void
  onFundingApply: () => void
}) {
  const t = useTranslations('profile')

  return (
    <>
      {/* Desktop */}
      <div className="hidden cursor-pointer grid-cols-37 items-center px-2 py-2 font-normal text-white transition-colors hover:rounded-lg hover:bg-[#23262B]/60 lg:grid">
        {/* Name */}
        <div className="col-span-4 flex items-center gap-2">
          <div className="relative h-[40px] w-[40px] shrink-0">
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
          <div className="leading-[1]">
            <div className="truncate font-bold text-white">{token.symbol}</div>
            <p className="mt-1 truncate text-xs text-[#ffffff]/40">
              {token.name}
            </p>
          </div>
        </div>

        {/* Market Cap */}
        <div className="col-span-4 text-right text-[12px]">
          {formatNumber(token.marketCap, 2, '$')}
        </div>

        {/* Hot */}
        <div className="col-span-3 flex justify-end">
          <Hot value={token.hot} />
        </div>

        {/* Progress Pct */}
        <div className="col-span-6 pl-13 text-right text-[12px]">
          <SimpleProgressBar
            percentage={token.progressPct}
            showVolume={true}
            volume={token.bnbCurrent}
          />
        </div>

        {/* Total Locked Token */}
        <div className="col-span-4 text-right text-[12px]">
          {formatPercentage(token.bnbTarget)}
        </div>

        {/* My Locked Token */}
        <div className="col-span-4 text-right text-[12px]">
          {formatAmount(token.myLockedAmount, 'BNB')}
        </div>

        {/* Project Locked Token Receive */}
        <div className="col-span-4 flex justify-end text-[12px]">
          <button
            onClick={onLuckUpClaim}
            className="rounded-md border border-[66]/40 px-2 py-1.5 text-xs text-[] hover:bg-[]/10"
          >
            {t('claim')}
          </button>
        </div>

        {/* Project Activity Application */}
        <div className="col-span-4 flex justify-end text-[12px]">
          <ApplyButton address={token.tokenAddress} />
        </div>

        {/* Project Fund Application */}
        <div className="col-span-4 flex justify-end text-[12px]">
          <button
            onClick={onFundingApply}
            className="flex items-center justify-center gap-1 rounded-md bg-[#191B22] px-2 py-1.5 text-xs text-white hover:text-[#ffffff]/80"
          >
            <span>{t('apply')}</span>
            <ChevronRight size={12} className="text-[#656A79]" />
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className="py-3 lg:hidden">
        <div className="grid grid-cols-24 font-normal text-white transition-colors">
          {/* Name */}
          <div className="col-span-10 flex items-center gap-2">
            <div className="relative h-[40px] w-[40px] shrink-0">
              <img
                src={token.iconUrl || '/assets/images/placeholder-token.svg'}
                alt="token"
                className="h-[40px] w-[40px] rounded-[8px] object-cover"
              />
              <BadgeLaunchMode
                className="absolute right-[-2px] bottom-[-2px]"
                value={token.launchMode as LaunchMode}
              />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1">
                <div className="flex-1 truncate text-sm font-bold text-white">
                  {token.symbol}
                </div>
                <Hot value={token.hot} />
              </div>
              <div className="text-xs text-[#9197AA]">
                {formatNumber(token.marketCap, 2, '$')}
              </div>
            </div>
          </div>

          {/* Locked Token */}
          <div className="col-span-5 text-right text-[12px]">
            {formatPercentage(token.bnbTarget)}
          </div>

          {/* My Locked Token */}
          <div className="col-span-6 text-right text-[12px]">
            {formatAmount(token.myLockedAmount, 'BNB')}
          </div>

          {/* Extra */}
          <div className="col-span-3 flex justify-end text-[12px]">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Ellipsis size={16} className="text-[#ffffff] outline-none" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-[#2B3139] bg-[#1B1E25] text-white">
                <DropdownMenuItem className="text-[]">
                  领取代币
                </DropdownMenuItem>
                <DropdownMenuItem>项目活动申请</DropdownMenuItem>
                <DropdownMenuItem>项目资金申请</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <SimpleProgressBar
          percentage={token.progressPct}
          showVolume={true}
          volume={token.marketCap}
          className="mt-2 lg:hidden"
        />
      </div>
    </>
  )
}
