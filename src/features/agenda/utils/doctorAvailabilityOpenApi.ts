/**
 * Contrato REST `DoctorAvailabilityRequest` para POST `/rest/v1/doctor_availability`.
 * Fonte: https://do5wegrct3.apidog.io/criar-disponibilidade-23129823e0
 */
export const DOCTOR_AVAILABILITY_API_SLOT_MIN = 15
export const DOCTOR_AVAILABILITY_API_SLOT_MAX = 120
export const DOCTOR_AVAILABILITY_API_SLOT_DEFAULT = 30

/** 0 = Domingo … 6 = Sábado (inteiro no JSON). */
export const DOCTOR_AVAILABILITY_API_WEEKDAY_MIN = 0
export const DOCTOR_AVAILABILITY_API_WEEKDAY_MAX = 6

function parseHmToMinutes(hhMm: string): number | null {
  const parts = hhMm.trim().split(':').map(Number)
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null
  const [h, m] = parts
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return h * 60 + m
}

/** Valida antes do POST conforme texto do endpoint + schema OpenAPI (start &lt; end). */
export function validateDoctorAvailabilityRequestInput(input: {
  weekday: number
  start_time: string
  end_time: string
  slot_minutes: number
}): string | null {
  const { weekday, start_time: startTime, end_time: endTime, slot_minutes: slotMinutes } = input
  if (
    !Number.isInteger(weekday) ||
    weekday < DOCTOR_AVAILABILITY_API_WEEKDAY_MIN ||
    weekday > DOCTOR_AVAILABILITY_API_WEEKDAY_MAX
  ) {
    return 'Dia da semana deve ser inteiro entre 0 (domingo) e 6 (sábado).'
  }
  const sm = parseHmToMinutes(startTime)
  const em = parseHmToMinutes(endTime)
  if (sm === null || em === null) return 'Informe horários de início e fim válidos (HH:MM).'
  if (sm >= em) return 'O horário inicial deve ser menor que o final (mesmo dia).'
  if (
    !Number.isInteger(slotMinutes) ||
    slotMinutes < DOCTOR_AVAILABILITY_API_SLOT_MIN ||
    slotMinutes > DOCTOR_AVAILABILITY_API_SLOT_MAX
  ) {
    return `Slot deve ser inteiro entre ${DOCTOR_AVAILABILITY_API_SLOT_MIN} e ${DOCTOR_AVAILABILITY_API_SLOT_MAX} minutos.`
  }
  return null
}
