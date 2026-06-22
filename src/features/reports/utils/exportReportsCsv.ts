import type { EnrichedReport } from '@/features/reports/types'
import { REPORT_STATUS_LABELS } from '@/features/reports/types'

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadReportsCsv(items: EnrichedReport[], filename = 'relatorios.csv'): void {
  const headers = [
    'Protocolo',
    'Paciente',
    'Status',
    'Exame',
    'Solicitante',
    'Criado em',
    'Prazo',
  ] as const
  const lines = [
    headers.join(','),
    ...items.map((r) =>
      [
        r.order_number ?? '',
        r.patient_name ?? '',
        REPORT_STATUS_LABELS[r.status],
        r.exam ?? '',
        r.requested_by ?? '',
        r.created_at ?? '',
        r.due_at ?? '',
      ]
        .map((v) => escapeCsvCell(String(v)))
        .join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
