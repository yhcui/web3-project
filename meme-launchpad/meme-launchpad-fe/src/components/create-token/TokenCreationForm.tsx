'use client'

import React, { useCallback, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { TabMode } from './config/tabConfig'
import { useTokenForm } from './hooks/useTokenForm'
import { useTokenCreation } from '@/hooks/useTokenCreation'
import { useTransactionMonitor } from '@/hooks/useTransactionMonitor'
import { TokenInfoSection } from './form-sections/TokenInfoSection'
import { BannerSection } from './form-sections/BannerSection'
import { TagsSection } from './form-sections/TagsSection'
import { SocialLinksSection } from './form-sections/SocialLinksSection'
import { EssentialInfoSection } from './form-sections/EssentialInfoSection'
import { SuccessDialog } from './SuccessDialog'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'

interface TokenCreationFormProps {
  mode: TabMode
  formData?: ReturnType<typeof useTokenForm>
  className?: string
}

export function TokenCreationForm({
  mode,
  formData,
  className = '',
}: TokenCreationFormProps) {
  const t = useTranslations()
  const router = useRouter()
  const { isAuthenticated, authenticate } = useWalletAuth()
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string>()
  const [transactionHash, setTransactionHash] = useState<string>()

  // Use provided formData or create new instance (for backward compatibility)
  const ownFormData = useTokenForm(mode)
  const {
    form,
    logoPreview,
    bannerPreview,
    selectedTags,
    contractPreviewData,
    uploadLogoMutation,
    uploadBannerMutation,
    prepareFormData,
    resetForm,
    handlers,
    config,
  } = formData || ownFormData

  // Token creation business logic
  const { createToken, isCreating } = useTokenCreation()

  // Transaction monitoring
  const transactionMonitor = useTransactionMonitor({
    useDialog: true,
    onDialogOpen: (receipt) => {
      // Extract token address from receipt logs if available
      // For now, use the predicted address from the creation result
      setShowSuccessDialog(true)
    },
    onSuccess: (receipt) => {},
    onError: (error) => {
      console.error('Transaction failed:', error)
    },
    onSettled: () => {
      setIsProcessing(false)
    },
  })

  /**
   * Handle form submission - orchestrate the entire flow
   */
  const handleSubmit = useCallback(
    async (values: any) => {
      // Step 1: Prepare form data
      const tokenData = prepareFormData(values)
      if (!tokenData) {
        return // Form validation failed
      }

      setIsProcessing(true)

      try {
        // Step 2: Create token (API + Contract)
        const result = await createToken(tokenData)

        if (!result) {
          // User cancelled or error occurred
          setIsProcessing(false)
          return
        }

        // Store token address and transaction hash for success dialog
        setCreatedTokenAddress(result.tokenAddress || result.predictedAddress)
        setTransactionHash(result.transactionHash)

        // Step 3: Clear form immediately after transaction sent
        resetForm()

        // Step 4: Start monitoring the transaction
        transactionMonitor.startMonitoring(result.transactionHash)
      } catch (error) {
        console.error('Token creation error:', error)
        setIsProcessing(false)
      }
    },
    [prepareFormData, createToken, resetForm, transactionMonitor]
  )

  // Combine processing states
  const isSubmitting =
    isProcessing || isCreating || transactionMonitor.isMonitoring

  /**
   * Handle authentication before form submission
   */
  const handleAuthClick = useCallback(async () => {
    if (!isConnected) {
      openConnectModal?.()
    } else if (!isAuthenticated) {
      await authenticate()
    }
  }, [isConnected, isAuthenticated, openConnectModal, authenticate])

  /**
   * Determine button text based on authentication state
   */
  const getButtonText = useCallback(() => {
    if (!isConnected) {
      return t('common.connectWallet')
    }
    if (!isAuthenticated) {
      return t('common.signMessage')
    }
    return t(config.submitButtonText)
  }, [isConnected, isAuthenticated, t, config.submitButtonText])

  return (
    <div className={`w-full ${className}`}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Token Info Section - Logo, Symbol, Name, Description */}
          <TokenInfoSection
            form={form}
            logoPreview={logoPreview}
            onLogoUpload={handlers.handleLogoUpload}
            onLogoCropComplete={handlers.handleLogoCropComplete}
            onLogoClear={handlers.clearLogo}
            isUploading={uploadLogoMutation.isPending}
          />

          {/* Banner Upload Section */}
          <BannerSection
            form={form}
            bannerPreview={bannerPreview}
            onBannerUpload={handlers.handleBannerUpload}
            onBannerClear={handlers.clearBanner}
            onBannerCropComplete={handlers.handleBannerCropComplete}
            isUploading={uploadBannerMutation.isPending}
          />

          {/* Tags Section */}
          <TagsSection
            selectedTags={selectedTags}
            onToggleTag={handlers.toggleTag}
          />

          {/* Social Platform Links Section */}
          <SocialLinksSection form={form} />

          {/* Essential Info Section - Mode-specific settings */}
          <EssentialInfoSection
            form={form}
            config={config}
            onContractPreview={handlers.handleContractPreview}
          />

          {/* Submit Button */}
          <Button
            type={isConnected && isAuthenticated ? 'submit' : 'button'}
            onClick={
              !isConnected || !isAuthenticated ? handleAuthClick : undefined
            }
            disabled={isSubmitting}
            className="h-[56px] w-full bg-[#BFFB06] text-xl font-bold text-[#0A0C0F] hover:bg-[#BFFB06]/90"
          >
            {!isConnected || !isAuthenticated ? (
              getButtonText()
            ) : (
              <>
                <Image
                  src="/icons/magic-wand.svg"
                  alt="Magic"
                  width={21}
                  height={21}
                  className="mr-2"
                />
                {getButtonText()}
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        tokenAddress={createdTokenAddress}
        transactionHash={transactionHash}
      />
    </div>
  )
}
