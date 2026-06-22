import type { AvailableSlotItem } from '@/features/agenda/types'

function pad2(n: number): string {
  return String(Math.trunc(n)).padStart(2, '0')
}

/** Converte campo `time` da API (`HH:mm` ou `HH:mm:ss`) para valor estável em selects e combineDateAndTime. */
export function normalizeSlotTimeValue(raw: string): string {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return raw.trim().slice(0, 5)
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)))
  const mi = Math.min(59, Math.max(0, parseInt(m[2], 10)))
  return `${pad2(h)}:${pad2(mi)}`
}

function timeFromISO(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** APIs às vezes omitem `available`; consideramos “livre” se não vier explicitamente `false`. */
export function isSelectableSlot(slot: AvailableSlotItem): boolean {
  if (slot.available === false) return false
  return !!slot.time?.trim()
}

/** Remove duplicados e slots sem horário válido ou marcados ocupados no payload. */
export function filterSelectableSlots(slots: AvailableSlotItem[]): AvailableSlotItem[] {
  const seen = new Set<string>()
  return slots.filter((s) => {
    if (!isSelectableSlot(s)) return false
    if (seen.has(s.time)) return false
    seen.add(s.time)
    return true
  })
}

/** Normaliza resposta brutas da Edge Function antes de usar na UI. */
export function coerceUnknownSlotRows(rawSlots: unknown): AvailableSlotItem[] {
  const arr = rawSlots === undefined ? [] : Array.isArray(rawSlots) ? rawSlots : null
  if (!arr || !arr.length) return []

  const out: AvailableSlotItem[] = []
  for (const row of arr) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    let time =
      typeof o.time === 'string'
        ? o.time
        : typeof o.slot_time === 'string'
          ? o.slot_time
          : ''
    let datetime =
      typeof o.datetime === 'string'
        ? o.datetime
        : typeof o.slot_datetime === 'string'
          ? o.slot_datetime
          : undefined
    const date = typeof o.date === 'string' ? o.date : undefined
    if ((!time || !time.trim()) && datetime) {
      const th = timeFromISO(datetime)
      if (th) time = `${th}:00`
    }
    if (!time?.trim()) continue
    let available = true
    if (typeof o.available === 'boolean') available = o.available
    else if (typeof o.is_available === 'boolean') available = o.is_available

    const timeNorm = normalizeSlotTimeValue(time)
    let duration_minutes: number | undefined
    if (typeof o.duration_minutes === 'number' && Number.isFinite(o.duration_minutes)) {
      duration_minutes = o.duration_minutes
    } else if (typeof o.duration === 'number' && Number.isFinite(o.duration)) {
      duration_minutes = o.duration
    } else if (typeof o.slot_minutes === 'number' && Number.isFinite(o.slot_minutes)) {
      duration_minutes = o.slot_minutes
    }
    out.push({
      date,
      datetime,
      time: timeNorm,
      available,
      ...(duration_minutes !== undefined ? { duration_minutes } : {}),
    })
  }

  const seen = new Set<string>()
  return out.filter((s) => {
    if (!s.time || seen.has(s.time)) return false
    seen.add(s.time)
    return true
  })
}
