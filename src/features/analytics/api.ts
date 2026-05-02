import type { AnalyticsPeriod, ExecutiveMetrics } from '@/features/analytics/types'
import { buildMockExecutiveMetrics } from '@/features/analytics/mock/buildMockExecutiveMetrics'

/**
 * Camada única de leitura de métricas executivas.
 * Hoje: dados simulados. Quando existir API, substituir o corpo por `apiClient.request`.
 */
export async function fetchExecutiveMetrics(period: AnalyticsPeriod): Promise<ExecutiveMetrics> {
  return buildMockExecutiveMetrics(period)
}

export type { AnalyticsPeriod, ExecutiveMetrics }
