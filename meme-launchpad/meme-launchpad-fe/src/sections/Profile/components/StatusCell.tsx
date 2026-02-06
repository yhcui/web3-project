import { ActivityStatus } from '@/enums/activities'

export default function StatusCell({ status }: { status: ActivityStatus }) {
  if (status === ActivityStatus.Pending) {
    return <div className="text-[#656A79]">审核中</div>
  } else if (status === ActivityStatus.Upcoming) {
    return <div className="text-[#656A79]">未开始</div>
  } else if (status === ActivityStatus.Ongoing) {
    return (
      <div className="flex items-center text-[12px]">
        <span className="mr-2 h-1 w-1 rounded-full bg-[#2EBD85]"></span>
        <span className="text-[#2EBD85]">进行中</span>
      </div>
    )
  } else if (status === ActivityStatus.Settled) {
    return <div className="text-[#656A79]">已结束</div>
  } else if (status === ActivityStatus.Complete) {
    return (
      <div className="flex items-center text-[12px]">
        <span className="text-[#656A79]">已结算</span>
      </div>
    )
  } else if (status === ActivityStatus.Cancel) {
    return (
      <div className="flex items-center text-[12px]">
        <span className="text-[#656A79]">已作废</span>
      </div>
    )
  }
  return <div className="text-[#656A79]">Pending</div>
}
