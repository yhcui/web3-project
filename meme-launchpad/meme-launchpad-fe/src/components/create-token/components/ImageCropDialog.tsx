'use client'

import React, { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import Cropper from 'react-easy-crop'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { getCroppedImg } from '@/lib/image-crop-utils'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog'

interface MediaSize {
  width: number
  height: number
  naturalWidth: number
  naturalHeight: number
}

interface ImageCropDialogProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onCropComplete: (croppedImageUrl: string, croppedFile: File) => void
}

export function ImageCropDialog({
  isOpen,
  onClose,
  imageUrl,
  onCropComplete,
}: ImageCropDialogProps) {
  const t = useTranslations()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [minZoom, setMinZoom] = useState(1)
  const [maxZoom] = useState(3)

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop)
  }

  const onZoomChange = (zoom: number) => {
    setZoom(zoom)
  }

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.1, maxZoom)
    setZoom(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.1, minZoom)
    setZoom(newZoom)
  }

  const onCropAreaComplete = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleUpload = async () => {
    if (!croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const { url, file } = await getCroppedImg(imageUrl, croppedAreaPixels)
      onCropComplete(url, file)
      onClose()
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex !max-w-[720px] flex-col gap-0 rounded-2xl border border-[#2B3139] bg-[#1B1E25] p-0 md:h-[822px]"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-end justify-between px-[30px] py-4">
          <DialogTitle className="font-din-pro text-xl font-bold text-white">
            {t('createToken.crop.title')}
          </DialogTitle>
          <DialogClose className="flex h-8 w-8 items-center justify-center rounded hover:bg-white/10">
            <X className="h-[25px] w-[25px] text-[#B7BDC6]" />
          </DialogClose>
        </div>

        {/* Crop Area */}
        <div className="relative mx-auto h-[260px] w-[270px] overflow-hidden rounded-lg bg-[#252832] md:h-[540px] md:w-[660px]">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
            showGrid={true}
            style={{
              containerStyle: {
                backgroundColor: '#252832',
              },
              cropAreaStyle: {
                border: '2px solid ',
                borderRadius: '0px',
                width: 360,
                height: 360,
              },
            }}
          />
        </div>

        {/* Zoom Slider */}
        <div className="flex items-center justify-between px-[30px] py-[44px]">
          <span className="font-din-pro text-base font-bold text-white">
            {t('createToken.crop.ratio')} 1:1
          </span>
          <div className="relative flex w-[448px] items-center gap-2">
            {/* Zoom Out Icon */}
            <button
              type="button"
              onClick={handleZoomOut}
              className="flex h-8 w-8 items-center justify-center rounded transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-6 w-6 text-[#656A79] hover:text-white" />
            </button>

            {/* Slider Track */}
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="slider-custom w-full"
              style={{
                background: `linear-gradient(to right,  0%,  ${
                  ((zoom - minZoom) / (maxZoom - minZoom)) * 100
                }%, #2B3139 ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, #2B3139 100%)`,
              }}
            />

            {/* Zoom In Icon */}
            <button
              type="button"
              onClick={handleZoomIn}
              className="flex h-8 w-8 items-center justify-center rounded transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-6 w-6 text-[#656A79] hover:text-white" />
            </button>
          </div>
        </div>

        {/* Upload Button */}
        <div className="px-[100px] pb-[30px]">
          <button
            onClick={handleUpload}
            disabled={isProcessing}
            className="font-din-pro flex h-[50px] w-full items-center justify-center rounded-lg bg-[#ADE416] text-lg font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isProcessing
              ? t('createToken.crop.processing')
              : t('createToken.crop.upload')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
