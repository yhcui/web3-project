import {
  useGetUserCommission,
  useCreateRebateRecord,
  useCheckRebateRecordStatus,
} from '@/api/endpoints/invite'
import { UserStatusResponse } from '@/api/schemas/invite.schema'
import { cn } from '@/lib/utils'
import { notify } from '@/stores/useUIStore'
import { format18 } from '../util'

export default function Total({
  userInfo,
}: {
  userInfo: UserStatusResponse | undefined
}) {
  const { data: userCommission } = useGetUserCommission(userInfo?.address)
  const cliamDisabled = userCommission?.totalFee
    ? userCommission?.totalFee - userCommission?.totalRebateFee <= 0
    : true
  const { mutateAsync: createRebateRecord } = useCreateRebateRecord()
  const { mutateAsync: checkRebateRecordStatus } = useCheckRebateRecordStatus()

  return (
    <div className="mx-auto mt-[100px] flex w-[1200px] rounded-xl bg-[#181A20] p-6">
      <div className="flex w-[400px] flex-col items-start justify-center">
        <div className="mb-2 text-[16px] text-white">总收益（BNB）</div>
        <div className="text-[48px] font-bold text-white">
          {format18(userCommission?.totalFee)}
        </div>
      </div>
      <div className="ml-8 flex flex-1 flex-col gap-4">
        <div className="flex gap-4">
          <div className="min-w-[150px] flex-1 rounded-md bg-black p-4">
            <div className="mb-2 text-[16px] text-white">推荐用户</div>
            <div className="text-[28px] font-bold text-white">
              {userCommission?.inviteUserCount}
            </div>
          </div>
          <div className="min-w-[150px] flex-1 rounded-md bg-black p-4">
            <div className="mb-2 text-[16px] text-white">真实交易用户</div>
            <div className="text-[28px] font-bold text-white">
              {userCommission?.tradingUserCount}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="min-w-[150px] flex-1 rounded-md bg-black p-4">
            <div className="mb-2 text-[16px] text-white">已支付佣金（BNB）</div>
            <div className="text-[28px] font-bold text-white">
              {format18(userCommission?.totalRebateFee)}
            </div>
          </div>
          <div className="flex min-w-[150px] flex-1 items-center justify-between rounded-md bg-black p-4">
            <div>
              <div className="mb-2 text-[16px] text-white">
                未支付佣金（BNB）
              </div>
              <div className="text-[28px] font-bold text-white">
                {format18(
                  userCommission?.totalFee
                    ? userCommission?.totalFee - userCommission?.totalRebateFee
                    : 0
                )}
              </div>
            </div>
            <button
              disabled={cliamDisabled}
              onClick={async () => {
                if (cliamDisabled) return
                if (!userInfo?.address) return

                const hasClaimed = await checkRebateRecordStatus({
                  address: userInfo?.address || '',
                })
                if (hasClaimed) {
                  notify.error('领取失败，已有正在发放中的返佣记录')
                  return
                }

                const res = await createRebateRecord({
                  data: {
                    userId: 0,
                    traderId: 0,
                    userAddr: userInfo?.address || '',
                    amount: userCommission?.totalFee
                      ? userCommission?.totalFee -
                        userCommission?.totalRebateFee
                      : 0,
                    status: 0,
                  },
                  query: {
                    address: userInfo?.address || '',
                  },
                })
                console.log('res', res)
              }}
              className={cn(
                'rounded bg-[#FFD600] px-6 py-1 text-[14px] text-black transition-colors hover:bg-[#ffe066]',
                cliamDisabled ? 'cursor-not-allowed opacity-50' : ''
              )}
            >
              领取
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
