import { ArrowRight, Calendar, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth/useAuth'
import { useResolvedPatientId } from '@/features/patient-portal/hooks'

export function PatientPortalDashboard() {
  const { userInfo } = useAuth()
  const patientId = useResolvedPatientId()
  const fullName = userInfo?.profile?.full_name ?? userInfo?.user?.email ?? 'Paciente'

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Portal do paciente
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] mt-2 sm:text-4xl">
          Olá, {fullName.split(' ')[0] || 'Paciente'}.
        </h1>
        <p className="mt-2 text-[var(--color-muted-foreground)]">
          Aqui você acompanha os agendamentos e laudos vinculados ao seu cadastro.
        </p>
      </header>

      {!patientId ? (
        <aside className="rounded-[var(--radius-card)] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-950">
          O app já tentou cruzar e‑mail ou CPF (metadados) com seu cadastro, mas não encontramos um paciente que
          possamos ler aqui ou o servidor bloqueia a consulta — peça à clínica para alinhar o e‑mail do cadastro
          com sua conta ou retornarem <code className="text-xs">patient.id</code> para o MediConnect resolver o
          vínculo automaticamente.
        </aside>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/app/meus-agendamentos"
          className="group flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-accent-soft)]/25"
        >
          <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg text-[var(--color-foreground)]">Meus agendamentos</h2>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Datas, horários, profissional e status dos seus compromissos.
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]">
            Ver agenda <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          to="/app/meus-laudos"
          className="group flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-accent-soft)]/25"
        >
          <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg text-[var(--color-foreground)]">Meus laudos</h2>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Relatórios disponibilizados para você (somente leitura).
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]">
            Ver laudos <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </div>
  )
}
