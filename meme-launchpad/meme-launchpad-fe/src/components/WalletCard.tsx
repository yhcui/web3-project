'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTranslations } from 'next-intl'

export function WalletCard() {
  const t = useTranslations('wallet')

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ConnectButton />
      </CardContent>
    </Card>
  )
}
