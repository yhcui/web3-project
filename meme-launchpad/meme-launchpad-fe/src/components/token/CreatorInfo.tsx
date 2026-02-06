'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Flame } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import FavoriteIcon from '@/assets/common/favorite.svg'
import UnFavoriteIcon from '@/assets/common/un-favorite.svg'
import ShareIcon from '@/assets/common/share.svg'

interface CreatorInfoProps {
  className?: string
  creatorName?: string
  creatorAvatar?: string
  description?: string
  heatCount?: number
  marginAmount?: string
  isFavorite?: boolean
  onFavoriteToggle?: () => void
}

export function CreatorInfo({
  className,
  creatorName = 'Mubaraksh',
  creatorAvatar = '/assets/images/creator-avatar.svg',
  description = 'The Sharpe ratio of the left side is meaningless. The short-term intracranial climax is an illusion. The short-term intracranial climax is an illusion. The Sharpe ratio of the left side is meaningless. The short-term intracranial climax is an illusion. The Sharpe ratio of the left side is meaningless. The short-term intracranial climax is an illusion.',
  heatCount = 25,
  marginAmount = '158',
  isFavorite = false,
  onFavoriteToggle,
}: CreatorInfoProps) {
  const t = useTranslations('Token.CreatorInfo')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 处理ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false)
      }
    }

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isModalOpen])

  return (
    <div
      className={cn(
        'relative max-h-[200px] min-h-[180px] overflow-hidden bg-[#181A20] p-4',
        className
      )}
    >
      {/* Background Avatar with blur effect - reduced to better proportion */}
      <div
        className="absolute top-0 right-0 left-0 h-[35%] bg-cover bg-center"
        style={{
          backgroundImage: `url(${creatorAvatar})`,
          filter: 'blur(4px)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Overlay gradient to ensure content readability */}
      <div className="absolute top-0 right-0 left-0 h-[35%] bg-gradient-to-b from-black/15 to-transparent" />

      {/* Content container with relative positioning */}
      <div className="relative z-10">
        {/* Creator Header */}
        <div className="mb-4 flex items-start justify-between">
          {/* Profile Section */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative h-[54px] w-[54px] flex-shrink-0 overflow-hidden rounded-[7.27px] bg-[#D9D9D9]">
              <Image
                src={creatorAvatar}
                alt={creatorName}
                fill
                className="object-cover"
              />
            </div>

            {/* Name and Badges */}
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              {/* Creator Name */}
              <div className="flex items-center justify-start gap-2">
                <h3 className="truncate text-base leading-6 font-normal text-white">
                  {creatorName}
                </h3>
                <div className="flex flex-shrink-0 cursor-pointer items-center gap-2">
                  <Image
                    src={isFavorite ? FavoriteIcon : UnFavoriteIcon}
                    alt={isFavorite ? 'favorite' : 'un-favorite'}
                    width={13}
                    height={13}
                    onClick={onFavoriteToggle}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              {/* Badge Row */}
              <div className="flex items-center gap-2">
                {/* Margin Badge */}
                <div className="flex h-6 items-center gap-0.5 rounded-[40px] border border-[#282D35]/60 bg-[#11131A]/60 px-2.5 py-0.5">
                  <div className="relative h-3 w-3">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_4017_4040)">
                        <path
                          d="M11.0458 8.98224C10.7518 9.16224 10.3498 9.30024 9.84577 9.40224C9.34177 9.50424 8.78977 9.55824 8.19577 9.55824C7.60177 9.55824 7.04977 9.50424 6.54577 9.40224C6.04177 9.30024 5.63977 9.15624 5.34577 8.98224C5.05177 8.80824 4.90177 8.61024 4.90177 8.40624V7.63824C5.24377 7.89024 5.70577 8.08224 6.29377 8.20824C6.88177 8.33424 7.51777 8.40024 8.19577 8.40024C8.87377 8.40024 9.50377 8.33424 10.0978 8.20824C10.6858 8.07624 11.1538 7.89024 11.4898 7.63824V8.40624C11.4898 8.61024 11.3398 8.80224 11.0458 8.98224ZM11.0458 7.24824C10.7518 7.42824 10.3498 7.56624 9.84577 7.66824C9.34177 7.77024 8.78977 7.82424 8.19577 7.82424C7.60177 7.82424 7.04977 7.77024 6.54577 7.66824C6.04177 7.56624 5.63977 7.42224 5.34577 7.24824C5.05177 7.06824 4.90177 6.87624 4.90177 6.67224V5.90424C5.24377 6.15624 5.70577 6.34824 6.29377 6.47424C6.88177 6.60624 7.51777 6.66624 8.19577 6.66624C8.87377 6.66624 9.50377 6.60024 10.0978 6.47424C10.6858 6.34824 11.1538 6.15624 11.4898 5.90424V6.67224C11.4898 6.87624 11.3398 7.06824 11.0458 7.24824ZM11.0458 5.52024C10.7518 5.69424 10.3498 5.83824 9.84577 5.94024C9.34177 6.04224 8.78977 6.09624 8.19577 6.09624C7.60177 6.09624 7.04977 6.04224 6.54577 5.94024C6.04177 5.83824 5.63977 5.69424 5.34577 5.52024C5.05177 5.34024 4.90177 5.14824 4.90177 4.94424V4.36824C4.90177 4.15824 5.05177 3.96624 5.34577 3.79224C5.63977 3.61224 6.04177 3.47424 6.54577 3.37224C7.04977 3.27024 7.60177 3.21624 8.19577 3.21624C8.78977 3.21624 9.34177 3.27024 9.84577 3.37224C10.3498 3.47424 10.7518 3.61824 11.0458 3.79224C11.3398 3.97224 11.4898 4.16424 11.4898 4.36824V4.94424C11.4898 5.14824 11.3398 5.34024 11.0458 5.52024ZM4.29577 4.21824C3.62377 4.21224 2.99977 4.15824 2.42977 4.04424C1.84177 3.92424 1.37377 3.76824 1.03177 3.56424C0.689766 3.36024 0.515766 3.14424 0.515766 2.91024V2.25624C0.515766 2.02224 0.689766 1.80024 1.03177 1.60224C1.37377 1.39824 1.84177 1.24224 2.42977 1.12224C3.01777 1.00224 3.65977 0.948242 4.35577 0.948242C5.05177 0.948242 5.69377 1.00824 6.28177 1.12224C6.86977 1.24224 7.33777 1.39824 7.67977 1.60224C8.02177 1.80624 8.19577 2.02224 8.19577 2.25624V2.51424L6.94777 2.62224C5.96977 2.61024 4.24777 3.21024 4.29577 4.21824ZM4.27777 4.87224V6.18024C3.61177 6.17424 2.99377 6.12024 2.42977 6.00624C1.84177 5.88624 1.37377 5.73024 1.03177 5.52624C0.689766 5.32224 0.515766 5.10624 0.515766 4.87224V4.00224C0.911766 4.29024 1.45177 4.50624 2.14177 4.65024C2.80177 4.79424 3.51577 4.86624 4.27777 4.87224ZM4.27777 6.84024V8.14824C3.61177 8.14224 2.99377 8.08824 2.42977 7.97424C1.84177 7.85424 1.37377 7.69824 1.03177 7.49424C0.689766 7.29024 0.515766 7.07424 0.515766 6.84024V5.97024C0.911766 6.25824 1.45177 6.47424 2.14177 6.61824C2.80177 6.76224 3.51577 6.83424 4.27777 6.84024ZM4.27777 8.80824V10.0382C4.27777 10.0682 4.28377 10.0922 4.28377 10.1222C3.61777 10.1162 2.99377 10.0622 2.42377 9.94824C1.83577 9.82824 1.36777 9.67224 1.02577 9.46824C0.683766 9.26424 0.509766 9.04824 0.509766 8.81424V7.94424C0.905766 8.23224 1.44577 8.44824 2.13577 8.59224C2.80177 8.73024 3.51577 8.80224 4.27777 8.80824ZM8.19577 10.1342C8.87377 10.1342 9.50377 10.0682 10.0978 9.94224C10.6858 9.81024 11.1538 9.62424 11.4898 9.37224V10.1402C11.4898 10.3502 11.3398 10.5422 11.0458 10.7162C10.7518 10.8962 10.3498 11.0342 9.84577 11.1362C9.34177 11.2382 8.78977 11.2922 8.19577 11.2922C7.60177 11.2922 7.04977 11.2382 6.54577 11.1362C6.04177 11.0342 5.63977 10.8902 5.34577 10.7162C5.05177 10.5362 4.90177 10.3442 4.90177 10.1402V9.36624C5.24377 9.61824 5.70577 9.81024 6.29377 9.93624C6.88177 10.0682 7.51777 10.1342 8.19577 10.1342Z"
                          fill=""
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_4017_4040">
                          <rect width="12" height="12" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <span className="text-xs leading-[18px] font-normal text-white/80">
                    {marginAmount}
                  </span>
                </div>

                {/* Heat Badge */}
                <div className="flex h-6 items-center gap-0.5 rounded-[40px] border border-[#282D35]/60 bg-[#11131A]/60 px-2.5 py-0.5">
                  <div className="relative h-3 w-3">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 1C7 1 6.5 2 6 3C5.5 4 5 5 5 6C5 7.105 5.895 8 7 8C8.105 8 9 7.105 9 6C9 5 8.5 4 8 3C7.5 2 7 1 7 1Z"
                        fill="#F69414"
                      />
                      <path
                        d="M4 4C4 4 3.5 5 3 6C2.5 7 2 8 2 9C2 10.105 2.895 11 4 11C5.105 11 6 10.105 6 9C6 8 5.5 7 5 6C4.5 5 4 4 4 4Z"
                        fill="#F69414"
                      />
                    </svg>
                  </div>
                  <span className="text-xs leading-[18px] font-normal text-[#F69414]">
                    {heatCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-col gap-2">
            {/* Heat Button */}
            <Button className="h-6 w-14 rounded-md bg-[#BFFB06] px-2 py-1 text-xs font-normal text-black hover:bg-[#BFFB06]/90">
              {t('heat')}
            </Button>
            <Button className="h-6 w-auto min-w-[58px] gap-1 rounded-md border border-[#FFFFFF1A] bg-[#11131999] px-1.5 py-1 text-xs font-normal text-[#BFFB06] transition-colors duration-200 hover:border-[#BFFB0688] hover:bg-[#1D202A]">
              <Image
                src={ShareIcon}
                alt="share"
                width={10}
                height={10}
                className="flex-shrink-0"
              />
              <span className="whitespace-nowrap">{t('share')}</span>
            </Button>
          </div>
        </div>

        {/* Description */}
        <p className="mb-2 line-clamp-3 overflow-hidden text-xs leading-5 font-normal text-white/90">
          {t('introPrefix')}
          {description ||
            'The Sharpe ratio of the left side is meaningless. The short-term intracranial climax is an illusion. The short-term intracranial climax is an illusion. The Sharpe ratio of the left side is meaningless. The short-term intracranial climax is an illusion. The Sharpe ratio of the left side is meaningless. The short-term intracranial climax is an illusion.'}
        </p>

        {/* View More Link */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs leading-5 font-normal text-[#BFFB06] transition-colors hover:text-[#BFFB06]/80"
          >
            {t('viewMore')}
          </button>
        </div>
      </div>

      {/* Custom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 mx-auto max-h-[80vh] w-[400px] overflow-hidden rounded-lg bg-[#181A20] px-6 pt-8">
            {/* Background Avatar with blur effect */}
            <div
              className="absolute top-0 right-0 left-0 h-[30%] bg-cover bg-center"
              style={{
                backgroundImage: `url(${creatorAvatar})`,
                filter: 'blur(4px)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0) 100%)',
              }}
            />

            {/* Overlay gradient */}
            <div className="absolute top-0 right-0 left-0 h-[30%] bg-gradient-to-b from-black/15 to-transparent" />

            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 z-20 text-white transition-colors hover:text-gray-300"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Content */}
            <div className="relative z-10 flex min-h-[300px] flex-col">
              {/* Creator Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="relative h-[54px] w-[54px] flex-shrink-0 overflow-hidden rounded-[7.27px] bg-[#D9D9D9]">
                    <Image
                      src={creatorAvatar}
                      alt={creatorName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-normal text-white">
                        {creatorName}
                      </h3>
                      <div className="flex-shrink-0">
                        <Image
                          src={isFavorite ? FavoriteIcon : UnFavoriteIcon}
                          alt={isFavorite ? 'favorite' : 'un-favorite'}
                          width={13}
                          height={13}
                          onClick={onFavoriteToggle}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 items-center gap-0.5 rounded-[40px] border border-[#282D35]/60 bg-[#11131A]/60 px-2.5 py-0.5">
                        <div className="relative h-3 w-3">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
                              fill=""
                            />
                          </svg>
                        </div>
                        <span className="text-xs leading-[18px] font-normal text-white/80">
                          {marginAmount}
                        </span>
                      </div>
                      <div className="flex h-6 items-center gap-0.5 rounded-[40px] border border-[#282D35]/60 bg-[#11131A]/60 px-2.5 py-0.5">
                        <div className="relative h-3 w-3">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M7 1C7 1 6.5 2 6 3C5.5 4 5 5 5 6C5 7.105 5.895 8 7 8C8.105 8 9 7.105 9 6C9 5 8.5 4 8 3C7.5 2 7 1 7 1Z"
                              fill="#F69414"
                            />
                            <path
                              d="M4 4C4 4 3.5 5 3 6C2.5 7 2 8 2 9C2 10.105 2.895 11 4 11C5.105 11 6 10.105 6 9C6 8 5.5 7 5 6C4.5 5 4 4 4 4Z"
                              fill="#F69414"
                            />
                          </svg>
                        </div>
                        <span className="text-xs leading-[18px] font-normal text-[#F69414]">
                          {heatCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col gap-2">
                  <Button className="h-6 w-14 rounded-md bg-[#BFFB06] px-2 py-1 text-xs font-normal text-black hover:bg-[#BFFB06]/90">
                    {t('heat')}
                  </Button>
                  <Button className="h-6 w-auto min-w-[58px] gap-1 rounded-md border border-[#FFFFFF1A] bg-[#11131999] px-1.5 py-1 text-xs font-normal text-[#BFFB06] transition-colors duration-200 hover:border-[#BFFB0688] hover:bg-[#1D202A]">
                    <Image
                      src={ShareIcon}
                      alt="share"
                      width={10}
                      height={10}
                      className="flex-shrink-0"
                    />
                    <span className="whitespace-nowrap">{t('share')}</span>
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <div className="max-h-[40vh] overflow-y-auto text-sm leading-6 text-white/90">
                  <span>{t('introPrefix')}</span>
                  <span>
                    {description ||
                      'The Sharpe ratio of the left side is meaningless. The short-term intracranial climax is an illusion. The short-term intracranial climax is an illusion. The Sharpe ratio of the left side is meaningless. The short-term intracranial climax is an illusion. The Sharpe ratio of the left side is meaningless. The short-term intracranial climax is an illusion.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
