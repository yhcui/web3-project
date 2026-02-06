/**
 * 按照18位精度格式化，保留2位小数
 * @param value 原始数值（字符串或数字，单位为wei）
 * @returns 格式化后的字符串，保留2位小数
 */
export function format18(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '0.00'
  let num: number
  try {
    // 先转为BigInt再处理，防止精度丢失
    const big = BigInt(value.toString())
    // 1e18 = 1000000000000000000n
    const base = BigInt(1000000000000000000)
    // 得到整数部分
    const integer = big / base
    // 得到小数部分（保留2位，四舍五入）
    const decimal = ((big % base) * BigInt(100) + base / BigInt(2)) / base
    return `${integer}.${decimal.toString().padStart(2, '0')}`
  } catch (e) {
    // 如果无法转为BigInt，尝试用Number处理
    num = Number(value)
    if (isNaN(num)) return '0.00'
    return (num / 1e18).toFixed(2)
  }
}
