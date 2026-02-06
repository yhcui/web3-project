'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield, AlertCircle } from 'lucide-react'

interface AuthenticationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  address?: string
  isAuthenticating?: boolean
}

export function AuthenticationModal({
  isOpen,
  onClose,
  onConfirm,
  address,
  isAuthenticating = false,
}: AuthenticationModalProps) {
  const t = useTranslations()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-[#2B3139] bg-[#191B22] text-[#F0F1F5] sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#BEFA0A]/10">
              <Shield className="h-6 w-6 text-[#BEFA0A]" />
            </div>
            <DialogTitle className="text-xl font-bold text-[#F0F1F5]">
              {t('createToken.auth.signatureRequired')}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <DialogDescription className="text-[#656A79]">
            {t('createToken.auth.signatureDescription')}
          </DialogDescription>

          {address && (
            <div className="rounded-lg border border-[#2B3139] bg-[#1A1D22] p-3">
              <p className="mb-1 text-xs text-[#656A79]">
                {t('createToken.auth.walletAddress')}
              </p>
              <p className="font-mono text-sm break-all text-[#F0F1F5]">
                {address}
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-[#BEFA0A]/20 bg-[#BEFA0A]/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#BEFA0A]" />
            <div className="text-sm text-[#BEFA0A]">
              {t('createToken.auth.signatureInfo')}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAuthenticating}
            className="flex-1 border-[#2B3139] bg-transparent text-[#F0F1F5] hover:border-[#3B4149] hover:bg-[#252832]"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isAuthenticating}
            className="flex-1 bg-[#BEFA0A] text-black hover:bg-[#BEFA0A]/90"
          >
            {isAuthenticating
              ? t('createToken.auth.signing')
              : t('createToken.auth.signMessage')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
