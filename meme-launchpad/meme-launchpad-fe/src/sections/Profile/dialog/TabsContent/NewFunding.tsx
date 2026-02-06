import { Button } from '@/components/ui/button'
import { formatAmount, formatPercentage } from '@/utils/format'
import { useTranslations } from 'next-intl'

export default function NewFunding() {
  const t = useTranslations('profile')

  return (
    <div className="flex h-[500px] flex-col gap-4 overflow-y-auto pt-4">
      <div className="flex-1">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-1 text-left text-sm tracking-wider text-[#656A79] uppercase">
                名字
              </th>
              <th className="px-4 py-1 text-right text-sm tracking-wider text-[#656A79] uppercase">
                总资金
              </th>
              <th className="px-4 py-1 text-right text-sm tracking-wider text-[#656A79] uppercase">
                已申请资金
              </th>
              <th className="px-4 py-1 text-right text-sm tracking-wider text-[#656A79] uppercase">
                申请中资金
              </th>
              <th className="px-4 py-1 text-right text-sm tracking-wider text-[#656A79] uppercase">
                剩余资金
              </th>
            </tr>
          </thead>
          <tbody className="">
            {Array.from({ length: 2 }).map((_, index) => (
              <tr key={index}>
                <td className="px-4 py-2 whitespace-nowrap text-white">
                  <p className="text-base font-bold">Symbol</p>
                  <p className="text-sm text-[#ffffff]/40">namename</p>
                </td>
                <td className="px-4 py-2 text-right text-sm font-bold whitespace-nowrap text-white">
                  {formatAmount(100, 'BNB')}
                </td>
                <td className="px-4 py-2 text-right text-sm font-bold whitespace-nowrap text-white">
                  {formatAmount(100, 'BNB')}
                </td>
                <td className="px-4 py-2 text-right text-sm font-bold whitespace-nowrap text-white">
                  {formatAmount(100, 'BNB')}
                </td>
                <td className="px-4 py-2 text-right text-sm font-bold whitespace-nowrap text-[]">
                  {formatAmount(100, 'BNB')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button className="h-10 w-full bg-[] text-black hover:bg-[]/80">
        {t('dialog.fundingApplyCreate')}
      </Button>
    </div>
  )
}
