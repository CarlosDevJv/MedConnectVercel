import * as React from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/useAuth'
import { canUseMultiDoctorAgenda } from '@/lib/roleGroups'
import { AgendaListView } from '@/features/agenda/components/AgendaListView'
import { AgendaResourceSidebar } from '@/features/agenda/components/AgendaResourceSidebar'
import { AgendaToolbar } from '@/features/agenda/components/AgendaToolbar'
import { AppointmentDetailDialog } from '@/features/agenda/components/AppointmentDetailDialog'
import { CalendarDayView } from '@/features/agenda/components/CalendarDayView'
import { CalendarMonthView } from '@/features/agenda/components/CalendarMonthView'
import { CalendarWeekView } from '@/features/agenda/components/CalendarWeekView'
import { NewAppointmentSheet } from '@/features/agenda/components/NewAppointmentSheet'
import { useAppointmentsQuery } from '@/features/agenda/hooks'
import type {
  AgendaViewMode,
  AppointmentStatus,
  EnrichedAppointment,
  ScheduleIntent,
} from '@/features/agenda/types'
import {
  addDays,
  addMonths,
  endOfMonth,
  formatFullWeekRangeLabel,
  rangeToISOStrings,
  startOfMonth,
  startOfWeekMonday,
  toISODateString,
} from '@/features/agenda/utils/calendar'
import { useResolvedDoctorId } from '@/features/agenda/useResolvedDoctorId'

const DAY_START = 7
const DAY_END = 20

export function AgendaPage() {
  const navigate = useNavigate()
  const { userInfo } = useAuth()
  const calendarRef = React.useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = React.useState<AgendaViewMode>('week')
  const [anchorDate, setAnchorDate] = React.useState(() => new Date())
  /** null = todas as agendas ativas; senão subconjunto escolhido pelo usuário */
  const [selectionOverride, setSelectionOverride] = React.useState<Set<string> | null>(null)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<AppointmentStatus | 'all'>('all')
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [sheetNonce, setSheetNonce] = React.useState(0)
  const [scheduleIntent, setScheduleIntent] = React.useState<ScheduleIntent>('atendimento')
  const [detailAppt, setDetailAppt] = React.useState<EnrichedAppointment | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const userId = userInfo?.user.id ?? ''
  const roles = userInfo?.roles ?? []
  const multiDoctorAgenda = canUseMultiDoctorAgenda(roles)
  const { resolvedDoctorId, medicoSemVinculo, doctorsList } = useResolvedDoctorId()

  const sheetDoctors = React.useMemo(() => {
    if (resolvedDoctorId) return doctorsList.filter((d) => d.id === resolvedDoctorId)
    if (roles.includes('medico') && !multiDoctorAgenda) return []
    return doctorsList
  }, [resolvedDoctorId, doctorsList, roles, multiDoctorAgenda])

  const selectedIds = React.useMemo(() => {
    if (resolvedDoctorId) return new Set([resolvedDoctorId])
    if (medicoSemVinculo) return new Set<string>()
    if (!doctorsList.length) return new Set<string>()
    if (selectionOverride !== null) return selectionOverride
    return new Set(doctorsList.map((d) => d.id))
  }, [resolvedDoctorId, medicoSemVinculo, doctorsList, selectionOverride])

  const weekStart = React.useMemo(() => startOfWeekMonday(anchorDate), [anchorDate])

  const { rangeFrom, rangeTo, rangeLabel } = React.useMemo(() => {
    if (viewMode === 'day') {
      const { from, to } = rangeToISOStrings(anchorDate, anchorDate)
      return {
        rangeFrom: from,
        rangeTo: to,
        rangeLabel: anchorDate.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      }
    }
    if (viewMode === 'week' || viewMode === 'list') {
      const end = addDays(weekStart, 6)
      const { from, to } = rangeToISOStrings(weekStart, end)
      return {
        rangeFrom: from,
        rangeTo: to,
        rangeLabel: formatFullWeekRangeLabel(weekStart),
      }
    }
    const sm = startOfMonth(anchorDate)
    const em = endOfMonth(anchorDate)
    const { from, to } = rangeToISOStrings(sm, em)
    return {
      rangeFrom: from,
      rangeTo: to,
      rangeLabel: anchorDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    }
  }, [viewMode, anchorDate, weekStart])

  const effectiveDoctorIds = React.useMemo(() => {
    if (resolvedDoctorId) return [resolvedDoctorId]
    if (selectedIds.size === 0) return [] as string[]
    if (doctorsList.length > 0 && selectedIds.size === doctorsList.length) return undefined
    return [...selectedIds]
  }, [resolvedDoctorId, selectedIds, doctorsList.length])

  const listParams = React.useMemo(
    () => ({
      scheduledFrom: rangeFrom,
      scheduledTo: rangeTo,
      doctorIds: effectiveDoctorIds,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [rangeFrom, rangeTo, effectiveDoctorIds, statusFilter]
  )

  const appointmentsQuery = useAppointmentsQuery(
    listParams,
    Boolean(userId && (resolvedDoctorId || selectedIds.size > 0))
  )

  const doctorNameById = React.useMemo(() => {
    const m: Record<string, string> = {}
    for (const d of doctorsList) m[d.id] = d.full_name
    return m
  }, [doctorsList])

  const visibleAppointments = React.useMemo(() => {
    let list = appointmentsQuery.data ?? []
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (a) =>
          (a.patient_name?.toLowerCase().includes(q) ?? false) ||
          (doctorNameById[a.doctor_id]?.toLowerCase().includes(q) ?? false)
      )
    }
    return list
  }, [appointmentsQuery.data, search, doctorNameById])

  function onPrev() {
    if (viewMode === 'day') setAnchorDate((d) => addDays(d, -1))
    else if (viewMode === 'month') setAnchorDate((d) => addMonths(d, -1))
    else setAnchorDate((d) => addDays(d, -7))
  }

  function onNext() {
    if (viewMode === 'day') setAnchorDate((d) => addDays(d, 1))
    else if (viewMode === 'month') setAnchorDate((d) => addMonths(d, 1))
    else setAnchorDate((d) => addDays(d, 7))
  }

  function onToday() {
    setAnchorDate(new Date())
  }

  function toggleDoctor(id: string, checked: boolean) {
    setSelectionOverride((prev) => {
      const base = prev ?? new Set(doctorsList.map((d) => d.id))
      const next = new Set(base)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function selectAllDoctors() {
    setSelectionOverride(new Set(doctorsList.map((d) => d.id)))
  }

  function clearDoctors() {
    setSelectionOverride(new Set())
  }

  function openDetail(a: EnrichedAppointment) {
    setDetailAppt(a)
    setDetailOpen(true)
  }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'c' || e.key === 'C') {
        calendarRef.current?.focus()
      }
      if (e.key === 'f' || e.key === 'F') {
        navigate('/app/fila-de-espera')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const showNoDoctor = !resolvedDoctorId && selectedIds.size === 0

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <nav className="text-xs text-[var(--color-muted-foreground)]">
        <span>Início</span>
        <span className="mx-1.5 opacity-50">/</span>
        <span className="font-medium text-[var(--color-foreground)]">Agenda</span>
      </nav>

      <AgendaToolbar
        viewMode={viewMode}
        onViewMode={setViewMode}
        rangeLabel={rangeLabel}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
        search={search}
        onSearch={setSearch}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        scheduleDisabled={medicoSemVinculo}
        scheduleDisabledTitle="Associe seu cadastro de médico ao usuário (campo user_id em doctors ou doctor em user-info) para agendar."
        onScheduleIntent={(intent) => {
          if (medicoSemVinculo) return
          setScheduleIntent(intent)
          setSheetNonce((n) => n + 1)
          setSheetOpen(true)
        }}
      />

      <div className="flex flex-col gap-4 lg:flex-row">
        <AgendaResourceSidebar
          doctors={
            resolvedDoctorId ? doctorsList.filter((d) => d.id === resolvedDoctorId) : doctorsList
          }
          selectedIds={selectedIds}
          onToggle={toggleDoctor}
          onSelectAll={selectAllDoctors}
          onClearAll={clearDoctors}
          lockedDoctorId={resolvedDoctorId}
        />

        <div className="min-w-0 flex-1 flex flex-col gap-3">
          {appointmentsQuery.isError && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Não foi possível carregar os agendamentos. Verifique sua conexão e permissões.
            </p>
          )}
          {medicoSemVinculo && (
            <p className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
              Não foi possível associar você a um médico nesta conta: falta{' '}
              <code className="rounded bg-amber-100/90 px-1 text-xs">doctor.id</code> em user-info, campo{' '}
              <code className="rounded bg-amber-100/90 px-1 text-xs">user_id</code> na tabela doctors ligado ao seu
              login, ou a lista de médicos deve retornar apenas o seu perfil (RLS). Solicite ao administrador.
            </p>
          )}
          {showNoDoctor && !medicoSemVinculo && (
            <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-2 text-sm">
              Selecione ao menos uma agenda na barra lateral.
            </p>
          )}

          {viewMode === 'week' && !showNoDoctor && (
            <CalendarWeekView
              weekStart={weekStart}
              dayStartHour={DAY_START}
              dayEndHour={DAY_END}
              appointments={visibleAppointments}
              doctorNameById={doctorNameById}
              calendarRef={calendarRef}
              onSelectAppointment={openDetail}
            />
          )}

          {viewMode === 'day' && !showNoDoctor && (
            <CalendarDayView
              day={anchorDate}
              dayStartHour={DAY_START}
              dayEndHour={DAY_END}
              appointments={visibleAppointments}
              doctorNameById={doctorNameById}
              calendarRef={calendarRef}
              onSelectAppointment={openDetail}
            />
          )}

          {viewMode === 'month' && (
            <CalendarMonthView
              monthAnchor={anchorDate}
              appointments={visibleAppointments}
              onSelectDay={(d) => {
                setAnchorDate(d)
                setViewMode('day')
              }}
            />
          )}

          {viewMode === 'list' && !showNoDoctor && (
            <AgendaListView
              appointments={visibleAppointments}
              doctorNameById={doctorNameById}
              onSelectAppointment={openDetail}
            />
          )}
        </div>
      </div>

      <NewAppointmentSheet
        key={`agenda-new-${sheetNonce}`}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        intent={scheduleIntent}
        userId={userId}
        doctors={sheetDoctors}
        linkedDoctorId={resolvedDoctorId}
        defaultDate={toISODateString(anchorDate)}
        onCompleted={() => void appointmentsQuery.refetch()}
      />

      <AppointmentDetailDialog
        appointment={detailAppt}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        doctorName={detailAppt ? doctorNameById[detailAppt.doctor_id] : undefined}
        onAppointmentUpdated={(row) => setDetailAppt(row)}
      />
    </div>
  )
}
