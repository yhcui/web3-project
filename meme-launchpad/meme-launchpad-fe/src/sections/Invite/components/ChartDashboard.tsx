import { useState } from 'react'
import ChartPanelWithTimeSelector from './ChartPanelWithTimeSelector'
import {
  useGetAgentDailyCommission,
  useGetDailyInviteUserStats,
  useGetDailyNewAgentStats,
  useGetDailyTradeAmountStats,
} from '@/api/endpoints/invite'
import { UserStatusResponse } from '@/api/schemas/invite.schema'

interface ChartData {
  time: string
  value: number
}

export default function ChartDashboard({
  userInfo,
}: {
  userInfo: UserStatusResponse | undefined
}) {
  const [selectedMetric, setSelectedMetric] = useState('新增邀请人数')

  const { data: commissionData7d } = useGetAgentDailyCommission(
    userInfo?.address,
    7
  )
  const { data: commissionData30d } = useGetAgentDailyCommission(
    userInfo?.address,
    30
  )
  const { data: inviteUsersData7d } = useGetDailyNewAgentStats(
    userInfo?.address,
    7
  )
  const { data: inviteUsersData30d } = useGetDailyNewAgentStats(
    userInfo?.address,
    30
  )
  const { data: tradeAmountData7d } = useGetDailyTradeAmountStats(
    userInfo?.address,
    7
  )
  const { data: tradeAmountData30d } = useGetDailyTradeAmountStats(
    userInfo?.address,
    30
  )

  return (
    <div className="mx-auto mt-[100px] w-[1200px] rounded-lg bg-[#181A20]">
      <div className="grid grid-cols-3 gap-6">
        {/* 佣金走势图 */}
        <ChartPanelWithTimeSelector
          title="佣金走势图"
          data7d={commissionData7d?.dailyStats.map((item) => ({
            time: item.statDate,
            value: item.totalCommission || 0,
          }))}
          data30d={commissionData30d?.dailyStats.map((item) => ({
            time: item.statDate,
            value: item.totalCommission || 0,
          }))}
          unit="BNB"
        />

        {/* 新增邀请人数 */}
        <ChartPanelWithTimeSelector
          title={selectedMetric}
          data7d={inviteUsersData7d?.dailyStats.map((item) => ({
            time: item.statDate,
            value: item.newAgentCount || 0,
          }))}
          data30d={inviteUsersData30d?.dailyStats.map((item) => ({
            time: item.statDate,
            value: item.newAgentCount || 0,
          }))}
          unit="人"
          showDropdown={true}
          dropdownOptions={['新增邀请人数', '代理数走势图']}
          onDropdownChange={(value) => {
            console.log('value', value)
            setSelectedMetric(value)
          }}
        />

        {/* 总交易额走势图 */}
        <ChartPanelWithTimeSelector
          title="总交易额走势图"
          data7d={tradeAmountData7d?.dailyStats.map((item) => ({
            time: item.statDate,
            value: item.totalAmount || 0,
          }))}
          data30d={tradeAmountData30d?.dailyStats.map((item) => ({
            time: item.statDate,
            value: item.totalAmount || 0,
          }))}
          unit="k BNB"
        />
      </div>
    </div>
  )
}
