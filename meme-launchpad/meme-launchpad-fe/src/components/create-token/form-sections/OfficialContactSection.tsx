'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { InfoTooltip } from '../components/InfoTooltip'
import { InlineFormLabel } from '../components/InlineFormLabel'
import type { FormData } from '../schemas/tokenFormSchema'

interface OfficialContactSectionProps {
  form: UseFormReturn<FormData>
}

export function OfficialContactSection({ form }: OfficialContactSectionProps) {
  const t = useTranslations()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="officialContact"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <div className="space-y-0.5">
              <FormLabel className="flex items-center gap-2 text-base font-bold text-[#F0F1F5]">
                <span>{t('createToken.settings.officialContact')}</span>
                <InfoTooltip
                  content={t('createToken.settings.officialContactTooltip')}
                />
              </FormLabel>
            </div>
            <FormControl>
              <Switch
                checked={field.value as boolean}
                onCheckedChange={field.onChange}
                className="data-[state=checked]:bg-[#FBD537] data-[state=unchecked]:bg-[#111319]"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Contact Fields - shown when switch is on */}
      {form.watch('officialContact') && (
        <div className="space-y-4 pt-2">
          {/* Telegram Field */}
          <FormField
            control={form.control}
            name="contractTg"
            render={({ field }) => (
              <FormItem>
                <InlineFormLabel name="contractTg" optional>
                  {t('createToken.contact.telegram')}
                </InlineFormLabel>
                <FormControl>
                  <Input
                    placeholder={t('createToken.contact.telegramPlaceholder')}
                    {...field}
                    className="h-[50px] border-[#2B3139] bg-[#191B22] px-4 text-[#F0F1F5] placeholder:text-[#656A79]"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Email Field */}
          <FormField
            control={form.control}
            name="contractEmail"
            render={({ field, fieldState }) => (
              <FormItem>
                <InlineFormLabel name="contractEmail" optional>
                  {t('createToken.contact.email')}
                </InlineFormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('createToken.contact.emailPlaceholder')}
                    {...field}
                    className="h-[50px] border-[#2B3139] bg-[#191B22] px-4 text-[#F0F1F5] placeholder:text-[#656A79]"
                  />
                </FormControl>
                {fieldState.error && (
                  <p className="mt-1 text-sm text-red-500">
                    {fieldState.error.message}
                  </p>
                )}
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="border-t border-[#252832]" />
    </div>
  )
}
