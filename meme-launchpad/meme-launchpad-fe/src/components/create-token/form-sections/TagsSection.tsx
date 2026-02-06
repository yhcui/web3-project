'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { AVAILABLE_TAGS } from '../config/tabConfig'

interface TagsSectionProps {
  selectedTags: string[]
  onToggleTag: (tagKey: string) => void
}

export function TagsSection({ selectedTags, onToggleTag }: TagsSectionProps) {
  const t = useTranslations()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-base font-bold text-[#F0F1F5]">
            {t('createToken.form.tag')}
          </span>
          <span className="text-base font-bold text-[#BFFB06]">
            {t('createToken.form.required')}
          </span>
        </div>
        <span className="text-sm text-[#656A79]">
          {t('createToken.form.selectUpTo3')}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_TAGS.map((tag) => (
          <button
            key={tag.key}
            type="button"
            onClick={() => onToggleTag(tag.key)}
            className={cn(
              'h-10 w-16 rounded-lg border text-nowrap transition-colors md:h-12 md:w-30 md:px-4 md:py-3',
              selectedTags.includes(tag.key)
                ? 'border-[#BFFB06] bg-[#191B22] text-[#BFFB06]'
                : 'border-[#2B3139] bg-[#191B22] text-[#656A79] hover:border-[#BFFB06]'
            )}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  )
}
