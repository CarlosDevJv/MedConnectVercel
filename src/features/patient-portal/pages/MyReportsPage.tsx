import { FileText } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { friendlyPortalLoadError } from '@/features/patient-portal/friendlyPortalLoadError'
import { useResolvedPatientId } from '@/features/patient-portal/hooks'
import { REPORT_STATUS_LABELS, type ReportStatus } from '@/features/reports/types'
import { formatDate } from '@/features/patients/utils/format'
import { useReportsList } from '@/features/reports/hooks'

type StatusFilter = 'all' | ReportStatus

export function MyReportsPage() {
  const patientId = useResolvedPatientId()
  const [page, setPage] = React.useState(1)
  const [pageSize] = React.useState(20)
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')

  React.useEffect(() => {
    setPage(1)
  }, [statusFilter, patientId])

  const listParams = React.useMemo(
    () => ({
      page,
      pageSize,
      order: 'created_at.desc' as const,
      ...(patientId ? { patient_id: patientId } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    }),
    [page, pageSize, patientId, statusFilter]
  )

  const query = useReportsList(listParams, Boolean(patientId))

  if (!patientId) {
    return (
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="font-display text-2xl text-[var(--color-foreground)]">Meus laudos</h1>
          <p className="mt-3 text-sm text-rose-600">
            Cadastro de paciente não encontrado para esta conta de acesso.
          </p>
        </header>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <header className="flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <FileText className="h-5 w-5" />
        </span>
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">Meus laudos</h1>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--color-muted-foreground)]">Filtrar:</span>
        {(
          [
            ['all', 'Todos'],
            ['completed', 'Finalizados'],
            ['draft', 'Em elaboração'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={statusFilter === value ? 'primary' : 'outline'}
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {query.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[var(--radius-card)]" />
      ) : query.isError ? (
        <p className="text-sm text-rose-600">{friendlyPortalLoadError(query.error)}</p>
      ) : query.data ? (
        <>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Exame / título</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-[var(--color-muted-foreground)]">
                      Nenhum laudo neste filtro.
                    </TableCell>
                  </TableRow>
                )}
                {query.data.items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.order_number ?? '—'}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{r.exam ?? '—'}</TableCell>
                    <TableCell>{REPORT_STATUS_LABELS[r.status]}</TableCell>
                    <TableCell className="whitespace-nowrap text-[var(--color-muted-foreground)]">
                      {r.updated_at ? formatDate(r.updated_at) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/app/meus-laudos/${r.id}`}>Abrir</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={query.data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </div>
  )
}
