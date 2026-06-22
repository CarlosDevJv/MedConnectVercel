import {
  buildExecutiveMetricsFromAppointments,
  doctorNameMap,
} from '@/features/analytics/buildExecutiveMetricsFromAppointments'
import type { AnalyticsPeriod, ExecutiveMetrics } from '@/features/analytics/types'
import { batchPatientNames, listAppointments } from '@/features/agenda/api'
import { listDoctors } from '@/features/doctors/api'

/**
 * Métricas só a partir dos endpoints documentados (`listDoctors`, `listAppointments`, `batchPatientNames`).
 */
export async function fetchExecutiveMetrics(period: AnalyticsPeriod): Promise<ExecutiveMetrics> {
  const doctorsRes = await listDoctors({ active: true, pageSize: 500 })
  const doctorIds = doctorsRes.items.map((d) => d.id).filter(Boolean)
  const dmap = doctorNameMap(doctorsRes.items)
  if (!doctorIds.length) {
    return buildExecutiveMetricsFromAppointments(period, [], {}, {})
  }
  const appointments = await listAppointments({
    doctorIds,
    scheduledFrom: period.from,
    scheduledTo: period.to,
  })
  const patientIds = [...new Set(appointments.map((a) => a.patient_id))]
  const patientNames = patientIds.length ? await batchPatientNames(patientIds) : {}
  return buildExecutiveMetricsFromAppointments(period, appointments, patientNames, dmap)
}

export type { AnalyticsPeriod, ExecutiveMetrics }
