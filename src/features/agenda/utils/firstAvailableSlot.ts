import { postGetAvailableSlots } from '@/features/agenda/api'
import type { AppointmentType } from '@/features/agenda/types'
import { addDays, combineDateAndTime, toISODateString } from '@/features/agenda/utils/calendar'

/**
 * Primeiro slot livre em um intervalo (reagendamento assistido).
 */
export async function findFirstAvailableSlot(params: {
  doctorId: string
  appointmentType: AppointmentType
  fromDate: Date
  /** Dias à frente para buscar (padrão 21) */
  maxDays?: number
}): Promise<{ scheduled_at: string } | null> {
  const maxDays = params.maxDays ?? 21
  const endDate = addDays(params.fromDate, maxDays)
  const slots = await postGetAvailableSlots({
    doctor_id: params.doctorId,
    start_date: toISODateString(params.fromDate),
    end_date: toISODateString(endDate),
    appointment_type: params.appointmentType,
  })
  for (const s of slots) {
    if (!s.available || !s.time) continue
    if (s.datetime) {
      return { scheduled_at: s.datetime }
    }
    const dateStr = s.date ?? toISODateString(params.fromDate)
    return { scheduled_at: combineDateAndTime(dateStr, s.time) }
  }
  return null
}
