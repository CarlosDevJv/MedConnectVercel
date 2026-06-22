import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createPatient,
  deletePatient,
  getPatient,
  listPatients,
  updatePatient,
  type CreatePatientPayload,
  type UpdatePatientPayload,
} from '@/features/patients/api'
import type { ListPatientsParams } from '@/features/patients/types'

export const patientKeys = {
  all: ['patients'] as const,
  list: (params: ListPatientsParams) => ['patients', 'list', params] as const,
  detail: (id: string | undefined) => ['patients', 'detail', id] as const,
}

export function useListPatients(params: ListPatientsParams) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => listPatients(params),
    placeholderData: keepPreviousData,
  })
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => {
      if (!id) throw new Error('id é obrigatório')
      return getPatient(id)
    },
    enabled: !!id,
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePatientPayload) => createPatient(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all })
    },
  })
}

export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePatientPayload) => updatePatient(id, payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all })
      queryClient.setQueryData(patientKeys.detail(id), data)
    },
  })
}

export function useDeletePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all })
      queryClient.removeQueries({ queryKey: patientKeys.detail(id) })
    },
  })
}
