export type TabMode = 'new-coin' | 'ido' | 'burning'

export interface TabConfig {
  mode: TabMode
  features: {
    showPreBuy: boolean
    showAddMargin: boolean
    showTokenLaunchReservation: boolean
    showOfficialContact: boolean
    showIDOSettings: boolean
    showBurningSettings: boolean
  }
  submitButtonText: string
  submitEndpoint: string
  defaultValues: Record<string, any>
}

export const TAB_CONFIGS: Record<TabMode, TabConfig> = {
  'new-coin': {
    mode: 'new-coin',
    features: {
      showPreBuy: true,
      showAddMargin: true,
      showTokenLaunchReservation: true,
      showOfficialContact: true,
      showIDOSettings: false,
      showBurningSettings: false,
    },
    submitButtonText: 'createToken.button.letsRoll',
    submitEndpoint: '/api/create-token',
    defaultValues: {
      preBuy: 0,
      addMargin: false,
      tokenLaunchReservation: false,
      officialContact: false,
    },
  },
  ido: {
    mode: 'ido',
    features: {
      showPreBuy: false,
      showAddMargin: false,
      showTokenLaunchReservation: false,
      showOfficialContact: false,
      showIDOSettings: true,
      showBurningSettings: false,
    },
    submitButtonText: 'createToken.button.launchIDO',
    submitEndpoint: '/api/create-ido',
    defaultValues: {
      idoPrice: 0,
      idoSupply: 0,
      minPurchase: 0,
      maxPurchase: 0,
    },
  },
  burning: {
    mode: 'burning',
    features: {
      showPreBuy: false,
      showAddMargin: false,
      showTokenLaunchReservation: false,
      showOfficialContact: false,
      showIDOSettings: false,
      showBurningSettings: true,
    },
    submitButtonText: 'createToken.button.startBurning',
    submitEndpoint: '/api/create-burning',
    defaultValues: {
      burnRate: 0,
      burnSchedule: 'daily',
      totalBurnAmount: 0,
      autoBurn: false,
    },
  },
}

export const getTabConfig = (mode: TabMode): TabConfig => {
  return TAB_CONFIGS[mode]
}

// Shared defaults for all modes
export const SHARED_DEFAULT_VALUES = {
  symbol: '',
  coinName: '',
  description: '',
  tags: [],
  twitter: '',
  discord: '',
  telegram: '',
  website: '',
  whitepaper: '',
  contractPreview: false,
}

// Available tags configuration
export const AVAILABLE_TAGS = [
  { key: 'ai', label: 'AI' },
  { key: 'meme', label: 'Meme' },
  { key: 'defi', label: 'DeFi' },
  { key: 'games', label: 'Games' },
  { key: 'infra', label: 'Infra' },
  { key: 'deSci', label: 'De-Sci' },
  { key: 'social', label: 'Social' },
  { key: 'depin', label: 'Depin' },
  { key: 'charity', label: 'Charity' },
  { key: 'others', label: 'Others' },
]
