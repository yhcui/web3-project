import Image from 'next/image'
import { ImageUp, X, Loader2 } from 'lucide-react'
import {
  FormField,
  FormItem,
  FormMessage,
  FormControl,
} from '@/components/ui/form'
import { UseFormReturn } from 'react-hook-form'
import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { readFile, validateImage } from '@/lib/image-crop-utils'
import { z } from 'zod'
import { FormDataSchema } from './EventForm'
import { useUploadActivityBanner } from '@/api/endpoints/file'
import { BannerCropDialog } from '@/components/create-token/components/BannerCropDialog'

export default function UploadImage({
  form,
}: {
  form: UseFormReturn<z.infer<typeof FormDataSchema>>
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false)
  const t = useTranslations()
  const { isPending: isUploading, mutate: onImageUpload } =
    useUploadActivityBanner()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
          form.setError('coverImage', {
            message: t('createToken.errors.invalidImageType'),
          })
          return
        }

        // Validate image
        const validation = await validateImage(file)
        if (!validation.isValid) {
          form.setError('coverImage', {
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
    [form, t]
  )

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
        form.setError('coverImage', {
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
   * Handle crop dialog close
   */
  const handleCropDialogClose = useCallback(() => {
    setIsCropDialogOpen(false)
    setSelectedImageUrl(null)
    setOriginalFile(null)
  }, [])

  /**
   * Handle crop completion - upload cropped image
   */
  const handleCropComplete = useCallback(
    async (croppedImageUrl: string, croppedFile: File) => {
      onImageUpload(croppedFile, {
        onSuccess: (publicUrl) => {
          setSelectedImageUrl(croppedImageUrl)
          setOriginalFile(null)
          form.setValue('coverImage', publicUrl)
        },
      })
    },
    [onImageUpload]
  )

  return (
    <div>
      <FormField
        control={form.control}
        name="coverImage"
        render={({ field: _field }) => (
          <FormItem>
            <div className="space-y-2">
              <FormControl>
                <label
                  htmlFor="logo-upload"
                  className={`relative flex h-[266px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-1 bg-[#191B22] transition-all ${
                    isDragOver
                      ? 'border-[] bg-[#1F222A]'
                      : 'border-[#2B3139] hover:border-[]'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {selectedImageUrl ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={selectedImageUrl}
                        alt="Token logo"
                        fill
                        className="rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          setSelectedImageUrl(null)
                          setOriginalFile(null)
                          setIsCropDialogOpen(false)
                          fileInputRef.current &&
                            (fileInputRef.current.value = '')
                          e.preventDefault()
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
                  {!selectedImageUrl && (
                    <span className="text-sm text-[#656A79]">
                      {t('createToken.upload.tokenLogo.supportedFormats')}
                    </span>
                  )}
                </label>
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
      {/* Image Crop Dialog */}
      {selectedImageUrl && (
        <BannerCropDialog
          isOpen={isCropDialogOpen}
          onClose={handleCropDialogClose}
          imageUrl={selectedImageUrl}
          onCropComplete={handleCropComplete}
          height={266}
          aspect={0}
        />
      )}
    </div>
  )
}
