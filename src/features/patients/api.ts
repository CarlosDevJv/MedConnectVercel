import { getEnv } from '@/env'
import { ApiError, apiClient, parseContentRangeTotal } from '@/lib/apiClient'

import type { ListPatientsParams, Patient, PatientList } from '@/features/patients/types'

export interface RegisterPatientPayload {
  email: string
  full_name: string
  cpf: string
  phone_mobile: string
  birth_date?: string
}

export interface RegisterPatientResponse {
  success: boolean
  patient_id: string
  user_id?: string
  message: string
  email?: string
}

export async function registerPatient(payload: RegisterPatientPayload) {
  return apiClient.post<RegisterPatientResponse, RegisterPatientPayload & { redirect_url: string }>(
    '/functions/v1/register-patient',
    {
      ...payload,
      redirect_url: `${getEnv().APP_URL}/app`,
    },
    { anonymous: true }
  )
}

const ONLY_DIGITS = /^\d+$/

const PATIENT_LIST_SELECT =
  'id,full_name,social_name,cpf,email,phone_mobile,birth_date,sex,city,state,vip,rn_in_insurance,created_at,updated_at,created_by'

const PATIENT_DETAIL_SELECT = '*'

function buildPatientListPath(params: ListPatientsParams): string {
  const search = params.search?.trim()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const order = params.order ?? 'full_name.asc'

  const usp = new URLSearchParams()
  usp.set('select', PATIENT_LIST_SELECT)
  usp.set('order', order)
  usp.set('limit', String(pageSize))
  usp.set('offset', String((page - 1) * pageSize))

  if (search) {
    if (ONLY_DIGITS.test(search) && search.length >= 6) {
      usp.set('cpf', `eq.${search}`)
    } else {
      const escaped = search.replace(/[%_]/g, (c) => `\\${c}`)
      usp.set('full_name', `ilike.*${escaped}*`)
    }
  }

  return `/rest/v1/patients?${usp.toString()}`
}

export async function listPatients(params: ListPatientsParams = {}): Promise<PatientList> {
  const path = buildPatientListPath(params)
  const result = await apiClient.request<Patient[]>({
    method: 'GET',
    path,
    options: { headers: { Prefer: 'count=exact' } },
  })
  const total = parseContentRangeTotal(result.headers) ?? result.data.length
  return { items: result.data, total }
}

export async function getPatient(id: string): Promise<Patient> {
  const usp = new URLSearchParams({
    id: `eq.${id}`,
    select: PATIENT_DETAIL_SELECT,
    limit: '1',
  })
  const items = await apiClient.get<Patient[]>(`/rest/v1/patients?${usp.toString()}`)
  if (!items.length) {
    throw new ApiError({
      message: 'Paciente não encontrado',
      status: 404,
    })
  }
  return items[0]
}

/**
 * Payload sent to POST /functions/v1/create-patient.
 * Mirrors the schema documented in apidog (RiseUP / Pacientes / Criar novo paciente).
 */
export interface CreatePatientPayload {
  full_name: string
  email: string
  cpf: string
  phone_mobile: string

  social_name?: string
  rg?: string
  document_type?: string
  document_number?: string
  birth_date?: string

  phone1?: string
  phone2?: string

  sex?: string
  race?: string
  ethnicity?: string
  nationality?: string
  naturality?: string
  profession?: string
  marital_status?: string

  mother_name?: string
  mother_profession?: string
  father_name?: string
  father_profession?: string
  guardian_name?: string
  guardian_cpf?: string
  spouse_name?: string

  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  reference?: string

  blood_type?: string
  weight_kg?: number
  height_m?: number
  bmi?: number

  legacy_code?: string
  rn_in_insurance?: boolean
  vip?: boolean
  notes?: string

  redirect_url?: string
}

export interface CreatePatientResponse {
  success?: boolean
  patient_id?: string
  user_id?: string
  message?: string
}

export async function createPatient(payload: CreatePatientPayload) {
  return apiClient.post<CreatePatientResponse, CreatePatientPayload>(
    '/functions/v1/create-patient',
    {
      ...payload,
      redirect_url: payload.redirect_url ?? `${getEnv().APP_URL}/app`,
    }
  )
}

/**
 * Update payload accepts the same fields as create plus null (to clear values).
 * CPF is immutable on the Edge Function side; we omit it from this payload regardless.
 */
type Nullable<T> = { [K in keyof T]?: T[K] | null }
export type UpdatePatientPayload = Nullable<Omit<CreatePatientPayload, 'cpf' | 'redirect_url'>>

export async function updatePatient(id: string, payload: UpdatePatientPayload) {
  const usp = new URLSearchParams({ id: `eq.${id}` })
  const result = await apiClient.request<Patient[]>({
    method: 'PATCH',
    path: `/rest/v1/patients?${usp.toString()}`,
    body: payload,
    options: { headers: { Prefer: 'return=representation' } },
  })
  if (!result.data?.length) {
    throw new ApiError({
      message: 'Paciente não encontrado para atualizar',
      status: 404,
    })
  }
  return result.data[0]
}

export async function deletePatient(id: string): Promise<void> {
  const usp = new URLSearchParams({ id: `eq.${id}` })
  await apiClient.del(`/rest/v1/patients?${usp.toString()}`)
}
