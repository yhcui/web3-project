/**
 * Utility functions for image cropping and processing
 */

interface CroppedArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Creates an image element from a URL
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

/**
 * Converts degrees to radians
 */
function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle
 */
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * Gets the cropped image from the source image based on the crop area
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CroppedArea,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<{ url: string; file: File }> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context available')
  }

  const rotRad = getRadianAngle(rotation)

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // Translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // Draw rotated image
  ctx.drawImage(image, 0, 0)

  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')

  if (!croppedCtx) {
    throw new Error('No 2d context available')
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height

  // Draw the cropped image onto the new canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Return both URL and File object
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }

      const url = URL.createObjectURL(blob)
      const file = new File([blob], 'cropped-image.png', {
        type: 'image/png',
      })

      resolve({ url, file })
    }, 'image/png')
  })
}

/**
 * Converts a File to a data URL
 */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result as string))
    reader.addEventListener('error', (error) => reject(error))
    reader.readAsDataURL(file)
  })
}

/**
 * Validates image dimensions and size
 */
export function validateImage(file: File): Promise<{
  isValid: boolean
  error?: string
  dimensions?: { width: number; height: number }
}> {
  return new Promise((resolve) => {
    // Check file size (10MB max - more generous for cropping)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      resolve({ isValid: false, error: 'Image size must be less than 10MB' })
      return
    }

    // Check dimensions - very minimal requirement since we'll crop
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const minDimension = 100 // Very low minimum since user will crop
        if (img.width < minDimension || img.height < minDimension) {
          resolve({
            isValid: false,
            error: `Image dimensions must be at least ${minDimension}x${minDimension}px`,
          })
        } else {
          resolve({
            isValid: true,
            dimensions: { width: img.width, height: img.height },
          })
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
