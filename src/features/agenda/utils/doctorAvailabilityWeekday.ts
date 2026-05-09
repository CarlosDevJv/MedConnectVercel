/**
 * **UI e OpenAPI (RiseUP)** usam inteiro 0=Domingo … 6=Sábado.
 * **Postgres (Supabase deste projeto)** expõe `weekday` como ENUM com rótulos em inglês
 * (`sunday` … `saturday`). O PostgREST não aceita `5` no JSON — precisa do rótulo (`friday`).
 */
export const WEEKDAY_PG_ENUM_LABELS_EN = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

export type DoctorAvailabilityWeekdayPg = (typeof WEEKDAY_PG_ENUM_LABELS_EN)[number]

/** Converte índice OpenAPI/UI (0–6) para valor serializado aceito pela coluna ENUM. */
export function uiWeekdayToPgEnum(ui: number): DoctorAvailabilityWeekdayPg {
  if (!Number.isInteger(ui) || ui < 0 || ui > 6) {
    throw new RangeError(`weekday inválido (esperado 0–6): ${ui}`)
  }
  return WEEKDAY_PG_ENUM_LABELS_EN[ui]
}

/** Normaliza resposta GET (inteiro 0–6 OU rótulo enum legado) para a UI. */
export function pgWeekdayToUi(raw: number | string): number | null {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw <= 6) {
    return raw
  }
  if (typeof raw === 'string') {
    const idx = WEEKDAY_PG_ENUM_LABELS_EN.indexOf(
      raw.toLowerCase() as DoctorAvailabilityWeekdayPg
    )
    return idx >= 0 ? idx : null
  }
  return null
}
