import { formatAmount, formatEthAddress } from '@/utils/format'
import { formatToUTC } from '@/utils/tools'
import CopyButton from '@/components/CopyButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ellipsis } from 'lucide-react'
import StatusCell from './StatusCell'
import {
  ActivityCategoryType,
  ActivityRewardTokenType,
} from '@/enums/activities'
import { useTranslations } from 'next-intl'

export default function CreatedActivityItem({ token }: { token: any }) {
  const t = useTranslations('profile')
  return (
    <>
      {/* Desktop */}
      <div className="hidden cursor-pointer grid-cols-37 items-center px-2 py-3 font-normal text-white transition-colors hover:rounded-lg hover:bg-[#23262B]/60 md:grid md:py-2">
        {/* Name */}
        <div className="col-span-6 flex items-center gap-2">
          <img
            src={token.tokenLogo || '/assets/images/placeholder-token.svg'}
            alt="token"
            className="h-[40px] w-[40px] shrink-0 rounded-[8px] bg-[#656A79] object-cover"
            onError={(e) => {
              e.currentTarget.src = '/assets/images/placeholder-token.svg'
            }}
          />
          <p className="truncate text-sm font-bold text-[#ffffff]">
            {token.name}
          </p>
        </div>

        {/* ca */}
        <div className="col-span-5 flex justify-end">
          <CopyButton
            text={formatEthAddress(token.tokenAddress)}
            className="text-xs text-white"
          />
        </div>

        {/* 发起时间 */}
        <div className="col-span-5 text-right text-[12px]">
          {formatToUTC(token.createdAt, 3)}
        </div>

        {/* 活动类型 */}
        <div className="col-span-5 text-right text-[12px]">
          {token.categoryType === ActivityCategoryType.Airdrop
            ? t('createEvent.categoryTypeOptions.airdrop')
            : t('createEvent.categoryTypeOptions.upcoming')}
        </div>

        {/* 活动时间 */}
        <div className="col-span-6 text-right text-[12px]">
          {formatToUTC(token.startAt, 3)} {t('createEvent.timeStartTo')}{' '}
          {formatToUTC(token.endAt, 3)}
        </div>

        {/* 奖池总额 */}
        <div className="col-span-5 text-right text-[12px]">
          {formatAmount(
            token.rewardAmountBnb,
            token.rewardTokenType == ActivityRewardTokenType.BNB
              ? 'BNB'
              : token.rewardTokenType == ActivityRewardTokenType.USDT
                ? 'USDT'
                : token.rewardTokenSymbol
          )}
        </div>

        {/* 活动状态 */}
        <div className="col-span-5 flex justify-end text-[12px]">
          <StatusCell status={token.status} />
        </div>
      </div>

      {/* Mobile */}
      <div className="py-3 md:hidden">
        <div className="grid grid-cols-24 font-normal text-white transition-colors lg:hidden">
          {/* Name */}
          <div className="col-span-9 flex items-center gap-2">
            <img
              src={token.tokenLogo || '/assets/images/placeholder-token.svg'}
              alt="token"
              className="h-[40px] w-[40px] rounded-[8px] object-cover"
            />
            <div className="flex-1 space-y-1">
              <div className="truncate text-sm font-bold text-white">
                {token.name}
              </div>
              <div className="text-xs text-[#9197AA]">
                {formatAmount(
                  token.rewardAmountBnb,
                  token.rewardTokenType == ActivityRewardTokenType.BNB
                    ? 'BNB'
                    : token.rewardTokenType == ActivityRewardTokenType.USDT
                      ? 'USDT'
                      : token.rewardTokenSymbol
                )}
              </div>
            </div>
          </div>

          {/* 时间 */}
          <div className="col-span-5 text-right text-[12px]">
            {formatToUTC(token.createdAt, 3)}
          </div>

          {/* My Locked Token */}
          <div className="col-span-6 text-right text-[12px]">
            {token.categoryType === ActivityCategoryType.Airdrop
              ? t('createEvent.categoryTypeOptions.airdrop')
              : t('createEvent.categoryTypeOptions.upcoming')}
          </div>

          {/* Extra */}
          <div className="col-span-3 flex justify-end text-[12px]">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Ellipsis size={16} className="text-[#ffffff] outline-none" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-[#2B3139] bg-[#1B1E25] text-white">
                <CopyButton
                  text={formatEthAddress(token.tokenAddress)}
                  className="py-3 pl-3 text-xs text-[#9197AA]"
                ></CopyButton>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <StatusCell status={token.status} />
          <div className="text-sm text-[#656A79]">
            <span>
              {formatToUTC(token.startAt, 3)} {t('createEvent.timeStartTo')}{' '}
              {formatToUTC(token.endAt, 3)}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
