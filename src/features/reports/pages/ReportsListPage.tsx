import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  AlertCircle,
  Download,
  MoreVertical,
  Plus,
  Printer,
  RefreshCcw,
  Search,
} from 'lucide-react'
import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ReportDeliverySmsDialog } from '@/features/reports/components/ReportDeliverySmsDialog'
import { ReportPreviewDialog } from '@/features/reports/components/ReportPreviewDialog'
import { useReportsList } from '@/features/reports/hooks'
import type { EnrichedReport, ReportStatus } from '@/features/reports/types'
import { downloadReportsCsv } from '@/features/reports/utils/exportReportsCsv'
import { buildReportFallbackHtml } from '@/features/reports/utils/reportPreviewFallbackHtml'
import { formatDate, formatDateTime } from '@/features/patients/utils/format'
import { useAuth } from '@/features/auth/useAuth'
import { usePatient } from '@/features/patients/hooks'
import { ApiError } from '@/lib/apiClient'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

function describeReportsListLoadError(err: unknown): string | null {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error && err.message.trim()) return err.message.trim()
  return null
}

function isDueOverdue(dueAt: string | null, status: ReportStatus): boolean {
  if (status !== 'draft' || !dueAt) return false
  const t = new Date(dueAt).getTime()
  if (Number.isNaN(t)) return false
  return t < Date.now()
}

function uuidFromQuery(raw: string | null): string | undefined {
  const s = raw?.trim() ?? ''
  if (!s) return undefined
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return re.test(s) ? s : undefined
}

function filterReportsClient(items: EnrichedReport[], q: string): EnrichedReport[] {
  const n = q.trim().toLowerCase()
  if (!n) return items
  return items.filter((r) => {
    const hay = [r.order_number, r.exam, r.requested_by, r.patient_name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(n)
  })
}

export function ReportsListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { userInfo } = useAuth()
  const userId = userInfo?.user.id ?? ''
  const roles = userInfo?.roles ?? []
  const scopeReportsToCreator =
    Boolean(userId) &&
    roles.includes('medico') &&
    !roles.some((r) => r === 'admin' || r === 'gestor')

  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)

  const [search, setSearch] = React.useState('')
  const debouncedSearch = useDebouncedValue(search, 320)

  const [preview, setPreview] = React.useState<EnrichedReport | null>(null)
  const [deliveryReport, setDeliveryReport] = React.useState<EnrichedReport | null>(null)

  const filteredPatientId = React.useMemo(
    () =>
      uuidFromQuery(searchParams.get('patient_id')) ??
      uuidFromQuery(searchParams.get('paciente')),
    [searchParams]
  )

  React.useEffect(() => {
    setPage(1)
  }, [filteredPatientId])

  const [prevReset, setPrevReset] = React.useState({ pageSize })
  if (prevReset.pageSize !== pageSize) {
    setPrevReset({ pageSize })
    setPage(1)
  }

  const listParams = React.useMemo(
    () => ({
      page,
      pageSize,
      order: 'created_at.desc',
      ...(scopeReportsToCreator ? { created_by: userId } : {}),
      ...(filteredPatientId ? { patient_id: filteredPatientId } : {}),
    }),
    [page, pageSize, scopeReportsToCreator, userId, filteredPatientId]
  )

  const query = useReportsList(listParams)
  const patientBannerQuery = usePatient(filteredPatientId)

  const items = query.data?.items
  const total = query.data?.total ?? 0
  const filteredItems = React.useMemo(() => {
    const list = items ?? []
    return filterReportsClient(list, debouncedSearch)
  }, [items, debouncedSearch])

  function exportCsv() {
    if (!filteredItems.length) {
      toast.message('Nada para exportar nesta página.')
      return
    }
    downloadReportsCsv(filteredItems)
    toast.success('CSV baixado.')
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Clínica
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-2xl text-[var(--color-foreground)]">
            Relatórios médicos
          </h1>
          <Button type="button" onClick={() => navigate('/app/relatorios/novo')}>
            <Plus className="h-4 w-4" />
            Novo relatório
          </Button>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Listagem conforme filtros da API RiseUP (<code className="text-xs">patient_id</code>,{' '}
          <code className="text-xs">created_by</code>). A busca só refina os registros já carregados nesta
          página.
        </p>
      </header>

      {filteredPatientId ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]/35 px-4 py-3 text-sm"
        >
          <span className="text-[var(--color-foreground)]">
            Filtrando laudos do paciente:{' '}
            <strong>{patientBannerQuery.data?.full_name ?? 'Carregando…'}</strong>
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/pacientes/${filteredPatientId}`)}
            >
              Ver cadastro
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev)
                    next.delete('patient_id')
                    next.delete('paciente')
                    return next
                  },
                  { replace: true }
                )
              }}
            >
              Limpar filtro
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="min-w-[200px] flex-1">
            <span className="mb-1.5 block text-xs font-medium text-[var(--color-muted-foreground)]">
              Busca nesta página
            </span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Protocolo, paciente, exame…"
              leftIcon={<Search className="h-4 w-4 shrink-0 opacity-70" />}
            />
          </div>
          <div className="flex flex-wrap gap-2 lg:ml-auto">
            <span className="sr-only" id="report-page-size-lbl">
              Por página
            </span>
            <select
              id="report-page-size"
              aria-labelledby="report-page-size-lbl"
              className="h-11 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / página
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      {query.isError ? (
        <ErrorState
          detail={describeReportsListLoadError(query.error)}
          onRetry={() => query.refetch()}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead className="hidden md:table-cell">Criado</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden lg:table-cell">Solicitante</TableHead>
                  <TableHead className="hidden xl:table-cell">Exame</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading
                  ? Array.from({ length: Math.min(pageSize, 6) }).map((_, idx) => (
                      <TableRow key={`sk-${idx}`} className="hover:bg-transparent">
                        <TableCell>
                          <Skeleton className="h-3.5 w-24" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-3.5 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-3.5 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-3.5 w-36" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Skeleton className="h-3.5 w-28" />
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Skeleton className="h-3.5 w-32" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))
                  : filteredItems.length === 0
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-14 text-center text-sm text-[var(--color-muted-foreground)]"
                          >
                            Nenhum relatório nesta visão. Ajuste filtros ou crie um novo laudo.
                          </TableCell>
                        </TableRow>
                      )
                    : (
                        filteredItems.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">
                              {r.order_number ?? '—'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-[var(--color-muted-foreground)]">
                              {formatDateTime(r.created_at)}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1.5">
                                {isDueOverdue(r.due_at, r.status) ? (
                                  <span
                                    className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-destructive)]"
                                    title="Prazo vencido"
                                  />
                                ) : null}
                                <span className="text-sm">{formatDate(r.due_at)}</span>
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-[var(--color-foreground)]">
                              {r.patient_name}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-[var(--color-muted-foreground)]">
                              {r.requested_by ?? '—'}
                            </TableCell>
                            <TableCell className="hidden max-w-[200px] truncate xl:table-cell text-[var(--color-muted-foreground)]">
                              {r.exam ?? '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Ações do laudo"
                                    className="h-8 w-8"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content
                                    align="end"
                                    sideOffset={6}
                                    className="z-50 min-w-[200px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl"
                                  >
                                    <DropdownMenu.Item
                                      className="cursor-pointer rounded-[6px] px-3 py-2 text-sm outline-none hover:bg-[var(--color-accent-soft)] focus:bg-[var(--color-accent-soft)]"
                                      onSelect={() => navigate(`/app/relatorios/${r.id}/editar`)}
                                    >
                                      Editar
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                      className="cursor-pointer rounded-[6px] px-3 py-2 text-sm outline-none hover:bg-[var(--color-accent-soft)] focus:bg-[var(--color-accent-soft)]"
                                      onSelect={() => setPreview(r)}
                                    >
                                      <span className="flex items-center gap-2">
                                        <Printer className="h-3.5 w-3.5" />
                                        Imprimir / visualizar
                                      </span>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                      className="cursor-pointer rounded-[6px] px-3 py-2 text-sm outline-none hover:bg-[var(--color-accent-soft)] focus:bg-[var(--color-accent-soft)]"
                                      onSelect={() => setDeliveryReport(r)}
                                    >
                                      Protocolo de entrega (SMS)
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                      className="pointer-events-none rounded-[6px] px-3 py-2 text-sm text-[var(--color-muted-foreground)] opacity-50 outline-none"
                                      disabled
                                    >
                                      Excluir (indisponível)
                                    </DropdownMenu.Item>
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
              </TableBody>
            </Table>
          </div>

          {!query.isError && total > 0 && !debouncedSearch.trim() && (
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          )}
          {debouncedSearch.trim() ? (
            <p className="text-center text-xs text-[var(--color-muted-foreground)]">
              Busca ativa: exibindo {filteredItems.length} de {(items ?? []).length} registros nesta página.
            </p>
          ) : null}
        </>
      )}

      <ReportPreviewDialog
        open={!!preview}
        onOpenChange={(o) => {
          if (!o) setPreview(null)
        }}
        title={preview ? `Laudo ${preview.order_number ?? preview.id.slice(0, 8)}` : 'Pré-visualização'}
        subtitle={preview?.patient_name}
        html={
          preview
            ? preview.content_html?.trim()
              ? preview.content_html
              : buildReportFallbackHtml(preview)
            : null
        }
      />
      <ReportDeliverySmsDialog
        report={deliveryReport}
        open={!!deliveryReport}
        onOpenChange={(open) => {
          if (!open) setDeliveryReport(null)
        }}
      />
    </div>
  )
}

function ErrorState({ detail, onRetry }: { detail?: string | null; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-destructive)]/40 bg-red-50/40 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-[var(--color-destructive)]">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg text-[var(--color-foreground)]">
        Não conseguimos carregar os relatórios
      </h3>
      <div className="max-w-[520px] space-y-2 text-sm text-[var(--color-muted-foreground)]">
        <p>Confira sessão e rede; se persistir, o detalhe abaixo costuma indicar a causa no Supabase/postgREST.</p>
        {detail ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-left font-mono text-xs text-red-950 break-words">
            {detail}
          </p>
        ) : null}
      </div>
      <Button type="button" variant="outline" onClick={onRetry}>
        <RefreshCcw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  )
}
