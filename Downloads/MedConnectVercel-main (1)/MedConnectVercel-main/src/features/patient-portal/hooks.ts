import { useQuery } from '@tanstack/react-query'

import { listAppointments } from '@/features/agenda/api'
import type { Appointment } from '@/features/agenda/types'
import { batchDoctorNames } from '@/features/doctors/api'
import { usePatientPortalPatientResolution } from '@/features/patient-portal/access'

export function useResolvedPatientId(): string | undefined {
  return usePatientPortalPatientResolution().resolvedId
}

export type PatientPortalAppointment = Appointment & { doctor_name: string }

export const patientPortalKeys = {
  appointments: (patientId: string | undefined) =>
    ['patient-portal', 'appointments', patientId] as const,
}

export function usePatientPortalAppointmentsQuery(patientId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: patientPortalKeys.appointments(patientId),
    queryFn: async (): Promise<PatientPortalAppointment[]> => {
      if (!patientId) throw new Error('patientId obrigatório')
      const items = await listAppointments({ patient_id: patientId })
      const doctorIds = [...new Set(items.map((a) => a.doctor_id))]
      const names = await batchDoctorNames(doctorIds)
      return items.map((a) => ({
        ...a,
        doctor_name: names[a.doctor_id] ?? 'Profissional',
      }))
    },
    enabled: Boolean(enabled && patientId),
  })
}
