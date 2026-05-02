/** Início do dia em ISO (UTC aproximado via local). */
export function startOfLocalDay(d: Date): string {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.toISOString()
}

export function endOfLocalDay(d: Date): string {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x.toISOString()
}

export function presetToday(): { from: string; to: string } {
  const n = new Date()
  return { from: startOfLocalDay(n), to: endOfLocalDay(n) }
}

export function presetLast7Days(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 6)
  return { from: startOfLocalDay(from), to: endOfLocalDay(to) }
}

export function presetThisMonth(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to.getFullYear(), to.getMonth(), 1)
  return { from: startOfLocalDay(from), to: endOfLocalDay(to) }
}

/** Converte valor de input type="date" (yyyy-mm-dd) em intervalo aplicável ao filtro created_at. */
export function dateInputsToIsoRange(fromYmd: string, toYmd: string): { from: string; to: string } | null {
  if (!fromYmd || !toYmd) return null
  const start = new Date(`${fromYmd}T00:00:00`)
  const end = new Date(`${toYmd}T23:59:59.999`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return null
  return { from: start.toISOString(), to: end.toISOString() }
}
