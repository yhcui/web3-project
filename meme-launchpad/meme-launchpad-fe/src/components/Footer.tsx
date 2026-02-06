'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

export function Footer() {
  const t = useTranslations('footer')
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1] || 'en'

  const navGroups = [
    {
      title: t('info.title'),
      links: [
        { label: t('info.privacy'), href: '/privacy' },
        { label: t('info.terms'), href: '/terms' },
      ],
    },
    {
      title: t('products.title'),
      links: [
        { label: t('products.launchpad'), href: '/launchpad' },
        { label: t('products.staking'), href: '/staking' },
        { label: t('products.claim'), href: '/claim' },
        { label: t('products.apply'), href: '/apply' },
      ],
    },
    {
      title: t('support.title'),
      links: [
        { label: t('support.docs'), href: '/docs' },
        { label: t('support.mediaKit'), href: '/media-kit' },
        { label: t('support.contact'), href: '/contact' },
        { label: t('support.faq'), href: '/faq' },
      ],
    },
  ]

  const socialLinks = [
    {
      name: 'Github',
      href: 'https://github.com/MetaNodeAcademy',
      icon: '/assets/images/social/github.svg',
    },
    {
      name: 'Medium',
      href: 'https://medium.com',
      icon: '/assets/images/social/medium.svg',
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com',
      icon: '/assets/images/social/twitter.svg',
    },
    {
      name: 'Telegram',
      href: 'https://t.me',
      icon: '/assets/images/social/telegram.svg',
    },
  ]

  return (
    <footer className="border-t border-[#252832] bg-[#111319]">
      <div className="mx-auto w-full max-w-[1200px] py-8">
        <div className="flex w-full justify-center">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Image
              className="hidden w-[80px] md:block"
              src="/assets/images/logo-i.webp"
              alt="MetaLand"
              width={80}
              height={80}
            />
            {/* Logo and Description */}
            <div className="flex flex-col justify-between">
              <Link href="/" className="mb-2 inline-block">
                {/* <Image
                  src="/assets/images/logo-w.webp"
                  alt="MetaLand"
                  width={120}
                  height={20}
                  className="hidden w-[100px] md:block lg:w-[136px]"
                /> */}
                <Image
                  src="/assets/images/logo.svg"
                  alt="MetaLand"
                  width={120}
                  height={20}
                  className="mx-auto block w-[136px] md:hidden"
                />
              </Link>
              <div className="flex flex-col gap-3">
                {/* Copyright */}
                <p className="text-sm text-[#9197AA]">
                  {t('copyright', { year: new Date().getFullYear() })}
                </p>
                {/* Social Links */}
                <div className="flex gap-4">
                  {socialLinks.map((social) => (
                    <Link
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex h-9 w-9 items-center justify-center rounded-full border-[1px] border-[#2B3139] transition hover:border-white"
                      aria-label={social.name}
                    >
                      <Image
                        src={social.icon}
                        alt={social.name}
                        width={16}
                        height={16}
                        className="opacity-50 group-hover:opacity-100"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="ml-auto hidden md:flex">
            <div className="grid grid-cols-2 gap-16 text-right md:grid-cols-3">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="font-din-pro mb-4 text-base font-bold tracking-wider text-white">
                    {group.title}
                  </h3>
                  <ul className="space-y-2">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={`/${currentLocale}${link.href}`}
                          className="text-sm text-[#9197AA] transition-colors hover:text-[#BEFA0A]"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
