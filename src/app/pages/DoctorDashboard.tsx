import * as React from 'react'
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  Clock,
  ChevronRight,
  ClipboardList,
  FilePlus,
  FileText,
  MessageSquare,
  Search,
  Shield,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { ModuleCard } from '@/app/components/ModuleCard'
import { QuickAction } from '@/app/components/QuickAction'
import { StatCard } from '@/app/components/StatCard'
import {
  formatDatePill,
  formatLastSignIn,
  formatTimeSlot,
  getGreeting,
  isSameLocalCalendarDay,
  statusPillClass,
} from '@/app/pages/dashboard/formatters'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/useAuth'
import { useAppointmentsQuery } from '@/features/agenda/hooks'
import { APPOINTMENT_STATUS_LABELS } from '@/features/agenda/types'
import { useResolvedDoctorId } from '@/features/agenda/useResolvedDoctorId'
import { addDays, rangeToISOStrings } from '@/features/agenda/utils/calendar'
import { useReportsList } from '@/features/reports/hooks'
import { cn } from '@/lib/cn'

export function DoctorDashboard() {
  const { userInfo, session } = useAuth()
  const navigate = useNavigate()
  const { resolvedDoctorId, medicoSemVinculo } = useResolvedDoctorId()

  const displayName =
    userInfo?.profile?.full_name?.trim() ||
    userInfo?.user?.email?.split('@')[0] ||
    'Doutor(a)'

  const userId = userInfo?.user.id ?? ''
  const roles = userInfo?.roles ?? []
  const scopeReportsToCreator =
    roles.includes('medico') && !roles.some((r) => r === 'admin' || r === 'gestor')

  const lastSignIn = formatLastSignIn(
    (session?.user as { last_sign_in_at?: string } | undefined)?.last_sign_in_at
  )

  const anchorToday = React.useMemo(() => new Date(), [])
  const weekRange = React.useMemo(
    () => rangeToISOStrings(anchorToday, addDays(anchorToday, 6)),
    [anchorToday]
  )

  const apptEnabled = Boolean(resolvedDoctorId) && !medicoSemVinculo
  const apptQuery = useAppointmentsQuery(
    {
      doctorIds: resolvedDoctorId ? [resolvedDoctorId] : [],
      scheduledFrom: weekRange.from,
      scheduledTo: weekRange.to,
    },
    apptEnabled
  )

  const draftsQuery = useReportsList(
    {
      status: 'draft',
      page: 1,
      pageSize: 1,
      order: 'created_at.desc',
      ...(scopeReportsToCreator && userId ? { created_by: userId } : {}),
    },
    !!userId
  )

  const rawList = apptQuery.data ?? []
  const consultasHoje = React.useMemo(
    () => rawList.filter((a) => isSameLocalCalendarDay(a.scheduled_at, anchorToday)).length,
    [rawList, anchorToday]
  )

  const todayAppointments = React.useMemo(() => {
    const todayOnly = rawList.filter((a) => isSameLocalCalendarDay(a.scheduled_at, anchorToday))
    return [...todayOnly].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)).slice(0, 8)
  }, [rawList, anchorToday])

  const draftsOpen = draftsQuery.data?.total
  const weekTotal = rawList.length

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
      {medicoSemVinculo ? (
        <div
          className="flex gap-3 rounded-[var(--radius-card)] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm sm:items-center sm:px-5"
          role="status"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <p className="leading-relaxed">
            Não encontramos vínculo do seu usuário com um médico na base. A agenda e os totais abaixo
            ficam indisponíveis até o administrador concluir o cadastro. Você ainda pode acessar{' '}
            <Link to="/app/pacientes" className="font-semibold underline-offset-2 hover:underline">
              pacientes
            </Link>
            ,{' '}
            <Link to="/app/relatorios" className="font-semibold underline-offset-2 hover:underline">
              relatórios
            </Link>{' '}
            e{' '}
            <Link to="/app/mensagens" className="font-semibold underline-offset-2 hover:underline">
              mensagens
            </Link>
            .
          </p>
        </div>
      ) : null}

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 shadow-[var(--shadow-card)] sm:px-8 animate-fade-in-up">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
              Início — médico
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)] sm:text-[2.15rem]">
              {getGreeting()}, {displayName}.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              Sua agenda, pacientes e laudos num painel igual ao da gestão, focado na rotina clínica.
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
          label="Consultas hoje"
          value={
            !apptEnabled ? '—' : apptQuery.isLoading ? undefined : consultasHoje
          }
          loading={apptEnabled && apptQuery.isLoading}
          icon={Calendar}
        />
        <StatCard
          label="Na próxima semana"
          value={!apptEnabled ? '—' : apptQuery.isLoading ? undefined : weekTotal}
          loading={apptEnabled && apptQuery.isLoading}
          icon={CalendarDays}
        />
        <StatCard
          label="Laudos em aberto"
          value={
            draftsQuery.isLoading
              ? undefined
              : draftsQuery.isError
                ? '—'
                : (draftsOpen ?? 0)
          }
          loading={draftsQuery.isLoading}
          icon={ClipboardList}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 animate-fade-in-up-delay-2">
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
          {!apptEnabled ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-4 py-8 text-center">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Vínculo com médico necessário para listar seus horários.
              </p>
            </div>
          ) : apptQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-muted)]" />
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-4 py-8 text-center">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Nenhum agendamento para hoje.
              </p>
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

        <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Laudos</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Continue rascunhos e libere relatórios (API `/rest/v1/reports`).
          </p>
          <div className="mt-6 flex min-h-[132px] flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[linear-gradient(145deg,var(--color-muted)_0%,transparent_55%)] px-4 py-8 text-center">
            <FileText className="h-8 w-8 text-[var(--color-accent)]/80" aria-hidden />
            <p className="max-w-[300px] text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {draftsQuery.isLoading
                ? 'Carregando laudos…'
                : draftsQuery.isError
                  ? 'Não foi possível carregar a contagem de laudos.'
                  : draftsOpen
                    ? `Você tem ${draftsOpen} laudo${draftsOpen === 1 ? '' : 's'} em aberto na lista.`
                    : 'Nenhum laudo em rascunho com seu usuário neste momento.'}{' '}
              <Link
                to="/app/relatorios"
                className="font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline"
              >
                Ir para relatórios
              </Link>
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
              <Link to="/app/pacientes">
                <Users className="h-4 w-4" />
                Pacientes
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_300px] animate-fade-in-up-delay-3">
        <div className="flex flex-col gap-4">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Áreas de trabalho</h2>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ModuleCard
              icon={Users}
              title="Pacientes"
              description="Lista, busca e atualização quando permitido (cadastro inicial costuma ficar na secretaria)."
              status="active"
              to="/app/pacientes"
            />
            <ModuleCard
              icon={Calendar}
              title="Agenda"
              description="Calendário e agendamentos do dia."
              status="active"
              to="/app/agenda"
            />
            {!medicoSemVinculo ? (
              <ModuleCard
                icon={Clock}
                title="Minha disponibilidade"
                description="Faixas semanais para cálculo de horários livres."
                status="active"
                to="/app/disponibilidade"
              />
            ) : null}
            <ModuleCard
              icon={FileText}
              title="Laudos"
              description="Gestão de relatórios e laudos médicos por paciente."
              status="active"
              to="/app/relatorios"
            />
            <ModuleCard
              icon={MessageSquare}
              title="Mensagens"
              description="Comunique-se com pacientes por SMS quando configurado."
              status="active"
              to="/app/mensagens"
            />
          </div>
        </div>

        <section className="flex flex-col gap-4">
          <header>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Atalhos</h2>
          </header>
          <div className="flex flex-col gap-2">
            <QuickAction
              icon={FilePlus}
              label="Novo laudo"
              description="Abre o relatório médico para preenchimento"
              to="/app/relatorios/novo"
            />
            <QuickAction
              icon={Search}
              label="Buscar paciente"
              description="Lista e filtros por nome ou CPF"
              to="/app/pacientes"
            />
            <QuickAction
              icon={Calendar}
              label="Agenda"
              description="Calendário e detalhes de consultas"
              to="/app/agenda"
            />
            {!medicoSemVinculo ? (
              <QuickAction
                icon={Clock}
                label="Disponibilidade"
                description="Grade semanal e slots"
                to="/app/disponibilidade"
              />
            ) : null}
            <QuickAction
              icon={FileText}
              label="Laudos"
              description="Lista e edição de relatórios"
              to="/app/relatorios"
            />
            <QuickAction
              icon={Shield}
              label="Segurança da conta"
              description={`Último acesso registrado em ${lastSignIn}`}
              to="/app/seguranca-e-notificacoes"
            />
            <QuickAction
              icon={MessageSquare}
              label="Mensagens"
              description="Canal com pacientes"
              to="/app/mensagens"
            />
          </div>
        </section>
      </section>
    </div>
  )
}
