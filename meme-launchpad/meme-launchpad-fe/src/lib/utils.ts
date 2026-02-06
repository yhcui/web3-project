import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string or timestamp into a standardized UTC string.
 * Example output: "August 5th, 2025 5:40 PM - UTC"
 * @param dateInput - The date to format (ISO string, timestamp, or Date object).
 * @param multiLine
 * @returns The formatted UTC date string.
 */
export function formatDateToUTC(
  dateInput: string | number | Date,
  multiLine: boolean = false
): string {
  const date = new Date(dateInput)

  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }

  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date)

  const month = parts.find((p) => p.type === 'month')?.value ?? ''
  const day = parts.find((p) => p.type === 'day')?.value ?? ''
  const hour = parts.find((p) => p.type === 'hour')?.value ?? ''
  const minute = parts.find((p) => p.type === 'minute')?.value ?? ''
  const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value ?? ''

  // 处理序数后缀
  const dayNum = parseInt(day, 10)
  let suffix = 'th'
  if ([1, 21, 31].includes(dayNum)) suffix = 'st'
  else if ([2, 22].includes(dayNum)) suffix = 'nd'
  else if ([3, 23].includes(dayNum)) suffix = 'rd'

  const datePart = `${month} ${dayNum}${suffix}`
  const timePart = `${hour}:${minute} ${dayPeriod.toUpperCase()} - UTC`

  return multiLine ? `${datePart}\n${timePart}` : `${datePart}, ${timePart}`
}

// 合并小数点后面连续的零，使用下标数量表示
export const mergeZero = (value: string) => {
  const parts = value.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  const firstZeroMatch = decimalPart?.match(/^0+/)
  const zeroCount = firstZeroMatch ? firstZeroMatch[0].length : 0

  if (zeroCount < 3) {
    return value
  }

  // 将数字转换为下标表示
  const zeroStr = zeroCount ? String.fromCharCode(0x2080 + zeroCount) : ''

  if (!decimalPart?.slice(zeroCount)) {
    return integerPart
  }

  if (zeroCount) {
    return `${integerPart}.0${zeroStr}${decimalPart?.slice(zeroCount)}`
  }
  return value
}
