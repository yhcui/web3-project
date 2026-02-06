// Auto-generated file. Do not edit directly.
// Run 'pnpm icons:generate' to regenerate this file.

export { DiscordIcon } from './DiscordIcon'
export { GithubIcon } from './GithubIcon'
export { MediumIcon } from './MediumIcon'
export { TelegramIcon } from './TelegramIcon'
export { TwitterIcon } from './TwitterIcon'
export { WebsiteIcon } from './WebsiteIcon'
export { WhitepaperIcon } from './WhitepaperIcon'
export { XIcon } from './XIcon'

// Type exports
export type SocialIconName =
  | 'DiscordIcon'
  | 'GithubIcon'
  | 'MediumIcon'
  | 'TelegramIcon'
  | 'TwitterIcon'
  | 'WebsiteIcon'
  | 'WhitepaperIcon'
  | 'XIcon'

// Icon map for dynamic usage
export const socialIconMap = {
  DiscordIcon: () => import('./DiscordIcon').then((m) => m.DiscordIcon),
  GithubIcon: () => import('./GithubIcon').then((m) => m.GithubIcon),
  MediumIcon: () => import('./MediumIcon').then((m) => m.MediumIcon),
  TelegramIcon: () => import('./TelegramIcon').then((m) => m.TelegramIcon),
  TwitterIcon: () => import('./TwitterIcon').then((m) => m.TwitterIcon),
  WebsiteIcon: () => import('./WebsiteIcon').then((m) => m.WebsiteIcon),
  WhitepaperIcon: () =>
    import('./WhitepaperIcon').then((m) => m.WhitepaperIcon),
  XIcon: () => import('./XIcon').then((m) => m.XIcon),
} as const
