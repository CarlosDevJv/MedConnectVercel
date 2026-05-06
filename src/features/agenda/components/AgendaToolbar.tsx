import { CalendarRange, ChevronDown, ChevronLeft, ChevronRight, ListOrdered, Search } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AgendaViewMode, AppointmentStatus, ScheduleIntent } from '@/features/agenda/types'
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  SCHEDULE_INTENT_LABELS,
} from '@/features/agenda/types'
import { cn } from '@/lib/cn'

const VIEWS: { id: AgendaViewMode; label: string }[] = [
  { id: 'month', label: 'Mês' },
  { id: 'week', label: 'Semana' },
  { id: 'day', label: 'Dia' },
  { id: 'list', label: 'Lista' },
]

export interface AgendaToolbarProps {
  viewMode: AgendaViewMode
  onViewMode: (v: AgendaViewMode) => void
  rangeLabel: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  search: string
  onSearch: (v: string) => void
  statusFilter: AppointmentStatus | 'all'
  onStatusFilter: (v: AppointmentStatus | 'all') => void
  onScheduleIntent: (intent: ScheduleIntent) => void
  scheduleDisabled?: boolean
  scheduleDisabledTitle?: string
}

export function AgendaToolbar({
  viewMode,
  onViewMode,
  rangeLabel,
  onPrev,
  onNext,
  onToday,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  onScheduleIntent,
  scheduleDisabled = false,
  scheduleDisabledTitle,
}: AgendaToolbarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function close(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-r-none"
            onClick={onPrev}
            aria-label="Período anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-none border-x border-[var(--color-border)]"
            onClick={onNext}
            aria-label="Próximo período"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-l-none px-3 text-[13px] font-medium"
            onClick={onToday}
          >
            Hoje
          </Button>
        </div>
        <p className="font-display text-sm font-medium text-[var(--color-foreground)] min-w-[180px]">
          {rangeLabel}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onViewMode(v.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
              viewMode === v.id
                ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[260px] lg:justify-end">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to="/app/fila-de-espera" className="gap-1.5">
            <ListOrdered className="h-3.5 w-3.5" />
            Fila de espera
          </Link>
        </Button>
        <Button type="button" variant="outline" size="sm" disabled title="Em breve">
          Baixar PDF
        </Button>
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilter(v as AppointmentStatus | 'all')}
        >
          <SelectTrigger className="h-10 w-[160px] shrink-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {APPOINTMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {APPOINTMENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar paciente ou profissional"
          className="h-10 min-w-[200px] max-w-[280px] flex-1"
          leftIcon={<Search className="h-4 w-4" />}
        />

        <div className="relative" ref={wrapRef}>
          <Button
            type="button"
            size="sm"
            className="gap-1 pr-2"
            disabled={scheduleDisabled}
            title={scheduleDisabled ? scheduleDisabledTitle : undefined}
            onClick={() => {
              if (scheduleDisabled) return
              setMenuOpen((o) => !o)
            }}
          >
            <CalendarRange className="h-4 w-4" />
            Agendar
            <ChevronDown className="h-4 w-4 opacity-80" />
          </Button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
              {(['atendimento', 'sessoes', 'urgencia'] as ScheduleIntent[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className="flex w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-muted)]"
                  onClick={() => {
                    setMenuOpen(false)
                    onScheduleIntent(key)
                  }}
                >
                  {SCHEDULE_INTENT_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
