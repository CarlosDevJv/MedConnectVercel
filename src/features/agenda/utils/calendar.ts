/** Grade do produto: 10 em 10 minutos (Agendamentos.txt); pode coexistir com duration_minutes da API */

export const GRID_SLOT_MINUTES = 10

export function toISODateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Início da semana na segunda-feira (0h local) */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function addMonths(date: Date, n: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function eachDayInWeek(startMonday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startMonday, i))
}

export function formatWeekdayShort(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'short' })
}

export function formatDayMonth(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function formatRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 5)
  const y = weekStart.getFullYear()
  return `${weekStart.getDate()}–${weekEnd.getDate()} ${weekStart.toLocaleDateString('pt-BR', { month: 'short' })}. De ${y}`
}

/** Rótulo completo semana (7 dias) para toolbar */
export function formatFullWeekRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6)
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear()
  const y = weekStart.getFullYear()
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.getDate()} – ${weekEnd.getDate()} de ${weekStart.toLocaleDateString('pt-BR', { month: 'long' })} de ${y}`
  }
  const a = weekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  const b = weekEnd.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric' })
  return `${a} – ${b}`
}

export function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

/** ISO local para início/fim de intervalo de listagem */
export function rangeToISOStrings(from: Date, to: Date): { from: string; to: string } {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0)
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

/** Monta ISO UTC a partir de data `YYYY-MM-DD` e hora local 24 h (`HH:MM` ou `HH:MM:SS`). */
export function combineDateAndTime(dateISO: string, timeHHmm: string): string {
  const parts = timeHHmm.split(':').map(Number)
  const hh = parts[0] ?? 0
  const mm = parts[1] ?? 0
  const d = parseISODateLocal(dateISO)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}
