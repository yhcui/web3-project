import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import { notify } from '@/stores/useUIStore'
import { fileKeys } from './queries'
import {
  FileUploadConfirmInputSchema,
  FileUploadConfirmResponseSchema,
  type FileUploadConfirmInput,
  type FileUploadConfirmResponse,
  type PresignUrl,
} from '@/api/schemas/file.schema'
import { useAccount } from 'wagmi'

// Helper function to extract file extension as mimeType
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) {
    throw new Error('File must have an extension')
  }

  const extension = filename.substring(lastDot + 1).toLowerCase()

  // Map common extensions to the expected format
  switch (extension) {
    case 'jpeg':
    case 'jpg':
      return 'jpg'
    case 'png':
      return 'png'
    case 'gif':
      return 'gif'
    default:
      throw new Error(
        `Unsupported file type: ${extension}. Only jpg, png, and gif are allowed.`
      )
  }
}

// API函数：上传文件到预签名URL
async function uploadToPresignedUrl(
  file: File,
  presignData: PresignUrl
): Promise<void> {
  const { uploadUrl, uploadHeaders } = presignData

  try {
    // 准备上传请求的headers
    const headers: HeadersInit = {
      'Content-Type': file.type,
    }

    // 只添加非空的uploadHeaders
    if (uploadHeaders && Object.keys(uploadHeaders).length > 0) {
      Object.assign(headers, uploadHeaders)
    }

    // 上传文件到预签名URL（通常是云存储服务）
    // 注意：某些云存储服务可能需要特定的CORS配置
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers,
      body: file,
      mode: 'cors', // 明确指定CORS模式
    })

    if (!response.ok) {
      // 获取更详细的错误信息
      let errorMessage = `Upload failed with status ${response.status}`
      try {
        const errorText = await response.text()
        if (errorText) {
          errorMessage += `: ${errorText}`
        }
      } catch {
        // 忽略解析错误
      }
      throw new Error(errorMessage)
    }
  } catch (error: any) {
    // 处理网络错误或CORS错误
    if (
      error.name === 'TypeError' &&
      error.message.includes('Failed to fetch')
    ) {
      throw new Error(
        'Upload failed. This might be a network or CORS issue. Please contact support if this persists.'
      )
    }
    throw error
  }
}

// API函数：确认文件上传成功
async function confirmFileUpload(
  data: FileUploadConfirmInput
): Promise<FileUploadConfirmResponse> {
  // 验证输入数据
  const validated = FileUploadConfirmInputSchema.parse(data)

  // 发起确认请求
  const response = await kyClient
    .post('file/upload-confirm', {
      json: validated,
    })
    .json()

  // 验证响应数据
  return parseApiResponse(response, FileUploadConfirmResponseSchema)
}

/**
 * Hook: 上传文件到预签名URL
 * 处理文件上传到云存储的完整流程
 *
 * @example
 * ```tsx
 * const uploadMutation = useUploadFile()
 *
 * const handleUpload = async (file: File, presignData: PresignUrl) => {
 *   await uploadMutation.mutateAsync({ file, presignData })
 * }
 * ```
 */
export const useUploadFile = () => {
  return useMutation({
    mutationFn: async ({
      file,
      presignData,
    }: {
      file: File
      presignData: PresignUrl
    }) => {
      // 上传文件到预签名URL
      await uploadToPresignedUrl(file, presignData)

      // 返回公开访问URL
      return presignData.publicUrl
    },

    onError: (error: any) => {
      console.error('File upload failed:', error)
      notify.error('Upload Failed', error?.message || 'Failed to upload file')
    },
  })
}

/**
 * Hook: 确认文件上传成功
 * 向后端确认文件已成功上传到云存储
 *
 * @example
 * ```tsx
 * const confirmMutation = useConfirmFileUpload()
 *
 * const handleConfirm = async (key: string, uploadedUrl: string) => {
 *   await confirmMutation.mutateAsync({
 *     key,
 *     uploadedUrl,
 *     metadata: { type: 'token-logo' }
 *   })
 * }
 * ```
 */
export const useConfirmFileUpload = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: confirmFileUpload,

    onSuccess: (response) => {
      // 验证响应
      if (response.code !== 200) {
        throw new Error(response.message || 'Confirmation failed')
      }

      // 清理相关缓存
      queryClient.invalidateQueries({ queryKey: fileKeys.all })

      // 显示成功通知
      notify.success('Upload Successful', 'File has been uploaded successfully')
    },

    onError: (error: any) => {
      console.error('File upload confirmation failed:', error)
      notify.error(
        'Confirmation Failed',
        error?.message || 'Failed to confirm file upload'
      )
    },
  })
}

/**
 * Hook: 完整的Token Logo上传流程
 * 包括获取预签名URL、上传文件、确认上传
 *
 * @example
 * ```tsx
 * const uploadLogoMutation = useUploadTokenLogo()
 *
 * const handleLogoUpload = async (file: File) => {
 *   const publicUrl = await uploadLogoMutation.mutateAsync(file)
 *   console.log('Logo uploaded to:', publicUrl)
 * }
 * ```
 */
export const useUploadTokenLogo = () => {
  const { chainId } = useAccount()

  return useMutation({
    mutationFn: async (file: File) => {
      try {
        // Extract file extension as mimeType
        const mimeType = getFileExtension(file.name)

        // Get current chain ID (default to BSC testnet if not connected)
        const currentChainId = chainId || 97

        console.log('Upload params:', {
          mimeType,
          chainId: currentChainId,
          fileName: file.name,
        })

        // 1. 获取预签名URL
        const presignResponse = await kyClient
          .get('file/token-logo-presign', {
            searchParams: {
              mimeType: mimeType,
              chainId: currentChainId,
            },
          })
          .json<any>()
          .catch((error) => {
            console.error('Failed to get presign URL:', error)
            throw new Error(
              'Failed to get upload URL from server. Please check your connection.'
            )
          })

        if (!presignResponse || presignResponse.code !== 200) {
          throw new Error(
            presignResponse?.message || 'Failed to get presign URL'
          )
        }

        // Handle the actual response format with fileName
        const responseData = presignResponse.data
        if (!responseData.uploadUrl || !responseData.fileName) {
          throw new Error('Invalid presign response from server')
        }

        console.log('Presign response:', responseData)

        // 2. 上传文件到预签名URL
        try {
          // Get proper MIME type for the Content-Type header
          const contentType = file.type || `image/${mimeType}`

          // 准备上传请求
          const response = await fetch(responseData.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': contentType,
            },
            body: file,
            mode: 'cors',
          })

          if (!response.ok) {
            let errorMessage = `Upload failed with status ${response.status}`
            try {
              const errorText = await response.text()
              if (errorText) {
                errorMessage += `: ${errorText}`
              }
            } catch {
              // 忽略解析错误
            }
            throw new Error(errorMessage)
          }
        } catch (uploadError: any) {
          console.error('Direct upload failed:', uploadError)
          throw new Error(
            'Failed to upload file. Please try again or contact support if the issue persists.'
          )
        }

        // 3. 返回后端提供的公开访问URL
        console.log('File uploaded successfully, public URL:', responseData.publicUrl)

        // 返回公开访问URL
        return responseData.publicUrl
      } catch (error: any) {
        // 重新抛出错误，让onError处理
        throw error
      }
    },

    onSuccess: (publicUrl) => {
      notify.success(
        'Logo Uploaded',
        'Token logo has been uploaded successfully'
      )
      return publicUrl
    },

    onError: (error: any) => {
      console.error('Token logo upload failed:', error)
      notify.error(
        'Logo Upload Failed',
        error?.message || 'Failed to upload token logo. Please try again.'
      )
    },
  })
}

/**
 * Hook: 完整的Token Banner上传流程
 * 包括获取预签名URL、上传文件、确认上传
 *
 * @example
 * ```tsx
 * const uploadBannerMutation = useUploadTokenBanner()
 *
 * const handleBannerUpload = async (file: File) => {
 *   const publicUrl = await uploadBannerMutation.mutateAsync(file)
 *   console.log('Banner uploaded to:', publicUrl)
 * }
 * ```
 */
export const useUploadTokenBanner = () => {
  const { chainId } = useAccount()

  return useMutation({
    mutationFn: async (file: File) => {
      try {
        // Extract file extension as mimeType
        const mimeType = getFileExtension(file.name)

        // Get current chain ID (default to BSC testnet if not connected)
        const currentChainId = chainId || 97

        console.log('Upload params:', {
          mimeType,
          chainId: currentChainId,
          fileName: file.name,
        })

        // 1. 获取预签名URL
        const presignResponse = await kyClient
          .get('file/token-banner-presign', {
            searchParams: {
              mimeType: mimeType,
              chainId: currentChainId,
            },
          })
          .json<any>()
          .catch((error) => {
            console.error('Failed to get presign URL:', error)
            throw new Error(
              'Failed to get upload URL from server. Please check your connection.'
            )
          })

        if (!presignResponse || presignResponse.code !== 200) {
          throw new Error(
            presignResponse?.message || 'Failed to get presign URL'
          )
        }

        // Handle the actual response format with fileName
        const responseData = presignResponse.data
        if (!responseData.uploadUrl || !responseData.fileName) {
          throw new Error('Invalid presign response from server')
        }

        console.log('Presign response:', responseData)

        // 2. 上传文件到预签名URL
        try {
          // Get proper MIME type for the Content-Type header
          const contentType = file.type || `image/${mimeType}`

          // 准备上传请求
          const response = await fetch(responseData.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': contentType,
            },
            body: file,
            mode: 'cors',
          })

          if (!response.ok) {
            let errorMessage = `Upload failed with status ${response.status}`
            try {
              const errorText = await response.text()
              if (errorText) {
                errorMessage += `: ${errorText}`
              }
            } catch {
              // 忽略解析错误
            }
            throw new Error(errorMessage)
          }
        } catch (uploadError: any) {
          console.error('Direct upload failed:', uploadError)
          throw new Error(
            'Failed to upload file. Please try again or contact support if the issue persists.'
          )
        }

        // 3. 返回后端提供的公开访问URL
        console.log('File uploaded successfully, public URL:', responseData.publicUrl)

        // 返回公开访问URL
        return responseData.publicUrl
      } catch (error: any) {
        // 重新抛出错误，让onError处理
        throw error
      }
    },

    onSuccess: (publicUrl) => {
      notify.success(
        'Banner Uploaded',
        'Token banner has been uploaded successfully'
      )
      return publicUrl
    },

    onError: (error: any) => {
      console.error('Token banner upload failed:', error)
      notify.error(
        'Banner Upload Failed',
        error?.message || 'Failed to upload token banner. Please try again.'
      )
    },
  })
}

/**
 * Hook: 完整的活动图上传流程
 * 包括获取预签名URL、上传文件、确认上传
 *
 * @example
 * ```tsx
 * const uploadBannerMutation = useUploadActivityBanner()
 *
 * const handleBannerUpload = async (file: File) => {
 *   const publicUrl = await uploadBannerMutation.mutateAsync(file)
 *   console.log('Banner uploaded to:', publicUrl)
 * }
 * ```
 */
export const useUploadActivityBanner = () => {
  const { chainId } = useAccount()

  return useMutation({
    mutationFn: async (file: File) => {
      try {
        // Extract file extension as mimeType
        const mimeType = getFileExtension(file.name)

        // Get current chain ID (default to BSC testnet if not connected)
        const currentChainId = chainId || 97

        console.log('Upload params:', {
          mimeType,
          chainId: currentChainId,
          fileName: file.name,
        })

        // 1. 获取预签名URL
        const presignResponse = await kyClient
          .get('file/activity-image-presign', {
            searchParams: {
              mimeType: mimeType,
              chainId: currentChainId,
            },
          })
          .json<any>()
          .catch((error) => {
            console.error('Failed to get presign URL:', error)
            throw new Error(
              'Failed to get upload URL from server. Please check your connection.'
            )
          })

        if (!presignResponse || presignResponse.code !== 200) {
          throw new Error(
            presignResponse?.message || 'Failed to get presign URL'
          )
        }

        // Handle the actual response format with fileName
        const responseData = presignResponse.data
        if (!responseData.uploadUrl || !responseData.fileName) {
          throw new Error('Invalid presign response from server')
        }

        console.log('Presign response:', responseData)

        // 2. 上传文件到预签名URL
        try {
          // Get proper MIME type for the Content-Type header
          const contentType = file.type || `image/${mimeType}`

          // 准备上传请求
          const response = await fetch(responseData.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': contentType,
            },
            body: file,
            mode: 'cors',
          })

          if (!response.ok) {
            let errorMessage = `Upload failed with status ${response.status}`
            try {
              const errorText = await response.text()
              if (errorText) {
                errorMessage += `: ${errorText}`
              }
            } catch {
              // 忽略解析错误
            }
            throw new Error(errorMessage)
          }
        } catch (uploadError: any) {
          console.error('Direct upload failed:', uploadError)
          throw new Error(
            'Failed to upload file. Please try again or contact support if the issue persists.'
          )
        }

        // 3. 返回后端提供的公开访问URL
        console.log('File uploaded successfully, public URL:', responseData.publicUrl)

        // 返回公开访问URL
        return responseData.publicUrl
      } catch (error: any) {
        // 重新抛出错误，让onError处理
        throw error
      }
    },

    onSuccess: (publicUrl) => {
      notify.success(
        'Banner Uploaded',
        'Token banner has been uploaded successfully'
      )
      return publicUrl
    },

    onError: (error: any) => {
      console.error('Token banner upload failed:', error)
      notify.error(
        'Banner Upload Failed',
        error?.message || 'Failed to upload token banner. Please try again.'
      )
    },
  })
}
