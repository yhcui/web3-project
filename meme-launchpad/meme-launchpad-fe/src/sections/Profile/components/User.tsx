import CopyButton from '@/components/CopyButton'
import { ChevronRight } from 'lucide-react'
import {
  useMyOverviewStats,
  type MyOverviewStatsData,
} from '@/api/endpoints/profile'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMemo } from 'react'
import { formatEthAddress, formatPrice } from '@/utils/format'
import DefaultAvatar from '@/assets/common/default-avatar.svg'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export default function User() {
  const { user } = useAuthStore()
  const t = useTranslations('profile')
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1] || 'en'
  const params = useMemo(() => {
    return {
      address: user?.address || '',
    }
  }, [user])

  const { data: myOverviewStats, isLoading } = useMyOverviewStats(params)

  const stats = useMemo<MyOverviewStatsData>(() => {
    return (
      myOverviewStats?.data ?? {
        createdTokens: 0,
        heatedTokens: 0,
        ownedTokens: 0,
        pendingUnlockTokens: 0,
        totalTradeBnb: '0',
      }
    )
  }, [myOverviewStats])

  const overview = useMemo<
    { title: string; value: number | string; isBnb?: boolean; tab?: string }[]
  >(() => {
    return [
      {
        title: t('pendingUnlockTokens'),
        value: stats.pendingUnlockTokens,
        tab: 'ido',
      },
      {
        title: t('ownedTokens'),
        value: stats.ownedTokens,
        tab: 'owned',
      },

      {
        title: t('createdTokens'),
        value: stats.createdTokens,
        tab: 'created',
      },
      {
        title: t('heatedTokens'),
        value: stats.heatedTokens,
        tab: 'followed',
      },
      {
        title: t('totalTradeBnb'),
        value: stats.totalTradeBnb,
        isBnb: true,
      },
    ]
  }, [stats])

  return (
    <div className="mt-4 items-center rounded-[12px] border border-[#2B3139] bg-[#15181E] p-4 md:flex md:p-6">
      <div className="flex items-center">
        <Image
          src={user?.avatar || DefaultAvatar}
          alt="avatar"
          className="mr-4 h-[50px] w-[50px] rounded-full object-cover md:h-[70px] md:w-[70px]"
          width={80}
          height={80}
        />
        <div>
          <div className="text-base font-bold text-white md:mb-1 md:text-[20px]">
            {user?.username ||
              `User-${user?.address.slice(
                user?.address.length - 4,
                user?.address.length
              )}`}
          </div>
          <div className="flex items-center gap-1">
            <CopyButton
              className="text-xs text-[#656A79] md:text-base"
              iconClassName="w-3 h-3"
              text={formatEthAddress(user?.address || '')}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-1 items-center justify-between gap-2 md:mt-0 md:justify-end md:gap-8 lg:gap-16">
        {overview.map((item) => (
          <div className="flex flex-col items-center gap-2" key={item.title}>
            <div
              onClick={() => {
                if (item.tab) {
                  router.push(`/${currentLocale}/profile?tab=${item.tab}`)
                }
              }}
              className="flex cursor-pointer items-center gap-1 text-base font-bold text-white md:text-[24px]"
            >
              <span className="leading-[1]">
                {item.isBnb ? formatPrice(item.value) : item.value}
              </span>
              <ChevronRight
                size={14}
                className="mt-2 hidden text-[#656A79] md:block"
              />
            </div>
            <div className="text-center text-[10px] text-[#656A79] md:text-[14px]">
              {item.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
