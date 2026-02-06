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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { FormData } from '../schemas/tokenFormSchema'
import { ImageCropDialog } from '../components/ImageCropDialog'
import { InlineFormLabel } from '../components/InlineFormLabel'
import { readFile, validateImage } from '@/lib/image-crop-utils'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { notify } from '@/stores/useUIStore'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { AuthenticationModal } from '@/components/AuthenticationModal'

interface TokenInfoSectionProps {
  form: UseFormReturn<FormData>
  logoPreview: string | null
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onLogoCropComplete?: (file: File) => void
  onLogoClear: () => void
  isUploading?: boolean
}

export function TokenInfoSection({
  form,
  logoPreview,
  onLogoUpload,
  onLogoCropComplete,
  onLogoClear,
  isUploading = false,
}: TokenInfoSectionProps) {
  const t = useTranslations()
  const { isAuthenticated, authenticate } = useWalletAuth()
  const { isConnected, address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
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

  /**
   * Handle file selection - opens crop dialog instead of direct upload
   */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate image
      const validation = await validateImage(file)
      if (!validation.isValid) {
        form.setError('tokenLogo', {
          message: validation.error || t('createToken.errors.invalidImage'),
        })
        e.target.value = ''
        return
      }

      // Store original file
      setOriginalFile(file)

      // Read file and open crop dialog
      const imageUrl = await readFile(file)
      setSelectedImageUrl(imageUrl)
      setIsCropDialogOpen(true)

      // Reset input value to allow re-selecting the same file
      e.target.value = ''
    },
    [form, t]
  )

  /**
   * Handle crop completion - upload cropped image
   */
  const handleCropComplete = useCallback(
    async (croppedImageUrl: string, croppedFile: File) => {
      // Use the dedicated crop handler if provided, otherwise fall back to creating synthetic event
      if (onLogoCropComplete) {
        await onLogoCropComplete(croppedFile)
      } else {
        // Fallback: call the original handler with a synthetic event
        const syntheticEvent = {
          target: {
            files: [croppedFile],
            value: '',
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>
        await onLogoUpload(syntheticEvent)
      }

      // Clean up
      setSelectedImageUrl(null)
      setOriginalFile(null)
    },
    [onLogoCropComplete, onLogoUpload]
  )

  /**
   * Handle crop dialog close
   */
  const handleCropDialogClose = useCallback(() => {
    setIsCropDialogOpen(false)
    setSelectedImageUrl(null)
    setOriginalFile(null)
  }, [])

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
          form.setError('tokenLogo', {
            message: t('createToken.errors.invalidImageType'),
          })
          return
        }

        // Validate image
        const validation = await validateImage(file)
        if (!validation.isValid) {
          form.setError('tokenLogo', {
            message: validation.error || t('createToken.errors.invalidImage'),
          })
          return
        }

        // Store original file
        setOriginalFile(file)

        // Read file and open crop dialog
        const imageUrl = await readFile(file)
        setSelectedImageUrl(imageUrl)
        setIsCropDialogOpen(true)
      }
    },
    [form, t, checkAuthBeforeUpload]
  )

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Token Logo Upload */}
      <FormField
        control={form.control}
        name="tokenLogo"
        render={({ field: _field }) => (
          <FormItem>
            <div className="space-y-2">
              <FormMessage />
              <FormControl>
                <label
                  htmlFor="logo-upload"
                  onClick={(e) => {
                    // Check authentication before opening file picker
                    if (!logoPreview && !isUploading) {
                      const isAuth = checkAuthBeforeUpload(() => {
                        // Trigger file input click after authentication
                        fileInputRef.current?.click()
                      })
                      if (!isAuth) {
                        e.preventDefault()
                      }
                    }
                  }}
                  className={`relative flex h-[120px] w-[360px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-[#191B22] transition-all md:h-[360px] ${
                    isDragOver
                      ? 'border-[] bg-[#1F222A]'
                      : 'border-[#2B3139] hover:border-[]'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {logoPreview ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={logoPreview}
                        alt="Token logo"
                        fill
                        className="rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          onLogoClear()
                        }}
                        className="absolute top-2 right-2 rounded-full bg-black/50 p-1"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ) : isUploading ? (
                    <>
                      <Loader2 className="size-10 animate-spin text-[#BFFB06]" />
                      <span className="text-base font-bold text-[#F0F1F5]">
                        {t('createToken.upload.uploading')}
                      </span>
                    </>
                  ) : (
                    <>
                      <ImageUp className="size-10 text-[#656A79]" />
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-base font-bold text-[#F0F1F5]">
                            {t('createToken.upload.clickToUpload')}
                          </span>
                          <span className="text-base font-bold text-[#BFFB06]">
                            {t('createToken.form.required')}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    id="logo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  {!logoPreview && (
                    <span className="text-sm text-[#656A79]">
                      {t('createToken.upload.tokenLogo.supportedFormats')}
                    </span>
                  )}
                </label>
              </FormControl>
            </div>
          </FormItem>
        )}
      />

      {/* Symbol, Coin Name, Description */}
      <div className="flex-1 space-y-4">
        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <InlineFormLabel name="symbol" required>
                {t('createToken.form.symbol')}
              </InlineFormLabel>
              <FormControl>
                <Input
                  placeholder={t('createToken.placeholders.symbol')}
                  {...field}
                  className="h-[50px] border-[#2B3139] bg-[#191B22] px-4 text-[#F0F1F5] placeholder:text-[#656A79]"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coinName"
          render={({ field }) => (
            <FormItem>
              <InlineFormLabel name="coinName" required>
                {t('createToken.form.coinName')}
              </InlineFormLabel>
              <FormControl>
                <Input
                  placeholder={t('createToken.placeholders.coinName')}
                  {...field}
                  className="h-[50px] border-[#2B3139] bg-[#191B22] px-4 text-[#F0F1F5] placeholder:text-[#656A79]"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <InlineFormLabel name="description" optional>
                {t('createToken.form.description')}
              </InlineFormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('createToken.placeholders.description')}
                  {...field}
                  className="min-h-[128px] resize-none border-[#2B3139] bg-[#191B22] px-4 py-3 text-[#F0F1F5] placeholder:text-[#656A79]"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Image Crop Dialog */}
      {selectedImageUrl && (
        <ImageCropDialog
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
    </div>
  )
}
