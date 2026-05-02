import { ArrowLeft, Eye, Loader2 } from 'lucide-react'
import * as React from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ReportPreviewDialog } from '@/features/reports/components/ReportPreviewDialog'
import { ReportRichText } from '@/features/reports/components/ReportRichText'
import { reportToReportInput } from '@/features/reports/api'
import { useReport, useUpdateReportMutation } from '@/features/reports/hooks'
import type { ReportInput, ReportStatus } from '@/features/reports/types'
import { useCanManagePatients } from '@/features/auth/useAuth'
import { usePatient } from '@/features/patients/hooks'
import { cn } from '@/lib/cn'

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalToIso(local: string): string | null {
  if (!local.trim()) return null
  const t = new Date(local).getTime()
  if (Number.isNaN(t)) return null
  return new Date(t).toISOString()
}

export function ReportEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canSeePatientProfile = useCanManagePatients()

  const reportQuery = useReport(id)
  const report = reportQuery.data
  const patientQuery = usePatient(report?.patient_id)

  const updateMutation = useUpdateReportMutation(id ?? '')

  const bodyRef = React.useRef({ html: '', json: {} as Record<string, unknown> })

  const [exam, setExam] = React.useState('')
  const [requestedBy, setRequestedBy] = React.useState('')
  const [cidCode, setCidCode] = React.useState('')
  const [diagnosis, setDiagnosis] = React.useState('')
  const [conclusion, setConclusion] = React.useState('')
  const [dueLocal, setDueLocal] = React.useState('')
  const [hideDate, setHideDate] = React.useState(false)
  const [hideSignature, setHideSignature] = React.useState(false)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewHtml, setPreviewHtml] = React.useState<string | null>(null)

  const initRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!report) return
    if (initRef.current === report.id) return
    initRef.current = report.id
    setExam(report.exam ?? '')
    setRequestedBy(report.requested_by ?? '')
    setCidCode(report.cid_code ?? '')
    setDiagnosis(report.diagnosis ?? '')
    setConclusion(report.conclusion ?? '')
    setDueLocal(isoToDatetimeLocal(report.due_at))
    setHideDate(!!report.hide_date)
    setHideSignature(!!report.hide_signature)
    bodyRef.current = {
      html: report.content_html ?? '',
      json: (report.content_json as Record<string, unknown>) ?? {},
    }
  }, [report])

  if (!id) {
    return <Navigate to="/app/relatorios" replace />
  }

  function buildPayload(status: ReportStatus): ReportInput {
    if (!report) throw new Error('Relatório não carregado')
    const due = datetimeLocalToIso(dueLocal)
    return {
      ...reportToReportInput(report, {
        status,
        exam: exam.trim() || null,
        requested_by: requestedBy.trim() || null,
        cid_code: cidCode.trim() || null,
        diagnosis: diagnosis.trim() || null,
        conclusion: conclusion.trim() || null,
        due_at: due,
        hide_date: hideDate,
        hide_signature: hideSignature,
        content_html: bodyRef.current.html || null,
        content_json: bodyRef.current.json,
      }),
    }
  }

  function save(status: ReportStatus) {
    if (!report) return
    updateMutation.mutate(buildPayload(status), {
      onSuccess: () => {
        toast.success(status === 'completed' ? 'Laudo finalizado.' : 'Rascunho salvo.')
      },
      onError: () => {
        toast.error('Não foi possível salvar o laudo.')
      },
    })
  }

  if (reportQuery.isError) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-[var(--color-destructive)]">Relatório não encontrado.</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => navigate('/app/relatorios')}>
          Voltar
        </Button>
      </div>
    )
  }

  if (reportQuery.isLoading || !report) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[var(--color-muted-foreground)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando laudo…
      </div>
    )
  }

  const patientName = patientQuery.data?.full_name ?? 'Paciente'
  const syncToken = `${report.id}:${report.updated_at ?? ''}`

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-[var(--color-muted-foreground)]"
          onClick={() => navigate('/app/relatorios')}
        >
          <ArrowLeft className="h-4 w-4" />
          Lista
        </Button>
      </div>

      <header className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Laudo médico
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <h1 className="font-display text-xl text-[var(--color-foreground)] sm:text-2xl">{patientName}</h1>
          {patientQuery.data?.id && canSeePatientProfile ? (
            <Link
              to={`/app/pacientes/${patientQuery.data.id}`}
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              Ver cadastro
            </Link>
          ) : null}
        </div>
        <p className="mt-1 font-mono text-xs text-[var(--color-muted-foreground)]">
          Protocolo {report.order_number ?? report.id.slice(0, 8)} ·{' '}
          {report.status === 'completed' ? 'Concluído' : 'Rascunho'}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exam">Exame</Label>
          <textarea
            id="exam"
            value={exam}
            onChange={(e) => setExam(e.target.value)}
            rows={2}
            className={cn(
              'rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="requested_by">Solicitante</Label>
          <textarea
            id="requested_by"
            value={requestedBy}
            onChange={(e) => setRequestedBy(e.target.value)}
            rows={2}
            className={cn(
              'rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cid">CID</Label>
          <input
            id="cid"
            value={cidCode}
            onChange={(e) => setCidCode(e.target.value)}
            className={cn(
              'h-11 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="due">Prazo</Label>
          <input
            id="due"
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            className={cn(
              'h-11 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="diagnosis">Diagnóstico</Label>
          <textarea
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={3}
            className={cn(
              'rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="conclusion">Conclusão</Label>
          <textarea
            id="conclusion"
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            rows={3}
            className={cn(
              'rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>
        <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
          <div className="flex items-center gap-2">
            <Checkbox id="hide_date" checked={hideDate} onCheckedChange={(v) => setHideDate(v === true)} />
            <Label htmlFor="hide_date" className="cursor-pointer font-normal">
              Ocultar data
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="hide_sig" checked={hideSignature} onCheckedChange={(v) => setHideSignature(v === true)} />
            <Label htmlFor="hide_sig" className="cursor-pointer font-normal">
              Ocultar assinatura
            </Label>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Label>Corpo do laudo</Label>
        <ReportRichText
          syncToken={syncToken}
          initialJson={report.content_json}
          initialHtml={report.content_html}
          onBodyChange={(html, json) => {
            bodyRef.current = { html, json }
          }}
        />
      </section>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPreviewHtml(bodyRef.current.html || report.content_html || '')
            setPreviewOpen(true)
          }}
        >
          <Eye className="h-4 w-4" />
          Pré-visualizar
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/app/relatorios')}>
          Cancelar
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          loading={updateMutation.isPending}
          onClick={() => save('draft')}
        >
          Salvar rascunho
        </Button>
        <Button type="button" loading={updateMutation.isPending} onClick={() => save('completed')}>
          Finalizar laudo
        </Button>
      </div>

      <ReportPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={`Laudo ${report.order_number ?? report.id.slice(0, 8)}`}
        subtitle={patientName}
        html={previewHtml ?? report.content_html}
      />
    </div>
  )
}
