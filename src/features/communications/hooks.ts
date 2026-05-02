import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { listSmsLogs, sendSms } from '@/features/communications/api'
import type { SendSmsPayload } from '@/features/communications/types'

export const communicationKeys = {
  all: ['communications'] as const,
  smsLogs: ['communications', 'sms-logs'] as const,
}

export function useSmsLogsQuery(limit = 50, enabled = true) {
  return useQuery({
    queryKey: [...communicationKeys.smsLogs, limit] as const,
    queryFn: () => listSmsLogs(limit),
    staleTime: 30_000,
    enabled,
  })
}

export function useSendSmsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SendSmsPayload) => sendSms(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: communicationKeys.smsLogs })
    },
  })
}
