import BadgeLaunchMode from '@/components/BadgeLaunchMode'
import { LaunchMode } from '@/types/token'
import {
  formatNumber,
  formatAmount,
  formatPercentage,
  formatEthAddress,
} from '@/utils/format'
import Hot from '@/components/HotIcon'
import { formatToUTC } from '@/utils/tools'
import { SimpleProgressBar } from '@/components/progress'
import { ChevronRight } from 'lucide-react'
import CopyButton from '@/components/CopyButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ellipsis } from 'lucide-react'

export default function JoinedActivityItem({
  token,
  pageSize,
  currentPage,
  idx,
}: {
  token: any
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
          <img
            src={'/assets/images/placeholder-token.svg'}
            alt="token"
            className="h-[40px] w-[40px] rounded-[8px] object-cover"
            onError={(e) => {
              e.currentTarget.src = '/assets/images/placeholder-token.svg'
            }}
          />
          <p className="truncate text-sm font-bold text-[#ffffff]">
            {'NameActivity'}
          </p>
        </div>

        {/* ca */}
        <div className="col-span-4 flex justify-end">
          <CopyButton
            text={formatEthAddress(
              '0x1234567890123456789012345678901234567890'
            )}
            className="text-xs text-white"
          />
        </div>

        {/* 活动类型 */}
        <div className="col-span-4 text-right text-[12px]">{'空投活动'}</div>

        {/* 活动时间 */}
        <div className="col-span-6 text-right text-[12px]">
          {'2025-08-15 至 2025-08-16'}
        </div>

        {/* 奖池总额 */}
        <div className="col-span-4 text-right text-[12px]">
          {formatAmount(1000, 'BNB')}
        </div>

        {/* 活动状态 */}
        <div className="col-span-5 text-right text-[12px]">{'进行中'}</div>

        {/* 参与进度 */}
        <div className="col-span-5 pl-10 text-right text-[12px]">
          {'已完成'}
        </div>

        {/* 奖励状态 */}
        <div className="col-span-4 flex justify-end text-[12px]">
          <button className="rounded-md border border-[66]/40 px-2 py-1.5 text-xs text-[] hover:bg-[]/10">
            Claim
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className="py-3 lg:hidden">
        <div className="grid grid-cols-24 font-normal text-white transition-colors lg:hidden">
          {/* Name */}
          <div className="col-span-9 flex items-center gap-2">
            <img
              src={'/assets/images/placeholder-token.svg'}
              alt="token"
              className="h-[40px] w-[40px] shrink-0 rounded-[8px] bg-[#656A79] object-cover"
            />
            <div className="flex-1 space-y-1">
              <div className="truncate text-sm font-bold text-white">NAmeM</div>
              <div className="text-xs text-[#9197AA]">
                {formatAmount(477, 'BNB')}
              </div>
            </div>
          </div>

          {/* 活动类型 */}
          <div className="col-span-5 text-right text-[12px]">{'空投活动'}</div>

          {/* 参与进度 */}
          <div className="col-span-6 text-right text-[12px]">{'已完成'}</div>

          {/* Extra */}
          <div className="col-span-3 flex justify-end text-[12px]">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Ellipsis size={16} className="text-[#ffffff] outline-none" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-[#2B3139] bg-[#1B1E25] text-white">
                <CopyButton
                  text={formatEthAddress(
                    '0x1234567890123456789012345678901234567890'
                  )}
                  className="py-3 pl-3 text-xs text-[#9197AA]"
                ></CopyButton>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center text-[12px]">
            <span className="mr-2 h-1 w-1 rounded-full bg-[#2EBD85]"></span>
            <span className="text-[#2EBD85]">进行中</span>
          </div>
          <div className="flex items-center text-[12px]">
            <span className="text-[#656A79]">已完成</span>
          </div>
          <div className="text-sm text-[#656A79]">
            <span>
              {formatToUTC('2025-08-15', 3)} 至 {formatToUTC('2025-08-16', 3)}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
