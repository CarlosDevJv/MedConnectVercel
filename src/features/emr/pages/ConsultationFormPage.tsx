import { ArrowLeft, Loader2 } from 'lucide-react'
import * as React from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { consultationToInput } from '@/features/emr/api'
import {
  useClinicalConsultation,
  useCreateClinicalConsultationMutation,
  useUpdateClinicalConsultationMutation,
} from '@/features/emr/hooks'
import type { ClinicalConsultationInput } from '@/features/emr/types'
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

export function ConsultationFormPage() {
  const { patientId, consultationId } = useParams<{ patientId: string; consultationId: string }>()
  const navigate = useNavigate()
  const isNew = consultationId === undefined

  const patientQuery = usePatient(patientId)
  const consultationQuery = useClinicalConsultation(isNew ? undefined : consultationId)

  const createMut = useCreateClinicalConsultationMutation()
  const updateMut = useUpdateClinicalConsultationMutation(consultationId ?? '__none__')

  const [consultationAt, setConsultationAt] = React.useState(() =>
    isoToDatetimeLocal(new Date().toISOString())
  )
  const [anamnesis, setAnamnesis] = React.useState('')
  const [physicalExam, setPhysicalExam] = React.useState('')
  const [hypotheses, setHypotheses] = React.useState('')
  const [conduct, setConduct] = React.useState('')
  const [prescriptions, setPrescriptions] = React.useState('')
  const [requestedExams, setRequestedExams] = React.useState('')
  const [followUpAt, setFollowUpAt] = React.useState('')
  const [cid10, setCid10] = React.useState('')
  const [diagnoses, setDiagnoses] = React.useState('')
  const [evolution, setEvolution] = React.useState('')
  const [attachmentsNote, setAttachmentsNote] = React.useState('')

  const initRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    initRef.current = null
  }, [consultationId])

  React.useEffect(() => {
    if (isNew || !consultationQuery.data) return
    const c = consultationQuery.data
    if (initRef.current === c.id) return
    initRef.current = c.id
    setConsultationAt(isoToDatetimeLocal(c.consultation_at))
    setAnamnesis(c.anamnesis ?? '')
    setPhysicalExam(c.physical_exam ?? '')
    setHypotheses(c.diagnostic_hypotheses ?? '')
    setConduct(c.medical_conduct ?? '')
    setPrescriptions(c.prescriptions ?? '')
    setRequestedExams(c.requested_exams ?? '')
    setFollowUpAt(c.follow_up_at ? isoToDatetimeLocal(c.follow_up_at) : '')
    setCid10(c.cid10 ?? '')
    setDiagnoses(c.diagnoses ?? '')
    setEvolution(c.evolution ?? '')
    setAttachmentsNote(c.attachments_note ?? '')
  }, [isNew, consultationQuery.data])

  if (!patientId) {
    return <Navigate to="/app/pacientes" replace />
  }

  const safePatientId: string = patientId

  function buildPayload(): ClinicalConsultationInput {
    const at = datetimeLocalToIso(consultationAt)
    if (!at) {
      toast.error('Informe data e hora da consulta.')
      throw new Error('validation')
    }
    return {
      patient_id: safePatientId,
      consultation_at: at,
      anamnesis: anamnesis.trim() || null,
      physical_exam: physicalExam.trim() || null,
      diagnostic_hypotheses: hypotheses.trim() || null,
      medical_conduct: conduct.trim() || null,
      prescriptions: prescriptions.trim() || null,
      requested_exams: requestedExams.trim() || null,
      follow_up_at: followUpAt.trim() ? datetimeLocalToIso(followUpAt) : null,
      cid10: cid10.trim() || null,
      diagnoses: diagnoses.trim() || null,
      evolution: evolution.trim() || null,
      attachments_note: attachmentsNote.trim() || null,
    }
  }

  function save() {
    try {
      const payload = buildPayload()
      if (isNew) {
        createMut.mutate(payload, {
          onSuccess: (row) => {
            toast.success('Consulta registrada.')
            navigate(`/app/pacientes/${safePatientId}/prontuario/consulta/${row.id}`, { replace: true })
          },
          onError: () => toast.error('Não foi possível salvar.'),
        })
      } else if (consultationQuery.data) {
        updateMut.mutate(
          { ...consultationToInput(consultationQuery.data), ...payload },
          {
            onSuccess: () => toast.success('Consulta atualizada.'),
            onError: () => toast.error('Não foi possível salvar.'),
          }
        )
      }
    } catch {
      /* validation toast */
    }
  }

  const saving = createMut.isPending || updateMut.isPending

  if (!isNew && consultationQuery.isError) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-[var(--color-destructive)]">Consulta não encontrada.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => navigate(`/app/pacientes/${safePatientId}/prontuario`)}
        >
          Voltar ao prontuário
        </Button>
      </div>
    )
  }

  if (!isNew && consultationQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[var(--color-muted-foreground)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando consulta…
      </div>
    )
  }

  const ta = cn(
    'w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm',
    'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
  )

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit gap-2 text-[var(--color-muted-foreground)]"
        onClick={() => navigate(`/app/pacientes/${safePatientId}/prontuario`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Prontuário
      </Button>

      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {isNew ? 'Nova consulta' : 'Editar consulta'}
        </p>
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">
          {patientQuery.data?.full_name ?? 'Paciente'}
        </h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="consultation_at">Data e hora da consulta</Label>
          <input
            id="consultation_at"
            type="datetime-local"
            value={consultationAt}
            onChange={(e) => setConsultationAt(e.target.value)}
            className={cn(ta, 'h-11')}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="anamnesis">Anamnese</Label>
          <textarea id="anamnesis" value={anamnesis} onChange={(e) => setAnamnesis(e.target.value)} rows={4} className={ta} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="physical_exam">Exame físico</Label>
          <textarea id="physical_exam" value={physicalExam} onChange={(e) => setPhysicalExam(e.target.value)} rows={4} className={ta} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="hypotheses">Hipóteses diagnósticas</Label>
          <textarea id="hypotheses" value={hypotheses} onChange={(e) => setHypotheses(e.target.value)} rows={3} className={ta} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="conduct">Conduta médica</Label>
          <textarea id="conduct" value={conduct} onChange={(e) => setConduct(e.target.value)} rows={3} className={ta} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="prescriptions">Prescrições</Label>
          <textarea id="prescriptions" value={prescriptions} onChange={(e) => setPrescriptions(e.target.value)} rows={4} className={ta} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="requested_exams">Exames solicitados</Label>
          <textarea id="requested_exams" value={requestedExams} onChange={(e) => setRequestedExams(e.target.value)} rows={3} className={ta} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="follow_up">Retorno agendado</Label>
          <input
            id="follow_up"
            type="datetime-local"
            value={followUpAt}
            onChange={(e) => setFollowUpAt(e.target.value)}
            className={cn(ta, 'h-11')}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cid10">CID-10</Label>
          <input id="cid10" value={cid10} onChange={(e) => setCid10(e.target.value)} className={cn(ta, 'h-11')} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="diagnoses">Diagnósticos</Label>
          <textarea id="diagnoses" value={diagnoses} onChange={(e) => setDiagnoses(e.target.value)} rows={3} className={ta} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="evolution">Evolução do quadro</Label>
          <textarea id="evolution" value={evolution} onChange={(e) => setEvolution(e.target.value)} rows={4} className={ta} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="attachments">Anexos (nota)</Label>
          <textarea
            id="attachments"
            value={attachmentsNote}
            onChange={(e) => setAttachmentsNote(e.target.value)}
            rows={2}
            className={ta}
            placeholder="Referência a exames/imagens até haver upload documentado na API."
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
        <Button type="button" variant="outline" onClick={() => navigate(`/app/pacientes/${safePatientId}/prontuario`)}>
          Cancelar
        </Button>
        <div className="flex-1" />
        <Button type="button" loading={saving} onClick={save}>
          Salvar
        </Button>
      </div>
    </div>
  )
}
