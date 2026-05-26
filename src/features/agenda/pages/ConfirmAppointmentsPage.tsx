import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Check,
  X,
  Smartphone,
  Info,
  CalendarDays,
  FileText,
  Search,
  Hash
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { listAppointments } from '@/features/agenda/api'
import { useUpdateAppointmentMutation } from '@/features/agenda/hooks'
import { useSendSmsMutation } from '@/features/communications/hooks'
import { apiClient } from '@/lib/apiClient'
import { cn } from '@/lib/cn'
import { formatDateTimePtBr } from '@/lib/formatTimePtBr'

interface EnrichedRequestAppointment {
  id: string
  doctor_id: string
  patient_id: string
  scheduled_at: string
  status: string
  duration_minutes?: number | null
  appointment_type?: string | null
  notes?: string | null
  patient_name: string
  patient_phone: string
  patient_email: string
  patient_cpf: string
  doctor_name: string
  doctor_specialty: string
}

export function ConfirmAppointmentsPage() {
  const updateMut = useUpdateAppointmentMutation()
  const sendSmsMut = useSendSmsMutation()

  // Estado para busca dinâmica
  const [searchQuery, setSearchQuery] = React.useState('')
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false)

  // Buscar agendamentos solicitados (status requested)
  const { data: appointments, isLoading, isError, refetch } = useQuery({
    queryKey: ['agenda', 'confirmations-list'],
    queryFn: () => listAppointments({ status: 'requested' }),
  })

  // Extrair IDs de pacientes e médicos para carregar detalhes em lote
  const patientIds = React.useMemo(() => appointments?.map((a) => a.patient_id) ?? [], [appointments])
  const doctorIds = React.useMemo(() => appointments?.map((a) => a.doctor_id) ?? [], [appointments])

  // Buscar detalhes dos pacientes (incluindo CPF)
  const patientsQuery = useQuery({
    queryKey: ['agenda', 'confirmations-patients', patientIds],
    queryFn: async () => {
      const unique = [...new Set(patientIds.filter(Boolean))]
      if (!unique.length) return {}
      const usp = new URLSearchParams()
      usp.set('select', 'id,full_name,phone_mobile,email,cpf')
      usp.set('id', `in.(${unique.join(',')})`)
      const rows = await apiClient.get<any[]>(`/rest/v1/patients?${usp.toString()}`)
      return Object.fromEntries(rows.map((r) => [r.id, r]))
    },
    enabled: patientIds.length > 0,
  })

  // Buscar detalhes dos médicos
  const doctorsQuery = useQuery({
    queryKey: ['agenda', 'confirmations-doctors', doctorIds],
    queryFn: async () => {
      const unique = [...new Set(doctorIds.filter(Boolean))]
      if (!unique.length) return {}
      const usp = new URLSearchParams()
      usp.set('select', 'id,full_name,specialty')
      usp.set('id', `in.(${unique.join(',')})`)
      const rows = await apiClient.get<any[]>(`/rest/v1/doctors?${usp.toString()}`)
      return Object.fromEntries(rows.map((r) => [r.id, r]))
    },
    enabled: doctorIds.length > 0,
  })

  // Combinar dados enriquecidos
  const requests = React.useMemo((): EnrichedRequestAppointment[] => {
    if (!appointments) return []
    const pats = patientsQuery.data ?? {}
    const docs = doctorsQuery.data ?? {}
    return appointments.map((appt) => {
      const patient = pats[appt.patient_id]
      const doctor = docs[appt.doctor_id]
      return {
        ...appt,
        patient_name: patient?.full_name ?? 'Carregando...',
        patient_phone: patient?.phone_mobile ?? '—',
        patient_email: patient?.email ?? '—',
        patient_cpf: patient?.cpf ?? '—',
        doctor_name: doctor?.full_name ?? 'Carregando...',
        doctor_specialty: doctor?.specialty ?? '—',
      }
    })
  }, [appointments, patientsQuery.data, doctorsQuery.data])

  // Lógica das sugestões autocompletar dinâmicas baseadas na digitação
  const suggestions = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return { patients: [], doctors: [], cpfs: [] }

    const patients = new Set<string>()
    const doctors = new Set<string>()
    const cpfs = new Set<string>()

    requests.forEach((r) => {
      if (r.patient_name.toLowerCase().includes(query)) {
        patients.add(r.patient_name)
      }
      if (r.doctor_name.toLowerCase().includes(query)) {
        doctors.add(r.doctor_name)
      }
      if (r.patient_cpf && r.patient_cpf.toLowerCase().includes(query)) {
        cpfs.add(r.patient_cpf)
      }
    })

    return {
      patients: Array.from(patients).slice(0, 5),
      doctors: Array.from(doctors).slice(0, 5),
      cpfs: Array.from(cpfs).slice(0, 5),
    }
  }, [searchQuery, requests])

  // Filtrar as solicitações exibidas de fato baseado no termo digitado
  const filteredRequests = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return requests

    return requests.filter((r) => {
      const matchPatient = r.patient_name.toLowerCase().includes(query)
      const matchDoctor = r.doctor_name.toLowerCase().includes(query)
      const matchCpf = r.patient_cpf && r.patient_cpf.toLowerCase().includes(query)
      return matchPatient || matchDoctor || matchCpf
    })
  }, [searchQuery, requests])

  const [processingId, setProcessingId] = React.useState<string | null>(null)

  const handleConfirm = async (appt: EnrichedRequestAppointment) => {
    setProcessingId(appt.id)
    try {
      // 1. Atualizar agendamento para confirmado
      await updateMut.mutateAsync({
        id: appt.id,
        payload: { status: 'confirmed' },
      })

      toast.success('Agendamento confirmado com sucesso!')

      // 2. Disparar notificação (SMS/WhatsApp)
      const msg = `Olá, ${appt.patient_name}! Seu agendamento com o(a) Dr(a). ${appt.doctor_name} no dia ${formatDateTimePtBr(appt.scheduled_at)} foi CONFIRMADO com sucesso. Até lá!`
      await sendNotification(appt, msg)

      refetch()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao confirmar o agendamento.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (appt: EnrichedRequestAppointment) => {
    setProcessingId(appt.id)
    try {
      // 1. Atualizar agendamento para cancelado (recusado)
      await updateMut.mutateAsync({
        id: appt.id,
        payload: { status: 'cancelled' },
      })

      toast.success('Solicitação de agendamento recusada/cancelada.')

      // 2. Disparar notificação (SMS/WhatsApp)
      const msg = `Olá, ${appt.patient_name}! Infelizmente não pudemos confirmar sua solicitação de agendamento com o(a) Dr(a). ${appt.doctor_name} no dia ${formatDateTimePtBr(appt.scheduled_at)}. Por favor, entre em contato para escolher outro horário.`
      await sendNotification(appt, msg)

      refetch()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao recusar o agendamento.')
    } finally {
      setProcessingId(null)
    }
  }

  const sendNotification = async (appt: EnrichedRequestAppointment, message: string) => {
    const formattedPhone = appt.patient_phone?.trim()
    if (!formattedPhone || formattedPhone === '—') {
      toast.warning('O paciente não possui celular cadastrado. A mensagem não pôde ser enviada.')
      return
    }

    try {
      await sendSmsMut.mutateAsync({
        phone_number: formattedPhone,
        message,
        patient_id: appt.patient_id,
      })
      toast.success(`Mensagem de aviso enviada via SMS/WhatsApp para ${formattedPhone}`)
    } catch (err) {
      console.warn('Falha no envio de SMS físico (esperado em ambiente front‑only/sem chaves):', err)
      // Exibe notificação simulada de SMS/WhatsApp conforme regras bancoeback
      toast.info(
        <div className="flex flex-col gap-1 text-xs">
          <p className="font-semibold text-emerald-800 dark:text-emerald-400">
            [Notificação Enviada (Simulação)]
          </p>
          <p>
            <strong>Destinatário:</strong> {appt.patient_name} ({formattedPhone})
          </p>
          <p className="italic text-[var(--color-muted-foreground)]">"{message}"</p>
        </div>,
        { duration: 6000 }
      )
    }
  }

  const hasSuggestions =
    suggestions.patients.length > 0 ||
    suggestions.doctors.length > 0 ||
    suggestions.cpfs.length > 0

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">Confirmações de Agendamento</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Analise, aprove ou recuse solicitações de consulta feitas por pacientes. Um aviso via SMS/WhatsApp será disparado automaticamente.
          </p>
        </div>
      </header>

      {/* Caixa de busca inteligente com auto-sugestão dinâmico */}
      {!isLoading && requests.length > 0 && (
        <section className="relative rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <Label htmlFor="search-field" className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider block mb-2">
            Buscar solicitações
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <Input
              id="search-field"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSuggestionsOpen(true)
              }}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => {
                setTimeout(() => setSuggestionsOpen(false), 200)
              }}
              placeholder="Digite o nome do paciente, do médico ou o CPF..."
              className="pl-10 pr-4"
            />
          </div>

          {suggestionsOpen && hasSuggestions && (
            <ul className="absolute left-0 right-0 top-full z-50 max-h-72 overflow-y-auto mt-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg text-sm p-1.5 space-y-1.5">
              {/* Categoria Pacientes */}
              {suggestions.patients.length > 0 && (
                <li>
                  <p className="px-2 py-1 text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                    Pacientes
                  </p>
                  <ul className="space-y-0.5 mt-0.5">
                    {suggestions.patients.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-[var(--color-accent-soft)]/50 transition-colors"
                          onMouseDown={() => {
                            setSearchQuery(name)
                            setSuggestionsOpen(false)
                          }}
                        >
                          <User className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                          <span>{name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              )}

              {/* Categoria Médicos */}
              {suggestions.doctors.length > 0 && (
                <li>
                  <p className="px-2 py-1 text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider border-t border-[var(--color-border)]/50 pt-1.5">
                    Médicos
                  </p>
                  <ul className="space-y-0.5 mt-0.5">
                    {suggestions.doctors.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-[var(--color-accent-soft)]/50 transition-colors"
                          onMouseDown={() => {
                            setSearchQuery(name)
                            setSuggestionsOpen(false)
                          }}
                        >
                          <Stethoscope className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                          <span>{name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              )}

              {/* Categoria CPFs */}
              {suggestions.cpfs.length > 0 && (
                <li>
                  <p className="px-2 py-1 text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider border-t border-[var(--color-border)]/50 pt-1.5">
                    CPFs de Pacientes
                  </p>
                  <ul className="space-y-0.5 mt-0.5">
                    {suggestions.cpfs.map((cpf) => (
                      <li key={cpf}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-[var(--color-accent-soft)]/50 transition-colors"
                          onMouseDown={() => {
                            setSearchQuery(cpf)
                            setSuggestionsOpen(false)
                          }}
                        >
                          <Hash className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                          <span>{cpf}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          )}
        </section>
      )}

      {isLoading || patientsQuery.isLoading || doctorsQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-28 w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-28 w-full rounded-[var(--radius-card)]" />
        </div>
      ) : isError ? (
        <div className="rounded-[var(--radius-card)] border border-rose-100 bg-rose-50/50 p-6 text-center text-rose-700">
          <Info className="mx-auto h-8 w-8 mb-2" />
          <p className="text-sm font-medium">Não foi possível carregar as solicitações de agendamento.</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center shadow-sm">
          <Check className="mx-auto h-12 w-12 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 rounded-full p-2.5 mb-3" />
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">Tudo limpo por aqui!</h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)] px-4">
            Nenhuma nova solicitação de agendamento pendente no momento.
          </p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center shadow-sm">
          <Info className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)] mb-2" />
          <p className="text-sm font-medium text-[var(--color-foreground)]">Nenhuma solicitação corresponde à busca.</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            Limpar filtros de busca
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredRequests.map((appt) => {
            const isProcessing = processingId === appt.id
            const formattedDate = formatDateTimePtBr(appt.scheduled_at)

            return (
              <div
                key={appt.id}
                className={cn(
                  "group relative flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all duration-200 hover:border-[var(--color-accent)]/25 hover:shadow-md",
                  isProcessing && "opacity-60 pointer-events-none"
                )}
              >
                {/* Informações Principais */}
                <div className="flex-1 space-y-3.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] bg-[var(--color-accent-soft)] px-2 py-0.5 rounded-full capitalize">
                      {appt.appointment_type === 'telemedicina' ? 'Telemedicina' : 'Presencial'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                      <Clock className="h-3 w-3" /> {appt.duration_minutes ?? 30} min
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Paciente */}
                    <div className="flex items-start gap-2.5">
                      <span className="grid h-8 w-8 place-items-center shrink-0 rounded-md bg-[var(--color-muted)] text-[var(--color-foreground)]">
                        <User className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                          Paciente
                        </p>
                        <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">
                          {appt.patient_name}
                        </p>
                        <div className="flex flex-col gap-0.5 mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                          <p className="flex items-center gap-1">
                            <Smartphone className="h-3.5 w-3.5 shrink-0" /> {appt.patient_phone}
                          </p>
                          <p className="flex items-center gap-1 font-mono text-[11px]">
                            <Hash className="h-3 w-3 shrink-0" /> CPF: {appt.patient_cpf}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Médico */}
                    <div className="flex items-start gap-2.5">
                      <span className="grid h-8 w-8 place-items-center shrink-0 rounded-md bg-[var(--color-muted)] text-[var(--color-foreground)]">
                        <Stethoscope className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                          Profissional
                        </p>
                        <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">
                          {appt.doctor_name}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
                          {appt.doctor_specialty}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes data / observações */}
                  <div className="pt-2 border-t border-[var(--color-border)]/60 space-y-2">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-foreground)]">
                      <Calendar className="h-4 w-4 text-[var(--color-accent)]" /> {formattedDate}
                    </p>

                    {appt.notes && (
                      <div className="flex gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-muted)]/30 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                        <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[var(--color-muted-foreground)]" />
                        <p className="leading-relaxed">
                          <strong>Observações:</strong> {appt.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex md:flex-col items-stretch justify-end gap-2 shrink-0 border-t md:border-t-0 border-[var(--color-border)]/60 pt-4 md:pt-0">
                  <Button
                    type="button"
                    variant="primary"
                    disabled={isProcessing}
                    onClick={() => handleConfirm(appt)}
                    className="flex-1 md:flex-none justify-center gap-1.5 h-10 px-5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                  >
                    <Check className="h-4 w-4" /> Confirmar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isProcessing}
                    onClick={() => handleReject(appt)}
                    className="flex-1 md:flex-none justify-center gap-1.5 h-10 px-5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 dark:hover:bg-rose-950/20"
                  >
                    <X className="h-4 w-4" /> Recusar
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
