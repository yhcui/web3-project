import { useState, useMemo } from 'react'
import { IconsSearchIcon } from '@/components/icons/generated'
import TimeFilter from './TimeFilter'
import { cn } from '@/lib/utils'
import CopyButton from '@/components/CopyButton'
import {
  UserStatusResponse,
  AgentDescendantStatsResponse,
} from '@/api/schemas/invite.schema'
import { useGetAgentDescendantStats } from '@/api/endpoints/invite/queries'
import { Pagination } from '@/components/Pagination'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

// 时间范围映射
const timeRangeMapping: Record<string, string> = {
  '24小时': '24h',
  '7天': '7d',
  '1个月': '1m',
  '3个月': '3m',
  '1年': '1y',
}

export default function ListAgent({
  userInfo,
}: {
  userInfo: UserStatusResponse | undefined
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [tradingUsersFilter, setTradingUsersFilter] = useState('24小时')
  const [commissionFilter, setCommissionFilter] = useState('7天')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [currentPage, setCurrentPage] = useState(1)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // 转换时间过滤器值为API格式
  const tradingUsersTimeRange = useMemo(
    () => timeRangeMapping[tradingUsersFilter] || '24h',
    [tradingUsersFilter]
  )
  const commissionTimeRange = useMemo(
    () => timeRangeMapping[commissionFilter] || '7d',
    [commissionFilter]
  )

  const { data: agentDescendantStats, isLoading } = useGetAgentDescendantStats(
    userInfo?.address,
    tradingUsersTimeRange,
    currentPage,
    10,
    searchQuery
  )

  // 从API数据中提取分页信息
  const totalPages = useMemo(
    () => agentDescendantStats?.totalPages || 1,
    [agentDescendantStats]
  )

  // 从API数据中提取代理列表
  const agentList = useMemo(
    () => agentDescendantStats?.agentStats || [],
    [agentDescendantStats]
  )
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="mx-auto mt-[100px] w-[1200px] rounded-xl bg-[#181A20] p-6">
      <div className="flex items-center justify-between">
        <div className="text-[20px] font-bold text-white">邀请明细</div>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="relative flex items-center gap-4 rounded-md border border-[#4F5867] bg-black">
            <input
              type="text"
              placeholder="输入代理名称/代理地址查询代理"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[300px] px-1 py-2 pr-[30px] text-[14px] text-white placeholder-[#798391] focus:rounded-md focus:ring-1 focus:ring-[#FFD600] focus:outline-none"
            />
            <div className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 cursor-pointer text-gray-400">
              <IconsSearchIcon />
            </div>
          </div>

          {/* 日期范围选择器 */}
          <div
            className={`relative flex cursor-pointer items-center gap-3 rounded-md border bg-black px-4 py-2 transition-colors hover:bg-gray-800 ${datePickerOpen ? 'border-[#FFD600]' : 'border-[#4F5867]'}`}
            onClick={() => setDatePickerOpen(true)}
          >
            <span className="text-[14px] text-[#798391]">
              {startDate ? startDate.toLocaleDateString() : '开始日期'}
            </span>
            <span className="text-[14px] text-[#798391]">→</span>
            <span className="text-[14px] text-[#798391]">
              {endDate ? endDate.toLocaleDateString() : '结束日期'}
            </span>
            <div className="ml-auto">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2H4C2.89543 2 2 2.89543 2 4V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z"
                  stroke="#798391"
                  strokeWidth="1.5"
                />
                <path d="M2 6H14" stroke="#798391" strokeWidth="1.5" />
                <path d="M6 2V6" stroke="#798391" strokeWidth="1.5" />
                <path d="M10 2V6" stroke="#798391" strokeWidth="1.5" />
              </svg>
            </div>

            {/* 日期选择器弹窗 */}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <div className="relative right-[-18px] bottom-[-16]" />
              </PopoverTrigger>
              <PopoverContent
                className="w-auto border-[#4F5867] bg-[#181A20] p-0"
                align="end"
              >
                <div className="p-4">
                  <Calendar
                    mode="range"
                    selected={{ from: startDate, to: endDate }}
                    onSelect={(range) => {
                      if (range?.from) setStartDate(range.from)
                      if (range?.to) setEndDate(range.to)
                    }}
                    className="bg-[#181A20] text-white"
                    numberOfMonths={2}
                    showOutsideDays={true}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDatePickerOpen(false)
                      }}
                      className="bg-[#FFD600] px-6 py-2 text-black hover:bg-[#ffe066]"
                    >
                      确定
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-[14px] font-normal text-[#798391]">
              <th className="pb-4 text-left">
                <div className="flex items-center gap-2">
                  <span>代理名称</span>
                </div>
              </th>
              <th className="pb-4 text-left">
                <div className="flex items-center gap-2">
                  <span>代理地址</span>
                </div>
              </th>
              <th className="pb-4 text-left">
                <div className="flex items-center gap-2">
                  <span>代理级别</span>
                </div>
              </th>
              <th className="pb-4 text-left">
                <div className="flex items-center gap-2">
                  <span>佣金比例</span>
                </div>
              </th>
              <th className="pr-[10px] pb-4 text-left">
                <div className="mx-auto flex w-[100px] flex-col items-end gap-2">
                  <TimeFilter
                    value={tradingUsersFilter}
                    onChange={setTradingUsersFilter}
                  />
                  <span>伞下交易用户数</span>
                </div>
              </th>
              <th className="pr-[10px] pb-4 text-left">
                <div className="mx-auto flex w-[100px] flex-col items-end gap-2">
                  <TimeFilter
                    value={commissionFilter}
                    onChange={setCommissionFilter}
                  />
                  <span>产生佣金</span>
                </div>
              </th>
              <th className="pb-4 text-left">
                <div className="flex items-center gap-2">
                  <span>交易量</span>
                </div>
              </th>
              <th className="pb-4 text-left">
                <div className="flex items-center gap-2">
                  <span>被邀请时间</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // 加载状态
              Array.from({ length: 3 }).map((_, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="py-4">
                    <div className="h-4 animate-pulse rounded bg-gray-700"></div>
                  </td>
                  <td className="py-4">
                    <div className="h-4 animate-pulse rounded bg-gray-700"></div>
                  </td>
                  <td className="py-4">
                    <div className="h-4 animate-pulse rounded bg-gray-700"></div>
                  </td>
                  <td className="py-4">
                    <div className="h-4 animate-pulse rounded bg-gray-700"></div>
                  </td>
                  <td className="py-4">
                    <div className="h-4 animate-pulse rounded bg-gray-700"></div>
                  </td>
                  <td className="py-4">
                    <div className="h-4 animate-pulse rounded bg-gray-700"></div>
                  </td>
                  <td className="py-4">
                    <div className="h-4 animate-pulse rounded bg-gray-700"></div>
                  </td>
                  <td className="py-4">
                    <div className="h-4 animate-pulse rounded bg-gray-700"></div>
                  </td>
                </tr>
              ))
            ) : agentList.length > 0 ? (
              // 数据列表
              agentList.map((agent) => (
                <tr key={agent.agentId} className="border-b border-gray-700">
                  <td className="py-4 text-white">{agent.agentName}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white" title={agent.agentAddress}>
                        {formatAddress(agent.agentAddress)}
                      </span>
                      <CopyButton
                        text={agent.agentAddress}
                        className="text-gray-400 hover:text-white"
                        showText={false}
                      />
                    </div>
                  </td>
                  <td className="py-4 text-white">
                    {agent.agentLevel === 1 ? '一级' : `${agent.agentLevel}级`}
                  </td>
                  <td className="py-4 text-white">20%</td>
                  <td className="py-4 pr-[10px] text-right text-white">
                    {agent.totalTradeUserCount}
                  </td>
                  <td className="py-4 pr-[10px] text-right text-white">
                    {agent.totalCommission.toLocaleString()}
                  </td>
                  <td className="py-4 text-white">
                    {agent.totalTxCount.toLocaleString()}
                  </td>
                  <td className="py-4 text-white">-</td>
                </tr>
              ))
            ) : (
              // 空状态
              <tr>
                <td colSpan={8} className="py-18 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-10 flex justify-end">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
