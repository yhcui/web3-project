'use client'

import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import {
  Wallet,
  AlertCircle,
  Copy,
  LogOut,
  User,
  Gift,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChevronArrow } from '@/components/create-token/components/ChevronArrow'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface CustomButtonProps {
  className?: string
  showBalance?: boolean
  variant?: 'desktop' | 'mobile'
}

export function WalletButton({
  className,
  showBalance = false,
  variant = 'desktop',
}: CustomButtonProps = {}) {
  const [mounted, setMounted] = useState(false)
  const [assetRecommendation, setAssetRecommendation] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const t = useTranslations()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1] || 'en'
  const router = useRouter()
  useEffect(() => {
    setMounted(true)
  }, [])

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Prevent hydration mismatch by not rendering wallet button until client-side
  if (!mounted) {
    return (
      <div
        className={cn(
          'h-10 animate-pulse rounded-lg border border-[#2B3139] bg-transparent',
          variant === 'mobile' ? 'w-full' : 'w-[140px]',
          className
        )}
      />
    )
  }

  const handleGoProfile = () => {
    router.push(`/${currentLocale}/profile`)
  }

  const handleGoRebate = () => {
    router.push(`/${currentLocale}/invite`)
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted: isReady,
      }) => {
        // Ensure component is ready and auth status is loaded
        const ready = isReady && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        if (!ready) {
          return (
            <div
              className={cn(
                'h-10 animate-pulse rounded-lg border border-[#2B3139] bg-transparent',
                variant === 'mobile' ? 'w-full' : 'w-[140px]',
                className
              )}
            />
          )
        }

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              className={cn(
                'group relative flex h-10 items-center justify-center gap-2 rounded-lg border border-[]/50 px-4 font-medium text-[#fff] transition-all hover:bg-[]/5',
                variant === 'mobile' ? 'w-full' : 'min-w-[140px]',
                className
              )}
            >
              <Wallet className="h-4 w-4" />
              <span>{t('wallet.title')}</span>
            </button>
          )
        }

        // Handle wrong network
        if (chain.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className={cn(
                'group flex h-10 items-center justify-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 font-medium text-red-400 transition-all hover:bg-red-500/20',
                variant === 'mobile' ? 'w-full' : 'min-w-[140px]',
                className
              )}
            >
              <AlertCircle className="h-4 w-4" />
              <span>{t('wallet.wrongNetwork')}</span>
            </button>
          )
        }

        // Connected state - Unified button with network icon and wallet address
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'group relative flex h-10 items-center gap-2 rounded-lg border border-[#2B3139] bg-[#1A1D22] px-2 transition-all hover:border-[] hover:bg-[#222529] data-[state=open]:border-[]',
                  variant === 'mobile' && 'w-full',
                  className
                )}
              >
                {/* Chain Icon */}
                {chain.hasIcon && (
                  <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full">
                    <div
                      style={{
                        background: chain.iconBackground,
                        width: '100%',
                        height: '100%',
                      }}
                    />
                    {chain.iconUrl && (
                      <img
                        alt={chain.name ?? 'Chain icon'}
                        src={chain.iconUrl}
                        className="absolute inset-0 h-full w-full"
                      />
                    )}
                  </div>
                )}

                {/* Address/ENS */}
                <span className="text-sm font-medium text-[#F0F1F5]">
                  {account.displayName}
                </span>

                {/* Balance (optional) */}
                {showBalance && account.displayBalance && (
                  <span className="text-sm text-gray-400">
                    {account.displayBalance}
                  </span>
                )}

                {/* Dropdown Arrow - use CSS for hover effect */}
                <div className="ml-auto">
                  {/* Default arrow (gray) */}
                  <ChevronArrow
                    className="block group-hover:hidden group-data-[state=open]:hidden"
                    color="#656A79"
                    width={9}
                    height={6}
                  />
                  {/* Hover/Open arrow (white) */}
                  <ChevronArrow
                    className="hidden group-hover:block group-data-[state=open]:block"
                    color="#FFFFFF"
                    width={9}
                    height={6}
                  />
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-[150px] border-[#2B3139] bg-[#1B1E25] !px-0 py-2.5"
              align="start"
            >
              {/* Personal Homepage */}
              <DropdownMenuItem
                className="flex h-[50px] cursor-pointer items-center justify-start rounded-none text-sm text-[#656A79] hover:bg-[#252832] hover:text-white"
                onClick={handleGoProfile}
              >
                <span>{t('wallet.personalPage')}</span>
              </DropdownMenuItem>

              {/* Rebate */}
              <DropdownMenuItem
                onClick={handleGoRebate}
                className="flex h-[50px] cursor-pointer items-center justify-start rounded-none text-sm text-[#656A79] hover:bg-[#252832] hover:text-white"
              >
                <span>{t('wallet.rebate')}</span>
              </DropdownMenuItem>

              {/* Asset Recommendation */}
              <DropdownMenuItem
                className="flex h-[50px] cursor-pointer items-center justify-between rounded-none text-sm text-[#656A79] hover:bg-[#252832] hover:text-white"
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex items-center">
                  <span>{t('wallet.assetRecommendation')}</span>
                </div>
                <Switch
                  checked={assetRecommendation}
                  onCheckedChange={setAssetRecommendation}
                  className="h-4 border-[#2B3139] data-[state=checked]:bg-[] data-[state=unchecked]:bg-[#111319] [&>span]:h-3 [&>span]:w-3"
                />
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-0 my-0 bg-[#252832]" />

              {/* Address with Copy */}
              <DropdownMenuItem
                className="flex h-[50px] cursor-pointer items-center justify-between rounded-none px-2.5 text-sm text-[#656A79] hover:bg-[#252832] hover:text-white"
                onSelect={(e) => {
                  e.preventDefault()
                  copyAddress(account.address!)
                }}
              >
                <span>{account.displayName}</span>
                <button className="flex h-4 w-4 items-center justify-center rounded">
                  {copied ? (
                    <span className="text-xs text-[#656A79]">✓</span>
                  ) : (
                    <Copy className="h-2.5 w-2.5 hover:text-white" />
                  )}
                </button>
              </DropdownMenuItem>

              {/* Disconnect */}
              <DropdownMenuItem
                className="flex h-[50px] cursor-pointer items-center justify-between rounded-none px-2.5 text-sm text-[#FF6767] hover:bg-[#252832] hover:text-[#FF6767]"
                onClick={() => {
                  openAccountModal()
                }}
              >
                <span>{t('wallet.disconnect')}</span>
                <LogOut className="text-red h-4 w-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }}
    </ConnectButton.Custom>
  )
}

export function MobileWalletButton({
  className,
  showBalance = false,
}: Omit<CustomButtonProps, 'variant'> = {}) {
  return (
    <WalletButton
      variant="mobile"
      className={className}
      showBalance={showBalance}
    />
  )
}
