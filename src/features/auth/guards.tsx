import * as React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth, useHasRole } from '@/features/auth/useAuth'
import type { UserRole } from '@/types/user'

function FullScreenLoader() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="fixed inset-0 grid place-items-center bg-[var(--color-background)]"
    >
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
    </div>
  )
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullScreenLoader />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()

  if (status === 'loading') return <FullScreenLoader />
  if (status === 'authenticated') return <Navigate to="/app" replace />
  return <>{children}</>
}

interface RequireRoleProps {
  roles: UserRole[]
  children: React.ReactNode
  fallbackPath?: string
}

export function RequireRole({ roles, children, fallbackPath = '/app' }: RequireRoleProps) {
  const { status, userEnrichmentSynced } = useAuth()
  const allowed = useHasRole(...roles)

  React.useEffect(() => {
    if (status === 'authenticated' && userEnrichmentSynced && !allowed) {
      toast.error('Acesso negado', {
        description: 'Você não tem permissão para acessar esta página.',
      })
    }
  }, [status, allowed, userEnrichmentSynced])

  if (status === 'loading') return <FullScreenLoader />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }
  if (status === 'authenticated' && !userEnrichmentSynced && !allowed) {
    return <FullScreenLoader />
  }
  if (!allowed) {
    return <Navigate to={fallbackPath} replace />
  }
  return <>{children}</>
}
