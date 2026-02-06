'use client'

import Image from 'next/image'
import EventForm from './sections/EventForm'
import TokenInfo from './sections/TokenInfo'
import SideBarImage from '@/assets/profile/event-side-img.jpg'
import { useParams } from 'next/navigation'
import { useState } from 'react'

export default function CreateEvent() {
  const params = useParams()
  const address = params.address as string
  const [coverImage, setCoverImage] = useState<string>('')
  const [tokenId, setTokenId] = useState<number>(0)

  return (
    <div className="mx-auto w-full max-w-[1200px] px-2 pb-20">
      {/* Token 信息 */}
      <TokenInfo
        address={address}
        onCoverImageChange={setCoverImage}
        onTokenIdChange={setTokenId}
      />

      {/* Form */}
      <div className="w-full">
        <EventForm
          coverImage={coverImage}
          tokenId={tokenId}
          address={address}
        />
      </div>
    </div>
  )
}
