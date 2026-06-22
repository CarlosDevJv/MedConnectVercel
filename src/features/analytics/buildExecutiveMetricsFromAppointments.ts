import type { AnalyticsPeriod, ExecutiveMetrics } from '@/features/analytics/types'
import type { Appointment } from '@/features/agenda/types'
import type { Doctor } from '@/features/doctors/types'

const DAY_MS = 86_400_000

function ymdAnchor(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Agrega apenas campos disponíveis em `appointments` via API. */
export function buildExecutiveMetricsFromAppointments(
  period: AnalyticsPeriod,
  appointments: Appointment[],
  patientNames: Record<string, string>,
  doctorNames: Record<string, string>
): ExecutiveMetrics {
  const fromMs = new Date(period.from).getTime()
  const toMs = new Date(period.to).getTime()

  const inRange = appointments.filter((a) => {
    const t = new Date(a.scheduled_at).getTime()
    return t >= fromMs && t <= toMs
  })

  const appointmentsScheduled = inRange.length
  const appointmentsCompleted = inRange.filter((a) => a.status === 'completed').length
  const noShows = inRange.filter((a) => a.status === 'no_show').length
  const attendedLike = appointmentsCompleted + noShows
  const noShowRatePercent =
    attendedLike > 0 ? Math.round((noShows / attendedLike) * 1000) / 10 : 0

  const byDayMap = new Map<string, number>()
  for (const a of inRange) {
    if (a.status !== 'completed') continue
    const k = ymdAnchor(a.scheduled_at)
    byDayMap.set(k, (byDayMap.get(k) ?? 0) + 1)
  }

  const consultationsByDay: ExecutiveMetrics['consultationsByDay'] = []
  for (let t = fromMs; t <= toMs && consultationsByDay.length < 14; t += DAY_MS) {
    const d = new Date(t)
    const k = ymdAnchor(d.toISOString())
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    consultationsByDay.push({ label, value: byDayMap.get(k) ?? 0 })
  }

  const patientCounts = new Map<string, number>()
  const doctorCounts = new Map<string, number>()
  for (const a of inRange) {
    if (a.status !== 'completed') continue
    patientCounts.set(a.patient_id, (patientCounts.get(a.patient_id) ?? 0) + 1)
    doctorCounts.set(a.doctor_id, (doctorCounts.get(a.doctor_id) ?? 0) + 1)
  }

  let topPatients = [...patientCounts.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      name: patientNames[id] ?? id.slice(0, 8),
      count,
    }))

  let topDoctors = [...doctorCounts.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      name: doctorNames[id] ?? id.slice(0, 8),
      count,
    }))

  if (!topPatients.length) {
    topPatients = [{ name: '—', count: 0 }]
  }
  if (!topDoctors.length) {
    topDoctors = [{ name: '—', count: 0 }]
  }

  return {
    period,
    appointmentsCompleted,
    appointmentsScheduled,
    noShowRatePercent,
    consultationsByDay:
      consultationsByDay.length > 0 ? consultationsByDay : [{ label: '—', value: 0 }],
    topPatients,
    topDoctors,
  }
}

export function doctorNameMap(doctors: Doctor[]): Record<string, string> {
  return Object.fromEntries(doctors.map((d) => [d.id, d.full_name]))
}
