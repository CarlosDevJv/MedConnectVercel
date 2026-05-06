import type { EnrichedAppointment } from '@/features/agenda/types'

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const WEEKDAYS_PT = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const

const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

/** Formato editorial pt-BR (sem capitalize automático do Intl). */
export function formatDatePill(): string {
  const d = new Date()
  const wd = WEEKDAYS_PT[d.getDay()]
  const day = d.getDate()
  const month = MONTHS_PT[d.getMonth()]
  const year = d.getFullYear()
  return `${wd}, ${day} de ${month} de ${year}`
}

export function formatTimeSlot(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatLastSignIn(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function statusPillClass(status: EnrichedAppointment['status']): string {
  switch (status) {
    case 'confirmed':
      return 'border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'cancelled':
      return 'border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
    default:
      return 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)]'
  }
}

export function isSameLocalCalendarDay(iso: string, ref: Date): boolean {
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return false
  return (
    t.getFullYear() === ref.getFullYear() &&
    t.getMonth() === ref.getMonth() &&
    t.getDate() === ref.getDate()
  )
}
