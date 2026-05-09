import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { MonthCalendarGrid } from '@/features/agenda/components/MonthCalendarGrid'
import { useDoctorAvailabilityListQuery } from '@/features/agenda/hooks'
import type { AppointmentType } from '@/features/agenda/types'
import { addMonths, parseISODateLocal, startOfMonth, toISODateString } from '@/features/agenda/utils/calendar'
import {
  collectAvailableWeekdaysForAppointmentType,
  nextAvailableCalendarDateIso,
} from '@/features/agenda/utils/doctorAvailabilityWeekdays'

export interface AppointmentAvailabilityDatePickerProps {
  doctorId: string | undefined
  appointmentType: AppointmentType
  value: string
  onChange: (isoDate: string) => void
  disabled?: boolean
  /**
   * Datas sempre clicáveis (≥ hoje), além dos dias da disponibilidade.
   * Ex.: data atual de uma consulta no reagendamento.
   */
  additionallyAllowedDatesIso?: readonly string[]
}

function startOfTodayLocal(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0)
}

export function AppointmentAvailabilityDatePicker({
  doctorId,
  appointmentType,
  value,
  onChange,
  disabled,
  additionallyAllowedDatesIso,
}: AppointmentAvailabilityDatePickerProps) {
  const availabilityQuery = useDoctorAvailabilityListQuery(doctorId, Boolean(doctorId) && !disabled)

  const extrasIso = React.useMemo(
    () => new Set((additionallyAllowedDatesIso ?? []).map((s) => s.trim()).filter(Boolean)),
    [additionallyAllowedDatesIso]
  )

  const [monthShown, setMonthShown] = React.useState<Date>(() =>
    value ? parseISODateLocal(value) : startOfMonth(startOfTodayLocal())
  )

  React.useEffect(() => {
    if (!value?.trim()) return
    try {
      setMonthShown(parseISODateLocal(value))
    } catch {
      /**/
    }
  }, [value])

  React.useEffect(() => {
    if (!doctorId || !availabilityQuery.isFetched) return
    const rows = availabilityQuery.data ?? []
    const weekdays = collectAvailableWeekdaysForAppointmentType(rows, appointmentType)
    if (!weekdays.size) return
    const today = startOfTodayLocal()
    const minIso = toISODateString(today)
    const trimmed = value.trim()
    let currentOk = false
    try {
      const dowOk = weekdays.has(parseISODateLocal(trimmed).getDay())
      currentOk =
        Boolean(trimmed) &&
        trimmed >= minIso &&
        (dowOk || extrasIso.has(trimmed))
    } catch {
      currentOk = false
    }
    if (!currentOk) {
      const next = nextAvailableCalendarDateIso(today, weekdays)
      if (next && next !== trimmed) onChange(next)
    }
  }, [doctorId, appointmentType, availabilityQuery.data, availabilityQuery.isFetched, extrasIso, onChange, value])

  const allowedWeekdays = React.useMemo(() => {
    if (!doctorId || !availabilityQuery.data?.length) return new Set<number>()
    return collectAvailableWeekdaysForAppointmentType(availabilityQuery.data, appointmentType)
  }, [availabilityQuery.data, appointmentType, doctorId])

  const weekdayReady =
    Boolean(doctorId) && availabilityQuery.isFetched && availabilityQuery.data !== undefined

  const todayIso = toISODateString(startOfTodayLocal())

  return (
    <div className="space-y-2">
      {!doctorId ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">Escolha o profissional para ver datas disponíveis.</p>
      ) : availabilityQuery.isError ? (
        <p className="text-xs text-amber-800">Não foi possível carregar a disponibilidade do médico.</p>
      ) : weekdayReady && !allowedWeekdays.size ? (
        <p className="text-xs text-amber-800">
          Este profissional não tem dias de atendimento cadastrados para este tipo de consulta ({appointmentType}). Cadastre
          disponibilidade ou ajuste o tipo na agenda.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-9 shrink-0 p-0"
              disabled={disabled}
              onClick={() => setMonthShown((m) => addMonths(m, -1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="font-display text-sm font-medium capitalize text-[var(--color-foreground)]">
              {monthShown.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-9 shrink-0 p-0"
              disabled={disabled}
              onClick={() => setMonthShown((m) => addMonths(m, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <MonthCalendarGrid
            monthAnchor={monthShown}
            selectedIso={value}
            isDaySelectable={(d) => {
              if (!doctorId || disabled) return false
              const iso = toISODateString(d)
              if (iso >= todayIso && extrasIso.has(iso)) return true
              if (!weekdayReady) return iso >= todayIso
              if (!allowedWeekdays.size) return false
              if (!allowedWeekdays.has(d.getDay())) return false
              return iso >= todayIso
            }}
            onDayPress={(d) => {
              const iso = toISODateString(d)
              onChange(iso)
            }}
          />
          {availabilityQuery.isPending && (
            <p className="text-xs text-[var(--color-muted-foreground)]">Carregando disponibilidade…</p>
          )}
        </>
      )}
    </div>
  )
}
