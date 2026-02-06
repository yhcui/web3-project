import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatAmount, formatPercentage } from '@/utils/format'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/Loading'

export default function LuckUpClaimDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[880px] rounded-2xl border border-[#2B3139] bg-[#1B1E25] px-8 py-5">
        <DialogHeader>
          <DialogTitle className="pb-6 text-white">项目锁仓领取</DialogTitle>
        </DialogHeader>
        <div className="max-h-[460px] space-y-4 overflow-y-auto">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="space-y-2" key={index}>
              <h3 className="text-sm text-white">项目社区建设01</h3>
              <p className="text-sm text-[#ffffff]/40">
                项目社区建设01项目社区建设01项目社区建设01项目社区建设01
              </p>
              <div>
                <table className="min-w-full rounded-lg bg-[#252832]">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs tracking-wider text-[#656A79] uppercase">
                        总额
                      </th>
                      <th className="px-4 py-2 text-left text-xs tracking-wider text-[#656A79] uppercase">
                        总锁仓
                      </th>
                      <th className="px-4 py-2 text-left text-xs tracking-wider text-[#656A79] uppercase">
                        当前锁仓
                      </th>
                      <th className="px-4 py-2 text-left text-xs tracking-wider text-[#656A79] uppercase">
                        剩余时间
                      </th>
                      <th className="px-4 py-2 text-left text-xs tracking-wider text-[#656A79] uppercase">
                        累计已领取
                      </th>
                      <th className="px-4 py-2 text-left text-xs tracking-wider text-[#656A79] uppercase">
                        待领取
                      </th>
                      <th className="px-4 py-2 text-left text-xs tracking-wider text-[#656A79] uppercase">
                        选择
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 text-sm font-bold whitespace-nowrap text-white">
                        {formatAmount(10000, 'BNB')}
                      </td>
                      <td className="px-4 py-2 text-sm font-bold whitespace-nowrap text-white">
                        {formatPercentage(0.1)}
                      </td>
                      <td className="px-4 py-2 text-sm font-bold whitespace-nowrap text-white">
                        {formatPercentage(0.01)}
                      </td>
                      <td className="px-4 py-2 text-sm font-bold whitespace-nowrap text-white">
                        3天
                      </td>
                      <td className="px-4 py-2 text-sm font-bold whitespace-nowrap text-white">
                        {formatAmount(100, 'BNB')}
                      </td>
                      <td className="px-4 py-2 text-sm font-bold whitespace-nowrap text-[]">
                        {formatAmount(10, 'BNB')}
                      </td>
                      <td className="px-4 py-2 text-sm whitespace-nowrap text-white">
                        <Checkbox
                          className="h-5 w-5 data-[state=checked]:bg-[] data-[state=checked]:text-[#15181E]"
                          checked={true}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-[]">300BNB</h2>
          <p className="text-sm text-[#ffffff]">确认转入当前钱包地址：</p>
          <p className="text-sm text-[#ffffff]/40">
            0x1234567890123456789012345678901234567890
          </p>
        </div>
        <Button className="mx-auto block h-[45px] w-[600px] rounded-lg bg-[] text-black hover:bg-[#FBD537]/90">
          立即提取
        </Button>
      </DialogContent>
    </Dialog>
  )
}
