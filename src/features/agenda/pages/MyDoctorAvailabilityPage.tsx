import { Link } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { useResolvedDoctorId } from '@/features/agenda/useResolvedDoctorId'
import { DoctorAvailabilitySection } from '@/features/doctors/components/DoctorAvailabilitySection'

export function MyDoctorAvailabilityPage() {
  const { resolvedDoctorId, medicoSemVinculo, doctorResolutionReady, doctorsList } =
    useResolvedDoctorId()
  const name = doctorsList.find((d) => d.id === resolvedDoctorId)?.full_name

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6">
      <nav className="text-xs text-[var(--color-muted-foreground)]">
        <Link to="/app" className="hover:text-[var(--color-foreground)]">
          Início
        </Link>
        <span className="mx-1.5 opacity-50">/</span>
        <span className="font-medium text-[var(--color-foreground)]">Minha disponibilidade</span>
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">
          Disponibilidade na agenda
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Defina suas faixas semanais usadas para calcular horários livres nos agendamentos.
          {name ? (
            <>
              {' '}
              Perfil vinculado: <span className="font-medium text-[var(--color-foreground)]">{name}</span>.
            </>
          ) : null}
        </p>
      </header>

      {!doctorResolutionReady ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <Skeleton className="mb-2 h-5 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : medicoSemVinculo ? (
        <p className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
          Não encontramos vínculo do seu usuário com um médico. Confirme{' '}
          <code className="rounded bg-amber-100/90 px-1 text-xs">doctor.id</code> na sua sessão ou o campo{' '}
          <code className="rounded bg-amber-100/90 px-1 text-xs">user_id</code> na tabela de médicos.{' '}
          <Link to="/app" className="font-medium underline-offset-2 hover:underline">
            Voltar ao início
          </Link>
        </p>
      ) : resolvedDoctorId ? (
        <DoctorAvailabilitySection doctorId={resolvedDoctorId} />
      ) : null}
    </div>
  )
}
