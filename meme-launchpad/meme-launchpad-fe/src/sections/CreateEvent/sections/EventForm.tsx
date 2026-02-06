'use client'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ActivityCategoryType,
  ActivityPlayType,
  ActivityRewardTokenType,
} from '@/enums/activities'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { InlineFormLabel } from '@/components/create-token/components/InlineFormLabel'
import { DateTimePicker } from '@/components/create-token/components/DateTimePicker'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import PlayFormField from './PlayFormField'
import { useEffect, useState } from 'react'
import { CreateEventInputSchema } from '@/api/schemas/profile.schema'
import { useCreateEvent } from '@/api/endpoints/profile'
import { notify } from '@/stores/useUIStore'
import { useTranslations } from 'next-intl'
import UploadImage from './UploadImage'
import SideBarImage from '@/assets/profile/event-side-img.jpg'
import Image from 'next/image'
import {
  categoryTypeOptions,
  playTypeOptions,
  rewardTokenTypeOptions,
} from '../config'
import SuccessDialog from './SuccessDialog'

export const FormDataSchema = CreateEventInputSchema

export default function EventForm({
  coverImage,
  tokenId,
  address,
}: {
  coverImage: string
  tokenId: number
  address: string
}) {
  const t = useTranslations('profile.createEvent')
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false)
  const form = useForm<z.infer<typeof FormDataSchema>>({
    resolver: zodResolver(FormDataSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryType: ActivityCategoryType.Airdrop,
      playType: ActivityPlayType.Trade,
      rewardTokenType: ActivityRewardTokenType.BNB,
      rewardAmount: '1',
      rewardSlots: '1',
      minDailyTradeAmount: '1',
      inviteMinCount: '',
      inviteeMinTradeAmount: '',
      heatVoteTarget: '',
      commentMinCount: '',
      coverImage: '',
      tokenId: 0,
      initiatorType: 1,
      audienceType: 4,
      rewardTokenId: 0,
      startAt: '',
      endAt: '',
      rewardTokenAddress: '',
    },
  })

  useEffect(() => {
    if (coverImage || tokenId) {
      form.setValue('tokenId', tokenId)
      form.setValue('rewardTokenId', tokenId)
      form.setValue('rewardTokenAddress', address)
    }
  }, [tokenId, form, address])

  const { mutate: createEvent, isPending } = useCreateEvent()

  const onSubmit = (data: z.infer<typeof FormDataSchema>) => {
    createEvent(data, {
      onSuccess: () => {
        setOpenSuccessDialog(true)
        form.reset()
      },
    })
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-2">
            {/* Left */}
            <div className="space-y-4">
              {/* 活动名称 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <InlineFormLabel
                      name="name"
                      required
                      className="text-[#656A79]"
                    >
                      {t('name')}
                    </InlineFormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-10 border border-[#2B3139] bg-[#191B22] text-[18px] text-[#191B22] text-white placeholder:text-[#656A79]"
                        placeholder={t('namePlaceholder')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 活动描述 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <InlineFormLabel
                      name="description"
                      required
                      className="text-[#656A79]"
                    >
                      {t('description')}
                    </InlineFormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="h-40 border border-[#2B3139] bg-[#191B22] text-[18px] text-[#191B22] text-white placeholder:text-[#656A79]"
                        placeholder={t('descriptionPlaceholder')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 活动类型 */}
              <FormField
                control={form.control}
                name="categoryType"
                render={({ field }) => (
                  <FormItem>
                    <InlineFormLabel
                      name="categoryType"
                      required
                      className="text-[#656A79]"
                    >
                      {t('categoryType')}
                    </InlineFormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full border border-[#2B3139] bg-[#191B22] py-5 text-white hover:border-[] data-[placeholder]:text-[#656A79]">
                            <SelectValue
                              placeholder={t('categoryTypePlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border border-[#2B3139] bg-[#252832] text-[#656A79]">
                          {categoryTypeOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              className="focus:bg-[#252832] focus:text-white"
                              value={option.value.toString()}
                            >
                              {t(option.label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 活动玩法 */}
              <FormField
                control={form.control}
                name="playType"
                render={({ field }) => (
                  <FormItem>
                    <InlineFormLabel
                      name="playType"
                      required
                      className="text-[#656A79]"
                    >
                      {t('playType')}
                    </InlineFormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full border border-[#2B3139] bg-[#191B22] py-5 text-white hover:border-[] data-[placeholder]:text-[#656A79]">
                            <SelectValue
                              placeholder={t('playTypePlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border border-[#2B3139] bg-[#252832] text-[#656A79]">
                          {playTypeOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              className="focus:bg-[#252832] focus:text-white"
                              value={option.value.toString()}
                            >
                              {t(option.label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 空投代币选择 */}
              <FormField
                control={form.control}
                name="rewardTokenType"
                render={({ field }) => (
                  <FormItem className="mt-12 flex items-center gap-2">
                    <FormLabel className="w-[200px] shrink-0 text-[18px] text-[#656A79]">
                      {t('rewardTokenType')}
                    </FormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full border border-[#2B3139] bg-[#191B22] py-5 text-white hover:border-[] data-[placeholder]:text-[#656A79]">
                            <SelectValue
                              placeholder={t('rewardTokenTypePlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border border-[#2B3139] bg-[#252832] text-[#656A79]">
                          {rewardTokenTypeOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              className="focus:bg-[#252832] focus:text-white"
                              value={option.value.toString()}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 空投总量 */}
              <FormField
                control={form.control}
                name="rewardAmount"
                render={({ field, formState: { errors } }) => {
                  const rewardTokenSymbol = form.watch('rewardTokenType')
                  return (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <div className="w-[200px] shrink-0 text-[18px] font-bold text-[#656A79]">
                          {t('rewardAmount')}
                        </div>
                        <FormControl>
                          <div
                            className={cn(
                              'flex w-full items-center gap-2 rounded-lg border border-[#2B3139] bg-[#191B22] focus-within:border-[] hover:border-[]',
                              errors.rewardAmount && 'border-[#e7000b]'
                            )}
                          >
                            <Input
                              {...field}
                              className="h-10 flex-1 border-none text-[18px] text-[#191B22] text-white placeholder:text-[#656A79]"
                              placeholder={t('rewardAmountPlaceholder')}
                            />
                            <span className="w-18 pr-4 text-right font-bold text-white">
                              {rewardTokenSymbol ===
                              ActivityRewardTokenType.Token
                                ? 'TOKEN'
                                : rewardTokenSymbol ===
                                    ActivityRewardTokenType.BNB
                                  ? 'BNB'
                                  : 'USDT'}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )
                }}
              />

              {/* 空投份数 */}
              <FormField
                control={form.control}
                name="rewardSlots"
                render={({ field }) => {
                  const rewardTokenSymbol = form.watch('rewardTokenType')
                  const rewardAmount = form.watch('rewardAmount')
                  return (
                    <FormItem>
                      <div className="flex items-start gap-2">
                        <div className="w-[200px] shrink-0 text-[18px] leading-[40px] font-bold text-[#656A79]">
                          {t('rewardSlots')}
                        </div>
                        <FormControl>
                          <div className="w-full">
                            <Input
                              {...field}
                              className={cn(
                                'h-10 border border-[#2B3139] bg-[#191B22] text-[18px] text-white placeholder:text-[#656A79]',
                                form.formState.errors.rewardSlots &&
                                  'border-red-600'
                              )}
                              placeholder={t('rewardSlotsPlaceholder')}
                            />
                            <div className="mt-2 flex items-center justify-end text-xs text-[]">
                              <p className="text-[#656A79]">
                                {t('rewardTokenSymbol')}
                              </p>
                              <p className="mx-1">
                                {rewardAmount
                                  ? Number(rewardAmount) / Number(field.value)
                                  : '0'}
                              </p>
                              <p>
                                {rewardTokenSymbol ===
                                ActivityRewardTokenType.Token
                                  ? 'TOKEN'
                                  : rewardTokenSymbol ===
                                      ActivityRewardTokenType.BNB
                                    ? 'BNB'
                                    : 'USDT'}
                              </p>
                            </div>
                          </div>
                        </FormControl>
                      </div>
                    </FormItem>
                  )
                }}
              />

              <PlayFormField form={form} />

              {/* 活动时间 */}
              <div className="flex items-center gap-2">
                <div className="ml-auto w-[140px] shrink-0 text-[18px] font-bold text-[#656A79]">
                  {t('time')}
                </div>
                <div className="flex flex-1 flex-col items-center gap-2 md:flex-row">
                  <FormField
                    control={form.control}
                    name="startAt"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <DateTimePicker
                            value={field.value}
                            onChange={(date) =>
                              field.onChange(date?.toISOString())
                            }
                            placeholder={t('timeStartPlaceholder')}
                            className={cn(
                              'rounded-lg border-[#2B3139]',
                              form.watch('startAt') && 'text-white',
                              form.formState.errors.startAt && 'border-red-600'
                            )}
                            showIcon={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="text-[18px] font-bold text-[#656A79]">
                    {t('timeStartTo')}
                  </div>
                  <FormField
                    control={form.control}
                    name="endAt"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <DateTimePicker
                            value={field.value}
                            onChange={(date) =>
                              field.onChange(date?.toISOString())
                            }
                            placeholder={t('timeEndPlaceholder')}
                            className={cn(
                              'rounded-lg border-[#2B3139]',
                              form.watch('endAt') && 'text-white',
                              form.formState.errors.endAt && 'border-red-600'
                            )}
                            showIcon={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isPending}
                className="mt-4 h-10 w-full bg-[#FBD537] text-black hover:bg-[#FBD537]/80"
              >
                {t('createActivity')}
              </Button>
            </div>

            {/* Right */}
            <div>
              {/* Token Logo Upload */}
              <InlineFormLabel
                name="coverImage"
                required
                className="mb-2 text-[#656A79]"
              >
                {t('coverImage')}
              </InlineFormLabel>
              <UploadImage form={form} />
              {/* Contact Info */}
              <div className="mt-6">
                <Image
                  src={SideBarImage}
                  alt="side-bar"
                  className="w-full rounded-xl"
                />
                <div className="-mt-26 space-y-1 px-8 text-white">
                  <h3 className="pb-2 text-base font-bold">
                    {t('sideBar.title')}
                  </h3>
                  <p className="text-sm font-bold">{t('sideBar.contact')}</p>
                  <p className="text-sm font-bold">{t('sideBar.email')}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>
      <SuccessDialog
        open={openSuccessDialog}
        onOpenChange={setOpenSuccessDialog}
      />
    </>
  )
}
