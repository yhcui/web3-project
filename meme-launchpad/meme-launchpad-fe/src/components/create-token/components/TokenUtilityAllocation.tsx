'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AllocationModule } from '../schemas/tokenFormSchema'

export type { AllocationModule }

interface TokenUtilityAllocationProps {
  initialAllocations?: AllocationModule[]
  onChange?: (allocations: AllocationModule[]) => void
}

export function TokenUtilityAllocation({
  initialAllocations = [],
  onChange,
}: TokenUtilityAllocationProps) {
  const t = useTranslations()
  const [allocations, setAllocations] = useState<AllocationModule[]>(
    initialAllocations.length > 0
      ? initialAllocations.map((a) => ({
          ...a,
          lockTime: a.lockTime || 0,
          lockTimeValue: a.lockTimeValue || 0,
          lockTimeUnit: a.lockTimeUnit || 'days',
        }))
      : [
          {
            id: '1',
            percentage: 0,
            type: 'normal',
            lockTime: 0,
            lockTimeValue: 0,
            lockTimeUnit: 'days',
            name: '',
            description: '',
          },
        ]
  )

  // Calculate total percentage
  const totalPercentage = useMemo(() => {
    return allocations.reduce(
      (sum, allocation) => sum + allocation.percentage,
      0
    )
  }, [allocations])

  const remainingPercentage = useMemo(() => {
    return Math.max(0, 100 - totalPercentage)
  }, [totalPercentage])

  // Add new allocation module
  const addAllocation = useCallback(() => {
    const newAllocation: AllocationModule = {
      id: Date.now().toString(),
      percentage: 0,
      type: 'normal',
      lockTime: 0,
      lockTimeValue: 0,
      lockTimeUnit: 'days',
      name: '',
      description: '',
    }
    const newAllocations = [...allocations, newAllocation]
    setAllocations(newAllocations)
    onChange?.(newAllocations)
  }, [allocations, onChange])

  // Remove allocation module
  const removeAllocation = useCallback(
    (id: string) => {
      const newAllocations = allocations.filter(
        (allocation) => allocation.id !== id
      )
      setAllocations(newAllocations)
      onChange?.(newAllocations)
    },
    [allocations, onChange]
  )

  // Update allocation field
  const updateAllocation = useCallback(
    (id: string, field: keyof AllocationModule, value: any) => {
      const newAllocations = allocations.map((allocation) => {
        if (allocation.id === id) {
          // For percentage, ensure it doesn't exceed 100 when combined with others
          if (field === 'percentage') {
            const otherTotal = allocations
              .filter((a) => a.id !== id)
              .reduce((sum, a) => sum + a.percentage, 0)
            const maxAllowed = 100 - otherTotal
            const validatedValue = Math.min(Math.max(0, value), maxAllowed)
            return { ...allocation, [field]: validatedValue }
          }
          return { ...allocation, [field]: value }
        }
        return allocation
      })
      setAllocations(newAllocations)
      onChange?.(newAllocations)
    },
    [allocations, onChange]
  )

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-base font-semibold text-white">
            {t('createToken.preBuy.overallProgress')}:{' '}
            <span className="!text-[#FBD437]">{totalPercentage}%</span>
          </span>
          <span className="text-base font-semibold text-white">
            {t('createToken.preBuy.left')}:{' '}
            <span className="!text-[#FBD437]">{remainingPercentage}%</span>
          </span>
        </div>
        <button
          type="button"
          onClick={addAllocation}
          disabled={totalPercentage >= 100}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2B3139] transition-colors hover:bg-[#323742] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 0.5V11.5"
              stroke="#FBD437"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M0.5 6H11.5"
              stroke="#FBD437"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Allocation Modules */}
      <div className="space-y-3">
        {allocations.map((allocation) => (
          <div key={allocation.id} className="space-y-3">
            {/* Main Row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-1">
                {/* Percentage Input */}
                <div className="flex h-10 items-center gap-1 rounded-lg bg-[#15181E] px-2.5">
                  <input
                    value={allocation.percentage}
                    onChange={(e) =>
                      updateAllocation(
                        allocation.id,
                        'percentage',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-8 bg-transparent text-sm font-medium text-white outline-none placeholder:text-[#656A79] md:w-12"
                    placeholder="0"
                  />
                  <span className="text-base font-bold text-[#F0F1F5]">%</span>
                </div>

                {/* Type Selector */}
                <Select
                  value={allocation.type}
                  onValueChange={(value: 'normal' | 'locked') => {
                    // Batch all updates in a single state change
                    const newAllocations = allocations.map((alloc) => {
                      if (alloc.id === allocation.id) {
                        const updates: Partial<AllocationModule> = {
                          type: value,
                        }

                        // Initialize lock time values when switching to locked
                        if (value === 'locked' && !alloc.lockTimeValue) {
                          updates.lockTimeValue = 30
                          updates.lockTimeUnit = 'days'
                          updates.lockTime = 30 * 24 * 60 * 60
                        }

                        return { ...alloc, ...updates }
                      }
                      return alloc
                    })

                    setAllocations(newAllocations)
                    onChange?.(newAllocations)
                  }}
                >
                  <SelectTrigger className="h-10 w-[100px] border-0 bg-[#15181E] text-sm font-medium text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">
                      {t('createToken.preBuy.normal')}
                    </SelectItem>
                    <SelectItem value="locked">
                      {t('createToken.preBuy.locked')}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Lock Time Input - only show when type is 'locked' */}
                {allocation.type === 'locked' && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={allocation.lockTimeValue || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        const unit = allocation.lockTimeUnit || 'days'
                        let seconds = 0
                        if (unit === 'days') seconds = value * 24 * 60 * 60
                        else if (unit === 'hours') seconds = value * 60 * 60
                        else if (unit === 'minutes') seconds = value * 60

                        // Batch update all related fields in a single state change
                        const newAllocations = allocations.map((alloc) => {
                          if (alloc.id === allocation.id) {
                            return {
                              ...alloc,
                              lockTimeValue: value,
                              lockTime: seconds,
                            }
                          }
                          return alloc
                        })
                        setAllocations(newAllocations)
                        onChange?.(newAllocations)
                      }}
                      className="h-10 w-16 rounded-lg bg-[#15181E] px-2 text-center text-sm font-medium text-white outline-none"
                      min="0"
                    />
                    <Select
                      value={allocation.lockTimeUnit || 'days'}
                      onValueChange={(unit: 'days' | 'hours' | 'minutes') => {
                        const value = allocation.lockTimeValue || 0
                        let seconds = 0
                        if (unit === 'days') seconds = value * 24 * 60 * 60
                        else if (unit === 'hours') seconds = value * 60 * 60
                        else if (unit === 'minutes') seconds = value * 60

                        // Batch update all related fields in a single state change
                        const newAllocations = allocations.map((alloc) => {
                          if (alloc.id === allocation.id) {
                            return {
                              ...alloc,
                              lockTimeUnit: unit,
                              lockTime: seconds,
                            }
                          }
                          return alloc
                        })
                        setAllocations(newAllocations)
                        onChange?.(newAllocations)
                      }}
                    >
                      <SelectTrigger className="h-10 w-[80px] border-0 bg-[#15181E] text-sm font-medium text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">d</SelectItem>
                        <SelectItem value="hours">h</SelectItem>
                        <SelectItem value="minutes">m</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Name Input */}
                <input
                  type="text"
                  value={allocation.name}
                  onChange={(e) =>
                    updateAllocation(allocation.id, 'name', e.target.value)
                  }
                  placeholder={t('createToken.preBuy.namePlaceholder')}
                  className="h-10 w-20 rounded-lg bg-[#15181E] px-2.5 text-sm font-medium text-white outline-none placeholder:text-[#656A79] md:w-auto"
                />
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => removeAllocation(allocation.id)}
                disabled={allocations.length === 1}
                className="flex h-6 w-6 items-center justify-center transition-colors hover:bg-[#323742] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  width="14"
                  height="16"
                  viewBox="0 0 14 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 4H13"
                    stroke="#FF6767"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 4V14C12 14.5523 11.5523 15 11 15H3C2.44772 15 2 14.5523 2 14V4"
                    stroke="#FF6767"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 1H10"
                    stroke="#FF6767"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5 7V12"
                    stroke="#FF6767"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 7V12"
                    stroke="#FF6767"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Description Field */}
            <textarea
              value={allocation.description}
              onChange={(e) =>
                updateAllocation(allocation.id, 'description', e.target.value)
              }
              placeholder={t('createToken.preBuy.descriptionPlaceholder')}
              className="w-full resize-none rounded-lg bg-[#15181E] px-2.5 py-2 text-sm text-[#F0F1F5] outline-none placeholder:text-[#656A79]"
              rows={2}
            />
          </div>
        ))}
      </div>

      {/* Warning for exceeding 100% */}
      {totalPercentage > 100 && (
        <div className="rounded-lg bg-red-500/10 p-3">
          <p className="text-sm text-red-500">
            {t('createToken.preBuy.percentageError')}
          </p>
        </div>
      )}
    </div>
  )
}
