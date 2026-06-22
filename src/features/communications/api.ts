import { ApiError, apiClient } from '@/lib/apiClient'

import type { SendSmsPayload, SendSmsSuccessResponse } from '@/features/communications/types'

/**
 * SMS via Twilio — documentado na API RiseUP: `POST /functions/v1/send-sms`.
 */

const SEND_SMS_PATH = '/functions/v1/send-sms'

export async function sendSms(payload: SendSmsPayload): Promise<SendSmsSuccessResponse> {
  return apiClient.post<SendSmsSuccessResponse, SendSmsPayload>(SEND_SMS_PATH, payload)
}

export function isSmsServiceDisabled(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 503 &&
    (/desabilitad/i.test(error.message) || /service-disabled/i.test(String((error.raw as { type?: string })?.type ?? '')))
  )
}
