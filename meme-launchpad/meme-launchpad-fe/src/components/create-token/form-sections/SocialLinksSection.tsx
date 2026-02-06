'use client'

import React from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { FormData } from '../schemas/tokenFormSchema'
import { FlameIcon } from '../components/FlameIcon'

interface SocialLinksConfig {
  name: keyof FormData
  icon: string
  iconSize: { width: number; height: number }
  placeholder: string
}

const SOCIAL_LINKS: SocialLinksConfig[] = [
  {
    name: 'twitter' as keyof FormData,
    icon: '/icons/twitter.svg',
    iconSize: { width: 11, height: 10 },
    placeholder: 'createToken.placeholders.twitter',
  },
  {
    name: 'discord' as keyof FormData,
    icon: '/icons/discord.svg',
    iconSize: { width: 13, height: 10 },
    placeholder: 'createToken.placeholders.discord',
  },
  {
    name: 'telegram' as keyof FormData,
    icon: '/icons/telegram.svg',
    iconSize: { width: 11, height: 9 },
    placeholder: 'createToken.placeholders.telegram',
  },
  {
    name: 'website' as keyof FormData,
    icon: '/icons/globe.svg',
    iconSize: { width: 13, height: 13 },
    placeholder: 'createToken.placeholders.website',
  },
  {
    name: 'whitepaper' as keyof FormData,
    icon: '/icons/document.svg',
    iconSize: { width: 10, height: 13 },
    placeholder: 'createToken.placeholders.whitepaper',
  },
]

interface SocialLinksSectionProps {
  form: UseFormReturn<FormData>
}

export function SocialLinksSection({ form }: SocialLinksSectionProps) {
  const t = useTranslations()

  return (
    <div className="space-y-4 rounded-xl">
      <h3 className="text-base font-bold text-[#FFFFFF]">
        {t('createToken.form.socialPlatform')}
      </h3>

      {SOCIAL_LINKS.map((social) => (
        <FormField
          key={social.name}
          control={form.control}
          name={social.name}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <div className="relative flex items-center gap-2 rounded-lg border border-[#2B3139] bg-[#191B22] px-4 py-3 transition-colors focus-within:border-[] hover:border-[]">
                  <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#252832]">
                    <Image
                      src={social.icon}
                      alt={social.name}
                      width={social.iconSize.width}
                      height={social.iconSize.height}
                    />
                  </div>
                  <Input
                    placeholder={t(social.placeholder)}
                    {...field}
                    className="h-8 flex-1 border-0 bg-transparent p-0 text-[#F0F1F5] placeholder:text-[#656A79] focus-visible:ring-0"
                  />
                  {fieldState.error && (
                    <span className="text-sm text-red-500">
                      {fieldState.error.message}
                    </span>
                  )}
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      ))}
    </div>
  )
}
