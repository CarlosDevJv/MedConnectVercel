/** Tipos do dashboard executivo; troque a fonte em `fetchExecutiveMetrics` quando houver API. */

export interface AnalyticsPeriod {
  /** ISO 8601 */
  from: string
  /** ISO 8601 */
  to: string
}

export interface ExecutiveMetrics {
  period: AnalyticsPeriod
  /** Consultas concluídas no período (simulado) */
  appointmentsCompleted: number
  /** Total agendado no período (simulado) */
  appointmentsScheduled: number
  /** Taxa de no-show / absenteísmo 0–100 (simulado) */
  noShowRatePercent: number
  /** Faturamento no período BRL (simulado) */
  revenueBrl: number
  /** Nota média satisfação 0–10 (simulado) */
  satisfactionAvg: number
  /** Série consultas por dia (rótulo + valor) */
  consultationsByDay: { label: string; value: number }[]
  /** Faturamento por mês no intervalo (simulado) */
  revenueByMonth: { month: string; value: number }[]
  /** Top pacientes por volume (simulado) */
  topPatients: { name: string; count: number }[]
  /** Top médicos por atendimentos (simulado) */
  topDoctors: { name: string; count: number }[]
  /** Convênios: repartição % (simulado) */
  insuranceShare: { name: string; percent: number }[]
}
