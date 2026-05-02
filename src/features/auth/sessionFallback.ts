import type { Session, User } from '@supabase/supabase-js'

import { ApiError } from '@/lib/apiClient'
import type { UserInfo, UserRole } from '@/types/user'

const KNOWN_ROLES: ReadonlySet<UserRole> = new Set([
  'admin',
  'gestor',
  'medico',
  'secretaria',
  'paciente',
  'user',
])

function coerceRoles(value: unknown): UserRole[] {
  if (!value) return []
  const raw = Array.isArray(value) ? value : [value]
  const out: UserRole[] = []
  for (const item of raw) {
    if (typeof item === 'string' && KNOWN_ROLES.has(item as UserRole)) {
      out.push(item as UserRole)
    }
  }
  return out
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

export function rolesFromSession(user: User | null | undefined): UserRole[] {
  if (!user) return []
  const meta = (user.app_metadata ?? {}) as Record<string, unknown>
  const fromRoles = coerceRoles(meta.roles)
  if (fromRoles.length) return fromRoles
  const fromRole = coerceRoles(meta.role)
  if (fromRole.length) return fromRole
  return coerceRoles(meta.user_role)
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

  collected.push(...coerceRoles(obj.roles))
  collected.push(...coerceRoles(obj.role))
  collected.push(...coerceRoles(obj.user_role))

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
    const meta = (nestedUser.app_metadata ?? {}) as Record<string, unknown>
    collected.push(...coerceRoles(meta.roles))
    collected.push(...coerceRoles(meta.role))
    collected.push(...coerceRoles(meta.user_role))
  }

  return dedupeRoles(collected)
}

export function buildFallbackUserInfo(session: Session | null): UserInfo | null {
  if (!session?.user) return null
  const user = session.user
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>

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
    roles: rolesFromSession(user),
    permissions: {
      isAdmin: false,
      canManageUsers: false,
    },
    doctor: null,
    patient: null,
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
  if (!fallback) {
    return {
      ...remote,
      roles: remoteRoles.length ? remoteRoles : (remote.roles ?? []),
    }
  }

  const resolvedRoles = remoteRoles.length
    ? remoteRoles
    : remote.roles?.length
      ? remote.roles
      : fallback.roles

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
    roles: resolvedRoles,
    permissions: remote.permissions ?? fallback.permissions,
    doctor: remote.doctor ?? null,
    patient: remote.patient ?? null,
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
