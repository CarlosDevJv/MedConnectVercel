import { useQuery } from '@tanstack/react-query'

import { fetchExecutiveMetrics, type AnalyticsPeriod } from '@/features/analytics/api'

export const analyticsKeys = {
  all: ['analytics'] as const,
  executive: (p: AnalyticsPeriod) => ['analytics', 'executive', p] as const,
}

export function useExecutiveMetrics(period: AnalyticsPeriod, enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.executive(period),
    queryFn: () => fetchExecutiveMetrics(period),
    enabled,
  })
}
