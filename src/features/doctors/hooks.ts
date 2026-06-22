import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  listDoctors,
  updateDoctor,
  type CreateDoctorPayload,
  type UpdateDoctorPayload,
} from '@/features/doctors/api'
import type { ListDoctorsParams } from '@/features/doctors/types'

export const doctorKeys = {
  all: ['doctors'] as const,
  list: (params: ListDoctorsParams) => ['doctors', 'list', params] as const,
  detail: (id: string | undefined) => ['doctors', 'detail', id] as const,
}

export function useListDoctors(params: ListDoctorsParams) {
  return useQuery({
    queryKey: doctorKeys.list(params),
    queryFn: () => listDoctors(params),
    placeholderData: keepPreviousData,
  })
}

export function useDoctor(id: string | undefined) {
  return useQuery({
    queryKey: doctorKeys.detail(id),
    queryFn: () => {
      if (!id) throw new Error('id é obrigatório')
      return getDoctor(id)
    },
    enabled: !!id,
  })
}

export function useCreateDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDoctorPayload) => createDoctor(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: doctorKeys.all })
    },
  })
}

export function useUpdateDoctor(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateDoctorPayload) => updateDoctor(id, payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: doctorKeys.all })
      queryClient.setQueryData(doctorKeys.detail(id), data)
    },
  })
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDoctor(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: doctorKeys.all })
      queryClient.removeQueries({ queryKey: doctorKeys.detail(id) })
    },
  })
}
