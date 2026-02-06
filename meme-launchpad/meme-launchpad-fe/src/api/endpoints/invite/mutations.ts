import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import { notify } from '@/stores/useUIStore'
import { inviteKeys } from './queries'
import {
  CreateRebateRecordQuerySchema,
  CheckRebateRecordStatusQuerySchema,
  RebateRecordSchema,
  CreateRebateRecordResponseSchema,
  CheckRebateRecordStatusResponseSchema,
  type CreateRebateRecordQuery,
  type CheckRebateRecordStatusQuery,
  type RebateRecord,
  type CreateRebateRecordResponse,
  type CheckRebateRecordStatusResponse,
} from '@/api/schemas/invite.schema'

// API函数：创建返佣记录
async function createRebateRecord(
  data: RebateRecord,
  query: CreateRebateRecordQuery
): Promise<CreateRebateRecordResponse> {
  try {
    // 验证查询参数
    const validatedQuery = CreateRebateRecordQuerySchema.parse(query)

    // 验证请求体数据
    const validatedData = RebateRecordSchema.parse(data)

    console.log(
      '[Invite API] Creating rebate record:',
      validatedData,
      'for address:',
      validatedQuery.address
    )

    // 发起创建请求
    const response = await kyClient
      .post('front/rebate_record', {
        searchParams: validatedQuery,
        json: validatedData,
      })
      .json()

    console.log('[Invite API] Create rebate record response:', response)

    // 直接返回data部分
    return (response as any).data
  } catch (error: any) {
    console.error('[Invite API] Failed to create rebate record:', error)
    throw error
  }
}

// API函数：检查返佣记录状态
async function checkRebateRecordStatus(
  query: CheckRebateRecordStatusQuery
): Promise<CheckRebateRecordStatusResponse> {
  try {
    const validated = CheckRebateRecordStatusQuerySchema.parse(query)

    console.log(
      '[Invite API] Checking rebate record status for:',
      validated.address
    )

    const response = await kyClient
      .get('front/rebate_record/check-status', {
        searchParams: validated,
      })
      .json()

    console.log('[Invite API] Check rebate record status response:', response)

    // 直接返回data部分
    return (response as any).data
  } catch (error: any) {
    console.error('[Invite API] Failed to check rebate record status:', error)
    throw error
  }
}

/**
 * Hook: 创建返佣记录
 * 插入一个新的返佣记录
 *
 * @example
 * ```tsx
 * const createRebateRecordMutation = useCreateRebateRecord()
 *
 * const handleCreate = async () => {
 *   try {
 *     await createRebateRecordMutation.mutateAsync({
 *       data: {
 *         userId: 123,
 *         traderId: 456,
 *         userAddr: '0x...',
 *         amount: 100.50,
 *         status: 0
 *       },
 *       query: {
 *         address: '0x...'
 *       }
 *     })
 *
 *     notify.success('返佣记录创建成功')
 *   } catch (error) {
 *     notify.error('创建失败: ' + error.message)
 *   }
 * }
 * ```
 */
export const useCreateRebateRecord = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      data,
      query,
    }: {
      data: RebateRecord
      query: CreateRebateRecordQuery
    }) => createRebateRecord(data, query),

    onSuccess: (response) => {
      // 显示成功消息
      notify.success('返佣记录创建成功')

      // 可以在这里添加其他成功后的逻辑
      console.log('[Invite API] Rebate record created successfully:', response)
    },

    onError: (error: any) => {
      console.error('[Invite API] Create rebate record failed:', error)

      // 显示错误消息
      const errorMessage = error.message || '创建返佣记录失败'
      notify.error(errorMessage)
    },
  })
}

/**
 * Hook: 检查返佣记录状态
 * 检查指定地址是否在 rebate_record 表中存在且 status=0
 *
 * @example
 * ```tsx
 * const checkRebateRecordStatusMutation = useCheckRebateRecordStatus()
 *
 * const handleCheck = async () => {
 *   try {
 *     const result = await checkRebateRecordStatusMutation.mutateAsync({
 *       address: '0x1234567890abcdef...'
 *     })
 *
 *     if (result) {
 *       console.log('该地址存在未发送的返佣记录')
 *     } else {
 *       console.log('该地址不存在未发送的返佣记录')
 *     }
 *   } catch (error) {
 *     notify.error('检查失败: ' + error.message)
 *   }
 * }
 * ```
 */
export const useCheckRebateRecordStatus = () => {
  return useMutation({
    mutationFn: (query: CheckRebateRecordStatusQuery) =>
      checkRebateRecordStatus(query),

    onSuccess: (response) => {
      console.log(
        '[Invite API] Rebate record status checked successfully:',
        response
      )
    },

    onError: (error: any) => {
      console.error('[Invite API] Check rebate record status failed:', error)

      // 显示错误消息
      const errorMessage = error.message || '检查返佣记录状态失败'
      notify.error(errorMessage)
    },
  })
}
