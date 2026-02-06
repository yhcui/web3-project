// Auto-generated file. Do not edit directly.
// Run 'pnpm icons:generate' to regenerate this file.

export { TokenPageSettingsIcon } from './TokenPageSettingsIcon'
export { TokenPageShareIcon } from './TokenPageShareIcon'

// Type exports
export type TokenPageIconName = 'TokenPageSettingsIcon' | 'TokenPageShareIcon'

// Icon map for dynamic usage
export const tokenPageIconMap = {
  TokenPageSettingsIcon: () =>
    import('./TokenPageSettingsIcon').then((m) => m.TokenPageSettingsIcon),
  TokenPageShareIcon: () =>
    import('./TokenPageShareIcon').then((m) => m.TokenPageShareIcon),
} as const
