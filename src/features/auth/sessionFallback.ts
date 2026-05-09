import type { Session, User } from '@supabase/supabase-js'

import { ApiError } from '@/lib/apiClient'
import {
  extractPatientRecordId,
  patientIdFromAuthClaims,
  patientIdFromUserMetadata,
} from '@/features/patient-portal/patientId'
import { isClinicalStaffRole } from '@/lib/roleGroups'
import type { UserInfo, UserRole } from '@/types/user'

const KNOWN_ROLES: ReadonlySet<UserRole> = new Set([
  'admin',
  'gestor',
  'medico',
  'secretaria',
  'paciente',
  'user',
])

/** Sinônimos / capitalização vinda de JWT ou `/user-info` — o app compara com papéis em minúsculas. */
const ROLE_SYNONYMS: Readonly<Record<string, UserRole>> = {
  admin: 'admin',
  administrator: 'admin',
  gestor: 'gestor',
  manager: 'gestor',
  gerente: 'gestor',
  medico: 'medico',
  médico: 'medico',
  doctor: 'medico',
  secretaria: 'secretaria',
  secretária: 'secretaria',
  paciente: 'paciente',
  patient: 'paciente',
  user: 'user',
}

function normalizeRoleLabel(raw: string): UserRole | null {
  const s = raw.normalize('NFKC').trim().toLowerCase()
  if (!s) return null
  const mapped = ROLE_SYNONYMS[s]
  if (mapped) return mapped
  return KNOWN_ROLES.has(s as UserRole) ? (s as UserRole) : null
}

function coerceRoles(value: unknown): UserRole[] {
  if (!value) return []
  const raw = Array.isArray(value) ? value : [value]
  const out: UserRole[] = []
  for (const item of raw) {
    if (typeof item === 'string') {
      const n = normalizeRoleLabel(item)
      if (n) out.push(n)
    }
  }
  return dedupeRoles(out)
}

function sanitizeResolvedRoles(roles: readonly (UserRole | string)[]): UserRole[] {
  const out: UserRole[] = []
  for (const r of roles) {
    if (typeof r === 'string') {
      const n = normalizeRoleLabel(r)
      if (n) out.push(n)
    } else if (KNOWN_ROLES.has(r)) {
      out.push(r)
    }
  }
  return dedupeRoles(out)
}

function dedupeRoles(roles: UserRole[]): UserRole[] {
  const seen = new Set<UserRole>()
  const out: UserRole[] = []
  for (const r of roles) {
    if (!seen.has(r)) {
      seen.add(r)
      out.push(r)
    }
  }
  return out
}

/** Alinha papel `paciente` com `patient.id` (API e/ou metadados do JWT, sem migração de banco). */
function augmentPacientePortalRole(
  roles: readonly (UserRole | string)[],
  patientField: Record<string, unknown> | null | undefined
): UserRole[] {
  const base = sanitizeResolvedRoles(roles)
  const pid = extractPatientRecordId(patientField ?? null)
  if (!pid || base.includes('paciente')) return base
  if (isClinicalStaffRole(base)) return base
  return dedupeRoles([...base, 'paciente'])
}

function rolesFromSingleAuthMeta(meta: Record<string, unknown>): UserRole[] {
  let r = coerceRoles(meta.roles)
  if (r.length) return r
  r = coerceRoles(meta.role)
  if (r.length) return r
  return coerceRoles(meta.user_role)
}

export function rolesFromSession(user: User | null | undefined): UserRole[] {
  if (!user) return []
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>
  /** Fluxos de cadastro por e‑mail frequentemente gravam `paciente` só em um dos dois metadatos. */
  return dedupeRoles([...rolesFromSingleAuthMeta(appMeta), ...rolesFromSingleAuthMeta(userMeta)])
}

/**
 * Tenta extrair roles de respostas variadas de `/user-info`. Aceita:
 * - `roles: ["admin"]`            (formato esperado)
 * - `role: "admin"`               (singular)
 * - `user_roles: [{ role: "x" }]` (tabela relacional)
 * - `permissions.isAdmin: true`   (injeta 'admin')
 * - `user.app_metadata.roles`     (resposta espelha o JWT)
 */
export function rolesFromRemote(remote: unknown): UserRole[] {
  if (!remote || typeof remote !== 'object') return []
  const obj = remote as Record<string, unknown>
  const collected: UserRole[] = []

  collected.push(...rolesFromSingleAuthMeta(obj))

  if (Array.isArray(obj.user_roles)) {
    for (const entry of obj.user_roles) {
      if (entry && typeof entry === 'object') {
        const e = entry as Record<string, unknown>
        collected.push(...coerceRoles(e.role))
        collected.push(...coerceRoles(e.roles))
        collected.push(...coerceRoles(e.name))
      } else {
        collected.push(...coerceRoles(entry))
      }
    }
  }

  const permissions = obj.permissions as Record<string, unknown> | undefined
  if (permissions && permissions.isAdmin === true) collected.push('admin')

  const nestedUser = obj.user as Record<string, unknown> | undefined
  if (nestedUser) {
    const am = (nestedUser.app_metadata ?? {}) as Record<string, unknown>
    const um = (nestedUser.user_metadata ?? {}) as Record<string, unknown>
    collected.push(...rolesFromSingleAuthMeta(am))
    collected.push(...rolesFromSingleAuthMeta(um))
  }

  return dedupeRoles(collected)
}

/** Algumas APIs mandam só `patient_id` na raiz; normaliza para objeto `patient`. */
function loosePatientObjectFrom(remote: unknown): Record<string, unknown> | null {
  const id = remote && typeof remote === 'object' ? patientIdFromUserMetadata(remote as Record<string, unknown>) : undefined
  return id ? { id } : null
}

function mergePatientPointers(
  primary: Record<string, unknown> | null | undefined,
  secondary: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (extractPatientRecordId(primary ?? null)) return primary ?? null
  if (extractPatientRecordId(secondary ?? null)) return secondary ?? null
  return null
}

export function buildFallbackUserInfo(session: Session | null): UserInfo | null {
  if (!session?.user) return null
  const user = session.user
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>
  const fromClaims = patientIdFromAuthClaims(user)
  const patientStub = fromClaims ? { id: fromClaims } : null

  return {
    user: {
      id: user.id,
      email: user.email ?? (typeof userMeta.email === 'string' ? (userMeta.email as string) : ''),
    },
    profile: {
      full_name:
        (typeof userMeta.full_name === 'string' && (userMeta.full_name as string)) ||
        (typeof userMeta.name === 'string' && (userMeta.name as string)) ||
        null,
      phone: typeof userMeta.phone === 'string' ? (userMeta.phone as string) : null,
      avatar_url: typeof userMeta.avatar_url === 'string' ? (userMeta.avatar_url as string) : null,
    },
    roles: augmentPacientePortalRole(rolesFromSession(user), patientStub),
    permissions: {
      isAdmin: false,
      canManageUsers: false,
    },
    doctor: null,
    patient: patientStub,
  }
}

/**
 * Combines a partial /user-info response with session-derived fallbacks so the UI
 * always has at least the basics (email, name, roles when present in the JWT).
 *
 * Tolerates loose response shapes: roles may come as `roles`, `role`, `user_roles[].role`,
 * `permissions.isAdmin`, or even nested `user.app_metadata.roles`. JWT app_metadata is a
 * second-layer fallback when the remote response carries no usable role.
 */
export function hydrateUserInfo(
  remote: UserInfo | null | undefined,
  session: Session | null
): UserInfo | null {
  const fallback = buildFallbackUserInfo(session)
  const remoteRoles = rolesFromRemote(remote)

  if (!remote) return fallback

  const coercedPatientRoot = loosePatientObjectFrom(remote as unknown)

  if (!fallback) {
    const raw = remoteRoles.length ? remoteRoles : (remote.roles ?? [])
    const patientMerged =
      mergePatientPointers(remote.patient ?? null, coercedPatientRoot) ?? remote.patient ?? null
    return {
      ...remote,
      patient: patientMerged,
      roles: augmentPacientePortalRole(raw, patientMerged ?? undefined),
    }
  }

  const resolvedRoles = remoteRoles.length
    ? remoteRoles
    : remote.roles?.length
      ? remote.roles
      : fallback.roles

  const mergedPatient = mergePatientPointers(
    mergePatientPointers(remote.patient ?? null, coercedPatientRoot),
    fallback.patient ?? null
  )

  return {
    user: {
      id: remote.user?.id || fallback.user.id,
      email: remote.user?.email || fallback.user.email,
    },
    profile: {
      full_name: remote.profile?.full_name ?? fallback.profile?.full_name ?? null,
      phone: remote.profile?.phone ?? fallback.profile?.phone ?? null,
      avatar_url: remote.profile?.avatar_url ?? fallback.profile?.avatar_url ?? null,
    },
    roles: augmentPacientePortalRole(resolvedRoles, mergedPatient ?? undefined),
    permissions: remote.permissions ?? fallback.permissions,
    doctor: remote.doctor ?? fallback.doctor ?? null,
    patient: mergedPatient as UserInfo['patient'],
  }
}

export function describeUserInfoError(error: unknown): {
  status?: number
  message: string
  raw: unknown
} {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message, raw: error.raw ?? error }
  }
  if (error instanceof Error) {
    return { message: error.message, raw: error }
  }
  return { message: 'Erro desconhecido ao carregar /user-info', raw: error }
}
