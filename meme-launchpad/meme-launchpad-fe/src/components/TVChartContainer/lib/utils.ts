// 将 TokenKline 转换为 TradingView 的 BarData
import type { KlineData } from '@/api/schemas/kline.schema'
import { Bar } from '@/public/static/charting_library/datafeed-api'
import dayjs from 'dayjs'

export const convertTokenKlineToTradingViewBarData = (
  tokenKline: KlineData[]
): Bar[] => {
  return tokenKline.map((item) => ({
    time: new Date(item.t[0]).getTime(),
    open: Number(item.o[0]),
    high: Number(item.h[0]),
    low: Number(item.l[0]),
    close: Number(item.c[0]),
    volume: Number(item.v[0]),
  }))
}

export const formatTVDate = (date: Date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

export const formatTVTime = (date: Date) => {
  return dayjs(date).format('HH:mm')
}
