import { UserStatusResponse } from '@/api/schemas/invite.schema'
import { useGetUserInvites } from '@/api/endpoints/invite'
import { Pagination } from '@/components/Pagination'
import { useState } from 'react'

export default function ListPersonal({
  userInfo,
}: {
  userInfo: UserStatusResponse | undefined
}) {
  const [page, setPage] = useState(1)
  const { data: userInvites } = useGetUserInvites(userInfo?.address, page)

  console.log('userInvites', userInvites)

  return (
    <div className="mx-auto mt-[100px] w-[1200px]">
      <div className="text-[20px] font-bold text-white">邀请明细</div>
      <div className="mt-6 rounded-lg bg-[#17191D] p-[24px]">
        <table className="w-full overflow-hidden rounded-sm text-left">
          <thead>
            <tr className="bg-[#23262F] text-[14px] text-[#798391]">
              <th className="w-[200px] px-6 py-3 font-medium">用户名/地址</th>
              <th className="px-6 py-3 text-right font-medium">累计产生佣金</th>
              <th className="px-6 py-3 text-right font-medium">日期</th>
            </tr>
          </thead>
          <tbody>
            {userInvites?.list?.map((item, idx) => (
              <tr key={idx} className="text-[14px] text-white">
                <td className="px-6 py-3">{item.userAddr}</td>
                <td className="px-6 py-3 text-right">{item.totalTradeFee}</td>
                <td className="px-6 py-3 text-right">{item.createdAt}</td>
              </tr>
            ))}
            {(!userInvites?.list || userInvites.list.length === 0) && (
              <tr>
                <td
                  colSpan={3}
                  className="py-10 text-center text-[16px] text-[#798391]"
                >
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {userInvites?.totalPages && userInvites?.totalPages > 1 && (
          <div className="mt-6 flex justify-end">
            <Pagination
              currentPage={userInvites?.page || 1}
              totalPages={userInvites?.totalPages || 1}
              onPageChange={(page) => {
                setPage(page)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
