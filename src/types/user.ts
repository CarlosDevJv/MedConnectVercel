export type UserRole = 'admin' | 'gestor' | 'medico' | 'secretaria' | 'paciente' | 'user'

export interface UserProfile {
  full_name?: string | null
  phone?: string | null
  avatar_url?: string | null
}

export interface UserPermissions {
  isAdmin?: boolean
  canManageUsers?: boolean
}

export interface AuthUser {
  id: string
  email: string
}

export interface UserInfo {
  user: AuthUser
  profile: UserProfile | null
  roles: UserRole[]
  permissions: UserPermissions
  doctor: Record<string, unknown> | null
  patient: Record<string, unknown> | null
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  medico: 'Médico',
  secretaria: 'Secretária',
  paciente: 'Paciente',
  user: 'Usuário',
}

export function pickPrimaryRole(roles: UserRole[] | undefined | null): UserRole {
  if (!roles || roles.length === 0) return 'user'
  const priority: UserRole[] = ['admin', 'gestor', 'medico', 'secretaria', 'paciente', 'user']
  return priority.find((r) => roles.includes(r)) ?? roles[0]
}
