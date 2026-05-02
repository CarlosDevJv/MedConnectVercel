import { AlertCircle, ArrowLeft, ClipboardList, Plus, RefreshCcw } from 'lucide-react'
import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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
import { useClinicalConsultationsList } from '@/features/emr/hooks'
import { usePatient } from '@/features/patients/hooks'
import { formatDateTime } from '@/features/patients/utils/format'

export function PatientChartPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  const [page, setPage] = React.useState(1)
  const pageSize = 15

  const patientQuery = usePatient(patientId)
  const listQuery = useClinicalConsultationsList(patientId, { page, pageSize })

  const patient = patientQuery.data
  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0

  if (!patientId) {
    navigate('/app/pacientes', { replace: true })
    return null
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate(`/app/pacientes/${patientId}`)}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao paciente
      </button>

      <header className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Prontuário médico
            </p>
            <h1 className="font-display text-xl text-[var(--color-foreground)] sm:text-2xl">
              {patientQuery.isLoading ? 'Carregando…' : (patient?.full_name ?? 'Paciente')}
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Histórico de consultas e evolução clínica.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => navigate(`/app/pacientes/${patientId}/prontuario/consulta/nova`)}
        >
          <Plus className="h-4 w-4" />
          Nova consulta
        </Button>
      </header>

      {listQuery.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-destructive)]/40 bg-red-50/40 px-6 py-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-[var(--color-destructive)]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg text-[var(--color-foreground)]">
            Não foi possível carregar o prontuário
          </h3>
          <p className="max-w-[480px] text-sm text-[var(--color-muted-foreground)]">
            Confirme no backend se existe a tabela <code className="rounded bg-[var(--color-muted)] px-1">clinical_consultations</code> com RLS, ou ajuste o resource em{' '}
            <code className="rounded bg-[var(--color-muted)] px-1">features/emr/api.ts</code>.
          </p>
          <Button type="button" variant="outline" onClick={() => listQuery.refetch()}>
            <RefreshCcw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>CID-10</TableHead>
                  <TableHead className="hidden md:table-cell">Diagnóstico</TableHead>
                  <TableHead className="hidden lg:table-cell">Profissional</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-8 w-20" />
                        </TableCell>
                      </TableRow>
                    ))
                  : items.length === 0
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-14 text-center text-sm text-[var(--color-muted-foreground)]"
                          >
                            Nenhum registro de consulta. Clique em &quot;Nova consulta&quot; para começar.
                          </TableCell>
                        </TableRow>
                      )
                    : (
                        items.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="text-[var(--color-foreground)]">
                              {formatDateTime(row.consultation_at)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{row.cid10 ?? '—'}</TableCell>
                            <TableCell className="hidden max-w-[280px] truncate md:table-cell text-[var(--color-muted-foreground)]">
                              {row.diagnoses ?? '—'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-[var(--color-muted-foreground)]">
                              {row.doctor_name ?? '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(
                                    `/app/pacientes/${patientId}/prontuario/consulta/${row.id}`
                                  )
                                }
                              >
                                Abrir
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
              </TableBody>
            </Table>
          </div>

          {total > 0 && (
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  )
}
