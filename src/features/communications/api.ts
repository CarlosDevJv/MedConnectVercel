import { ApiError, apiClient } from '@/lib/apiClient'

import type { SendSmsPayload, SendSmsSuccessResponse, SmsLogsResult, SmsLogRow } from '@/features/communications/types'

/**
 * MVP Comunicação (alinhado ao plano e Apidog RiseUP):
 *
 * - Canal suportado neste front: **SMS via Twilio**, Edge Function Supabase `send-sms`.
 * - Path: `POST /functions/v1/send-sms` (nome da function = segmento após `/functions/v1/`).
 * - WhatsApp dedicado, e-mail transacional (laudos/newsletters) e campos ricos da doc 2.5
 *   **não** estão neste contrato — dependem de novas APIs backend.
 *
 * Doc Apidog indica possível `503` quando o serviço está desabilitado (`service-disabled`).
 */

const SEND_SMS_PATH = '/functions/v1/send-sms'

/** `*` evita erro 400 quando colunas divergem entre ambientes. */
const SMS_LOGS_SELECT = '*'

export async function sendSms(payload: SendSmsPayload): Promise<SendSmsSuccessResponse> {
  return apiClient.post<SendSmsSuccessResponse, SendSmsPayload>(SEND_SMS_PATH, payload)
}

/**
 * Lista registros recentes de `sms_logs` via PostgREST, se a tabela e RLS permitirem.
 * Falha silenciosa com `unavailableReason` para não quebrar a página em ambientes sem tabela.
 */
export async function listSmsLogs(limit = 50): Promise<SmsLogsResult> {
  const usp = new URLSearchParams({
    select: SMS_LOGS_SELECT,
    order: 'created_at.desc',
    limit: String(limit),
  })
  const path = `/rest/v1/sms_logs?${usp.toString()}`
  try {
    const rows = await apiClient.get<SmsLogRow[]>(path)
    return { rows: rows ?? [] }
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 404 || e.status === 406) {
        return { rows: [], unavailableReason: 'Histórico SMS (sms_logs) não encontrado neste projeto.' }
      }
      if (e.status === 401 || e.status === 403) {
        return {
          rows: [],
          unavailableReason: 'Sem permissão para ler sms_logs. Verifique políticas RLS no Supabase.',
        }
      }
    }
    return {
      rows: [],
      unavailableReason: 'Não foi possível carregar o histórico de SMS.',
    }
  }
}

export function isSmsServiceDisabled(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 503 &&
    (/desabilitad/i.test(error.message) || /service-disabled/i.test(String((error.raw as { type?: string })?.type ?? '')))
  )
}
