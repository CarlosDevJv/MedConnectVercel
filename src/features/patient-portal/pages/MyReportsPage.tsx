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

import { formatDate } from '@/features/patients/utils/format'
import { useReportsList } from '@/features/reports/hooks'

export function MyReportsPage() {
  const patientId = useResolvedPatientId()
  const [page, setPage] = React.useState(1)
  const [pageSize] = React.useState(20)
  React.useEffect(() => {
    setPage(1)
  }, [patientId])

  const listParams = React.useMemo(
    () => ({
      page,
      pageSize,
      order: 'created_at.desc' as const,
      ...(patientId ? { patient_id: patientId } : {}),
      // status omitido na query da API para evitar erro de enum Postgres em bases desatualizadas
    }),
    [page, pageSize, patientId]
  )

  const query = useReportsList(listParams, Boolean(patientId))

  const filteredItems = React.useMemo(() => {
    if (!query.data?.items) return []
    return query.data.items.filter((r) => {
      const isSigned = Boolean(r.content_html && r.content_html.includes('Assinado Digitalmente'))
      return r.status === 'completed' || isSigned
    })
  }, [query.data?.items])

  if (!patientId) {
    return (
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="font-display text-2xl text-[var(--color-foreground)]">Laudos</h1>
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
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">Laudos</h1>
      </header>

      {/* Filtros de status omitidos para o portal do paciente */}

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
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-[var(--color-muted-foreground)]">
                      Nenhum laudo neste filtro.
                    </TableCell>
                  </TableRow>
                )}
                {filteredItems.map((r) => {
                  const displayStatus = r.status === 'completed' || (r.content_html && r.content_html.includes('Assinado Digitalmente'))
                    ? 'Finalizado'
                    : 'Rascunho'
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.order_number ?? '—'}</TableCell>
                      <TableCell className="max-w-[280px] truncate">{r.exam ?? '—'}</TableCell>
                      <TableCell>{displayStatus}</TableCell>
                      <TableCell className="whitespace-nowrap text-[var(--color-muted-foreground)]">
                        {r.updated_at ? formatDate(r.updated_at) : '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/meus-laudos/${r.id}`}>Abrir</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
