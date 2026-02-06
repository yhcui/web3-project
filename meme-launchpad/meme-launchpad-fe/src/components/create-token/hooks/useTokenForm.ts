import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import {
  getSchemaForMode,
  MAX_FILE_SIZE,
  ACCEPTED_IMAGE_TYPES,
} from '../schemas/tokenFormSchema'
import type { FormData } from '../schemas/tokenFormSchema'
import {
  TabMode,
  getTabConfig,
  SHARED_DEFAULT_VALUES,
} from '../config/tabConfig'
import { useUploadTokenLogo, useUploadTokenBanner } from '@/api/endpoints/file'
import type { TokenCreationData } from '@/hooks/useTokenCreation'

/**
 * Form state management hook
 * ONLY handles form state, validation, and data preparation
 * No business logic, no contract interaction, no monitoring
 */
export function useTokenForm(mode: TabMode) {
  const t = useTranslations()
  const config = getTabConfig(mode)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [contractPreviewData, setContractPreviewData] = useState<{
    predictedAddress?: string
    digits?: string
    isCalculated?: boolean
  } | null>(null)

  // Use upload mutations
  const uploadLogoMutation = useUploadTokenLogo()
  const uploadBannerMutation = useUploadTokenBanner()

  // Initialize form with mode-specific schema and defaults
  const form = useForm<FormData>({
    resolver: zodResolver(getSchemaForMode(mode)) as any,
    defaultValues: {
      ...SHARED_DEFAULT_VALUES,
      ...config.defaultValues,
    },
  })

  // Process logo file upload (shared by both file input and crop handlers)
  const processLogoFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        form.setError('tokenLogo', {
          message: t('createToken.errors.fileSize'),
        })
        return false
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        form.setError('tokenLogo', {
          message: t('createToken.errors.fileType', {
            types: 'JPEG, PNG, GIF',
          }),
        })
        return false
      }

      // Show preview immediately
      const reader = new FileReader()
      reader.onloadend = async () => {
        setLogoPreview(reader.result as string)
        form.setValue('tokenLogo', file)

        try {
          // Upload to cloud storage and get public URL
          const publicUrl = await uploadLogoMutation.mutateAsync(file)
          setLogoUrl(publicUrl)
          // Store the URL in form for submission
          form.setValue('tokenLogoUrl', publicUrl)
        } catch (error) {
          console.error('Failed to upload logo:', error)
          form.setError('tokenLogo', {
            message: t('createToken.errors.uploadFailed'),
          })
        }
      }
      reader.readAsDataURL(file)
      return true
    },
    [form, t, uploadLogoMutation]
  )

  // Handle logo upload from file input
  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        await processLogoFile(file)
        // Reset input value to allow re-selecting the same file
        e.target.value = ''
      }
    },
    [processLogoFile]
  )

  // Handle logo upload from crop completion
  const handleLogoCropComplete = useCallback(
    async (croppedFile: File) => {
      await processLogoFile(croppedFile)
    },
    [processLogoFile]
  )

  // Handle banner upload (deprecated - kept for backward compatibility)
  const handleBannerUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          form.setError('banner', { message: t('createToken.errors.fileSize') })
          // Reset input value to allow re-selecting the same file
          e.target.value = ''
          return
        }
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type.replace('gif', ''))) {
          form.setError('banner', {
            message: t('createToken.errors.fileType', { types: 'JPEG, PNG' }),
          })
          // Reset input value to allow re-selecting the same file
          e.target.value = ''
          return
        }

        // Show preview immediately
        const reader = new FileReader()
        reader.onloadend = async () => {
          setBannerPreview(reader.result as string)
          form.setValue('banner', file)

          try {
            // Upload to cloud storage and get public URL
            const publicUrl = await uploadBannerMutation.mutateAsync(file)
            setBannerUrl(publicUrl)
            // Store the URL in form for submission
            form.setValue('bannerUrl', publicUrl)
          } catch (error) {
            console.error('Failed to upload banner:', error)
            form.setError('banner', {
              message: t('createToken.errors.uploadFailed'),
            })
          }
        }
        reader.readAsDataURL(file)

        // Reset input value to allow re-selecting the same file
        e.target.value = ''
      }
    },
    [form, t, uploadBannerMutation]
  )

  // Handle banner crop complete
  const handleBannerCropComplete = useCallback(
    async (croppedImageUrl: string, croppedFile: File) => {
      // Validate file size
      if (croppedFile.size > MAX_FILE_SIZE) {
        form.setError('banner', { message: t('createToken.errors.fileSize') })
        return
      }

      // Show preview immediately
      setBannerPreview(croppedImageUrl)
      form.setValue('banner', croppedFile)

      try {
        // Upload cropped image to cloud storage and get public URL
        const publicUrl = await uploadBannerMutation.mutateAsync(croppedFile)
        setBannerUrl(publicUrl)
        // Store the URL in form for submission
        form.setValue('bannerUrl', publicUrl)
      } catch (error) {
        console.error('Failed to upload banner:', error)
        form.setError('banner', {
          message: t('createToken.errors.uploadFailed'),
        })
        // Clear preview on error
        setBannerPreview(null)
      }
    },
    [form, t, uploadBannerMutation]
  )

  // Clear logo
  const clearLogo = useCallback(() => {
    setLogoPreview(null)
    setLogoUrl(null)
    form.setValue('tokenLogo', undefined)
    form.setValue('tokenLogoUrl', undefined)
  }, [form])

  // Clear banner
  const clearBanner = useCallback(() => {
    setBannerPreview(null)
    setBannerUrl(null)
    form.setValue('banner', undefined)
    form.setValue('bannerUrl', undefined)
  }, [form])

  // Toggle tag selection
  const toggleTag = useCallback(
    (tagKey: string) => {
      if (selectedTags.includes(tagKey)) {
        const newTags = selectedTags.filter((t) => t !== tagKey)
        setSelectedTags(newTags)
        form.setValue('tags', newTags)
      } else if (selectedTags.length < 3) {
        const newTags = [...selectedTags, tagKey]
        setSelectedTags(newTags)
        form.setValue('tags', newTags)
      }
    },
    [selectedTags, form]
  )

  // Handle contract preview calculation
  const handleContractPreview = useCallback(
    (data: { predictedAddress?: string; digits?: string }) => {
      setContractPreviewData({
        ...data,
        isCalculated: true,
      })
    },
    []
  )

  /**
   * Prepare form data for token creation
   * Returns clean data object ready for business logic
   */
  const prepareFormData = useCallback(
    (values: FormData): TokenCreationData | null => {
      // Validate required fields
      if (!logoUrl) {
        form.setError('tokenLogo', {
          message: t('createToken.errors.uploadLogoFirst'),
        })
        return null
      }

      // Prepare the data payload
      const data: TokenCreationData = {
        // Basic token info
        name: values.coinName,
        symbol: values.symbol,
        description: values.description || '',

        // Launch configuration
        launchMode: 1, // Default to "1" as specified
        launchTime: 0, // Default to current time (0)

        // Media URLs
        logo: logoUrl,

        // Social links (all optional)
        website: values.website || undefined,
        twitter: values.twitter || undefined,
        telegram: values.telegram || undefined,
        discord: values.discord || undefined,
        whitepaper: values.whitepaper || undefined,

        // Tags (optional)
        tags:
          selectedTags && selectedTags.length > 0 ? selectedTags : undefined,

        // Default financial parameters
        preBuyPercent: 0,
        marginBnb: 0,
        marginTime: 0,
      }

      // Add banner only if provided
      if (bannerUrl) {
        data.banner = bannerUrl
      }

      // Handle mode-specific fields for new-coin mode
      if (mode === 'new-coin' && 'preBuy' in values) {
        // Pre-buy percentage (convert to decimal 0-1)
        data.preBuyPercent = (values.preBuy || 0) / 100

        // Handle pre-buy allocations
        if (values.preBuyAllocations && values.preBuyAllocations.length > 0) {
          // Convert allocations to API format
          data.preBuyUsedPercent = values.preBuyAllocations.map(
            (a) => a.percentage / 100
          ) // Convert to decimal
          data.preBuyUsedType = values.preBuyAllocations.map((a) =>
            a.type === 'locked' ? 2 : 1
          ) // 1=normal, 2=locked
          data.preBuyLockTime = values.preBuyAllocations.map((a) =>
            a.type === 'locked' ? a.lockTime || 0 : 0
          )
          data.preBuyUsedName = values.preBuyAllocations.map(
            (a) => a.name || ''
          )
          data.preBuyUsedDesc = values.preBuyAllocations.map(
            (a) => a.description || ''
          )
        }

        // Margin settings
        if (values.addMargin && values.marginAmount) {
          data.marginBnb = values.marginAmount
          // Convert marginTime from days to seconds
          data.marginTime = (values.marginTime || 0) * 24 * 60 * 60
        }

        // Token launch reservation
        if (
          values.tokenLaunchReservation &&
          values.tokenLaunchReservationDate
        ) {
          // Convert date string to unix timestamp
          const launchDate = new Date(values.tokenLaunchReservationDate)
          data.launchTime = Math.floor(launchDate.getTime() / 1000)
        }

        // Official contact information
        if (values.officialContact) {
          if (values.contractTg) {
            data.contractTg = values.contractTg
          }
          if (values.contractEmail) {
            data.contractEmail = values.contractEmail
          }
        }
      }

      // Handle contract address preview logic
      if (
        contractPreviewData?.isCalculated &&
        contractPreviewData?.predictedAddress
      ) {
        data.predictedAddress = contractPreviewData.predictedAddress

        // Only send digits if custom digits were used
        if (
          contractPreviewData.digits &&
          contractPreviewData.digits.length === 4
        ) {
          data.digits = contractPreviewData.digits
        }
      }

      // Handle IDO-specific fields
      if (mode === 'ido' && 'idoPrice' in values) {
        data.launchMode = 2 // IDO mode
        // Add IDO specific fields here if needed
      }

      // Handle Burning-specific fields
      if (mode === 'burning' && 'burnRate' in values) {
        // Add burning specific fields here if needed
      }

      return data
    },
    [mode, logoUrl, bannerUrl, selectedTags, contractPreviewData, form, t]
  )

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    form.reset()
    setLogoPreview(null)
    setBannerPreview(null)
    setLogoUrl(null)
    setBannerUrl(null)
    setSelectedTags([])
    setContractPreviewData(null)
  }, [form])

  return {
    // Form state
    form,
    logoPreview,
    bannerPreview,
    logoUrl,
    bannerUrl,
    selectedTags,
    contractPreviewData,

    // Upload mutations
    uploadLogoMutation,
    uploadBannerMutation,

    // Functions
    prepareFormData,
    resetForm,

    // Handlers
    handlers: {
      handleLogoUpload,
      handleLogoCropComplete,
      handleBannerUpload,
      handleBannerCropComplete,
      clearLogo,
      clearBanner,
      toggleTag,
      handleContractPreview,
    },

    config,
  }
}
