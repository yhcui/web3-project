import { formatTVDate, formatTVTime } from '../lib/utils'
import { mergeZero } from '@/lib/utils'
import {
  ChartingLibraryFeatureset,
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
} from '@/public/static/charting_library'
import numeral from 'numeral'

// 颜色常量
const RED = '#F6465D' // 红色 - 从项目中其他地方保持一致
const GREEN = '#0ECB81' // 绿色 - 从项目中其他地方保持一致
export const DEFAULT_PERIOD = '1'

// 根据颜色方案获取涨跌颜色
export const getKlineColors = (
  scheme: 'green-up-red-down' | 'red-up-green-down'
) => {
  if (scheme === 'green-up-red-down') {
    return {
      upColor: GREEN, // 上涨绿色
      downColor: RED, // 下跌红色
    }
  } else {
    return {
      upColor: RED, // 上涨红色
      downColor: GREEN, // 下跌绿色
    }
  }
}

// 生成图表样式覆盖配置
export const getChartStyleOverrides = (
  colorScheme: 'green-up-red-down' | 'red-up-green-down'
) => {
  const colors = getKlineColors(colorScheme)

  return ['candleStyle', 'hollowCandleStyle', 'haStyle'].reduce(
    (acc, cv) => {
      acc[`mainSeriesProperties.${cv}.drawWick`] = true
      acc[`mainSeriesProperties.${cv}.drawBorder`] = false
      acc[`mainSeriesProperties.${cv}.upColor`] = colors.upColor
      acc[`mainSeriesProperties.${cv}.downColor`] = colors.downColor
      acc[`mainSeriesProperties.${cv}.wickUpColor`] = colors.upColor
      acc[`mainSeriesProperties.${cv}.wickDownColor`] = colors.downColor
      acc[`mainSeriesProperties.${cv}.borderUpColor`] = colors.upColor
      acc[`mainSeriesProperties.${cv}.borderDownColor`] = colors.downColor
      return acc
    },
    {} as { [k in string]: string | boolean }
  )
}

// 生成图表覆盖配置
export const getChartOverrides = (
  colorScheme: 'green-up-red-down' | 'red-up-green-down'
) => {
  return {
    'paneProperties.background': '#181A20',
    'paneProperties.backgroundGradientStartColor': '#181A20',
    'paneProperties.backgroundGradientEndColor': '#181A20',
    'paneProperties.backgroundType': 'solid',
    'paneProperties.vertGridProperties.color': '#22242c',
    'paneProperties.vertGridProperties.style': 3,
    'paneProperties.horzGridProperties.color': '#22242c',
    'paneProperties.horzGridProperties.style': 3,
    'mainSeriesProperties.priceLineColor': '#aa68ff',
    'scalesProperties.textColor': '#fff',
    'scalesProperties.lineColor': '#181A20',
    ...getChartStyleOverrides(colorScheme),
  }
}

export const disabledFeaturesOnMobile = [
  'header_saveload',
  'header_fullscreen_button',
]

const disabledFeatures = [
  'show_logo_on_all_charts',
  'caption_buttons_text_if_possible',
  'compare_symbol',
  'display_market_status',
  'header_symbol_search',
  'header_in_fullscreen_mode',
  'right_bar_stays_on_scroll',
  'symbol_info',
  'volume_force_overlay', // 禁用 Volume 强制覆盖，让 Volume 显示在单独窗格
  'header_undo_redo', // 禁用 undo/redo 功能
]

const enabledFeatures = [
  'side_toolbar_in_fullscreen_mode',
  'header_in_fullscreen_mode',
  'hide_resolution_in_legend',
  'items_favoriting',
  'seconds_resolution',
]

// enabled_features: ['determine_first_data_request_size_using_visible_range'],
// disabled_features: ['symbol_search_hot_key', 'header_symbol_search', 'symbol_info', 'header_compare', 'header_undo_redo', 'show_symbol_logo_for_compare_studies', 'adaptive_logo', 'go_to_date'],
export const SUPPORTED_RESOLUTIONS = {
  // "1S": "1s",
  // "5S": "5s",
  // "15S": "15s",
  // "30S": "30s",
  '1': '1m',
  '3': '3m',
  '5': '5m',
  '15': '15m',
  '30': '30m',
  '60': '1h',
  '120': '2h',
  '240': '4h',
  '480': '6h',
  '720': '12h',
  '1D': '1d',
  '3D': '3d',
  '1W': '1w',
  '1M': '1M',
}

// 生成默认图表配置
export const getDefaultChartProps = (
  colorScheme: 'green-up-red-down' | 'red-up-green-down'
): Partial<ChartingLibraryWidgetOptions> & any => {
  return {
    theme: 'dark',
    locale: 'en' as LanguageCode,
    library_path: '/static/charting_library/',
    client_id: 'tradingview.com',
    user_id: 'public_user_id',
    fullscreen: false,
    autosize: true,
    charts_storage_api_version: '1.1',
    overrides: getChartOverrides(colorScheme),
    enabled_features: enabledFeatures as ChartingLibraryFeatureset[],
    disabled_features: disabledFeatures as ChartingLibraryFeatureset[],
    custom_css_url: '/static/custom.css',
    loading_screen: { backgroundColor: '#181A20', foregroundColor: '#BFFB06' },
    settings_overrides: {
      'paneProperties.background': '#181A20',
      'paneProperties.backgroundType': 'solid',
    },
    max_bars_in_memory: 500, // 设置 K 线最大数量为 500 条
    time_scale: {
      right_offset: 0, // 设置右侧偏移为0，让图表显示到最新时间
    } as any,
    // 设置时间范围，从当前时间开始
    time_frames: [
      { text: '1D', resolution: '5' as ResolutionString, description: '1 Day' },
      {
        text: '1W',
        resolution: '30' as ResolutionString,
        description: '1 Week',
      },
      {
        text: '1M',
        resolution: '240' as ResolutionString,
        description: '1 Month',
      },
    ],
    favorites: {
      intervals: ['1', '3', '5', '60', '240'] as ResolutionString[],
    },
    custom_formatters: {
      timeFormatter: {
        format: (date: Date) => formatTVTime(date),
        formatLocal: (date: Date) => formatTVTime(date),
        parse: (date: string) => formatTVTime(new Date(date)),
      },
      dateFormatter: {
        format: (date: Date) => formatTVDate(date),
        formatLocal: (date: Date) => formatTVDate(date),
        parse: (date: string) => formatTVDate(new Date(date)),
      },
      priceFormatterFactory: () => {
        return {
          format: (price: number) => {
            if (price > 1000) {
              return numeral(price).format('0,0.00a')
            }
            // 兼容精度太小的价格
            let smallPrice = numeral(price).format('0,0.[00000000]')
            if (smallPrice === 'NaN') {
              smallPrice = price.toFixed(8)
            }
            return mergeZero(smallPrice)
          },
        }
      },
      studyFormatterFactory: () => {
        return {
          format: (price: number) => {
            if (price > 1000) {
              return numeral(price).format('0,0.00a')
            }
            // 兼容精度太小的价格
            let smallPrice = numeral(price).format('0,0.[00000000]')
            if (smallPrice === 'NaN') {
              smallPrice = price.toFixed(8)
            }
            return mergeZero(smallPrice)
          },
        }
      },
    },
  }
}
