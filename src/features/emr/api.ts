import { ApiError, apiClient, parseContentRangeTotal } from '@/lib/apiClient'

import type {
  ClinicalConsultation,
  ClinicalConsultationInput,
  ClinicalConsultationList,
  EnrichedClinicalConsultation,
  ListClinicalConsultationsParams,
} from '@/features/emr/types'

/** Nome da tabela PostgREST; altere se o Apidog/backend usar outro resource. */
const RESOURCE = 'clinical_consultations'

const SELECT =
  'id,patient_id,doctor_id,consultation_at,anamnesis,physical_exam,diagnostic_hypotheses,medical_conduct,prescriptions,requested_exams,follow_up_at,cid10,diagnoses,evolution,attachments_note,created_at,updated_at,created_by,updated_by'

function buildListPath(params: ListClinicalConsultationsParams): string {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 50
  const order = params.order ?? 'consultation_at.desc'
  const usp = new URLSearchParams()
  usp.set('select', SELECT)
  usp.set('patient_id', `eq.${params.patient_id}`)
  usp.set('order', order)
  usp.set('limit', String(pageSize))
  usp.set('offset', String((page - 1) * pageSize))
  return `/rest/v1/${RESOURCE}?${usp.toString()}`
}

export async function listClinicalConsultations(
  params: ListClinicalConsultationsParams
): Promise<ClinicalConsultationList> {
  const path = buildListPath(params)
  const result = await apiClient.request<ClinicalConsultation[]>({
    method: 'GET',
    path,
    options: { headers: { Prefer: 'count=exact' } },
  })
  const total = parseContentRangeTotal(result.headers) ?? result.data.length
  return { items: result.data, total }
}

export async function getClinicalConsultation(id: string): Promise<ClinicalConsultation> {
  const usp = new URLSearchParams({ id: `eq.${id}`, select: SELECT, limit: '1' })
  const rows = await apiClient.get<ClinicalConsultation[]>(`/rest/v1/${RESOURCE}?${usp.toString()}`)
  if (!rows.length) throw new ApiError({ message: 'Consulta não encontrada', status: 404 })
  return rows[0]
}

export async function createClinicalConsultation(
  payload: ClinicalConsultationInput
): Promise<ClinicalConsultation> {
  const result = await apiClient.request<ClinicalConsultation[]>({
    method: 'POST',
    path: `/rest/v1/${RESOURCE}`,
    body: payload,
    options: { headers: { Prefer: 'return=representation' } },
  })
  const row = result.data?.[0]
  if (!row) throw new ApiError({ message: 'Consulta criada sem retorno', status: 201 })
  return row
}

export async function updateClinicalConsultation(
  id: string,
  payload: ClinicalConsultationInput
): Promise<ClinicalConsultation> {
  const usp = new URLSearchParams({ id: `eq.${id}` })
  const result = await apiClient.request<ClinicalConsultation[]>({
    method: 'PATCH',
    path: `/rest/v1/${RESOURCE}?${usp.toString()}`,
    body: payload,
    options: { headers: { Prefer: 'return=representation' } },
  })
  if (!result.data?.length) throw new ApiError({ message: 'Consulta não encontrada', status: 404 })
  return result.data[0]
}

export function consultationToInput(
  c: ClinicalConsultation,
  overrides: Partial<ClinicalConsultationInput> = {}
): ClinicalConsultationInput {
  return {
    patient_id: c.patient_id,
    doctor_id: c.doctor_id,
    consultation_at: c.consultation_at,
    anamnesis: c.anamnesis,
    physical_exam: c.physical_exam,
    diagnostic_hypotheses: c.diagnostic_hypotheses,
    medical_conduct: c.medical_conduct,
    prescriptions: c.prescriptions,
    requested_exams: c.requested_exams,
    follow_up_at: c.follow_up_at,
    cid10: c.cid10,
    diagnoses: c.diagnoses,
    evolution: c.evolution,
    attachments_note: c.attachments_note,
    ...overrides,
  }
}

export async function batchDoctorNames(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return {}
  const usp = new URLSearchParams()
  usp.set('select', 'id,full_name')
  usp.set('id', `in.(${unique.join(',')})`)
  const rows = await apiClient.get<{ id: string; full_name: string }[]>(
    `/rest/v1/doctors?${usp.toString()}`
  )
  return Object.fromEntries(rows.map((r) => [r.id, r.full_name]))
}

export async function listClinicalConsultationsEnriched(
  params: ListClinicalConsultationsParams
): Promise<{ items: EnrichedClinicalConsultation[]; total: number }> {
  const { items, total } = await listClinicalConsultations(params)
  const docIds = items.map((i) => i.doctor_id).filter((x): x is string => !!x)
  const names = await batchDoctorNames(docIds)
  return {
    items: items.map((r) => ({
      ...r,
      doctor_name: r.doctor_id ? names[r.doctor_id] ?? 'Médico' : undefined,
    })),
    total,
  }
}
