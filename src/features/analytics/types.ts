/** Indicadores agregados somente a partir de `appointments` (GET documentado na API RiseUP). */

export interface AnalyticsPeriod {
  /** ISO 8601 */
  from: string
  /** ISO 8601 */
  to: string
}

export interface ExecutiveMetrics {
  period: AnalyticsPeriod
  appointmentsCompleted: number
  appointmentsScheduled: number
  noShowRatePercent: number
  consultationsByDay: { label: string; value: number }[]
  topPatients: { name: string; count: number }[]
  topDoctors: { name: string; count: number }[]
}
