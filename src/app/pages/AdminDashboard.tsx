import * as React from 'react'
import {
  BarChart3,
  Calendar,
  ChevronRight,
  FileText,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { ModuleCard } from '@/app/components/ModuleCard'
import { QuickAction } from '@/app/components/QuickAction'
import { StatCard } from '@/app/components/StatCard'
import {
  formatDatePill,
  formatLastSignIn,
  formatTimeSlot,
  getGreeting,
  statusPillClass,
} from '@/app/pages/dashboard/formatters'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/useAuth'
import { useAppointmentsQuery } from '@/features/agenda/hooks'
import { APPOINTMENT_STATUS_LABELS } from '@/features/agenda/types'
import { rangeToISOStrings } from '@/features/agenda/utils/calendar'
import { countDoctors } from '@/features/doctors/api'
import { countPatients } from '@/features/patients/api'
import { cn } from '@/lib/cn'

function usePatientCount() {
  return useQuery({
    queryKey: ['dashboard', 'patient-count'],
    queryFn: () => countPatients(),
    staleTime: 60_000,
    retry: false,
  })
}

function useDoctorCount() {
  return useQuery({
    queryKey: ['dashboard', 'doctor-count'],
    queryFn: () => countDoctors(),
    staleTime: 60_000,
    retry: false,
  })
}

export function AdminDashboard() {
  const { userInfo, session } = useAuth()
  const navigate = useNavigate()

  const displayName =
    userInfo?.profile?.full_name?.trim() ||
    userInfo?.user?.email?.split('@')[0] ||
    'Usuário'

  const patientQuery = usePatientCount()
  const doctorQuery = useDoctorCount()

  const lastSignIn = formatLastSignIn(
    (session?.user as { last_sign_in_at?: string } | undefined)?.last_sign_in_at
  )

  const todayRange = React.useMemo(() => {
    const d = new Date()
    return rangeToISOStrings(d, d)
  }, [])

  const apptQuery = useAppointmentsQuery({
    scheduledFrom: todayRange.from,
    scheduledTo: todayRange.to,
  })

  const todayAppointments = React.useMemo(() => {
    const list = apptQuery.data ?? []
    return [...list].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)).slice(0, 8)
  }, [apptQuery.data])

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 shadow-[var(--shadow-card)] sm:px-8 animate-fade-in-up">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
              Painel operacional
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)] sm:text-[2.15rem]">
              {getGreeting()}, {displayName}.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              Visão geral clínica e operação do dia.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
            <span className="inline-flex w-fit rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/60 px-4 py-2 text-sm font-medium text-[var(--color-foreground)]">
              {formatDatePill()}
            </span>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate('/app/pacientes')}
            >
              <Search className="h-4 w-4" />
              Buscar paciente
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3 animate-fade-in-up-delay-1">
        <StatCard
          label="Pacientes cadastrados"
          value={patientQuery.isLoading ? undefined : (patientQuery.data ?? '—')}
          loading={patientQuery.isLoading}
          icon={Users}
        />
        <StatCard
          label="Médicos cadastrados"
          value={
            doctorQuery.isLoading ? undefined : doctorQuery.isError ? '—' : (doctorQuery.data ?? '—')
          }
          loading={doctorQuery.isLoading}
          icon={Stethoscope}
        />
        <StatCard label="Último acesso" value={lastSignIn} icon={ShieldCheck} />
      </section>

      <section className="animate-fade-in-up-delay-2">
        <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Agenda de hoje</h2>
            <Link
              to="/app/agenda"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Ver agenda
              <ChevronRight className="h-4 w-4" />
            </Link>
          </header>
          {apptQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-muted)]" />
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-4 py-8 text-center">
              <p className="text-sm text-[var(--color-muted-foreground)]">Nenhum agendamento para hoje.</p>
              <Button type="button" variant="link" className="mt-2 text-[var(--color-accent)]" asChild>
                <Link to="/app/agenda">Abrir agenda</Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {todayAppointments.map((a, idx) => (
                <li
                  key={a.id}
                  className={cn(
                    'flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-transparent px-3 py-3 transition-colors sm:flex-nowrap',
                    idx === 0 && 'border-[var(--color-accent)]/25 bg-[var(--color-accent-soft)]/60'
                  )}
                >
                  <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
                    {formatTimeSlot(a.scheduled_at)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/app/pacientes/${a.patient_id}`}
                      className="truncate font-medium text-[var(--color-foreground)] hover:text-[var(--color-accent)]"
                    >
                      {a.patient_name}
                    </Link>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      statusPillClass(a.status)
                    )}
                  >
                    {APPOINTMENT_STATUS_LABELS[a.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px] animate-fade-in-up-delay-3">
        <section className="flex flex-col gap-4">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Módulos do sistema</h2>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ModuleCard
              icon={Users}
              title="Pacientes"
              description="Cadastre, edite, busque e gerencie os pacientes da clínica."
              status="active"
              to="/app/pacientes"
            />
            <ModuleCard
              icon={Stethoscope}
              title="Médicos"
              description="Gerencie o cadastro e a disponibilidade dos médicos."
              status="active"
              to="/app/medicos"
            />
            <ModuleCard
              icon={Calendar}
              title="Agenda"
              description="Agende, reagende e cancele consultas com facilidade."
              status="active"
              to="/app/agenda"
            />
            <ModuleCard
              icon={FileText}
              title="Relatórios médicos"
              description="Laudos e relatórios médicos armazenados no sistema."
              status="active"
              to="/app/relatorios"
            />
            <ModuleCard
              icon={BarChart3}
              title="Indicadores"
              description="Métricas agregadas a partir dos agendamentos da clínica."
              status="active"
              to="/app/indicadores"
            />
            <ModuleCard
              icon={MessageSquare}
              title="Mensagens"
              description="SMS via Twilio para lembretes e avisos; entrega de laudo por SMS a partir da lista de relatórios."
              status="active"
              to="/app/mensagens"
            />
            <ModuleCard
              icon={ShieldCheck}
              title="Usuários e permissões"
              description="Controle de acesso, roles e convites de novos usuários."
              status="coming-soon"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <header>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Atalhos</h2>
          </header>
          <div className="flex flex-col gap-2">
            <QuickAction
              icon={Plus}
              label="Novo paciente"
              description="Abre o formulário de cadastro"
              to="/app/pacientes/novo"
            />
            <QuickAction
              icon={Users}
              label="Lista de pacientes"
              description="Busque ou filtre por CPF e nome"
              to="/app/pacientes"
            />
            <QuickAction
              icon={Calendar}
              label="Agenda"
              description="Calendário e agendamentos"
              to="/app/agenda"
            />
            <QuickAction
              icon={BarChart3}
              label="Indicadores"
              description="Métricas a partir da API de agendamentos"
              to="/app/indicadores"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
