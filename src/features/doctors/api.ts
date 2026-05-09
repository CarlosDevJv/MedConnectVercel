import { ApiError, apiClient, parseContentRangeTotal } from '@/lib/apiClient'
import { stripNonDigits } from '@/features/patients/utils/cpf'

import type { Doctor, DoctorList, ListDoctorsParams } from '@/features/doctors/types'

const DOCTOR_LIST_SELECT =
  'id,user_id,full_name,email,cpf,crm,crm_uf,phone_mobile,specialty,birth_date,active,created_at,updated_at'

const DOCTOR_DETAIL_SELECT = '*'

function buildDoctorListPath(params: ListDoctorsParams): string {
  const search = params.search?.trim()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const order = params.order ?? 'full_name.asc'

  const usp = new URLSearchParams()
  usp.set('select', DOCTOR_LIST_SELECT)
  usp.set('order', order)
  usp.set('limit', String(pageSize))
  usp.set('offset', String((page - 1) * pageSize))

  if (typeof params.active === 'boolean') {
    usp.set('active', `eq.${params.active}`)
  }
  if (params.specialty) {
    usp.set('specialty', `eq.${params.specialty}`)
  }
  if (search) {
    const escaped = search.replace(/[%_]/g, (c) => `\\${c}`)
    usp.set('full_name', `ilike.*${escaped}*`)
  }

  return `/rest/v1/doctors?${usp.toString()}`
}

export async function listDoctors(params: ListDoctorsParams = {}): Promise<DoctorList> {
  const path = buildDoctorListPath(params)
  const result = await apiClient.request<Doctor[]>({
    method: 'GET',
    path,
    options: { headers: { Prefer: 'count=exact' } },
  })
  const total = parseContentRangeTotal(result.headers) ?? result.data.length
  return { items: result.data, total }
}

export async function countDoctors(): Promise<number> {
  const result = await apiClient.request<unknown[]>({
    method: 'GET',
    path: '/rest/v1/doctors?select=id&limit=0',
    options: { headers: { Prefer: 'count=exact' } },
  })
  const n = parseContentRangeTotal(result.headers)
  if (n !== null) return n
  const list = await listDoctors({ page: 1, pageSize: 50000 })
  return list.total
}

/** Nomes de médicos por id (lista de compromissos do paciente, etc.). */
export async function batchDoctorNames(doctorIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(doctorIds.filter(Boolean))]
  if (!unique.length) return {}
  const usp = new URLSearchParams()
  usp.set('select', 'id,full_name')
  usp.set('id', `in.(${unique.join(',')})`)
  const rows = await apiClient.get<{ id: string; full_name: string }[]>(
    `/rest/v1/doctors?${usp.toString()}`
  )
  return Object.fromEntries(rows.map((r) => [r.id, r.full_name]))
}

export async function getDoctor(id: string): Promise<Doctor> {
  const usp = new URLSearchParams({
    id: `eq.${id}`,
    select: DOCTOR_DETAIL_SELECT,
    limit: '1',
  })
  const items = await apiClient.get<Doctor[]>(`/rest/v1/doctors?${usp.toString()}`)
  if (!items.length) {
    throw new ApiError({ message: 'Médico não encontrado', status: 404 })
  }
  return items[0]
}

export interface CreateDoctorPayload {
  full_name: string
  email: string
  cpf: string
  crm: string
  crm_uf: string
  phone_mobile?: string
  specialty?: string
  birth_date?: string
  /**
   * Com senha: `POST /functions/v1/create-user-with-password` + `role=medico` (contrato Apidog).
   * Sem senha: `POST /functions/v1/create-doctor` (fluxo sem credencial inicial no Auth).
   */
  password?: string
}

export interface CreateDoctorResponse {
  success?: boolean
  doctor_id?: string
  user_id?: string
  message?: string
}

/**
 * Campos da tabela `doctors` / perfil profissional: a doc OpenAPI de
 * `create-user-with-password` pode não listá-los, mas a Edge Function deve
 * repassar para o banco quando `role=medico`.
 */
function buildDoctorProfessionalJson(payload: CreateDoctorPayload): Record<string, unknown> {
  const phoneDigits = payload.phone_mobile ? stripNonDigits(payload.phone_mobile) : ''
  const specialty = payload.specialty?.trim()
  const birth = payload.birth_date?.trim()

  const out: Record<string, unknown> = {
    full_name: payload.full_name.trim(),
    email: payload.email.trim(),
    cpf: stripNonDigits(payload.cpf),
    crm: stripNonDigits(payload.crm),
    crm_uf: payload.crm_uf.trim().toUpperCase().slice(0, 2),
  }

  if (phoneDigits) {
    out.phone_mobile = phoneDigits
    out.phone = phoneDigits
  }
  if (specialty) out.specialty = specialty
  if (birth) out.birth_date = birth

  return out
}

export async function createDoctor(payload: CreateDoctorPayload) {
  const professional = buildDoctorProfessionalJson(payload)

  if (payload.password) {
    const body: Record<string, unknown> = {
      ...professional,
      password: payload.password,
      role: 'medico',
    }

    return apiClient.post<CreateDoctorResponse, Record<string, unknown>>(
      '/functions/v1/create-user-with-password',
      body
    )
  }

  return apiClient.post<CreateDoctorResponse, Record<string, unknown>>(
    '/functions/v1/create-doctor',
    professional
  )
}

type Nullable<T> = { [K in keyof T]?: T[K] | null }
export type UpdateDoctorPayload = Nullable<{
  full_name: string
  email: string
  crm: string
  crm_uf: string
  phone_mobile: string
  specialty: string
  birth_date: string
  active: boolean
}>

export async function updateDoctor(id: string, payload: UpdateDoctorPayload) {
  const usp = new URLSearchParams({ id: `eq.${id}` })
  const result = await apiClient.request<Doctor[]>({
    method: 'PATCH',
    path: `/rest/v1/doctors?${usp.toString()}`,
    body: payload,
    options: { headers: { Prefer: 'return=representation' } },
  })
  if (!result.data?.length) {
    throw new ApiError({
      message: 'Médico não encontrado para atualizar',
      status: 404,
    })
  }
  return result.data[0]
}

export async function deleteDoctor(id: string): Promise<void> {
  const usp = new URLSearchParams({ id: `eq.${id}` })
  await apiClient.del(`/rest/v1/doctors?${usp.toString()}`)
}
