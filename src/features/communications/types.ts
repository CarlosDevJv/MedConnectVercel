/** Contrato Apidog (Comunicação): POST /functions/v1/send-sms — body e resposta documentados. */

export interface SendSmsPayload {
  phone_number: string
  message: string
  patient_id?: string
}

export interface SendSmsSuccessResponse {
  success: boolean
  sid?: string
  message?: string
}

/**
 * Linha da tabela `sms_logs` exposta via PostgREST (formato pode variar por ambiente).
 * Campos opcionais cobrem evolução futura (tipo, template, status de entrega etc.).
 */
export interface SmsLogRow {
  id?: string
  patient_id?: string | null
  phone_number?: string | null
  message?: string | null
  sid?: string | null
  created_at?: string | null
  status?: string | null
  error?: string | null
  [key: string]: unknown
}

export interface SmsLogsResult {
  rows: SmsLogRow[]
  unavailableReason?: string
}
