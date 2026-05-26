import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Calendar,
  Clock,
  Search,
  Stethoscope,
  User,
  ArrowLeft,
  CheckCircle,
  Video,
  MapPin,
  FileText
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppointmentAvailabilityDatePicker } from '@/features/agenda/components/AppointmentAvailabilityDatePicker'
import { useCreateAppointmentMutation, useResolvedAppointmentFormSlots } from '@/features/agenda/hooks'
import { useResolvedPatientId } from '@/features/patient-portal/hooks'
import { useListDoctors } from '@/features/doctors/hooks'
import { combineDateAndTime } from '@/features/agenda/utils/calendar'
import { DOCTOR_AVAILABILITY_API_SLOT_DEFAULT } from '@/features/agenda/utils/doctorAvailabilityOpenApi'
import { cn } from '@/lib/cn'
import { formatPostgresLocalTimePtBr } from '@/lib/formatTimePtBr'

export function RequestAppointmentPage() {
  const navigate = useNavigate()
  const patientId = useResolvedPatientId()
  const createMut = useCreateAppointmentMutation()

  // Buscar todos os médicos ativos
  const doctorsQuery = useListDoctors({ active: true, pageSize: 200 })

  // Estados do formulário de agendamento
  const [specialtyQuery, setSpecialtyQuery] = React.useState('')
  const [selectedSpecialty, setSelectedSpecialty] = React.useState('')
  const [specialtySuggestionsOpen, setSpecialtySuggestionsOpen] = React.useState(false)

  const [doctorQuery, setDoctorQuery] = React.useState('')
  const [selectedDoctorId, setSelectedDoctorId] = React.useState('')
  const [doctorSuggestionsOpen, setDoctorSuggestionsOpen] = React.useState(false)

  const [appointmentType, setAppointmentType] = React.useState<'presencial' | 'telemedicina'>('presencial')
  const [date, setDate] = React.useState('')
  const [time, setTime] = React.useState('')
  const [notes, setNotes] = React.useState('')

  // Extrair especialidades únicas de todos os médicos
  const specialties = React.useMemo(() => {
    const list = doctorsQuery.data?.items ?? []
    const set = new Set<string>()
    list.forEach((doc) => {
      if (doc.specialty?.trim()) {
        set.add(doc.specialty.trim())
      }
    })
    return Array.from(set).sort()
  }, [doctorsQuery.data])

  // Filtrar especialidades com base na digitação
  const filteredSpecialties = React.useMemo(() => {
    const q = specialtyQuery.trim().toLowerCase()
    if (!q) return specialties
    return specialties.filter((s) => s.toLowerCase().includes(q))
  }, [specialtyQuery, specialties])

  // Filtrar médicos baseando-se na especialidade e na digitação do nome
  const filteredDoctors = React.useMemo(() => {
    const list = doctorsQuery.data?.items ?? []
    return list.filter((doc) => {
      const matchSpecialty = !selectedSpecialty || doc.specialty === selectedSpecialty
      const matchSearch = !doctorQuery.trim() || doc.full_name.toLowerCase().includes(doctorQuery.toLowerCase())
      return doc.active !== false && matchSpecialty && matchSearch
    })
  }, [doctorsQuery.data, selectedSpecialty, doctorQuery])

  // Médico selecionado (objeto completo)
  const selectedDoctor = React.useMemo(() => {
    return doctorsQuery.data?.items.find((d) => d.id === selectedDoctorId)
  }, [doctorsQuery.data, selectedDoctorId])

  // Resolver slots disponíveis para o médico na data
  const { slotItems, slotsLoading, slotsError } = useResolvedAppointmentFormSlots({
    sheetOpen: true,
    calendarEnabled: true,
    doctorId: selectedDoctorId || undefined,
    dateISO: date || undefined,
    appointmentType,
  })

  // Resetar passos dependentes ao trocar seleções anteriores
  React.useEffect(() => {
    setSelectedDoctorId('')
    setDoctorQuery('')
    setDate('')
    setTime('')
  }, [selectedSpecialty])

  React.useEffect(() => {
    setDate('')
    setTime('')
  }, [selectedDoctorId, appointmentType])

  React.useEffect(() => {
    setTime('')
  }, [date])

  const handleSelectSpecialty = (spec: string) => {
    setSelectedSpecialty(spec)
    setSpecialtyQuery(spec)
    setSpecialtySuggestionsOpen(false)
  }

  const handleSelectDoctor = (id: string, name: string) => {
    setSelectedDoctorId(id)
    setDoctorQuery(name)
    setDoctorSuggestionsOpen(false)
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!patientId) {
      toast.error('Cadastro de paciente não encontrado para esta conta de acesso.')
      return
    }
    if (!selectedDoctorId) {
      toast.error('Por favor, selecione um médico.')
      return
    }
    if (!date) {
      toast.error('Por favor, selecione uma data disponível.')
      return
    }
    if (!time) {
      toast.error('Por favor, selecione um horário disponível.')
      return
    }

    const scheduled_at = combineDateAndTime(date, time)
    const matchedSlot = slotItems.find((s) => s.time === time)
    const duration = matchedSlot?.duration_minutes ?? DOCTOR_AVAILABILITY_API_SLOT_DEFAULT

    try {
      await createMut.mutateAsync({
        doctor_id: selectedDoctorId,
        patient_id: patientId,
        scheduled_at,
        duration_minutes: duration,
        status: 'requested',
        created_by: patientId,
        appointment_type: appointmentType,
        notes: notes.trim() || null,
      })

      toast.success('Solicitação de agendamento enviada! Aguarde a aprovação da clínica.')
      navigate('/app/meus-agendamentos')
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível enviar a solicitação de agendamento. Tente novamente mais tarde.')
    }
  }

  if (!patientId) {
    return (
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="font-display text-2xl text-[var(--color-foreground)]">Solicitar Agendamento</h1>
          <p className="mt-3 text-sm text-rose-600">
            Cadastro de paciente não encontrado para esta conta de acesso.
          </p>
        </header>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-10 w-10 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">Solicitar Agendamento</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Escolha a especialidade, o médico, a data e hora desejados para solicitar seu agendamento.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmitRequest} className="flex flex-col gap-6">
        {/* Passo 1: Especialidade */}
        <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold text-sm">
              1
            </span>
            <h2 className="font-display text-lg font-semibold text-[var(--color-foreground)]">
              Qual especialidade procura?
            </h2>
          </div>

          <div className="relative">
            <Label htmlFor="specialty_search" className="sr-only">Especialidade</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <Input
                id="specialty_search"
                value={specialtyQuery}
                onChange={(e) => {
                  setSpecialtyQuery(e.target.value)
                  setSelectedSpecialty('')
                  setSpecialtySuggestionsOpen(true)
                }}
                onFocus={() => setSpecialtySuggestionsOpen(true)}
                onBlur={() => {
                  setTimeout(() => setSpecialtySuggestionsOpen(false), 200)
                }}
                placeholder="Digite ou selecione uma especialidade (Ex: Cardiologia, Dermatologia...)"
                className="pl-10"
              />
            </div>

            {specialtySuggestionsOpen && (
              <ul className="absolute left-0 right-0 top-full z-50 max-h-56 overflow-y-auto mt-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg text-sm">
                {filteredSpecialties.map((spec) => (
                  <li key={spec}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--color-accent-soft)]/50 transition-colors",
                        selectedSpecialty === spec && "bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium"
                      )}
                      onMouseDown={() => handleSelectSpecialty(spec)}
                    >
                      <span className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                        {spec}
                      </span>
                      {selectedSpecialty === spec && <CheckCircle className="h-4 w-4" />}
                    </button>
                  </li>
                ))}
                {filteredSpecialties.length === 0 && (
                  <li className="px-4 py-3 text-[var(--color-muted-foreground)] text-center">
                    Nenhuma especialidade encontrada com esse nome.
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>

        {/* Passo 2: Médico */}
        <section
          className={cn(
            "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-opacity duration-200",
            !selectedSpecialty && "opacity-50 pointer-events-none"
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold text-sm">
              2
            </span>
            <h2 className="font-display text-lg font-semibold text-[var(--color-foreground)]">
              Selecione o profissional
            </h2>
          </div>

          <div className="relative">
            <Label htmlFor="doctor_search" className="sr-only">Profissional</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <Input
                id="doctor_search"
                value={doctorQuery}
                onChange={(e) => {
                  setDoctorQuery(e.target.value)
                  setSelectedDoctorId('')
                  setDoctorSuggestionsOpen(true)
                }}
                onFocus={() => setDoctorSuggestionsOpen(true)}
                onBlur={() => {
                  setTimeout(() => setDoctorSuggestionsOpen(false), 200)
                }}
                placeholder="Busque pelo nome do médico..."
                className="pl-10"
                disabled={!selectedSpecialty}
              />
            </div>

            {doctorSuggestionsOpen && selectedSpecialty && (
              <ul className="absolute left-0 right-0 top-full z-50 max-h-56 overflow-y-auto mt-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg text-sm">
                {filteredDoctors.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--color-accent-soft)]/50 transition-colors",
                        selectedDoctorId === doc.id && "bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium"
                      )}
                      onMouseDown={() => handleSelectDoctor(doc.id, doc.full_name)}
                    >
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                        <div>
                          <p className="font-medium text-[var(--color-foreground)]">{doc.full_name}</p>
                          <p className="text-xs text-[var(--color-muted-foreground)]">{doc.specialty || 'Clínico Geral'}</p>
                        </div>
                      </span>
                      {selectedDoctorId === doc.id && <CheckCircle className="h-4 w-4" />}
                    </button>
                  </li>
                ))}
                {filteredDoctors.length === 0 && (
                  <li className="px-4 py-3 text-[var(--color-muted-foreground)] text-center">
                    Nenhum médico ativo encontrado para a especialidade {selectedSpecialty}.
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>

        {/* Passo 3: Modalidade */}
        <section
          className={cn(
            "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-opacity duration-200",
            !selectedDoctorId && "opacity-50 pointer-events-none"
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold text-sm">
              3
            </span>
            <h2 className="font-display text-lg font-semibold text-[var(--color-foreground)]">
              Selecione a modalidade
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setAppointmentType('presencial')}
              disabled={!selectedDoctorId}
              className={cn(
                "flex flex-col items-center gap-2.5 p-4 rounded-[var(--radius-sm)] border text-sm font-medium transition-all",
                appointmentType === 'presencial'
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-sm"
                  : "border-[var(--color-border)] hover:bg-[var(--color-muted)]/20 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              )}
            >
              <MapPin className="h-5 w-5" />
              Atendimento Presencial
            </button>
            <button
              type="button"
              onClick={() => setAppointmentType('telemedicina')}
              disabled={!selectedDoctorId}
              className={cn(
                "flex flex-col items-center gap-2.5 p-4 rounded-[var(--radius-sm)] border text-sm font-medium transition-all",
                appointmentType === 'telemedicina'
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-sm"
                  : "border-[var(--color-border)] hover:bg-[var(--color-muted)]/20 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              )}
            >
              <Video className="h-5 w-5" />
              Telemedicina (Online)
            </button>
          </div>
        </section>

        {/* Passo 4: Data e Hora */}
        <section
          className={cn(
            "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-opacity duration-200",
            !selectedDoctorId && "opacity-50 pointer-events-none"
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold text-sm">
              4
            </span>
            <h2 className="font-display text-lg font-semibold text-[var(--color-foreground)]">
              Selecione data e hora
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Selecione o Dia
              </Label>
              <div className="p-2 border border-[var(--color-border)] rounded-lg">
                <AppointmentAvailabilityDatePicker
                  doctorId={selectedDoctorId || undefined}
                  appointmentType={appointmentType}
                  value={date}
                  onChange={setDate}
                  disabled={!selectedDoctorId}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Horários Disponíveis
              </Label>

              {slotsLoading ? (
                <div className="flex flex-1 items-center justify-center py-12 text-sm text-[var(--color-muted-foreground)]">
                  Carregando horários...
                </div>
              ) : slotsError ? (
                <div className="flex flex-1 items-center justify-center p-4 border border-rose-100 rounded-lg text-xs text-rose-700 bg-rose-50/50">
                  Erro ao carregar horários. Tente selecionar outro dia.
                </div>
              ) : !date ? (
                <div className="flex flex-1 items-center justify-center py-12 text-center text-xs text-[var(--color-muted-foreground)] border border-dashed border-[var(--color-border)] rounded-lg px-4">
                  Selecione um dia disponível no calendário para ver os horários.
                </div>
              ) : slotItems.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-12 text-center text-xs text-[var(--color-muted-foreground)] border border-dashed border-[var(--color-border)] rounded-lg px-4 bg-amber-50/20">
                  Nenhum horário livre encontrado para este dia.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[290px] overflow-y-auto pr-1">
                  {slotItems.map((slot) => {
                    const isSelected = time === slot.time
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setTime(slot.time)}
                        className={cn(
                          "py-2 px-3 text-sm rounded-md border text-center transition-all font-medium",
                          isSelected
                            ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-sm"
                            : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-accent)]/55 hover:bg-[var(--color-accent-soft)]/20"
                        )}
                      >
                        {formatPostgresLocalTimePtBr(slot.time)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Passo 5: Observações (Opcional) */}
        <section
          className={cn(
            "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-opacity duration-200",
            (!date || !time) && "opacity-50 pointer-events-none"
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold text-sm">
              5
            </span>
            <h2 className="font-display text-lg font-semibold text-[var(--color-foreground)]">
              Observações ou sintomas (Opcional)
            </h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="request_notes" className="sr-only">Observações</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-[var(--color-muted-foreground)]" />
              <textarea
                id="request_notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escreva brevemente o motivo da consulta ou algum sintoma se desejar..."
                disabled={!date || !time}
                rows={3}
                className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/70 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
              />
            </div>
          </div>
        </section>

        {/* Rodapé e botão enviar */}
        <div className="flex justify-end gap-3 items-center mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/app/meus-agendamentos')}
            className="h-11 px-6"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={createMut.isPending}
            disabled={!selectedDoctorId || !date || !time}
            className="h-11 px-8 font-medium shadow-md"
          >
            Solicitar Agendamento
          </Button>
        </div>
      </form>
    </div>
  )
}
