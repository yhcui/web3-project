'use client'
import { useState, useEffect } from 'react'
import { UserStatusResponse } from '@/api/schemas/invite.schema'
import CopyButton from '@/components/CopyButton'

export default function Code({
  userInfo,
}: {
  userInfo: UserStatusResponse | undefined
}) {
  const [inviteLink, setInviteLink] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}${window.location.pathname}?code=${userInfo?.invitationCode || ''}`
      setInviteLink(link)
    }
  }, [userInfo?.invitationCode])

  return (
    <div className="w-[440px] rounded-xl bg-[#000000] p-8">
      <div className="mb-6 text-[16px] font-medium text-white">你的邀请码</div>
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex h-12 items-center justify-between rounded-md border border-[#333B47] bg-[#17191D] px-2">
          <span className="w-[72px] text-[16px] text-[#7C7C80]">邀请码</span>
          <div className="flex items-center">
            <CopyButton
              text={userInfo?.invitationCode || ''}
              className="flex flex-1 justify-end gap-1 text-[16px] text-white"
            />
          </div>
        </div>
        <div className="flex h-12 items-center justify-between rounded-md border border-[#333B47] bg-[#17191D] px-2 overflow-ellipsis">
          <div className="w-[80%] overflow-hidden text-[16px] overflow-ellipsis whitespace-nowrap text-white">
            {inviteLink}
          </div>
          {isClient && (
            <CopyButton
              text={inviteLink}
              showText={false}
              className="flex justify-between text-[16px] text-white"
            />
          )}
        </div>
      </div>
      <button
        onClick={() => {
          // 分享到 Twitter
          if (typeof window !== 'undefined') {
            const text = `快来加入我在CoinRoll的邀请活动！我的邀请码：${userInfo?.invitationCode || ''}`
            const url = encodeURIComponent(inviteLink)
            const shareText = encodeURIComponent(text)
            const twitterUrl = `https://twitter.com/intent/tweet?url=${url}&text=${shareText}`
            window.open(twitterUrl, '_blank')
          }
        }}
        className="h-12 w-full rounded-md bg-[#FFD600] text-[16px] text-black transition-colors hover:bg-[#ffe066]"
      >
        立即分享
      </button>
    </div>
  )
}
