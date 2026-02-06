export const ADVANCED_SORT_TYPE = {
  LATEST_LAUNCHED: 1,
  ABOUT_TO_LAUNCH: 2,
  ABOUT_TO_FILL: 3,
  HOT: 4,
  TRADING_VOLUME: 5,
  MARKET_CAP: 6,
  HOLDERS: 7,
  TRANSACTIONS: 8,
  GRADUATED: 9,
} as const

export const ADVANCED_SORT_TYPE_VALUES = Object.values(
  ADVANCED_SORT_TYPE
) as readonly number[]

export const VOLUME_STATISTICS_TYPE = {
  MIN_5: 1,
  MIN_30: 2,
  HOUR_1: 3,
  HOUR_4: 4,
  DAY_1: 5,
  DAY_7: 6,
} as const

export const VOLUME_STATISTICS_TYPE_VALUES = Object.values(
  VOLUME_STATISTICS_TYPE
) as readonly number[]

export const ADVANCED_TOKEN_LIMIT = {
  TOP: 15,
  HOT: 5000,
} as const
