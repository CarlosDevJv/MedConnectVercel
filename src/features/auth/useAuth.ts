import * as React from 'react'

import { AuthContext } from '@/features/auth/authContext'
import { PATIENT_FORM_ROLES } from '@/lib/roleGroups'
import type { UserRole } from '@/types/user'

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}

export function useRoles(): UserRole[] {
  const { userInfo } = useAuth()
  return userInfo?.roles ?? []
}

export function useHasRole(...roles: UserRole[]): boolean {
  const current = useRoles()
  if (roles.length === 0) return current.length > 0
  return roles.some((role) => current.includes(role))
}

export function useCanManagePatients(): boolean {
  const current = useRoles()
  return current.some((r) => PATIENT_FORM_ROLES.includes(r))
}

export function useIsRoleless(): boolean {
  const { userInfo, status, userEnrichmentSynced } = useAuth()
  if (status !== 'authenticated' || !userEnrichmentSynced) return false
  return (userInfo?.roles ?? []).length === 0
}
