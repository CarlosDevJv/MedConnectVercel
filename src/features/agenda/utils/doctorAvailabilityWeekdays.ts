import type { AppointmentType, DoctorAvailability } from '@/features/agenda/types'
import { addDays, toISODateString } from '@/features/agenda/utils/calendar'
import { pgWeekdayToUi } from '@/features/agenda/utils/doctorAvailabilityWeekday'

function rowIsActive(row: DoctorAvailability): boolean {
  return row.active !== false && row.active !== null
}

function matchesAppointmentFilter(
  rowType: AppointmentType | null | undefined,
  requested: AppointmentType
): boolean {
  if (!rowType) return true
  return rowType === requested
}

/** Dias da semana (0 = domingo … 6 = sábado) em que há janelas ativas, qualquer tipo de consulta. */
export function collectAvailableWeekdaysUnion(rows: DoctorAvailability[]): Set<number> {
  const set = new Set<number>()
  for (const row of rows) {
    if (!rowIsActive(row)) continue
    const dow = pgWeekdayToUi(row.weekday)
    if (dow !== null) set.add(dow)
  }
  return set
}

/** Dias da semana com janela ativa para o tipo de agendamento (null no cadastro conta para ambos). */
export function collectAvailableWeekdaysForAppointmentType(
  rows: DoctorAvailability[],
  appointmentType: AppointmentType
): Set<number> {
  const set = new Set<number>()
  for (const row of rows) {
    if (!rowIsActive(row)) continue
    if (!matchesAppointmentFilter(row.appointment_type, appointmentType)) continue
    const dow = pgWeekdayToUi(row.weekday)
    if (dow !== null) set.add(dow)
  }
  return set
}

/** Primeira data (`yyyy-mm-dd`) a partir de `cursor` cuja weekday está em `allowed`. */
export function nextAvailableCalendarDateIso(cursor: Date, allowed: Set<number>, maxAhead = 400): string | null {
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 0, 0, 0, 0)
  for (let i = 0; i < maxAhead; i++) {
    const d = addDays(start, i)
    if (allowed.has(d.getDay())) return toISODateString(d)
  }
  return null
}
