/** Tipos do dashboard executivo; troque a fonte em `fetchExecutiveMetrics` quando houver API. */

export interface AnalyticsPeriod {
  /** ISO 8601 */
  from: string
  /** ISO 8601 */
  to: string
}

export interface ExecutiveMetrics {
  period: AnalyticsPeriod
  /** Consultas concluídas no período */
  appointmentsCompleted: number
  /** Total agendado no período */
  appointmentsScheduled: number
  /** Taxa de no-show / absenteísmo 0–100 */
  noShowRatePercent: number
  /** Faturamento estimado (modelo simplificado) ou mock */
  revenueBrl: number
  /** Nota média (mock pode preencher; dados reais opcionais) */
  satisfactionAvg: number | null
  /** Série consultas por dia (rótulo + valor) */
  consultationsByDay: { label: string; value: number }[]
  /** Faturamento por mês no intervalo */
  revenueByMonth: { month: string; value: number }[]
  /** Top pacientes por volume */
  topPatients: { name: string; count: number }[]
  /** Top médicos por atendimentos */
  topDoctors: { name: string; count: number }[]
  /** Convênios: repartição % */
  insuranceShare: { name: string; percent: number }[]
  /** `appointments` = agregado real; `mock` = simulação */
  derivation?: 'appointments' | 'mock' | 'hybrid'
}
