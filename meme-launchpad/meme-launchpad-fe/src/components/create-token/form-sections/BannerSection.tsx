'use client'

import React, { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { ImageUp, X, Loader2 } from 'lucide-react'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { FormData } from '../schemas/tokenFormSchema'
import { FlameIcon } from '../components/FlameIcon'
import { BannerCropDialog } from '../components/BannerCropDialog'
import { InlineFormLabel } from '../components/InlineFormLabel'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { notify } from '@/stores/useUIStore'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { AuthenticationModal } from '@/components/AuthenticationModal'

interface BannerSectionProps {
  form: UseFormReturn<FormData>
  bannerPreview: string | null
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBannerClear: () => void
  onBannerCropComplete?: (croppedImageUrl: string, croppedFile: File) => void
  isUploading?: boolean
}

export function BannerSection({
  form,
  bannerPreview,
  onBannerUpload,
  onBannerClear,
  onBannerCropComplete,
  isUploading = false,
}: BannerSectionProps) {
  const t = useTranslations()
  const { isAuthenticated, authenticate } = useWalletAuth()
  const { isConnected, address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Check authentication before allowing file upload
   * Returns true if authenticated, false otherwise
   */
  const checkAuthBeforeUpload = useCallback(
    (onSuccess?: () => void): boolean => {
      // If not connected, show connect modal
      if (!isConnected) {
        notify.info(
          t('createToken.auth.required'),
          t('createToken.auth.connectWalletToUpload')
        )
        openConnectModal?.()
        return false
      }

      // If connected but not authenticated, show auth modal
      if (!isAuthenticated) {
        setPendingAction(() => onSuccess || null)
        setShowAuthModal(true)
        return false
      }

      // Already authenticated
      return true
    },
    [isConnected, isAuthenticated, openConnectModal, t]
  )

  /**
   * Handle authentication confirmation from modal
   */
  const handleAuthConfirm = useCallback(async () => {
    const success = await authenticate()
    setShowAuthModal(false)

    if (success && pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [authenticate, pendingAction])

  /**
   * Handle authentication modal close
   */
  const handleAuthModalClose = useCallback(() => {
    setShowAuthModal(false)
    setPendingAction(null)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a URL for the file to show in crop dialog
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImageUrl(reader.result as string)
        setIsCropDialogOpen(true)
      }
      reader.readAsDataURL(file)
      // Reset input value to allow re-selecting the same file
      e.target.value = ''
    }
  }

  const handleCropDialogClose = () => {
    setIsCropDialogOpen(false)
    setSelectedImageUrl(null)
  }

  const handleCropComplete = (croppedImageUrl: string, croppedFile: File) => {
    if (onBannerCropComplete) {
      onBannerCropComplete(croppedImageUrl, croppedFile)
    }
    handleCropDialogClose()
  }

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
    },
    []
  )

  /**
   * Handle drop event
   */
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        const file = files[0]

        // Check authentication first
        const isAuth = checkAuthBeforeUpload(() => {
          // Re-trigger the drop action after authentication
          handleDrop(e)
        })
        if (!isAuth) {
          return
        }

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
          form.setError('banner', {
            message: t('createToken.errors.invalidImageType'),
          })
          return
        }

        // Create a URL for the file to show in crop dialog
        const reader = new FileReader()
        reader.onloadend = () => {
          setSelectedImageUrl(reader.result as string)
          setIsCropDialogOpen(true)
        }
        reader.readAsDataURL(file)
      }
    },
    [checkAuthBeforeUpload, form, t]
  )

  return (
    <>
      <FormField
        control={form.control}
        name="banner"
        render={({ field }) => (
          <FormItem>
            <InlineFormLabel name="banner">
              {t('createToken.form.banner')}
            </InlineFormLabel>
            <FormControl>
              <label
                htmlFor="banner-upload"
                onClick={(e) => {
                  // Check authentication before opening file picker
                  if (!bannerPreview && !isUploading) {
                    const isAuth = checkAuthBeforeUpload(() => {
                      // Trigger file input click after authentication
                      fileInputRef.current?.click()
                    })
                    if (!isAuth) {
                      e.preventDefault()
                    }
                  }
                }}
                className={`relative flex h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-[#191B22] transition-all md:h-[240px] ${
                  isDragOver
                    ? 'border-[] bg-[#1F222A]'
                    : 'border-[#2B3139] hover:border-[]'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {bannerPreview ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={bannerPreview}
                      alt="Banner"
                      fill
                      className="rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        onBannerClear()
                      }}
                      className="absolute top-2 right-2 rounded-full bg-black/50 p-1"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : isUploading ? (
                  <>
                    <Loader2 className="size-10 animate-spin text-[#FBD537]" />
                    <span className="text-base font-bold text-[#F0F1F5]">
                      {t('createToken.upload.uploading')}
                    </span>
                  </>
                ) : (
                  <>
                    <ImageUp className="size-10 text-[#656A79]" />
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-base font-bold text-[#F0F1F5]">
                        {t('createToken.upload.clickToUpload')}
                      </span>
                    </div>
                    {!bannerPreview && (
                      <span className="text-sm text-[#656A79]">
                        {t('createToken.upload.banner.supportedFormats')}
                      </span>
                    )}
                  </>
                )}
                <input
                  ref={fileInputRef}
                  id="banner-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </label>
            </FormControl>
          </FormItem>
        )}
      />

      {/* Banner Crop Dialog */}
      {selectedImageUrl && (
        <BannerCropDialog
          isOpen={isCropDialogOpen}
          onClose={handleCropDialogClose}
          imageUrl={selectedImageUrl}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Authentication Modal */}
      <AuthenticationModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        onConfirm={handleAuthConfirm}
        address={address}
        isAuthenticating={false}
      />
    </>
  )
}
