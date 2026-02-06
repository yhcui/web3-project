'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import celebrationImg from '@/assets/success-dialog/celebration.svg'
import shareIcon from '@/assets/success-dialog/share-icon.svg'
import homeIcon from '@/assets/success-dialog/home-icon.svg'

interface SuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokenAddress?: string
  transactionHash?: string
}

export function SuccessDialog({
  open,
  onOpenChange,
  tokenAddress,
  transactionHash,
}: SuccessDialogProps) {
  const t = useTranslations()
  const router = useRouter()

  // Trigger confetti effect when dialog opens
  useEffect(() => {
    if (open) {
      // Realistic confetti effect based on the provided documentation
      const count = 200
      const defaults = {
        origin: { y: 0.7 },
      }

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        })
      }

      // Fire multiple confetti bursts with different parameters for realistic effect
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      })

      fire(0.2, {
        spread: 60,
      })

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      })

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      })

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      })
    }
  }, [open])

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share && tokenAddress) {
      navigator
        .share({
          title: t('createToken.success.title'),
          text: t('createToken.success.shareText', { address: tokenAddress }),
          url: window.location.origin + `/token/${tokenAddress}`,
        })
        .catch(console.error)
    }
  }

  const handleViewOnHomepage = () => {
    if (tokenAddress) {
      router.push(`/`)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-[500px] rounded-2xl border border-[#2B3139] bg-[#191B22] p-0"
        style={{ maxHeight: '404px', height: '404px' }}
      >
        {/* Hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">
          {t('createToken.success.title')}
        </DialogTitle>

        {/* Celebration Animation Container */}
        <div className="relative h-[315px] w-full">
          <Image
            src={celebrationImg}
            alt="Celebration"
            className="absolute top-[-50%] left-1/2 -translate-x-1/2"
            priority
          />
          {/* Success Text */}
          <div className="absolute inset-x-0 bottom-0 pb-6 text-center">
            <h2 className="font-din-pro text-2xl font-bold text-white">
              {t('createToken.success.congratulations')}
            </h2>

            {/* Contract Address */}
            {tokenAddress && (
              <div className="mt-5 px-6">
                <p className="font-din-pro text-base leading-6 text-[#9197AA]">
                  {t('createToken.success.contractAddress')}
                </p>
                <p className="font-din-pro font-mono text-base leading-6 break-all text-[#9197AA]">
                  {tokenAddress}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[10px] px-[30px] pb-[30px]">
          {/* Share Button */}
          <Button
            onClick={handleShare}
            variant="outline"
            className="font-din-pro h-[50px] flex-1 rounded-lg border border-[] bg-transparent text-lg font-bold text-[] hover:bg-[]/10"
          >
            <span>{t('createToken.success.share')}</span>
            <Image
              src={shareIcon}
              alt="Share"
              width={24}
              height={24}
              className="ml-2"
            />
          </Button>

          {/* View on Homepage Button */}
          <Button
            onClick={handleViewOnHomepage}
            className="font-din-pro h-[50px] flex-1 rounded-lg bg-[#BFFB06] text-lg font-bold text-black hover:bg-[#BFFB06]/90"
          >
            <span>{t('createToken.success.viewHomepage')}</span>
            <Image
              src={homeIcon}
              alt="Home"
              width={24}
              height={24}
              className="ml-2"
            />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
