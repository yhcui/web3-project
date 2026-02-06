export const RANKING_PAGE_TYPE = {
  FAVORITES: 1,
  CRYPTOS: 2,
  NEW: 3,
} as const

export type RANKING_PAGE_TYPE_VALUES =
  (typeof RANKING_PAGE_TYPE)[keyof typeof RANKING_PAGE_TYPE]

export const RANKING_CATEGORY_TYPE = {
  ALL: '0',
  MEME: '1',
  AI: '2',
  DEFI: '3',
  GAME: '4',
  INFRA: '5',
  DESCI: '6',
  DEPIN: '7',
  CHARITY: '8',
  OTHERS: '9',
  SOCIAL: '10',
}

export type RANKING_CATEGORY_TYPE_VALUES =
  (typeof RANKING_CATEGORY_TYPE)[keyof typeof RANKING_CATEGORY_TYPE]

export const RANKING_TABLE_LABELS = {
  NAME: 'name',
  HOT: 'hot',
  PRICE: 'price',
  CHANGE24H: 'change24h',
  VOLUME24H: 'volume24h',
  MARKET_CAP: 'market_cap',
  TX_COUNT: 'tx_count',
  HOLDERS: 'holders',
  TOP10_PERCENT: 'top10_percent',
  AGE_DAYS: 'age_days',
  PROGRESS: 'progress',
}
export type RANKING_TABLE_LABEL_VALUES =
  (typeof RANKING_TABLE_LABELS)[keyof typeof RANKING_TABLE_LABELS]

export const RANKING_TYPE = {
  HOT: 1,
  TOP_GAINER: 2,
  TOP_LOSER: 3,
  TOP_VOLUME: 4,
  TOP_MARKET_CAP: 5,
} as const

export type RANKING_TYPE_VALUES =
  (typeof RANKING_TYPE)[keyof typeof RANKING_TYPE]
