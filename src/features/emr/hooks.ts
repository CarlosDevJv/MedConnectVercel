import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createClinicalConsultation,
  getClinicalConsultation,
  listClinicalConsultationsEnriched,
  updateClinicalConsultation,
} from '@/features/emr/api'
import type {
  ClinicalConsultation,
  ClinicalConsultationInput,
  ListClinicalConsultationsParams,
} from '@/features/emr/types'

export const emrKeys = {
  all: ['emr'] as const,
  listByPatient: (patientId: string, p: Omit<ListClinicalConsultationsParams, 'patient_id'>) =>
    ['emr', 'list', patientId, p] as const,
  detail: (id: string | undefined) => ['emr', 'detail', id] as const,
}

export function useClinicalConsultationsList(
  patientId: string | undefined,
  params: Omit<ListClinicalConsultationsParams, 'patient_id'> = {},
  enabled = true
) {
  return useQuery({
    queryKey: emrKeys.listByPatient(patientId ?? '', params),
    queryFn: () =>
      listClinicalConsultationsEnriched({
        patient_id: patientId!,
        ...params,
      }),
    enabled: enabled && !!patientId,
  })
}

export function useClinicalConsultation(id: string | undefined) {
  return useQuery({
    queryKey: emrKeys.detail(id),
    queryFn: () => {
      if (!id) throw new Error('id obrigatório')
      return getClinicalConsultation(id)
    },
    enabled: !!id,
  })
}

export function useCreateClinicalConsultationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClinicalConsultationInput) => createClinicalConsultation(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emrKeys.all })
    },
  })
}

export function useUpdateClinicalConsultationMutation(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClinicalConsultationInput) => updateClinicalConsultation(id, payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: emrKeys.all })
      qc.setQueryData(emrKeys.detail(id), data)
    },
  })
}

export type { ClinicalConsultation }
