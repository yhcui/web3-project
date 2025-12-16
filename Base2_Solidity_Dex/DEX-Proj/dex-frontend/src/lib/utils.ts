import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化数字
export function formatNumber(num: number): string {
  if (num === 0) return '0'
  if (num < 0.001) return '<0.001'
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toFixed(3).replace(/\.?0+$/, '')
}

// 格式化代币数量
export function formatTokenAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (num === 0) return '0'
  if (num < 0.001) return '<0.001'
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toFixed(6).replace(/\.?0+$/, '')
}

// 格式化价格
export function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (num === 0) return '0'
  if (num < 0.0001) return '<0.0001'
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toFixed(6).replace(/\.?0+$/, '')
}

// 缩短地址显示
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

// 计算滑点后的最小接收量
export function calculateMinReceived(amount: string, slippage: number): string {
  const num = parseFloat(amount)
  const minReceived = num * (1 - slippage / 100)
  return minReceived.toString()
}

// 解析输入数量
export function parseInputAmount(input: string): string {
  // 移除非数字字符（除了小数点）
  const cleaned = input.replace(/[^0-9.]/g, '')
  
  // 确保只有一个小数点
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('')
  }
  
  return cleaned
} 