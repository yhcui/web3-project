import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ActivityPlayType, ActivityRewardTokenType } from '@/enums/activities'
import { UseFormReturn } from 'react-hook-form'
import { FormDataSchema } from './EventForm'
import { cn } from '@/lib/utils'
import { z } from 'zod'
import { useTranslations } from 'next-intl'

interface PlayFormFieldProps {
  form: UseFormReturn<z.infer<typeof FormDataSchema>>
}

export default function PlayFormField({ form }: PlayFormFieldProps) {
  const t = useTranslations('profile.createEvent')
  if (form.watch('playType') === ActivityPlayType.Trade) {
    const rewardTokenSymbol = form.watch('rewardTokenType')
    return (
      <FormField
        control={form.control}
        name="minDailyTradeAmount"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <div className="w-[280px] shrink-0 text-[18px] font-bold text-[#656A79]">
              {t('minDailyTradeAmount')}
            </div>
            <FormControl>
              <div
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg border border-[#2B3139] bg-[#191B22] focus-within:border-[] hover:border-[]',
                  form.formState.errors.minDailyTradeAmount && 'border-red-600'
                )}
              >
                <Input
                  {...field}
                  className={cn(
                    'h-10 flex-1 border-none text-[18px] text-[#191B22] text-white placeholder:text-[#656A79]'
                  )}
                  placeholder="0"
                />
                <span className="w-18 pr-4 text-right font-bold text-white">
                  {rewardTokenSymbol === ActivityRewardTokenType.Token
                    ? 'TOKEN'
                    : rewardTokenSymbol === ActivityRewardTokenType.BNB
                      ? 'BNB'
                      : 'USDT'}
                </span>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    )
  }

  if (form.watch('playType') === ActivityPlayType.Invite) {
    return (
      <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
        <FormField
          control={form.control}
          name="inviteMinCount"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <div className="w-[60px] shrink-0 text-[18px] font-bold text-[#656A79]">
                {t('inviteMinCount')}
              </div>
              <FormControl>
                <div
                  className={cn(
                    'flex w-28 items-center gap-2 rounded-lg border border-[#2B3139] bg-[#191B22] focus-within:border-[] hover:border-[]',
                    form.formState.errors.inviteMinCount && 'border-red-600'
                  )}
                >
                  <Input
                    {...field}
                    className={cn(
                      'h-10 w-24 flex-1 border-none text-[18px] text-[#191B22] text-white placeholder:text-[#656A79]'
                    )}
                    placeholder="0"
                  />
                  <span className="w-10 pr-2 text-right font-bold text-white">
                    个
                  </span>
                </div>
              </FormControl>
              <div className="text-[18px] font-bold text-[#656A79]">
                {t('inviteeMinTradeAmount')}
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="inviteeMinTradeAmount"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <div className="w-[80px] shrink-0 text-[18px] font-bold text-[#656A79]">
                {t('inviteeMinTradeAmountUnit')}
              </div>
              <FormControl>
                <div
                  className={cn(
                    'flex w-32 items-center gap-2 rounded-lg border border-[#2B3139] bg-[#191B22] focus-within:border-[] hover:border-[]',
                    form.formState.errors.inviteeMinTradeAmount &&
                      'border-red-600'
                  )}
                >
                  <Input
                    {...field}
                    className={cn(
                      'h-10 flex-1 border-none text-[18px] text-[#191B22] text-white placeholder:text-[#656A79]'
                    )}
                    placeholder="0"
                  />
                  <span className="w-18 pr-4 text-right font-bold text-white">
                    USDT
                  </span>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    )
  }

  if (form.watch('playType') === ActivityPlayType.HeatVote) {
    return (
      <FormField
        control={form.control}
        name="heatVoteTarget"
        render={({ field }) => (
          <FormItem className="flex items-start gap-2">
            <div className="w-[200px] shrink-0 text-[18px] leading-[40px] font-bold text-[#656A79]">
              {t('heatVoteTarget')}
            </div>
            <FormControl>
              <div className="w-full">
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg border border-[#2B3139] bg-[#191B22] focus-within:border-[] hover:border-[]',
                    form.formState.errors.heatVoteTarget && 'border-red-600'
                  )}
                >
                  <Input
                    {...field}
                    className={cn(
                      'h-10 flex-1 border-none text-[18px] text-[#191B22] text-white placeholder:text-[#656A79]'
                    )}
                    placeholder={t('heatVoteTargetPlaceholder')}
                  />
                  <span className="w-18 pr-4 text-right font-bold text-white">
                    {t('heatVoteTargetUnit')}
                  </span>
                </div>
                <div className="mt-2 text-right text-xs text-[#656A79]">
                  {t('heatVoteTargetValue')}
                  <span className="text-[]">{0.8} BNB</span>
                </div>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    )
  }

  if (form.watch('playType') === ActivityPlayType.Comment) {
    return (
      <FormField
        control={form.control}
        name="commentMinCount"
        render={({ field }) => (
          <FormItem className="flex items-start gap-2">
            <div className="w-[200px] shrink-0 text-[18px] leading-[40px] font-bold text-[#656A79]">
              {t('commentMinCount')}
            </div>
            <FormControl>
              <div className="w-full">
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg border border-[#2B3139] bg-[#191B22] focus-within:border-[] hover:border-[]',
                    form.formState.errors.commentMinCount && 'border-red-600'
                  )}
                >
                  <Input
                    {...field}
                    className={cn(
                      'h-10 flex-1 border-none text-[18px] text-[#191B22] text-white placeholder:text-[#656A79]'
                    )}
                    placeholder="0"
                  />
                  <span className="w-18 pr-4 text-right font-bold text-white">
                    {t('commentMinCountUnit')}
                  </span>
                </div>
                <div className="mt-2 text-right text-xs text-[#656A79]">
                  {t('commentMinCountValue')}
                  <span className="text-[]">{0.8} BNB</span>
                </div>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    )
  }
}
