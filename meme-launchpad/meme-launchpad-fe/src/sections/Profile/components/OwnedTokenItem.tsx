import { MyOwnedTokenListDataItem } from '@/api/endpoints/profile'
import BadgeLaunchMode from '@/components/BadgeLaunchMode'
import { LaunchMode } from '@/types/token'
import { formatAmount, formatNumber } from '@/utils/format'
import Hot from '@/components/HotIcon'
import { ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ellipsis } from 'lucide-react'
import ApplyButton from './ApplyButton'

export default function OwnedTokenItem({
  token,
  pageSize,
  currentPage,
  idx,
}: {
  token: MyOwnedTokenListDataItem
  pageSize: number
  currentPage: number
  idx: number
}) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden cursor-pointer grid-cols-37 items-center px-2 py-2 font-normal text-white transition-colors hover:rounded-lg hover:bg-[#23262B]/60 lg:grid">
        {/* Name */}
        <div className="col-span-5 flex items-center gap-2">
          <div className="relative h-[40px] w-[40px]">
            <img
              src={'/assets/images/placeholder-token.svg'}
              alt="token"
              className="h-[40px] w-[40px] shrink-0 rounded-[8px] bg-[#656A79] object-cover"
              onError={(e) => {
                e.currentTarget.src = '/assets/images/placeholder-token.svg'
              }}
            />
            <BadgeLaunchMode
              className="absolute right-[-2px] bottom-[-2px]"
              value={3 as LaunchMode}
            />
          </div>
          <div className="leading-[1]">
            <div className="truncate font-bold text-white">{'Symbol'}</div>
            <p className="mt-1 truncate text-xs text-[#ffffff]/40">{'Name'}</p>
          </div>
        </div>

        {/* 市值 */}
        <div className="col-span-6 text-right text-[12px]">
          {formatAmount(10000)}
        </div>

        {/* Hot */}
        <div className="col-span-6 flex justify-end">
          <Hot value={100} />
        </div>

        {/* 总锁仓代币 */}
        <div className="col-span-7 text-right text-[12px]">
          {formatAmount(10000)}
        </div>

        {/* 当前我的锁仓 */}
        <div className="col-span-7 text-right text-[12px]">
          {formatAmount(10000)}
        </div>

        {/* 项目活动申请 */}
        <div className="col-span-6 flex justify-end text-[12px]">
          <ApplyButton address={token.tokenAddress} />
        </div>
      </div>

      {/* Mobile */}
      <div className="py-3 lg:hidden">
        <div className="grid grid-cols-24 font-normal text-white transition-colors">
          {/* Name */}
          <div className="col-span-10 flex items-center gap-2">
            <div className="relative h-[40px] w-[40px]">
              <img
                src={'/assets/images/placeholder-token.svg'}
                alt="token"
                className="h-[40px] w-[40px] rounded-[8px] object-cover"
              />
              <BadgeLaunchMode
                className="absolute right-[-2px] bottom-[-2px]"
                value={3 as LaunchMode}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <div className="truncate text-sm font-bold text-white">
                  NAmeM
                </div>
                <Hot value={100} />
              </div>
              <div className="text-xs text-[#9197AA]">
                {formatNumber(1000, 2, '$')}
              </div>
            </div>
          </div>

          {/* 当前锁仓 */}
          <div className="col-span-5 text-right text-[12px]">
            {formatAmount(477, 'BNB')}
          </div>

          {/* My Locked Token */}
          <div className="col-span-6 text-right text-[12px]">
            {formatAmount(477, 'BNB')}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  )
}
