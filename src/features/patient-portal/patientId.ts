import { stripNonDigits } from '@/features/patients/utils/cpf'

/** Formato esperado para `patient.id` nos cadastros (UUID Postgre). */
export function looksLikePatientUuid(raw: unknown): raw is string {
  return typeof raw === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    raw.trim()
  )
}

/** Extrai UUID do vínculo `patient` retornado por `/functions/v1/user-info` ou metadatos. */
export function extractPatientRecordId(patient: unknown): string | undefined {
  if (!patient || typeof patient !== 'object') return undefined
  const id = (patient as Record<string, unknown>).id
  return looksLikePatientUuid(id) ? id.trim() : undefined
}

function coercePatientUuidString(raw: string): string | undefined {
  const t = raw.trim()
  return looksLikePatientUuid(t) ? t : undefined
}

/**
 * Vínculo sem migração de banco: o backend deve gravar na conta Auth (invite/hook/metadata)
 * `patient_id`, `patientId` ou objeto `patient: { id }` em user_metadata ou app_metadata.
 */
export function patientIdFromUserMetadata(meta: Record<string, unknown> | null | undefined): string | undefined {
  if (!meta || typeof meta !== 'object') return undefined
  for (const k of ['patient_id', 'patientId'] as const) {
    const v = meta[k]
    if (typeof v === 'string') {
      const id = coercePatientUuidString(v)
      if (id) return id
    }
  }
  const nested = meta.patient
  if (nested && typeof nested === 'object') {
    return extractPatientRecordId(nested)
  }
  return undefined
}

export function patientIdFromAuthClaims(
  user:
    | {
        user_metadata?: Record<string, unknown> | null
        app_metadata?: Record<string, unknown> | null
      }
    | null
    | undefined
): string | undefined {
  if (!user) return undefined
  return (
    patientIdFromUserMetadata((user.user_metadata ?? null) as Record<string, unknown> | null) ??
    patientIdFromUserMetadata((user.app_metadata ?? null) as Record<string, unknown> | null)
  )
}

/** Lista de e-mails para cruzar com `patients.email` quando não há patient.id no JWT. */
export function collectPatientLookupEmails(payload: {
  sessionEmail?: string | null | undefined
  userInfoEmail?: string | null | undefined
  userMetadata?: Record<string, unknown> | null | undefined
  appMetadata?: Record<string, unknown> | null | undefined
}): string[] {
  const out: string[] = []

  function push(em: unknown) {
    if (typeof em !== 'string') return
    const t = em.trim()
    if (t && !out.includes(t)) out.push(t)
  }

  push(payload.sessionEmail)
  push(payload.userInfoEmail)
  const um = payload.userMetadata
  const am = payload.appMetadata
  if (um) {
    push(um.email)
    push(um.user_email)
    push(um.contact_email)
    push(um.secondary_email)
  }
  if (am) {
    push(am.email)
    push(am.contact_email)
  }
  return out
}

/** CPF em 11 dígitos vindos dos metadados do Auth (ex.: signup), para último recurso no lookup. */
export function cpfDigitsFromAuthPayload(payload: {
  userMetadata?: Record<string, unknown> | null | undefined
  appMetadata?: Record<string, unknown> | null | undefined
}): string | undefined {
  const tryMeta = (m: Record<string, unknown> | null | undefined) => {
    if (!m || typeof m !== 'object') return undefined
    for (const key of ['cpf', 'CPF'] as const) {
      const v = m[key]
      if (typeof v === 'string') {
        const d = stripNonDigits(v).slice(0, 11)
        if (d.length === 11) return d
      }
    }
    return undefined
  }
  return tryMeta(payload.userMetadata ?? undefined) ?? tryMeta(payload.appMetadata ?? undefined)
}
