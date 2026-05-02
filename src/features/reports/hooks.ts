import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createReport,
  getReport,
  listReportsEnriched,
  updateReport,
} from '@/features/reports/api'
import type { EnrichedReport, ListReportsParams, Report, ReportInput } from '@/features/reports/types'

export const reportKeys = {
  all: ['reports'] as const,
  list: (p: ListReportsParams) => ['reports', 'list', p] as const,
  detail: (id: string | undefined) => ['reports', 'detail', id] as const,
}

export function useReportsList(params: ListReportsParams, enabled = true) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => listReportsEnriched(params),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => {
      if (!id) throw new Error('id obrigatório')
      return getReport(id)
    },
    enabled: !!id,
  })
}

export function useCreateReportMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReportInput) => createReport(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useUpdateReportMutation(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReportInput) => updateReport(id, payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: reportKeys.all })
      qc.setQueryData(reportKeys.detail(id), data)
    },
  })
}

export type { EnrichedReport, Report }
