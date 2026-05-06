import {
  buildExecutiveMetricsFromAppointments,
  doctorNameMap,
} from '@/features/analytics/buildExecutiveMetricsFromAppointments'
import { buildMockExecutiveMetrics } from '@/features/analytics/mock/buildMockExecutiveMetrics'
import type { AnalyticsPeriod, ExecutiveMetrics } from '@/features/analytics/types'
import { batchPatientNames, listAppointments } from '@/features/agenda/api'
import { listDoctors } from '@/features/doctors/api'

/**
 * Métricas executivas: tenta agregar `appointments` reais; se falhar, cai no mock.
 */
export async function fetchExecutiveMetrics(period: AnalyticsPeriod): Promise<ExecutiveMetrics> {
  try {
    const doctorsRes = await listDoctors({ active: true, pageSize: 500 })
    const doctorIds = doctorsRes.items.map((d) => d.id).filter(Boolean)
    if (!doctorIds.length) {
      return buildMockExecutiveMetrics(period)
    }
    const appointments = await listAppointments({
      doctorIds,
      scheduledFrom: period.from,
      scheduledTo: period.to,
    })
    const patientIds = [...new Set(appointments.map((a) => a.patient_id))]
    const patientNames = await batchPatientNames(patientIds)
    const dmap = doctorNameMap(doctorsRes.items)
    return buildExecutiveMetricsFromAppointments(period, appointments, patientNames, dmap)
  } catch {
    return buildMockExecutiveMetrics(period)
  }
}

export type { AnalyticsPeriod, ExecutiveMetrics }
