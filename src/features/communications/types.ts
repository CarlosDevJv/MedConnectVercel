/** Contrato Apidog: POST /functions/v1/send-sms */

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
