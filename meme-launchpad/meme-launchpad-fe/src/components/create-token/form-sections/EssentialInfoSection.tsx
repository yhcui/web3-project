'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PercentageInput } from '@/components/ui/percentage-input'
import type { FormData } from '../schemas/tokenFormSchema'
import { TabConfig } from '../config/tabConfig'
import { ContractPreview } from '@/components/ContractPreview'
import { DateTimePicker } from '../components/DateTimePicker'
import { InlineFormLabel } from '../components/InlineFormLabel'
import { InfoTooltip } from '../components/InfoTooltip'
import { useCalculateInitialBuyBNB } from '@/contracts/hooks/coinrollCore/useCalculateInitialBuyBNB'
import { COINROLL_CORE_CONSTANTS } from '@/contracts/types/coinrollCore'
import { TokenUtilityAllocation } from '../components/TokenUtilityAllocation'
import { ChevronArrow } from '../components/ChevronArrow'
import type { AllocationModule } from '../schemas/tokenFormSchema'

interface EssentialInfoSectionProps {
  form: UseFormReturn<FormData>
  config: TabConfig
  onContractPreview?: (data: {
    predictedAddress?: string
    digits?: string
  }) => void
}

export function EssentialInfoSection({
  form,
  config,
  onContractPreview,
}: EssentialInfoSectionProps) {
  const t = useTranslations()

  // State for address mode selection
  const [addressMode, setAddressMode] = useState<'random' | 'custom'>('random')
  const [customDigits, setCustomDigits] = useState<string>('')
  const [digitsError, setDigitsError] = useState<string>('')

  // State for token utility expansion
  const [showTokenUtility, setShowTokenUtility] = useState(false)
  const [tokenAllocations, setTokenAllocations] = useState<AllocationModule[]>(
    []
  )

  // Watch form values for the contract preview
  const tokenName = form.watch('coinName')
  const tokenSymbol = form.watch('symbol')

  // Watch preBuy percentage for BNB calculation
  const preBuyPercentage = form.watch('preBuy') || 0

  // Calculate BNB required based on prebuy percentage
  const calculationParams = useMemo(() => {
    if (!preBuyPercentage || preBuyPercentage === 0) return undefined

    // Convert percentage to basis points (1% = 100 BP)
    // Cap at 99.9% (9990 BP) as per max input
    const cappedPercentage = Math.min(preBuyPercentage, 99.9)
    const percentageBP = Math.round(cappedPercentage * 100)
    return {
      saleAmount: COINROLL_CORE_CONSTANTS.DEFAULT_SALE_AMOUNT,
      virtualBNBReserve: COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_BNB_RESERVE,
      virtualTokenReserve:
        COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_TOKEN_RESERVE,
      percentageBP,
    }
  }, [preBuyPercentage])

  const { bnbRequiredFormatted, isLoading: isCalculating } =
    useCalculateInitialBuyBNB(calculationParams)

  // Format BNB amount for display
  const displayBNB = useMemo(() => {
    if (!bnbRequiredFormatted || preBuyPercentage === 0) return '0'
    // Format to 4 decimal places
    const bnbValue = parseFloat(bnbRequiredFormatted)
    return bnbValue.toFixed(4)
  }, [bnbRequiredFormatted, preBuyPercentage])

  // Calculate USD value (assuming BNB price - you might want to fetch this from an API)
  const bnbPriceUSD = 600 // You can replace this with actual price fetching
  const displayUSD = useMemo(() => {
    const bnbValue = parseFloat(displayBNB)
    const usdValue = bnbValue * bnbPriceUSD
    return usdValue.toFixed(2)
  }, [displayBNB])

  // Validate hex digits input
  const handleDigitsChange = (value: string) => {
    // Allow only hex characters (0-9, a-f, A-F) and limit to 4
    const hexValue = value
      .toLowerCase()
      .replace(/[^0-9a-f]/gi, '')
      .slice(0, 4)
    setCustomDigits(hexValue)

    // Validate
    if (hexValue && hexValue.length !== 4) {
      setDigitsError(t('createToken.settings.digitsError'))
    } else {
      setDigitsError('')
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-[#FFFFFF]">
        {t('createToken.form.essentialInfo')}
      </h3>
      <div className="space-y-6 rounded-2xl border-[#252832] bg-[#1B1E25] p-2 md:border md:p-5">
        {/* New Coin Mode: Pre-Buy */}
        {config.features.showPreBuy && (
          <>
            <div className="space-y-4 rounded-2xl border-[#252832] bg-[#1B1E25] md:border-none md:bg-transparent md:p-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-base font-bold text-[#F0F1F5]">
                      {t('createToken.preBuy.title')}
                    </span>
                    <span className="text-sm text-[#656A79]">
                      {t('createToken.form.optional')}
                    </span>
                  </div>
                  <p className="text-sm text-[#656A79]">
                    {t('createToken.preBuy.description')
                      .split(/(up to \d+\.?\d*%|最多\s*\d+\.?\d*%)/gi)
                      .map((part, index) => {
                        if (
                          /(up to \d+\.?\d*%|最多\s*\d+\.?\d*%)/gi.test(part)
                        ) {
                          return (
                            <span key={index} className="text-[#BFFB06]">
                              {part}
                            </span>
                          )
                        }
                        return part
                      })}
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="preBuy"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <PercentageInput
                        value={field.value}
                        onChange={field.onChange}
                        onQuickSelect={(value) =>
                          form.setValue('preBuy', value, {
                            shouldValidate: true,
                          })
                        }
                        showQuickSelect={true}
                        min={0}
                        max={99.9}
                        placeholder="0"
                        inputClassName="h-[50px] border-0 bg-[#15181E] pr-12 pl-4 !text-2xl font-bold text-[#F0F1F5]"
                        percentSymbolClassName="text-2xl font-bold text-[#FFFFFF]"
                        quickSelectOptions={[
                          { label: '10%', value: 10 },
                          { label: '25%', value: 25 },
                          { label: '50%', value: 50 },
                        ]}
                      />
                    </FormControl>
                    {fieldState.error && (
                      <span className="ml-2 text-sm text-red-500">
                        {fieldState.error.message}
                      </span>
                    )}
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#656A79]">
                    {t('createToken.preBuy.cost')}
                  </span>
                  <span className="font-bold text-[#F0F1F5]">
                    {isCalculating ? '...' : `${displayBNB} BNB`}
                  </span>
                  <span className="text-[#656A79]">
                    {isCalculating ? '...' : `$${displayUSD}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTokenUtility(!showTokenUtility)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#252832] p-3 transition-colors hover:bg-[#2B3139]"
                >
                  <span
                    className={`text-sm ${showTokenUtility ? 'text-[#FBD437]' : 'text-[#656A79]'}`}
                  >
                    {t('createToken.preBuy.tokenUtilityExplanation')}
                  </span>
                  <ChevronArrow expanded={showTokenUtility} />
                </button>
              </div>

              {/* Token Utility Allocation Section - Expandable */}
              {showTokenUtility && (
                <div className="mt-4">
                  <TokenUtilityAllocation
                    initialAllocations={tokenAllocations}
                    onChange={(allocations) => {
                      setTokenAllocations(allocations)
                      // Update form data with allocations
                      form.setValue('preBuyAllocations', allocations as any)
                    }}
                  />
                </div>
              )}
            </div>
            <div className="border-[#252832] md:border-t" />
          </>
        )}

        {/* IDO Mode: IDO Settings */}
        {config.features.showIDOSettings && (
          <>
            <div className="space-y-4">
              <h4 className="text-base font-bold text-[#F0F1F5]">
                {t('createToken.ido.settings')}
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="idoPrice"
                  render={({ field }) => (
                    <FormItem>
                      <InlineFormLabel name="idoPrice">
                        {t('createToken.ido.price')}
                      </InlineFormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className="h-[50px] text-[#F0F1F5] border-[#2B3139] bg-[#191B22]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idoSupply"
                  render={({ field }) => (
                    <FormItem>
                      <InlineFormLabel name="idoSupply">
                        {t('createToken.ido.supply')}
                      </InlineFormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className="h-[50px] text-[#F0F1F5] border-[#2B3139] bg-[#191B22]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="border-[#252832] md:border-t" />
          </>
        )}

        {/* Burning Mode: Burning Settings */}
        {config.features.showBurningSettings && (
          <>
            <div className="space-y-4">
              <h4 className="text-base font-bold text-[#F0F1F5]">
                {t('createToken.burning.settings')}
              </h4>

              <FormField
                control={form.control}
                name="burnRate"
                render={({ field }) => (
                  <FormItem>
                    <InlineFormLabel name="burnRate">
                      {t('createToken.burning.rate')}
                    </InlineFormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className="h-[50px] border-[#2B3139] bg-[#191B22]"
                        />
                      </FormControl>
                      <span className="text-xl font-bold text-[#FFFFFF]">
                        %
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="burnSchedule"
                render={({ field }) => (
                  <FormItem>
                    <InlineFormLabel name="burnSchedule">
                      {t('createToken.burning.schedule')}
                    </InlineFormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value as string}
                    >
                      <FormControl>
                        <SelectTrigger className="h-[50px] border-[#2B3139] bg-[#191B22]">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hourly">
                          {t('createToken.burning.hourly')}
                        </SelectItem>
                        <SelectItem value="daily">
                          {t('createToken.burning.daily')}
                        </SelectItem>
                        <SelectItem value="weekly">
                          {t('createToken.burning.weekly')}
                        </SelectItem>
                        <SelectItem value="monthly">
                          {t('createToken.burning.monthly')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="border-[#252832] md:border-t" />
          </>
        )}

        {/* New Coin Mode: Add Margin */}
        {config.features.showAddMargin && (
          <>
            <FormField
              control={form.control}
              name="addMargin"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2 text-base font-bold text-[#F0F1F5]">
                      <span>{t('createToken.settings.addMargin')}</span>
                      <InfoTooltip
                        content={t('createToken.settings.addMarginTooltip')}
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

            {/* Margin Fields - shown when switch is on */}
            {form.watch('addMargin') && (
              <div className="flex flex-col items-center gap-6 pt-4">
                {/* Margin Amount Field */}
                <FormField
                  control={form.control}
                  name="marginAmount"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="relative flex-1">
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*\.?[0-9]*"
                              placeholder={t(
                                'createToken.margin.amountPlaceholder'
                              )}
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value
                                // Allow empty string, numbers, and decimal point
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  field.onChange(
                                    value === ''
                                      ? 0
                                      : parseFloat(value) || value
                                  )
                                }
                              }}
                              onBlur={(e) => {
                                // Clean up the value on blur
                                const value = parseFloat(e.target.value) || 0
                                field.onChange(value)
                              }}
                              className="h-[50px] border-0 bg-[#15181E] pr-16 pl-4 text-base font-normal text-[#F0F1F5] placeholder:text-[#3F475A]"
                            />
                          </FormControl>
                          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xl font-bold text-[#FFFFFF]">
                            BNB
                          </span>
                        </div>

                        <div className="flex gap-2.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => form.setValue('marginAmount', 10)}
                            className="h-10 min-w-[108px] bg-[#252832] px-2 text-base font-medium text-[#656A79] hover:bg-[#2B3139]"
                          >
                            10 BNB
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => form.setValue('marginAmount', 100)}
                            className="h-10 min-w-[108px] bg-[#252832] px-2 text-base font-medium text-[#656A79] hover:bg-[#2B3139]"
                          >
                            100 BNB
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => form.setValue('marginAmount', 200)}
                            className="h-10 min-w-[108px] bg-[#252832] px-2 text-base font-medium text-[#656A79] hover:bg-[#2B3139]"
                          >
                            200 BNB
                          </Button>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Time Field */}
                <FormField
                  control={form.control}
                  name="marginTime"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <InlineFormLabel name="marginTime">
                        {t('createToken.margin.time')}
                      </InlineFormLabel>
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="relative flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder={t(
                                'createToken.margin.timePlaceholder'
                              )}
                              {...field}
                              value={field.value || ''}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              className="h-[50px] border-0 bg-[#15181E] pr-10 pl-4 text-base font-normal text-[#F0F1F5] placeholder:text-[#3F475A]"
                            />
                          </FormControl>
                          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xl font-bold text-[#FFFFFF]">
                            d
                          </span>
                        </div>

                        <div className="flex gap-2.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => form.setValue('marginTime', 7)}
                            className="h-10 min-w-[108px] bg-[#252832] px-2 text-base font-medium text-[#656A79] hover:bg-[#2B3139]"
                          >
                            7 d
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => form.setValue('marginTime', 30)}
                            className="h-10 min-w-[108px] bg-[#252832] px-2 text-base font-medium text-[#656A79] hover:bg-[#2B3139]"
                          >
                            30 d
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => form.setValue('marginTime', 60)}
                            className="h-10 min-w-[108px] bg-[#252832] px-2 text-base font-medium text-[#656A79] hover:bg-[#2B3139]"
                          >
                            60 d
                          </Button>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="border-[#252832] md:border-t" />
          </>
        )}

        {/* New Coin Mode: Token Launch Reservation */}
        {config.features.showTokenLaunchReservation && (
          <>
            <FormField
              control={form.control}
              name="tokenLaunchReservation"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-1 text-base font-bold text-[#F0F1F5]">
                      <span>
                        {t('createToken.settings.tokenLaunchReservation')}
                      </span>
                      <InfoTooltip
                        content={t(
                          'createToken.settings.tokenLaunchReservationTooltip'
                        )}
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

            {/* Reservation Date Field - shown when switch is on */}
            {form.watch('tokenLaunchReservation') && (
              <div className="pt-2">
                <FormField
                  control={form.control}
                  name="tokenLaunchReservationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <DateTimePicker
                          value={field.value}
                          onChange={(date) =>
                            field.onChange(date?.toISOString())
                          }
                          placeholder={t(
                            'createToken.reservation.selectDateTime'
                          )}
                          className="rounded-lg"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="border-[#252832] md:border-t" />
          </>
        )}

        {/* New Coin Mode: Official Contact */}
        {config.features.showOfficialContact && (
          <>
            <FormField
              control={form.control}
              name="officialContact"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2 text-base font-bold text-[#F0F1F5]">
                      <span>{t('createToken.settings.officialContact')}</span>
                      <InfoTooltip
                        content={t(
                          'createToken.settings.officialContactTooltip'
                        )}
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
                          placeholder={t(
                            'createToken.contact.telegramPlaceholder'
                          )}
                          {...field}
                          value={field.value || ''}
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
                          placeholder={t(
                            'createToken.contact.emailPlaceholder'
                          )}
                          {...field}
                          value={field.value || ''}
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

            <div className="border-[#252832] md:border-t" />
          </>
        )}

        {/* Contract Preview - Shared across all modes */}
        <div className="space-y-4">
          <h4 className="text-base font-bold text-[#F0F1F5]">
            {t('createToken.settings.contractPreview')}
          </h4>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => {
                setAddressMode('random')
                setCustomDigits('')
                setDigitsError('')
              }}
              className={`flex-1 border ${
                addressMode === 'random'
                  ? 'border-[] bg-[#252832] text-[#fefefe]'
                  : 'border-transparent bg-[#242832] text-[#fefefe] hover:border-[] hover:bg-[#252832] hover:text-[#fefefe]'
              }`}
            >
              {t('createToken.settings.last4RandomDigits')}
            </Button>
            <Button
              type="button"
              onClick={() => setAddressMode('custom')}
              className={`flex-1 border ${
                addressMode === 'custom'
                  ? 'border-[] bg-[#2B3139] text-[]'
                  : 'border-transparent bg-[#242832] text-[#656A79] hover:border-[] hover:bg-[#2B3139] hover:text-[]'
              }`}
            >
              {t('createToken.settings.customizeLast4Digits')}
            </Button>
          </div>

          {/* Custom Digits Input - Show when custom mode is selected */}
          {addressMode === 'custom' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4 rounded-lg bg-[#15181E] px-4 py-[14px]">
                <input
                  type="text"
                  value={customDigits}
                  onChange={(e) => handleDigitsChange(e.target.value)}
                  placeholder={t('createToken.settings.digitsPlaceholder')}
                  maxLength={4}
                  className="h-auto w-full border-0 bg-transparent p-0 text-base font-medium text-[#FFFFFF] placeholder:text-[#656A79] focus:ring-0 focus:outline-none"
                />
                <span className="text-base text-nowrap text-[#656A79]">
                  {t('createToken.settings.digitsHint')}
                </span>
              </div>
              {digitsError && (
                <p className="text-sm text-red-500">{digitsError}</p>
              )}
            </div>
          )}

          <ContractPreview
            key={addressMode} // Reset the component when mode changes
            tokenName={tokenName}
            tokenSymbol={tokenSymbol}
            digits={addressMode === 'custom' ? customDigits : ''}
            className="mt-4"
            onAddressCalculated={onContractPreview}
          />
        </div>
      </div>
    </div>
  )
}
