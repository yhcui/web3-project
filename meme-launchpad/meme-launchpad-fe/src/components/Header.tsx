'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter, usePathname } from 'next/navigation'
import { WalletButton, MobileWalletButton } from '@/components/WalletButton'

export function Header() {
  const t = useTranslations('header')
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1] || 'en'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'board', label: t('nav.board'), href: '/' },
    { id: 'ranking', label: t('nav.ranking'), href: '/ranking' },
    {
      id: 'advancedEarn',
      label: t('nav.advancedEarn'),
      href: '/advanced-earn',
    },
    { id: 'events', label: t('nav.events'), href: '/campaign' },
  ]

  const handleLanguageChange = (locale: string) => {
    const newPath = pathname.replace(`/${currentLocale}`, `/${locale}`)
    router.push(newPath)
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-[#111319]">
      <div className="mx-auto px-4 sm:px-6 lg:px-[50px]">
        <div className="flex h-[70px] items-center justify-between">
          {/* Left Section: Logo and Navigation */}
          <div className="flex items-center gap-6 lg:gap-10">
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/images/logo.svg"
                alt="MetaLand LaunchPad"
                width={134}
                height={24}
                priority
                className="w-[134px]"
              />
            </Link>

            <nav className="hidden items-center gap-[26px] lg:flex">
              {navItems.map((item) => {
                // Remove locale prefix from pathname for comparison
                const pathWithoutLocale = pathname.replace(/^\/[^\/]+/, '')
                const isActive =
                  pathWithoutLocale === item.href ||
                  (item.href === '/' && pathWithoutLocale === '')

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`font-din-pro text-base font-bold transition-colors ${
                      isActive
                        ? 'text-lg text-[#BEFA0A]'
                        : 'text-[#656A79] hover:text-[#BEFA0A]'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right Section: Desktop */}
          <div className="hidden items-center gap-5 lg:flex">
            {/* Search Icon */}
            <button className="opacity-80 transition-opacity hover:opacity-100">
              <Image
                src="/assets/images/search-icon.svg"
                alt={t('actions.search')}
                width={20}
                height={20}
              />
            </button>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100">
                  <Image
                    src="/assets/images/language-icon.svg"
                    alt={t('actions.language')}
                    width={20}
                    height={20}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[120px] border-[#2B3139] bg-[#1a1d29]">
                <DropdownMenuRadioGroup
                  value={currentLocale}
                  onValueChange={handleLanguageChange}
                >
                  <DropdownMenuRadioItem
                    value="en"
                    className="cursor-pointer text-white hover:bg-[#252832]"
                  >
                    English
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="zh"
                    className="cursor-pointer text-white hover:bg-[#252832]"
                  >
                    中文
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Create Coin Button */}
            <Link href={`/${currentLocale}/create-token`}>
              <Button className="font-din-pro h-10 gap-1 rounded-lg bg-[#BEFA0A] px-4 pl-3 text-sm font-bold text-[#111319] hover:bg-[#BEFA0A]/90">
                <Image
                  src="/assets/images/create-coin-icon.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="mr-1"
                />
                {t('actions.createCoin')}
              </Button>
            </Link>

            {/* Wallet Connection */}
            <WalletButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="p-2 text-white lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <>
            <div
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="fixed top-0 right-0 bottom-0 left-0 z-10 h-dvh w-full bg-black/40"
            ></div>
            <div className="fixed top-0 right-0 z-20 h-dvh w-[230px] border-b border-[#252832] bg-[#191B22] p-4 lg:hidden">
              <div className="flex flex-col gap-3">
                <MobileWalletButton className="flex-col gap-4" />

                <Link href={`/${currentLocale}/create-token`}>
                  <Button className="font-din-pro h-10 w-full gap-1 rounded-lg bg-[#BEFA0A] px-4 pl-3 text-sm font-bold text-[#111319] hover:bg-[#BEFA0A]/90">
                    <Image
                      src="/assets/images/create-coin-icon.svg"
                      alt=""
                      width={24}
                      height={24}
                      className="mr-1"
                    />
                    {t('actions.createCoin')}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-full border-[#2B3139] bg-transparent text-white"
                    >
                      <Image
                        src="/assets/images/language-icon.svg"
                        alt={t('actions.language')}
                        width={18}
                        height={18}
                        className="mr-2"
                      />
                      {currentLocale === 'en' ? 'English' : '中文'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[120px] border-[#2B3139] bg-[#1a1d29]">
                    <DropdownMenuRadioGroup
                      value={currentLocale}
                      onValueChange={handleLanguageChange}
                    >
                      <DropdownMenuRadioItem
                        value="en"
                        className="cursor-pointer text-white hover:bg-[#252832]"
                      >
                        English
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="zh"
                        className="cursor-pointer text-white hover:bg-[#252832]"
                      >
                        中文
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <nav className="mt-4 flex flex-col gap-4 divide-y divide-[#252832]">
                {navItems.map((item) => {
                  // Remove locale prefix from pathname for comparison
                  const pathWithoutLocale = pathname.replace(/^\/[^\/]+/, '')
                  const isActive =
                    pathWithoutLocale === item.href ||
                    (item.href === '/' && pathWithoutLocale === '')

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`py-3 text-base font-bold transition-colors ${
                        isActive
                          ? 'text-[#BEFA0A]'
                          : 'text-[#656A79] hover:text-white'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
