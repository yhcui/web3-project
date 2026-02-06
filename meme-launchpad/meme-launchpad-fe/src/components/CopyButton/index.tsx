'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { notify } from '@/stores/useUIStore'
import { useTranslations } from 'next-intl'

const CopyButton = ({
  text,
  className,
  showText = true,
  iconClassName,
}: {
  text: string
  className?: string
  showText?: boolean
  iconClassName?: string
}) => {
  const [isCopied, setIsCopied] = useState(false)
  const t = useTranslations('common')

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    notify.success(t('copySuccess'))
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'flex cursor-pointer items-center gap-1 text-xs text-[#656A79] hover:text-[#757A89]',
        className
      )}
      onClick={handleCopy}
    >
      {showText && <div className="truncate">{text}</div>}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        className={iconClassName}
      >
        <g clipPath="url(#clip0_2253_38829)">
          <path
            d="M9.52322 3.53436C9.52322 3.53436 10.132 3.74614 11.3182 4.91918C12.5044 6.0925 12.7329 6.73204 12.7329 6.73204H12.7332C12.7445 7.19915 12.75 7.66639 12.7497 8.13364C12.7497 9.56966 12.7019 10.6227 12.6507 11.3378C12.5998 12.0531 12.0531 12.5995 11.3375 12.6507C10.6227 12.7019 9.56938 12.7497 8.13364 12.7497C6.69763 12.7497 5.64461 12.7019 4.92953 12.6507C4.21418 12.5998 3.66781 12.0531 3.61661 11.3375C3.56514 10.623 3.51758 9.56966 3.51758 8.13364C3.51758 6.69763 3.56542 5.64461 3.61661 4.92981C3.66753 4.21418 4.21418 3.66753 4.92981 3.61661C5.64433 3.56514 6.69763 3.51758 8.13364 3.51758C8.64477 3.51758 9.10721 3.52373 9.5235 3.5338L9.52322 3.53408V3.53436Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.83361 1.09987C8.11853 1.0484 7.06104 1 5.61607 1C4.17977 1 3.12675 1.04784 2.41196 1.09904C1.69661 1.14995 1.14967 1.69661 1.09876 2.41224C1.04756 3.12703 1 4.18033 1 5.61607C1 7.06103 1.04868 8.11825 1.09987 8.83332"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.733 6.73116C11.974 6.92 11.0944 6.93259 10.3203 6.6987C10.1599 6.64964 10.0135 6.56319 9.89298 6.44646C9.7725 6.32973 9.68147 6.18606 9.62737 6.02728C9.35236 5.2294 9.32075 4.28492 9.52301 3.5332"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_2253_38829">
            <rect width="14" height="14" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  )
}

export default CopyButton
