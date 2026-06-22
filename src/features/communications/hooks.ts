import { useMutation } from '@tanstack/react-query'

import { sendSms } from '@/features/communications/api'
import type { SendSmsPayload } from '@/features/communications/types'

export function useSendSmsMutation() {
  return useMutation({
    mutationFn: (payload: SendSmsPayload) => sendSms(payload),
  })
}
