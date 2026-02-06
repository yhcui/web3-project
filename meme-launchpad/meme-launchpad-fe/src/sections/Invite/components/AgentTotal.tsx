import {
  useGetUserCommission,
  useCreateRebateRecord,
  useCheckRebateRecordStatus,
  useGetAgentDetail,
} from '@/api/endpoints/invite'
import { UserStatusResponse } from '@/api/schemas/invite.schema'
import { cn } from '@/lib/utils'
import { notify } from '@/stores/useUIStore'
import { format18 } from '../util'

export default function AgentTotal({
  userInfo,
}: {
  userInfo: UserStatusResponse | undefined
}) {
  const { data: agentDetail } = useGetAgentDetail(userInfo?.address)
  const cliamDisabled = agentDetail?.totalCommission
    ? agentDetail?.totalCommission - agentDetail?.totalRebateFee <= 0
    : true
  const { mutateAsync: createRebateRecord } = useCreateRebateRecord()
  const { mutateAsync: checkRebateRecordStatus } = useCheckRebateRecordStatus()

  return (
    <div className="mx-auto mt-[100px] flex w-[1200px] rounded-xl bg-[#181A20] p-6">
      <div className="flex w-[250px] flex-col items-start justify-center">
        <div className="mb-2 text-[16px] text-white">总佣金（BNB）</div>
        <div className="text-[48px] font-bold text-white">
          {format18(agentDetail?.totalCommission)}
        </div>
      </div>
      <div className="ml-8 flex flex-1 flex-col gap-4">
        <div className="flex gap-4">
          <div className="min-w-[150px] flex-1 rounded-md bg-black p-4">
            <div className="mb-2 text-[16px] text-white">返佣比例</div>
            <div className="text-[28px] font-bold text-white">
              {agentDetail?.commissionRate
                ? `${agentDetail.commissionRate}%`
                : '0%'}
            </div>
          </div>
          <div className="min-w-[150px] flex-1 rounded-md bg-black p-4">
            <div className="mb-2 text-[16px] text-white">总下级代理数</div>
            <div className="text-[28px] font-bold text-white">
              {agentDetail?.descendantAgentCount || '0'}
            </div>
          </div>
          <div className="min-w-[150px] flex-1 rounded-md bg-black p-4">
            <div className="mb-2 text-[16px] text-white">伞下所有交易用户</div>
            <div className="text-[28px] font-bold text-white">
              {agentDetail?.tradingUserCount || '0'}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="min-w-[150px] flex-1 rounded-md bg-black p-4">
            <div className="mb-2 text-[16px] text-white">代理级别</div>
            <div className="text-[28px] font-bold text-white">
              {agentDetail?.level || '0'}
            </div>
          </div>
          <div className="min-w-[150px] flex-1 rounded-md bg-black p-4">
            <div className="mb-2 text-[16px] text-white">已领取返佣（BNB）</div>
            <div className="text-[28px] font-bold text-white">
              {format18(agentDetail?.totalRebateFee)}
            </div>
          </div>
          <div className="flex min-w-[150px] flex-1 items-center justify-between rounded-md bg-black p-4">
            <div>
              <div className="mb-2 text-[16px] text-white">
                未领取返佣（BNB）
              </div>
              <div className="text-[28px] font-bold text-white">
                {format18(
                  agentDetail?.totalCommission
                    ? agentDetail?.totalCommission - agentDetail?.totalRebateFee
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
                    amount: agentDetail?.totalCommission
                      ? agentDetail?.totalCommission -
                        agentDetail?.totalRebateFee
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
