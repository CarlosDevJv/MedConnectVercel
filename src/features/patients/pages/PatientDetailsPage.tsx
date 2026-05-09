import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  Heart,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Pill,
  RefreshCcw,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DeletePatientDialog } from '@/features/patients/components/DeletePatientDialog'
import { usePatient } from '@/features/patients/hooks'
import { formatCpf } from '@/features/patients/utils/cpf'
import { formatRg } from '@/features/patients/utils/rg'
import { formatCep } from '@/features/patients/utils/cep'
import { numberToDecimalString } from '@/features/patients/utils/decimal'
import {
  calculateAge,
  formatDate,
  formatDateTime,
  formatPatientCpf,
  formatPatientPhone,
} from '@/features/patients/utils/format'
import { useAuth, useCanManagePatients } from '@/features/auth/useAuth'
import { REPORT_ROLES } from '@/lib/roleGroups'
import { ApiError } from '@/lib/apiClient'
import type { UserRole } from '@/types/user'

export function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canManage = useCanManagePatients()
  const { userInfo } = useAuth()
  const canSeeReports = Boolean(
    userInfo?.roles?.some((r) => REPORT_ROLES.includes(r as UserRole))
  )

  const query = usePatient(id)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  if (query.isLoading) return <DetailsSkeleton />

  if (query.isError) {
    const isNotFound = query.error instanceof ApiError && query.error.status === 404
    return isNotFound ? <NotFoundState /> : <ErrorState onRetry={() => query.refetch()} />
  }

  const patient = query.data
  if (!patient) return <NotFoundState />

  const cityState =
    [patient.city, patient.state].filter(Boolean).join('/') || '—'

  const fullAddress = formatAddress(patient)
  const bmi = patient.bmi !== null && patient.bmi !== undefined ? patient.bmi : null

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/app/pacientes')}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para pacientes
      </button>

      <header className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={patient.full_name} size="lg" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl text-[var(--color-foreground)]">
                {patient.full_name}
              </h1>
              {patient.vip && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  VIP
                </span>
              )}
            </div>
            {patient.social_name && (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Nome social: <span className="text-[var(--color-foreground)]">{patient.social_name}</span>
              </p>
            )}
            <p className="font-mono text-sm text-[var(--color-muted-foreground)]">
              {formatPatientCpf(patient.cpf)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canSeeReports ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(`/app/relatorios?patient_id=${encodeURIComponent(patient.id)}`)
              }
            >
              <FileText className="h-4 w-4" />
              Laudos
            </Button>
          ) : null}
          {canManage && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/app/pacientes/${patient.id}/editar`)}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(true)}
              className="text-[var(--color-destructive)] hover:bg-red-50 hover:text-[var(--color-destructive)]"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </>
          )}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Identificação" icon={<User className="h-4 w-4" />}>
          <Row label="Nome completo" value={patient.full_name} />
          {patient.social_name && <Row label="Nome social" value={patient.social_name} />}
          <Row
            label="CPF"
            value={<span className="font-mono text-sm">{formatCpf(patient.cpf)}</span>}
            icon={<IdCard className="h-4 w-4" />}
          />
          {patient.rg && (
            <Row
              label="RG"
              value={<span className="font-mono text-sm">{formatRg(patient.rg)}</span>}
            />
          )}
          {patient.document_type && (
            <Row
              label={patient.document_type}
              value={patient.document_number ?? '—'}
            />
          )}
          <Row
            label="Data de nascimento"
            value={
              patient.birth_date
                ? `${formatDate(patient.birth_date)}${
                    calculateAge(patient.birth_date) !== null
                      ? ` (${calculateAge(patient.birth_date)} anos)`
                      : ''
                  }`
                : '—'
            }
            icon={<CalendarDays className="h-4 w-4" />}
          />
          {patient.sex && <Row label="Sexo" value={patient.sex} />}
          {patient.race && <Row label="Raça" value={patient.race} />}
          {patient.nationality && <Row label="Nacionalidade" value={patient.nationality} />}
          {patient.naturality && <Row label="Naturalidade" value={patient.naturality} />}
          {patient.profession && <Row label="Profissão" value={patient.profession} />}
          {patient.marital_status && <Row label="Estado civil" value={patient.marital_status} />}
        </Card>

        <Card title="Filiação" icon={<Users className="h-4 w-4" />}>
          {patient.mother_name || patient.father_name || patient.guardian_name || patient.spouse_name ? (
            <>
              {patient.mother_name && <Row label="Nome da mãe" value={patient.mother_name} />}
              {patient.mother_profession && (
                <Row label="Profissão da mãe" value={patient.mother_profession} />
              )}
              {patient.father_name && <Row label="Nome do pai" value={patient.father_name} />}
              {patient.father_profession && (
                <Row label="Profissão do pai" value={patient.father_profession} />
              )}
              {patient.guardian_name && (
                <Row label="Responsável" value={patient.guardian_name} />
              )}
              {patient.guardian_cpf && (
                <Row
                  label="CPF do responsável"
                  value={<span className="font-mono text-sm">{formatCpf(patient.guardian_cpf)}</span>}
                />
              )}
              {patient.spouse_name && <Row label="Esposo(a)" value={patient.spouse_name} />}
            </>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">Sem informações de filiação.</p>
          )}
        </Card>

        <Card title="Contato" icon={<Phone className="h-4 w-4" />}>
          <Row
            label="Email"
            value={patient.email || '—'}
            icon={<Mail className="h-4 w-4" />}
          />
          <Row
            label="Celular"
            value={formatPatientPhone(patient.phone_mobile)}
            icon={<Phone className="h-4 w-4" />}
          />
          {patient.phone1 && (
            <Row label="Telefone 1" value={formatPatientPhone(patient.phone1)} />
          )}
          {patient.phone2 && (
            <Row label="Telefone 2" value={formatPatientPhone(patient.phone2)} />
          )}
        </Card>

        <Card title="Endereço" icon={<MapPin className="h-4 w-4" />}>
          {patient.cep || patient.street || patient.city ? (
            <>
              {patient.cep && (
                <Row
                  label="CEP"
                  value={<span className="font-mono text-sm">{formatCep(patient.cep)}</span>}
                />
              )}
              {fullAddress && <Row label="Endereço" value={fullAddress} />}
              {patient.neighborhood && <Row label="Bairro" value={patient.neighborhood} />}
              <Row label="Cidade / UF" value={cityState} />
              {patient.reference && (
                <Row label="Ponto de referência" value={patient.reference} />
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">Endereço não informado.</p>
          )}
        </Card>

        <Card title="Convênio" icon={<Building2 className="h-4 w-4" />}>
          {patient.insurance_company ||
          patient.insurance_plan ||
          patient.insurance_member_number ||
          patient.insurance_card_valid_until ? (
            <>
              {patient.insurance_company && (
                <Row label="Operadora / convênio" value={patient.insurance_company} />
              )}
              {patient.insurance_plan && <Row label="Plano" value={patient.insurance_plan} />}
              {patient.insurance_member_number && (
                <Row label="Matrícula / carteirinha" value={patient.insurance_member_number} />
              )}
              {patient.insurance_card_valid_until && (
                <Row label="Validade da carteira" value={formatDate(patient.insurance_card_valid_until)} />
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">Convênio não informado.</p>
          )}
        </Card>

        <Card title="Informações médicas" icon={<Heart className="h-4 w-4" />} className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {patient.blood_type && <Row label="Tipo sanguíneo" value={patient.blood_type} />}
            {patient.weight_kg !== null && patient.weight_kg !== undefined && (
              <Row
                label="Peso"
                value={`${numberToDecimalString(patient.weight_kg, 2)} kg`}
              />
            )}
            {patient.height_m !== null && patient.height_m !== undefined && (
              <Row
                label="Altura"
                value={`${numberToDecimalString(patient.height_m, 2)} m`}
              />
            )}
            {bmi !== null && (
              <Row
                label="IMC"
                value={
                  <span className="inline-flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                    {numberToDecimalString(bmi, 2)} kg/m²
                  </span>
                }
              />
            )}
          </div>

          {(patient.allergies || patient.medications_in_use || patient.chronic_conditions) && (
            <div className="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-4 sm:grid-cols-2">
              {patient.allergies && (
                <div className="sm:col-span-2">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted-foreground)]">
                    <Pill className="h-3.5 w-3.5" />
                    Alergias
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)] whitespace-pre-wrap">
                    {patient.allergies}
                  </p>
                </div>
              )}
              {patient.medications_in_use && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Medicamentos em uso
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)] whitespace-pre-wrap">
                    {patient.medications_in_use}
                  </p>
                </div>
              )}
              {patient.chronic_conditions && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Condições crônicas
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)] whitespace-pre-wrap">
                    {patient.chronic_conditions}
                  </p>
                </div>
              )}
            </div>
          )}

          {patient.notes && (
            <div className="mt-3 border-t border-[var(--color-border)] pt-3">
              <p className="text-xs text-[var(--color-muted-foreground)]">Observações</p>
              <p className="mt-1 text-sm text-[var(--color-foreground)] whitespace-pre-wrap">
                {patient.notes}
              </p>
            </div>
          )}
          {!patient.blood_type &&
            patient.weight_kg === null &&
            patient.height_m === null &&
            !patient.notes &&
            !patient.allergies &&
            !patient.medications_in_use &&
            !patient.chronic_conditions && (
              <p className="text-sm text-[var(--color-muted-foreground)]">Sem informações médicas.</p>
            )}
        </Card>

        <Card title="Histórico" icon={<CalendarDays className="h-4 w-4" />} className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Cadastrado em" value={formatDateTime(patient.created_at)} />
            <Row label="Última atualização" value={formatDateTime(patient.updated_at)} />
            {patient.legacy_code && <Row label="Código legado" value={patient.legacy_code} />}
            {patient.rn_in_insurance && (
              <Row label="RN na guia do convênio" value="Sim" />
            )}
          </div>
        </Card>
      </section>

      <DeletePatientDialog
        open={deleteOpen}
        onOpenChange={(next) => {
          if (!next) setDeleteOpen(false)
        }}
        patient={patient}
        onDeleted={() => navigate('/app/pacientes', { replace: true })}
      />
    </div>
  )
}

function formatAddress(patient: {
  street: string | null
  number: string | null
  complement: string | null
}): string {
  const parts: string[] = []
  if (patient.street) parts.push(patient.street)
  if (patient.number) parts.push(`nº ${patient.number}`)
  if (patient.complement) parts.push(patient.complement)
  return parts.join(', ')
}

function Card({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 ${
        className ?? ''
      }`}
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
        <span aria-hidden="true">{icon}</span>
        {title}
      </div>
      <dl className="space-y-3">{children}</dl>
    </div>
  )
}

function Row({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)]/60 pb-3 last:border-b-0 last:pb-0">
      <dt className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-[var(--color-foreground)]">{value}</dd>
    </div>
  )
}

function DetailsSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <Skeleton className="h-4 w-40" />
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  )
}

function NotFoundState() {
  const navigate = useNavigate()
  return (
    <Centered
      icon={<AlertCircle className="h-5 w-5" />}
      title="Paciente não encontrado"
      description="O paciente pode ter sido removido ou você não tem acesso ao registro."
      action={
        <Button type="button" variant="outline" onClick={() => navigate('/app/pacientes')}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para a lista
        </Button>
      }
    />
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Centered
      icon={<AlertCircle className="h-5 w-5" />}
      title="Não conseguimos carregar o paciente"
      description="Verifique sua conexão e tente novamente."
      action={
        <Button type="button" variant="outline" onClick={onRetry}>
          <RefreshCcw className="h-4 w-4" />
          Tentar novamente
        </Button>
      }
    />
  )
}

function Centered({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="mx-auto mt-8 flex w-full max-w-[480px] flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        {icon}
      </div>
      <h3 className="font-display text-lg text-[var(--color-foreground)]">{title}</h3>
      <p className="max-w-[420px] text-sm text-[var(--color-muted-foreground)]">{description}</p>
      {action}
    </div>
  )
}
