import { Button } from '@/components/ui/button'
import IconVIP1 from '@/assets/common/icon-vip-1.svg'
import IconVIP2 from '@/assets/common/icon-vip-2.svg'
import DefaultAvatar from '@/assets/common/default-avatar.svg'
import Image from 'next/image'
import { MyFollowersListDataItem } from '@/api/endpoints/profile'

export default function UserCard({ user }: { user: MyFollowersListDataItem }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-[#2B3139] bg-[#191B22] px-4 py-3">
      <Image
        src={DefaultAvatar}
        alt="avatar"
        className="h-12 w-12 rounded-full bg-[#656A79] object-cover"
        width={48}
        height={48}
      />
      <div className="min-w-0 flex-1">
        <div className="text-base text-white">0xaB...2792de</div>
        <Image src={IconVIP1} alt="vip" width={20} height={20} />
      </div>
      <Button className="ml-auto h-8 rounded-sm bg-[#252832] px-3 text-[12px] text-[#656A79] transition-colors">
        取消关注
      </Button>
    </div>
  )
}
