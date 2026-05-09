import { AdminDashboard } from '@/app/pages/AdminDashboard'
import { DoctorDashboard } from '@/app/pages/DoctorDashboard'
import { HomePlaceholder } from '@/app/pages/HomePlaceholder'
import { PatientPortalDashboard } from '@/app/pages/PatientPortalDashboard'
import { SecretariaDashboard } from '@/app/pages/SecretariaDashboard'
import { useAuth } from '@/features/auth/useAuth'
import { usePatientPortalRouteGate } from '@/features/patient-portal/access'

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
  const portalGate = usePatientPortalRouteGate()

  const awaitingFirstEnrichment =
    status === 'authenticated' && !userEnrichmentSynced && roles.length === 0

  if (awaitingFirstEnrichment) {
    return <DashboardBootstrapSpinner />
  }

  if (roles.includes('admin') || roles.includes('gestor')) {
    return <AdminDashboard />
  }

  if (
    roles.includes('medico') &&
    !roles.includes('admin') &&
    !roles.includes('gestor')
  ) {
    return <DoctorDashboard />
  }

  if (
    roles.includes('secretaria') &&
    !roles.includes('admin') &&
    !roles.includes('gestor') &&
    !roles.includes('medico')
  ) {
    return <SecretariaDashboard />
  }

  if (portalGate.allowed) {
    return <PatientPortalDashboard />
  }

  return <HomePlaceholder />
}
