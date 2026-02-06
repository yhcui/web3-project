'use client'

import { useTranslations } from 'next-intl'
import { SocialIconWrapper } from '@/components/icons/SocialIconWrapper'

export interface SocialLink {
  type: 'website' | 'x' | 'telegram' | 'discord' | 'whitepaper'
  url: string
}

interface SocialLinksProps {
  links: SocialLink[]
  className?: string
}

// Define the icon mapping and order
const SOCIAL_ICON_CONFIG = {
  website: {
    label: 'website',
  },
  x: {
    label: 'twitter', // Keep label as 'twitter' for translations
  },
  telegram: {
    label: 'telegram',
  },
  discord: {
    label: 'discord',
  },
  whitepaper: {
    label: 'document', // Keep label as 'document' for translations
  },
} as const

// Define the display order
const SOCIAL_ORDER: (keyof typeof SOCIAL_ICON_CONFIG)[] = [
  'website',
  'x',
  'telegram',
  'discord',
  'whitepaper',
]

export function SocialLinks({ links, className = '' }: SocialLinksProps) {
  const t = useTranslations('TokenPage')

  // Sort links according to the defined order
  const sortedLinks = links.sort((a, b) => {
    const orderA = SOCIAL_ORDER.indexOf(a.type)
    const orderB = SOCIAL_ORDER.indexOf(b.type)
    return orderA - orderB
  })

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {sortedLinks.map((link) => {
        const config = SOCIAL_ICON_CONFIG[link.type]

        return (
          <a
            key={link.type}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-3 w-3 items-center justify-center transition-all duration-200"
            aria-label={t(config.label)}
            title={t(config.label)}
          >
            <SocialIconWrapper type={link.type} size={12} interactive={true} />
          </a>
        )
      })}
    </div>
  )
}
