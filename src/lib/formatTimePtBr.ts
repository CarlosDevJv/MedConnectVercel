/**
 * Formatação no padrão brasileiro: datas com `Intl` locale `pt-BR`,
 * **horas sempre como dígitos HH:mm (24 h)** sem depender do relógio 12 h do Intl/navegador.
 */

export const LOCALE_PT_BR = 'pt-BR'

function pad2(n: number): string {
  return String(Math.trunc(n)).padStart(2, '0')
}

/** Horário local do `Date`, sempre `00–23 : 00–59`. */
export function formatLocalTimeDigits(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Ex.: `14:30`, `09:05`. */
export function formatTimePtBr(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  if (Number.isNaN(d.getTime())) return '—'
  return formatLocalTimeDigits(d)
}

/** Ex.: `09/05/2026 14:30`. */
export function formatDateTimePtBr(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  if (Number.isNaN(d.getTime())) return '—'
  const datePart = d.toLocaleDateString(LOCALE_PT_BR, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${datePart} ${formatLocalTimeDigits(d)}`
}

/** Dia/mês + hora (SMS “amanhã”, etc.). */
export function formatDateTimeShortNoYearPtBr(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  if (Number.isNaN(d.getTime())) return '—'
  const datePart = d.toLocaleDateString(LOCALE_PT_BR, { day: '2-digit', month: '2-digit' })
  return `${datePart} ${formatLocalTimeDigits(d)}`
}

/** `HH:MM` ou `HH:MM:SS` da API → `HH:MM` (24 h). */
export function formatPostgresLocalTimePtBr(pg: string | null | undefined): string {
  if (!pg?.trim()) return '—'
  const m = pg.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return pg.trim().slice(0, 8)
  const h = Number(m[1])
  const mi = Number(m[2])
  if (Number.isNaN(h) || Number.isNaN(mi) || h > 23 || mi > 59) return pg.trim().slice(0, 8)
  return `${pad2(h)}:${pad2(mi)}`
}

/** Marcador na grade da agenda (hora/minuto fixos). */
export function formatHourMarkPtBr(hour24: number, minute = 0): string {
  return `${pad2(hour24)}:${pad2(minute)}`
}
