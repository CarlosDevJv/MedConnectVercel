/**
 * Contrato RiseUP/OpenAPI Reports — listagem GET /rest/v1/reports
 * ({@link https://do5wegrct3.apidog.io/listar-relat%C3%B3rios-m%C3%A9dicos-23131760e0 Apidog: Listar relatórios médicos}).
 * Enum `status`: `draft` | `completed` (tipo Postgres esperado `report_status` aligned).
 */

export const REPORT_STATUSES = ['draft', 'completed'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: 'Rascunho',
  completed: 'Finalizado',
}

export interface Report {
  id: string
  order_number: string | null
  patient_id: string
  status: ReportStatus
  exam: string | null
  requested_by: string | null
  cid_code: string | null
  diagnosis: string | null
  conclusion: string | null
  content_html: string | null
  content_json: Record<string, unknown> | null
  hide_date: boolean | null
  hide_signature: boolean | null
  due_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string | null
  updated_at: string | null
}

export type ReportContentJson = Record<string, unknown>

export interface ReportInput {
  patient_id: string
  status?: ReportStatus
  exam?: string | null
  requested_by?: string | null
  cid_code?: string | null
  diagnosis?: string | null
  conclusion?: string | null
  content_html?: string | null
  content_json?: ReportContentJson | null
  hide_date?: boolean | null
  hide_signature?: boolean | null
  due_at?: string | null
}

export interface ListReportsParams {
  patient_id?: string
  status?: ReportStatus
  created_by?: string
  order?: string
  page?: number
  pageSize?: number
}

export interface ReportList {
  items: Report[]
  total: number
}

export interface EnrichedReport extends Report {
  patient_name?: string
}
