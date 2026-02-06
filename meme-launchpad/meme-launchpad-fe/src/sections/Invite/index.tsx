'use client'
import Title from './components/Title'
import Code from './components/Code'
import Total from './components/Total'
import ListPersonal from './components/ListPersonal'
import { useGetUserStatus } from '@/api/endpoints/invite'
import { useAuthStore } from '@/stores/useAuthStore'
import AgentTotal from './components/AgentTotal'
import ListAgent from './components/ListAgent'
import ChartDashboard from './components/ChartDashboard'

export default function Invite() {
  const { user } = useAuthStore()
  const { data: userInfo } = useGetUserStatus(user?.address)

  return (
    <div>
      <div className="mx-auto flex w-[1200px] items-center justify-between">
        <Title userInfo={user?.address ? userInfo : undefined} />
        <Code userInfo={user?.address ? userInfo : undefined} />
      </div>
      {!userInfo?.isAgent && (
        <>
          <Total userInfo={userInfo} />
          <ListPersonal userInfo={userInfo} />
        </>
      )}
      {userInfo?.isAgent && (
        <>
          <AgentTotal userInfo={userInfo} />
          <ChartDashboard userInfo={userInfo} />
          <ListAgent userInfo={userInfo} />
        </>
      )}
    </div>
  )
}
