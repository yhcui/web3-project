import React from 'react'
import { formatAmount } from '@/utils/format'
import { cn } from '@/lib/utils'

interface HotProps {
  value: number
  lowThreshold?: number // default 1000
  highThreshold?: number // default 5000
  className?: string
}

const Hot: React.FC<HotProps> = ({
  value,
  lowThreshold = 1000,
  highThreshold = 5000,
  className = '',
}) => {
  const getIcon = () => {
    if (value < lowThreshold) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M4.01414 8.76961C4.05149 9.40609 4.2365 9.93242 4.85109 10.906C3.79636 10.906 2.46971 9.45955 2.27581 9.03484C0.914915 6.05549 5.03242 5.5336 5.03262 1.00017C5.42737 0.981151 7.15575 2.55241 7.51966 3.00009C8.35341 4.02683 9 5.51439 9 6.94118C9 8.36797 8.21682 11 5.84955 11C6.61825 10.4919 7.35065 9.28954 6.59992 8.38316C6.06003 7.73023 5.94763 6.88907 6.02269 6C5.20025 6.63359 3.94254 7.55921 4.01414 8.76961Z"
            fill="#F69414"
          />
        </svg>
      )
    } else if (value >= lowThreshold && value < highThreshold) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M9.10036 3.90006C8.86617 4.74994 8.63724 5.21659 7.87444 6C7.87444 6 8.49939 1.2 5.04465 0C5.04465 0 4.73268 3.3001 3.17286 4.50002C1.61304 5.69994 -1.50678 9.30002 4.73252 12C4.73252 12 1.61271 8.70006 5.66858 6.2999C5.66858 6.2999 5.35645 7.49998 6.91644 8.70006C8.47643 9.90014 6.91644 12 6.91644 12C6.91644 12 14.4049 10.2 9.10036 3.90006Z"
            fill="url(#paint0_linear_1760_22272)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_1760_22272"
              x1="5.5"
              y1="1.04929e-08"
              x2="6"
              y2="11"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FFC014" />
              <stop offset="1" stop-color="#E1560B" />
            </linearGradient>
          </defs>
        </svg>
      )
    } else {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3.41769 12C2.79669 10.95 3.11694 10.192 3.70268 9.564C4.43393 8.75333 4.64018 7.79733 4.64018 7.79733C4.64018 7.79733 5.54692 8.514 5.54692 9.564C6.61566 8.51867 6.52416 6.93733 6.37792 6.31067C9.1514 8.33333 9.53389 9.65867 8.12465 12C15.6081 8.32 10.1234 2.80133 9.15215 2.216C9.49189 2.84267 9.54064 3.88867 8.85965 4.39C7.74216 0.710666 4.97242 0 4.97242 0C5.31217 1.88133 3.80618 3.93 2.34819 5.47733C2.29944 4.72467 2.25069 4.22267 1.76545 3.47067C1.66795 4.85067 0.452956 5.93733 0.113208 7.31733C-0.324789 9.19867 0.452956 10.5367 3.41769 12Z"
            fill="url(#paint0_linear_1760_23977)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_1760_23977"
              x1="4.8"
              y1="-3.27273"
              x2="5.6945"
              y2="10.3836"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FFC014" />
              <stop offset="1" stop-color="#EB2B00" />
            </linearGradient>
          </defs>
        </svg>
      )
    }
  }

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div>{getIcon()}</div>
      <div
        className={cn(
          'text-sm font-normal',
          value < lowThreshold
            ? 'text-[#F69414]'
            : value >= lowThreshold && value < highThreshold
              ? 'text-[#FF7811]'
              : 'text-[#FF4314]'
        )}
      >
        {formatAmount(value)}
      </div>
    </div>
  )
}

export default Hot
