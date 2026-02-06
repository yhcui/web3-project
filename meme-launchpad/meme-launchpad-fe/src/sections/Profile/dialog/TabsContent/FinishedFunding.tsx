import CopyButton from '@/components/CopyButton'
import { formatAmount, formatPercentage } from '@/utils/format'

export default function FinishedFunding() {
  return (
    <div className="h-[500px] overflow-y-auto pt-4">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-sm tracking-wider text-[#656A79] uppercase">
              项目名称
            </th>
            <th className="px-4 py-2 text-right text-sm tracking-wider text-[#656A79] uppercase">
              项目说明
            </th>
            <th className="px-4 py-2 text-right text-sm tracking-wider text-[#656A79] uppercase">
              申请资金
            </th>
            <th className="px-4 py-2 text-right text-sm tracking-wider text-[#656A79] uppercase">
              赞同比例
            </th>
            <th className="px-4 py-2 text-right text-sm tracking-wider text-[#656A79] uppercase">
              反对比例
            </th>
            <th className="px-4 py-2 text-right text-sm tracking-wider text-[#656A79] uppercase">
              待定比例
            </th>
            <th className="px-4 py-2 text-right text-sm tracking-wider text-[#656A79] uppercase">
              结果
            </th>
            <th className="px-4 py-2 text-right text-sm tracking-wider text-[#656A79] uppercase">
              Hash
            </th>
          </tr>
        </thead>
        <tbody className="">
          <tr>
            <td className="px-4 py-2 text-sm font-bold whitespace-nowrap text-white">
              {formatAmount(10000, 'BNB')}
            </td>
            <td className="px-4 py-2 text-right text-sm font-bold whitespace-nowrap text-white">
              {formatPercentage(0.1)}
            </td>
            <td className="px-4 py-2 text-right text-sm font-bold whitespace-nowrap text-white">
              {formatPercentage(0.01)}
            </td>
            <td className="px-4 py-2 text-right text-sm font-bold whitespace-nowrap text-white">
              3天
            </td>
            <td className="px-4 py-2 text-right text-sm font-bold whitespace-nowrap text-white">
              {formatAmount(100, 'BNB')}
            </td>
            <td className="px-4 py-2 text-right text-sm font-bold whitespace-nowrap text-[]">
              {formatAmount(10, 'BNB')}
            </td>
            <td className="px-4 py-2 text-right text-sm font-bold whitespace-nowrap text-[]">
              通过
            </td>
            <td className="flex justify-end px-4 py-2 text-sm font-bold whitespace-nowrap text-[]">
              <CopyButton text="0x1234567890" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
