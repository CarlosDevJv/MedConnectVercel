import { AdminDashboard } from '@/app/pages/AdminDashboard'
import { HomePlaceholder } from '@/app/pages/HomePlaceholder'
import { useAuth } from '@/features/auth/useAuth'

function DashboardBootstrapSpinner() {
  return (
    <div
      className="grid place-items-center py-24"
      role="status"
      aria-label="Carregando dados do usuário"
    >
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
    </div>
  )
}

export function Dashboard() {
  const { userInfo, status, userEnrichmentSynced } = useAuth()
  const roles = userInfo?.roles ?? []

  const awaitingFirstEnrichment =
    status === 'authenticated' && !userEnrichmentSynced && roles.length === 0

  if (awaitingFirstEnrichment) {
    return <DashboardBootstrapSpinner />
  }

  if (roles.includes('admin') || roles.includes('gestor')) {
    return <AdminDashboard />
  }

  return <HomePlaceholder />
}
