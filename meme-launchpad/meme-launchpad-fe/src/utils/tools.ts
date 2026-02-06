import dayjs from 'dayjs'
import utc from 'dayjs-plugin-utc'
import advancedFormat from 'dayjs/plugin/advancedFormat'

// 类型扩展声明
declare module 'dayjs' {
  interface Dayjs {
    utc(): Dayjs
  }
}

// 初始化插件
dayjs.extend(utc)
dayjs.extend(advancedFormat)

export default dayjs

/**
 * 格式化时间为 UTC 0 的指定格式
 * @param {string|number} input - 时间戳或时间字符串（如 "2024-06-30T22:30:38"）
 * @param {1 | 2} [formatType=1] - 1: "2024-06-30 22:30:38", 2: "January 21st, 7:19 AM - UTC"
 * @returns {string} 格式化后的时间字符串
 */
export const formatToUTC = (
  input: string | number | Date,
  formatType: 1 | 2 | 3 = 1
): string => {
  // 统一处理输入
  let normalizedInput: string | number | Date = input

  // 如果是数字时间戳
  if (typeof input === 'number') {
    // 检测是否为秒级时间戳（10位数字）
    const isSeconds = input <= 9999999999 // 小于 10^10
    normalizedInput = isSeconds ? input * 1000 : input
  }

  // 转换为 UTC 时间
  const date = dayjs(normalizedInput).utc()

  // 返回指定格式
  switch (formatType) {
    case 1:
      return date.format('YYYY-MM-DD HH:mm:ss')
    case 2:
      return `${date.format('MMMM Do, h:mm A')} - UTC`
    case 3:
      return date.format('YYYY-MM-DD')
    default:
      throw new Error('Invalid formatType. Use 1 or 2.')
  }
}

/**
 * 获取时间差标签
 * @param targetTime - 目标时间戳
 * @returns 时间差标签
 */
export function getTimeDiffLabel(targetTime: number): string {
  if (targetTime === 0) {
    return '0h'
  }

  const now = dayjs()
  const target = dayjs(targetTime)
  let diffInSeconds = Math.abs(target.diff(now, 'second')) // 绝对值

  const units = [
    { unit: 'year', label: 'y', seconds: 60 * 60 * 24 * 365 },
    { unit: 'month', label: 'mon', seconds: 60 * 60 * 24 * 30 },
    { unit: 'day', label: 'd', seconds: 60 * 60 * 24 },
    { unit: 'hour', label: 'h', seconds: 60 * 60 },
    { unit: 'minute', label: 'm', seconds: 60 },
    { unit: 'second', label: 's', seconds: 1 },
  ]

  for (const { label, seconds } of units) {
    if (diffInSeconds >= seconds) {
      const value = Math.floor(diffInSeconds / seconds)
      return `${value}${label}`
    }
  }

  return '0s' // 差值小于 1s
}
