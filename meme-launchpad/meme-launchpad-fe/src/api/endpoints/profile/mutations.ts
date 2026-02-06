import { kyClient } from '@/api/client/ky-client'
import { parseApiResponse } from '@/api/utils/response-handler'
import { useMutation } from '@tanstack/react-query'
import { notify } from '@/stores/useUIStore'
import {
  CreateEventInput,
  CreateEventResponse,
  CreateEventInputSchema,
  CreateEventResponseSchema,
} from '@/api/schemas/profile.schema'

async function createEvent(
  data: CreateEventInput
): Promise<CreateEventResponse> {
  const validated = CreateEventInputSchema.parse(data)

  const response = await kyClient
    .post('act/create', {
      json: validated,
    })
    .json()

  return parseApiResponse(response, CreateEventResponseSchema)
}

export const useCreateEvent = () => {
  return useMutation({
    mutationFn: createEvent,
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.log(error)
      // 显示错误通知
      notify.error(
        'Create Event Failed',
        error?.message || 'Failed to create event. Please try again.'
      )
    },
  })
}
