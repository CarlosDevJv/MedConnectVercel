/**
 * Lista e CRUD `/rest/v1/reports`.
 * Lista (filtros, enum de status): https://do5wegrct3.apidog.io/listar-relat%C3%B3rios-m%C3%A9dicos-23131760e0
 * — apenas os query params da spec: `patient_id`, `status`, `created_by`, `order`;
 * paginação via PostgREST `limit`/`offset` + Prefer count.
 */
import { ApiError, apiClient, parseContentRangeTotal } from '@/lib/apiClient'

import type {
  EnrichedReport,
  ListReportsParams,
  Report,
  ReportInput,
  ReportList,
} from '@/features/reports/types'

const REPORT_SELECT =
  'id,order_number,patient_id,status,exam,requested_by,cid_code,diagnosis,conclusion,content_html,content_json,hide_date,hide_signature,due_at,created_by,updated_by,created_at,updated_at'

function buildListReportsPath(params: ListReportsParams): string {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const order = params.order ?? 'created_at.desc'

  const usp = new URLSearchParams()
  usp.set('select', REPORT_SELECT)
  usp.set('order', order)
  usp.set('limit', String(pageSize))
  usp.set('offset', String((page - 1) * pageSize))

  if (params.patient_id) usp.set('patient_id', `eq.${params.patient_id}`)
  if (params.status) usp.set('status', `eq.${params.status}`)
  if (params.created_by) usp.set('created_by', `eq.${params.created_by}`)

  return `/rest/v1/reports?${usp.toString()}`
}

export async function listReports(params: ListReportsParams = {}): Promise<ReportList> {
  const path = buildListReportsPath(params)
  const result = await apiClient.request<Report[]>({
    method: 'GET',
    path,
    options: { headers: { Prefer: 'count=exact' } },
  })
  const total = parseContentRangeTotal(result.headers) ?? result.data.length
  return { items: result.data, total }
}

export async function getReport(id: string): Promise<Report> {
  const usp = new URLSearchParams({
    id: `eq.${id}`,
    select: REPORT_SELECT,
    limit: '1',
  })
  const rows = await apiClient.get<Report[]>(`/rest/v1/reports?${usp.toString()}`)
  if (!rows.length) {
    throw new ApiError({ message: 'Relatório não encontrado', status: 404 })
  }
  return rows[0]
}

export async function createReport(payload: ReportInput): Promise<Report> {
  const result = await apiClient.request<Report[]>({
    method: 'POST',
    path: '/rest/v1/reports',
    body: payload,
    options: { headers: { Prefer: 'return=representation' } },
  })
  const row = result.data?.[0]
  if (!row) throw new ApiError({ message: 'Relatório criado sem corpo', status: 201 })
  return row
}

/** Monta o body de PATCH a partir do registro atual (API exige `patient_id` em toda atualização). */
export function reportToReportInput(r: Report, overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    patient_id: r.patient_id,
    status: r.status,
    exam: r.exam,
    requested_by: r.requested_by,
    cid_code: r.cid_code,
    diagnosis: r.diagnosis,
    conclusion: r.conclusion,
    content_html: r.content_html,
    content_json: r.content_json,
    hide_date: r.hide_date,
    hide_signature: r.hide_signature,
    due_at: r.due_at,
    ...overrides,
  }
}

export async function updateReport(id: string, payload: ReportInput): Promise<Report> {
  const usp = new URLSearchParams({ id: `eq.${id}` })
  const result = await apiClient.request<Report[]>({
    method: 'PATCH',
    path: `/rest/v1/reports?${usp.toString()}`,
    body: payload,
    options: { headers: { Prefer: 'return=representation' } },
  })
  if (!result.data?.length) {
    throw new ApiError({ message: 'Relatório não encontrado para atualizar', status: 404 })
  }
  return result.data[0]
}

export async function batchPatientNamesForReports(
  patientIds: string[]
): Promise<Record<string, string>> {
  const unique = [...new Set(patientIds.filter(Boolean))]
  if (!unique.length) return {}
  const usp = new URLSearchParams()
  usp.set('select', 'id,full_name')
  usp.set('id', `in.(${unique.join(',')})`)
  const rows = await apiClient.get<{ id: string; full_name: string }[]>(
    `/rest/v1/patients?${usp.toString()}`
  )
  return Object.fromEntries(rows.map((r) => [r.id, r.full_name]))
}

export async function listReportsEnriched(
  params: ListReportsParams
): Promise<{ items: EnrichedReport[]; total: number }> {
  const { items, total } = await listReports(params)
  const names = await batchPatientNamesForReports(items.map((r) => r.patient_id))
  return {
    items: items.map((r) => ({
      ...r,
      patient_name: names[r.patient_id] ?? 'Paciente',
    })),
    total,
  }
}
