/** Grade do produto: 10 em 10 minutos (Agendamentos.txt); pode coexistir com duration_minutes da API */

export const GRID_SLOT_MINUTES = 10

export function toISODateString(d: Date): string {
  const dateStr = d.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
  const [day, month, year] = dateStr.split('/')
  return `${year}-${month}-${day}`
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
  return d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' })
}

export function formatDayMonth(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
}

export function formatRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 5)
  const y = weekStart.getFullYear()
  const mLabel = weekStart.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })
  return `${weekStart.getDate()}–${weekEnd.getDate()} ${mLabel}. De ${y}`
}

/** Rótulo completo semana (7 dias) para toolbar */
export function formatFullWeekRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6)
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear()
  const y = weekStart.getFullYear()
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    const mLabel = weekStart.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'America/Sao_Paulo' })
    return `${weekStart.getDate()} – ${weekEnd.getDate()} de ${mLabel} de ${y}`
  }
  const a = weekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo' })
  const b = weekEnd.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric', timeZone: 'America/Sao_Paulo' })
  return `${a} – ${b}`
}

export function minutesSinceMidnight(d: Date): number {
  const timeStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  })
  const [hh, mm] = timeStr.split(':').map(Number)
  return (hh ?? 0) * 60 + (mm ?? 0)
}

/** ISO local para início/fim de intervalo de listagem no fuso de Brasília (UTC-3) */
export function rangeToISOStrings(from: Date, to: Date): { from: string; to: string } {
  // Brasília está em UTC-3. 00:00 local = 03:00 UTC. 23:59:59.999 local = 02:59:59.999 UTC do dia seguinte.
  const start = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate(), 3, 0, 0, 0))
  const end = new Date(Date.UTC(to.getFullYear(), to.getMonth(), to.getDate() + 1, 2, 59, 59, 999))
  return { from: start.toISOString(), to: end.toISOString() }
}

/** Monta ISO UTC correspondente ao fuso de Brasília (UTC-3) a partir de data `YYYY-MM-DD` e hora local 24 h (`HH:MM` ou `HH:MM:SS`). */
export function combineDateAndTime(dateISO: string, timeHHmm: string): string {
  const parts = timeHHmm.split(':').map(Number)
  const hh = parts[0] ?? 0
  const mm = parts[1] ?? 0
  const [y, m, day] = dateISO.split('-').map(Number)
  const dUtc = new Date(Date.UTC(y, m - 1, day, hh + 3, mm, 0, 0))
  return dUtc.toISOString()
}
