/**
 * 格式化数字为 K、M、B 等单位
 * @param value - 数字或字符串数字
 * @param decimals - 小数位数，默认为 1
 * @returns 格式化后的字符串
 *
 * @example
 * formatNumber(1234) // "1.2K"
 * formatNumber("1234567") // "1.2M"
 * formatNumber(1234567890) // "1.2B"
 * formatNumber(999, 0) // "999"
 * formatNumber(1000, 0) // "1K"
 */
export function formatNumber(
  value: number | string,
  decimals: number = 1,
  prefix?: string
): string {
  // 转换为数字
  const num = typeof value === 'string' ? parseFloat(value) : value

  // 检查是否为有效数字
  if (isNaN(num)) {
    return '0'
  }

  // 如果数字小于 1000，直接返回
  if (num < 1000) {
    return Math.round(num).toString()
  }

  // 定义单位
  const units = [
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' },
  ]

  // 找到合适的单位
  for (const unit of units) {
    if (num >= unit.value) {
      const formatted = (num / unit.value).toFixed(decimals)
      // 移除末尾的 .0
      const cleanFormatted = formatted.endsWith('.0')
        ? formatted.slice(0, -2)
        : formatted.replace(/\.?0+$/, '')
      return cleanFormatted + unit.symbol
    }
  }

  return prefix ? `${prefix}${num.toString()}` : num.toString()
}

/**
 * 格式化百分比
 * @param value - 数字或字符串数字
 * @param decimals - 小数位数，默认为 2
 * @returns 格式化后的百分比字符串
 *
 * @example
 * formatPercentage(0.1234) // "12.34%"
 * formatPercentage("0.5") // "50%"
 * formatPercentage(1.234, 1) // "123.4%"
 */
export function formatPercentage(
  value: number | string,
  decimals: number = 2
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return '0%'
  }

  const percentage = (num * 100).toFixed(decimals)
  const cleanPercentage = percentage.endsWith('.00')
    ? percentage.slice(0, -3)
    : percentage.replace(/\.?0+$/, '')

  return cleanPercentage + '%'
}

/**
 * 格式化代币价格（处理前导零）
 * @param value - 数字或字符串数字
 * @returns 格式化后的价格字符串
 *
 * @example
 * formatTokenPrice(0.00000000678) // "$0.{8}678"
 * formatTokenPrice(0.000123) // "$0.000123"
 * formatTokenPrice("1234.5678") // "$1,234.57"
 * formatTokenPrice(0.000000000123) // "$0.{9}123"
 */
export function formatTokenPrice(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return '$0'
  }

  // 如果数字为0，直接返回
  if (num === 0) {
    return '$0'
  }

  // 如果数字很大，使用千分位分隔符
  if (num >= 1000) {
    return (
      '$' +
      num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
      })
    )
  }

  // 处理科学计数法
  if (Math.abs(num) < 1e-6 && num !== 0) {
    const str = num.toExponential()
    const [coefficient, exponent] = str.split('e')
    const exp = parseInt(exponent)

    if (exp < 0) {
      const zeros = Math.abs(exp) - 1
      const significantDigits = coefficient.replace('.', '').slice(0, 4)
      return `$0.{${zeros}}${significantDigits}`
    }
  }

  // 处理普通小数
  if (num < 1 && num > 0) {
    const str = num.toString()
    const decimalStr = str.split('.')[1] || ''

    // 计算前导零的数量
    let leadingZeros = 0
    for (let i = 0; i < decimalStr.length; i++) {
      if (decimalStr[i] === '0') {
        leadingZeros++
      } else {
        break
      }
    }

    // 如果前导零超过3个，使用特殊格式
    if (leadingZeros > 3) {
      const significantDigits = decimalStr.slice(leadingZeros, leadingZeros + 4)
      return `$0.{${leadingZeros}}${significantDigits}`
    }
  }

  // 普通情况，保留最多6位小数
  const formatted = num.toFixed(6)
  const cleanFormatted = formatted.replace(/\.?0+$/, '')

  return '$' + cleanFormatted
}

/**
 * 格式化价格（通用）
 * @param value - 数字或字符串数字
 * @param decimals - 小数位数，默认为 6
 * @returns 格式化后的价格字符串
 *
 * @example
 * formatPrice(0.000123) // "$0.000123"
 * formatPrice("1234.5678") // "$1,234.57"
 * formatPrice(0.000000123, 8) // "$0.00000012"
 */
export function formatPrice(
  value: number | string,
  decimals: number = 6
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return '$0'
  }

  // 如果数字很小，使用科学计数法
  if (num < 0.000001 && num > 0) {
    return '$' + num.toExponential(decimals)
  }

  // 如果数字很大，使用千分位分隔符
  if (num >= 1000) {
    return (
      '$' +
      num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      })
    )
  }

  // 普通情况
  const formatted = num.toFixed(decimals)
  const cleanFormatted = formatted.replace(/\.?0+$/, '')

  return '$' + cleanFormatted
}

/**
 * 格式化代币数量
 * @param value - 数字或字符串数字
 * @param symbol - 代币符号，默认为空
 * @param decimals - 小数位数，默认为 2
 * @returns 格式化后的代币数量字符串
 *
 * @example
 * formatAmount(1234567) // "1,234,567"
 * formatAmount("1234567.89", "ETH") // "1,234,567.89 ETH"
 * formatAmount(0.000123, "BTC", 6) // "0.000123 BTC"
 */
export function formatAmount(
  value: number | string,
  symbol: string = '',
  decimals: number = 2
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return symbol ? `0 ${symbol}` : '0'
  }

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })

  return symbol ? `${formatted} ${symbol}` : formatted
}

/**
 * 格式化以太坊地址为 0x... 缩写形式
 * @param {string} address - 完整的以太坊地址 (0x开头，42字符)
 * @returns {string} 格式化后的地址 (0x + 前2位 + ... + 后6位)
 */
export function formatEthAddress(address: string) {
  // 正则验证并提取关键部分
  const match = address.match(
    /^(0x)([a-fA-F0-9]{2})([a-fA-F0-9]*)([a-fA-F0-9]{6})$/
  )

  if (!match) {
    return address
  }

  // 返回格式化结果：0x + 前2字符 + ... + 后6字符
  return `${match[1]}${match[2]}...${match[4]}`
}
