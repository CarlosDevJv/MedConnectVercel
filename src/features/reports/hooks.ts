import { keepPreviousData, useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'

import {
  createReport,
  deleteReport,
  getReport,
  listReportsEnriched,
  updateReport,
} from '@/features/reports/api'
import type { EnrichedReport, ListReportsParams, Report, ReportInput } from '@/features/reports/types'
import { useAuth } from '@/features/auth/useAuth'

export const reportKeys = {
  all: ['reports'] as const,
  list: (p: ListReportsParams) => ['reports', 'list', p] as const,
  detail: (id: string | undefined) => ['reports', 'detail', id] as const,
}

export function useReportsList(
  params: ListReportsParams,
  enabled = true
): UseQueryResult<{ items: EnrichedReport[]; total: number }, Error> {
  const { userInfo } = useAuth()
  const roles = userInfo?.roles ?? []
  const isMedicoOnly = roles.includes('medico') && !roles.some((r) => r === 'admin' || r === 'gestor')

  const query = useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => listReportsEnriched(params),
    enabled,
    placeholderData: keepPreviousData,
  })

  // Se o usuário logado for apenas médico, aplica o filtro de soft delete local
  if (query.data?.items && isMedicoOnly) {
    try {
      const stored = localStorage.getItem('mediconnect.soft_deleted_reports')
      const softDeletedIds = stored ? JSON.parse(stored) : []
      if (Array.isArray(softDeletedIds) && softDeletedIds.length > 0) {
        const filteredItems = query.data.items.filter((r) => !softDeletedIds.includes(r.id))
        return {
          ...query,
          data: {
            ...query.data,
            items: filteredItems,
            total: Math.max(0, query.data.total - (query.data.items.length - filteredItems.length)),
          },
        } as UseQueryResult<{ items: EnrichedReport[]; total: number }, Error>
      }
    } catch (e) {
      console.error('[useReportsList] Erro no soft delete local:', e)
    }
  }

  return query
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

export function useDeleteReportMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteReport(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: reportKeys.all })
      qc.removeQueries({ queryKey: reportKeys.detail(id) })
    },
  })
}

export type { EnrichedReport, Report }
