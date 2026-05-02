import { ApiError, apiClient, parseContentRangeTotal } from '@/lib/apiClient'

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
   * Quando enviado, a Edge Function `create-doctor` deve criar o usuário com login por senha
   * (comportamento RiseUP — confirmar deploy do backend).
   */
  password?: string
}

export interface CreateDoctorResponse {
  success?: boolean
  doctor_id?: string
  user_id?: string
  message?: string
}

export async function createDoctor(payload: CreateDoctorPayload) {
  const body: Record<string, unknown> = {
    full_name: payload.full_name,
    email: payload.email,
    cpf: payload.cpf,
    crm: payload.crm,
    crm_uf: payload.crm_uf,
  }
  if (payload.phone_mobile) body.phone_mobile = payload.phone_mobile
  if (payload.specialty) body.specialty = payload.specialty
  if (payload.birth_date) body.birth_date = payload.birth_date
  if (payload.password) body.password = payload.password

  return apiClient.post<CreateDoctorResponse, Record<string, unknown>>(
    '/functions/v1/create-doctor',
    body
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
