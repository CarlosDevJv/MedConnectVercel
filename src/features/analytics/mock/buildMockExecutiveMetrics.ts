import type { AnalyticsPeriod, ExecutiveMetrics } from '@/features/analytics/types'

const DAY_MS = 86_400_000

/** Gera métricas determinísticas a partir do período (demo reproduzível). */
export function buildMockExecutiveMetrics(period: AnalyticsPeriod): ExecutiveMetrics {
  const start = new Date(period.from).getTime()
  const end = new Date(period.to).getTime()
  const days = Math.max(1, Math.ceil((end - start) / DAY_MS) + 1)

  const seed = (start % 10_000) / 1000
  const appointmentsScheduled = Math.round(180 + days * 4 + seed * 20)
  const noShowRatePercent = Math.min(28, Math.round(12 + (days % 7) + seed * 2))
  const appointmentsCompleted = Math.round(
    appointmentsScheduled * (1 - noShowRatePercent / 100)
  )
  const revenueBrl = Math.round(appointmentsCompleted * (280 + seed * 40))
  const satisfactionAvg = Number((8.2 + (seed % 1) * 0.8).toFixed(1))

  const consultationsByDay: ExecutiveMetrics['consultationsByDay'] = []
  for (let i = 0; i < Math.min(days, 14); i++) {
    const d = new Date(start + i * DAY_MS)
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    const value = Math.round(8 + (i + seed) % 9 + (i % 3))
    consultationsByDay.push({ label, value })
  }

  const revenueByMonth: ExecutiveMetrics['revenueByMonth'] = [
    { month: 'Jan', value: Math.round(revenueBrl * 0.22) },
    { month: 'Fev', value: Math.round(revenueBrl * 0.18) },
    { month: 'Mar', value: Math.round(revenueBrl * 0.2) },
    { month: 'Abr', value: Math.round(revenueBrl * 0.2) },
    { month: 'Mai', value: Math.round(revenueBrl * 0.2) },
  ]

  const topPatients: ExecutiveMetrics['topPatients'] = [
    { name: 'Maria S.', count: 12 + Math.round(seed) },
    { name: 'João P.', count: 9 },
    { name: 'Ana L.', count: 8 },
    { name: 'Carlos R.', count: 7 },
    { name: 'Fernanda T.', count: 6 },
  ]

  const topDoctors: ExecutiveMetrics['topDoctors'] = [
    { name: 'Dra. Helena Monteiro', count: 45 + Math.round(seed * 3) },
    { name: 'Dr. Ricardo Alves', count: 38 },
    { name: 'Dra. Paula Nunes', count: 33 },
  ]

  const insuranceShare: ExecutiveMetrics['insuranceShare'] = [
    { name: 'Unimed', percent: 34 },
    { name: 'Bradesco Saúde', percent: 22 },
    { name: 'Particular', percent: 18 },
    { name: 'Amil', percent: 15 },
    { name: 'Outros', percent: 11 },
  ]

  return {
    period,
    appointmentsCompleted,
    appointmentsScheduled,
    noShowRatePercent,
    revenueBrl,
    satisfactionAvg,
    consultationsByDay,
    revenueByMonth,
    topPatients,
    topDoctors,
    insuranceShare,
    derivation: 'mock',
  }
}
