import { ArrowLeft } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { friendlyPortalLoadError } from '@/features/patient-portal/friendlyPortalLoadError'
import { useResolvedPatientId } from '@/features/patient-portal/hooks'

import { buildReportFallbackHtml } from '@/features/reports/utils/reportPreviewFallbackHtml'
import { sanitizeReportHtml } from '@/features/reports/utils/sanitizeHtml'
import { formatDate } from '@/features/patients/utils/format'
import { useReport } from '@/features/reports/hooks'
import { printHtmlInNewWindow } from '@/lib/printHtmlInNewWindow'
import { triggerBrowserPrint } from '@/lib/triggerBrowserPrint'

export function MyReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const patientId = useResolvedPatientId()
  const query = useReport(id)
  const printRootRef = useRef<HTMLDivElement>(null)

  if (!id) {
    return <Navigate to="/app/meus-laudos" replace />
  }

  if (!patientId) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-sm text-rose-600">
          Cadastro de paciente não encontrado para esta conta de acesso.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/app/meus-laudos')}>
          Voltar
        </Button>
      </div>
    )
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-3xl py-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-96 w-full rounded-[var(--radius-card)]" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-sm text-rose-600">
          {query.isError ? friendlyPortalLoadError(query.error) : 'Laudo não encontrado.'}
        </p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/app/meus-laudos">Voltar à lista</Link>
        </Button>
      </div>
    )
  }

  const report = query.data
  const isSigned = Boolean(report.content_html && report.content_html.includes('Assinado Digitalmente'))
  const isDraftUnsigned = report.status === 'draft' && !isSigned

  if (report.patient_id !== patientId || isDraftUnsigned) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-sm text-rose-600">Este laudo não está disponível para o seu cadastro.</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/app/meus-laudos">Voltar à lista</Link>
        </Button>
      </div>
    )
  }

  const rawHtml = report.content_html?.trim() ? report.content_html : buildReportFallbackHtml({ ...report })
  const safe = sanitizeReportHtml(rawHtml)

  function handlePrint() {
    const el = printRootRef.current
    if (!el) return
    const title = report.order_number ?? report.exam ?? 'Laudo médico'
    if (printHtmlInNewWindow({ title, bodyInnerHtml: el.innerHTML })) {
      return
    }
    toast.warning('A impressão em janela separada falhou.', {
      description:
        'Abrimos o diálogo desta aba como alternativa. Se nada aparecer, use Ctrl+P (Cmd+P no Mac).',
    })
    triggerBrowserPrint()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => navigate('/app/meus-laudos')}
        className="inline-flex w-fit items-center gap-1.5 print:hidden text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos laudos
      </button>

      {/* id exigido pelo @media print em globals.css (só esse bloco aparece na impressão) */}
      <div ref={printRootRef} id="report-print-root" className="space-y-6">
        <header className="space-y-1 border-b border-[var(--color-border)] pb-6 print:border-gray-300">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Laudo · {report.status === 'completed' || isSigned ? 'Finalizado' : 'Rascunho'}
          </p>
          <h1 className="font-display text-2xl text-[var(--color-foreground)]">
            {report.exam ?? 'Relatório médico'}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-muted-foreground)]">
            {report.order_number ? <span>Protocolo {report.order_number}</span> : null}
            {report.updated_at ? <span>Atualizado em {formatDate(report.updated_at)}</span> : null}
          </div>
        </header>



        <div
          className="report-preview-body min-h-[200px] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6 text-sm text-[var(--color-foreground)] [&_a]:text-[var(--color-accent)] print:border-gray-300"
          dangerouslySetInnerHTML={{ __html: safe }}
        />
      </div>

      <div className="flex print:hidden">
        <Button type="button" variant="outline" onClick={handlePrint}>
          Imprimir
        </Button>
      </div>
    </div>
  )
}
