import { getEnv } from '@/env'
import { ApiError, apiClient, parseContentRangeTotal } from '@/lib/apiClient'
import { HTTP_ERROR_INTERNAL, HTTP_ERROR_RATE_LIMIT } from '@/lib/httpErrorMessages'

import type { ListPatientsParams, Patient, PatientList } from '@/features/patients/types'
import { stripNonDigits } from '@/features/patients/utils/cpf'

/** Texto inteiro só com dígitos e máscara de CPF (evita tratar nome com números como CPF). */
function looksLikeCpfSearch(trimmed: string): boolean {
  if (!/^[\d\s.\-]+$/.test(trimmed)) return false
  return stripNonDigits(trimmed).length >= 6
}

const PATIENT_LIST_SELECT =
  'id,user_id,full_name,social_name,cpf,email,phone_mobile,birth_date,sex,city,state,vip,rn_in_insurance,created_at,updated_at,created_by'

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
    if (looksLikeCpfSearch(search)) {
      const digits = stripNonDigits(search).slice(0, 11)
      if (digits.length >= 11) {
        usp.set('cpf', `eq.${digits}`)
      } else {
        usp.set('cpf', `like.*${digits}*`)
      }
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

/** Total de pacientes para KPIs — `limit=0` devolve só Content-Range (evita fallback `length===1`). */
export async function countPatients(): Promise<number> {
  const result = await apiClient.request<unknown[]>({
    method: 'GET',
    path: '/rest/v1/patients?select=id&limit=0',
    options: { headers: { Prefer: 'count=exact' } },
  })
  const n = parseContentRangeTotal(result.headers)
  if (n !== null) return n
  const list = await listPatients({ page: 1, pageSize: 50000 })
  return list.total
}

/** Pacientes em lote para lembretes (telefone + preferência). */
export async function batchPatientContact(ids: string[]): Promise<
  Record<string, { phone_mobile: string; preferred_contact: string | null }>
> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return {}
  const usp = new URLSearchParams()
  usp.set('select', 'id,phone_mobile,preferred_contact')
  usp.set('id', `in.(${unique.join(',')})`)
  const rows = await apiClient.get<
    { id: string; phone_mobile: string; preferred_contact?: string | null }[]
  >(`/rest/v1/patients?${usp.toString()}`)
  return Object.fromEntries(
    rows.map((r) => [
      r.id,
      { phone_mobile: r.phone_mobile ?? '', preferred_contact: r.preferred_contact ?? null },
    ])
  )
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
 * Payload aceito pela UI antes de sanitização para o RiseUP (`criar novo paciente`).
 * @see https://do5wegrct3.apidog.io/criar-novo-paciente-34388576e0.md
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
  /** Usado só na UI/local; removido em `toApidogPatientWriteBody` (fora do OpenAPI RiseUP Pacientes). */
  preferred_contact?: string

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

  /** Não fazem parte do OpenAPI RiseUP Pacientes (`criar novo paciente`); somente UI — mesclados em `notes` no envio. */
  insurance_company?: string
  insurance_plan?: string
  insurance_member_number?: string
  insurance_card_valid_until?: string

  allergies?: string
  medications_in_use?: string
  chronic_conditions?: string

  redirect_url?: string
}

export interface CreatePatientResponse {
  success?: boolean
  patient_id?: string
  user_id?: string
  message?: string
}

/** Contrato POST `functions/v1/register-patient-with-password` (cadastro paciente + auth). */
export interface RegisterPatientWithPasswordPayload {
  email: string
  password: string
  full_name: string
  phone_mobile: string
  cpf: string
  birth_date: string
}

export interface RegisterPatientWithPasswordResponse {
  success?: boolean
  patient_id?: string
  user_id?: string
  message?: string
}

function registerPatientErrorPayloadMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return ''
  const o = body as Record<string, unknown>
  if (typeof o.detail === 'string' && o.detail.trim()) return o.detail.trim()
  if (typeof o.message === 'string' && o.message.trim()) return o.message.trim()
  if (typeof o.error === 'string' && o.error.trim()) return o.error.trim()
  if (typeof o.title === 'string' && o.title.trim()) return o.title.trim()
  return ''
}

function registerPatientFieldErrors(body: unknown): Record<string, string[]> | undefined {
  if (!body || typeof body !== 'object') return undefined
  const errors = (body as { errors?: unknown }).errors
  if (!errors || typeof errors !== 'object') return undefined
  const out: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(errors)) {
    if (Array.isArray(v) && v.every((item) => typeof item === 'string')) {
      out[k] = v as string[]
    } else if (typeof v === 'string') {
      out[k] = [v]
    }
  }
  return Object.keys(out).length ? out : undefined
}

/**
 * Registra paciente com senha (Edge Function dedicada): só `apikey` anon conforme gateway.
 */
export async function registerPatientWithPassword(
  payload: RegisterPatientWithPasswordPayload
): Promise<RegisterPatientWithPasswordResponse> {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getEnv()
  const url = `${SUPABASE_URL}/functions/v1/register-patient-with-password`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    const text = await response.text()
    if (!text) return {}
    try {
      const raw = JSON.parse(text) as Record<string, unknown>
      const patient_id =
        typeof raw.patient_id === 'string'
          ? raw.patient_id
          : typeof raw.id === 'string'
            ? raw.id
            : (() => {
                const p = raw.patient
                if (p && typeof p === 'object' && typeof (p as { id?: unknown }).id === 'string') {
                  return (p as { id: string }).id
                }
                return undefined
              })()
      const user_id = typeof raw.user_id === 'string' ? raw.user_id : undefined
      const success = typeof raw.success === 'boolean' ? raw.success : undefined
      const message = typeof raw.message === 'string' ? raw.message : undefined
      return { success, patient_id, user_id, message }
    } catch {
      return {}
    }
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }

  if (response.status === 429) {
    throw new ApiError({
      message: HTTP_ERROR_RATE_LIMIT,
      status: 429,
      raw: body,
    })
  }

  if (response.status === 500) {
    throw new ApiError({
      message: HTTP_ERROR_INTERNAL,
      status: 500,
      raw: body,
    })
  }

  if (response.status === 409) {
    throw new ApiError({
      message: 'CPF ou e-mail já cadastrado',
      status: 409,
      code: 'PATIENT_REGISTER_CONFLICT',
      raw: body,
    })
  }

  if (response.status === 400) {
    const fallback = registerPatientErrorPayloadMessage(body)
    throw new ApiError({
      message: fallback || 'Verifique os dados informados.',
      status: 400,
      fieldErrors: registerPatientFieldErrors(body),
      raw: body,
    })
  }

  throw new ApiError({
    message: registerPatientErrorPayloadMessage(body) || `Falha ao registrar paciente (HTTP ${response.status})`,
    status: response.status,
    raw: body,
  })
}

/**
 * RiseUP / Apidog — Pacientes · [Criar novo paciente](https://do5wegrct3.apidog.io/criar-novo-paciente-34388576e0.md):
 * apenas estas chaves são enviadas aos endpoints documentados (`create-patient`, PATCH Pacientes).
 * `preferred_contact`, `insurance_*` ficam de fora; alergias/medicamentos/condições viram texto em `notes`.
 */
const APIDOG_PATIENT_WRITE_KEYS = new Set<string>([
  'full_name',
  'social_name',
  'email',
  'cpf',
  'rg',
  'document_type',
  'document_number',
  'birth_date',
  'phone_mobile',
  'phone1',
  'phone2',
  'sex',
  'race',
  'ethnicity',
  'nationality',
  'naturality',
  'profession',
  'marital_status',
  'mother_name',
  'mother_profession',
  'father_name',
  'father_profession',
  'guardian_name',
  'guardian_cpf',
  'spouse_name',
  'cep',
  'street',
  'number',
  'complement',
  'neighborhood',
  'city',
  'state',
  'reference',
  'blood_type',
  'weight_kg',
  'height_m',
  'bmi',
  'legacy_code',
  'rn_in_insurance',
  'vip',
  'notes',
  'redirect_url',
])

/** OpenAPI RiseUP: em `notes` (“Alergias, restrições, etc.”). */
function mergeClinicalIntoNotes(
  notes: string | null | undefined,
  allergies: string | null | undefined,
  medications: string | null | undefined,
  chronic: string | null | undefined
): string | null {
  const parts: string[] = []
  const base = typeof notes === 'string' ? notes.trim() : ''
  if (base) parts.push(base)
  const a = typeof allergies === 'string' ? allergies.trim() : ''
  if (a) parts.push(`Alergias: ${a}`)
  const m = typeof medications === 'string' ? medications.trim() : ''
  if (m) parts.push(`Medicamentos em uso: ${m}`)
  const c = typeof chronic === 'string' ? chronic.trim() : ''
  if (c) parts.push(`Condições crônicas: ${c}`)
  const out = parts.join('\n\n').trim()
  return out || null
}

function toApidogPatientWriteBody(
  payload: Record<string, unknown>,
  mode: 'create' | 'patch'
): Record<string, unknown> {
  const mergedNotes = mergeClinicalIntoNotes(
    payload.notes as string | null | undefined,
    payload.allergies as string | null | undefined,
    payload.medications_in_use as string | null | undefined,
    payload.chronic_conditions as string | null | undefined
  )

  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (
      key === 'notes' ||
      key === 'allergies' ||
      key === 'medications_in_use' ||
      key === 'chronic_conditions'
    ) {
      continue
    }
    if (key === 'preferred_contact' || key.startsWith('insurance_')) continue
    if (!APIDOG_PATIENT_WRITE_KEYS.has(key)) continue
    if (mode === 'patch' && (key === 'cpf' || key === 'birth_date' || key === 'redirect_url')) continue
    if (value === undefined) continue
    out[key] = value
  }

  if (mergedNotes !== null) out.notes = mergedNotes
  else if ('notes' in payload && payload.notes !== undefined) out.notes = payload.notes

  return out
}

export async function createPatient(payload: CreatePatientPayload) {
  const merged: Record<string, unknown> = {
    ...(payload as unknown as Record<string, unknown>),
    redirect_url: payload.redirect_url ?? `${getEnv().APP_URL}/app`,
  }
  const body = toApidogPatientWriteBody(merged, 'create')
  return apiClient.post<CreatePatientResponse, Record<string, unknown>>(
    '/functions/v1/create-patient',
    body
  )
}

/**
 * Update payload accepts the same fields as create plus null (to clear values).
 * CPF is immutable on the Edge Function side; we omit it from this payload regardless.
 */
type Nullable<T> = { [K in keyof T]?: T[K] | null }
export type UpdatePatientPayload = Nullable<Omit<CreatePatientPayload, 'cpf' | 'redirect_url'>>

export async function updatePatient(id: string, payload: UpdatePatientPayload) {
  const body = toApidogPatientWriteBody(payload as Record<string, unknown>, 'patch')
  const usp = new URLSearchParams({ id: `eq.${id}` })
  const result = await apiClient.request<Patient[]>({
    method: 'PATCH',
    path: `/rest/v1/patients?${usp.toString()}`,
    body,
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
