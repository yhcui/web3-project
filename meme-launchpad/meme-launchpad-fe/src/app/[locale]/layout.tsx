import type { Metadata } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Web3Provider } from '@/providers/Web3Provider'
import { KlineWebSocketProvider } from '@/providers/KlineWebSocketProvider'
import { websocketConfig } from '@/config/websocket'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Toaster } from '@/components/ui/sonner'
import localFont from 'next/font/local'
import '../globals.css'
import { ThemeProvider } from 'next-themes'

const dinpro = localFont({
  src: [
    {
      path: '../../../public/fonts/dinpro.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/dinpro_bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-din-pro',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MetaLand',
  description: 'MetaLand',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning className="scrollbar-hide">
      <body className={`${dinpro.variable} bg-[#111319] font-sans`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider defaultTheme="light">
            <Web3Provider>
              <KlineWebSocketProvider routes={websocketConfig.routes}>
                <Header />
                <main className="min-h-screen bg-[#111319] pt-[70px]">
                  {children}
                </main>
                <Footer />
              </KlineWebSocketProvider>
            </Web3Provider>
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
