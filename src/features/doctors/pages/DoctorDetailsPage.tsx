import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  IdCard,
  Mail,
  Pencil,
  Phone,
  RefreshCcw,
  Stethoscope,
  Trash2,
  User,
} from 'lucide-react'
import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteDoctorDialog } from '@/features/doctors/components/DeleteDoctorDialog'
import { DoctorAvailabilitySection } from '@/features/doctors/components/DoctorAvailabilitySection'
import { DoctorFormDrawer } from '@/features/doctors/components/DoctorFormDrawer'
import { useDoctor } from '@/features/doctors/hooks'
import { formatCpf } from '@/features/patients/utils/cpf'
import {
  formatDate,
  formatDateTime,
  formatPatientPhone,
} from '@/features/patients/utils/format'
import { useHasRole } from '@/features/auth/useAuth'
import { ApiError } from '@/lib/apiClient'

export function DoctorDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canManage = useHasRole('admin', 'gestor')

  const query = useDoctor(id)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  if (query.isLoading) return <DetailsSkeleton />

  if (query.isError) {
    const isNotFound = query.error instanceof ApiError && query.error.status === 404
    return isNotFound ? <NotFoundState /> : <ErrorState onRetry={() => query.refetch()} />
  }

  const doctor = query.data
  if (!doctor) return <NotFoundState />

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/app/medicos')}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para médicos
      </button>

      <header className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={doctor.full_name} size="lg" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl text-[var(--color-foreground)]">
                {doctor.full_name}
              </h1>
              {doctor.active === false ? (
                <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
                  Inativo
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                  Ativo
                </span>
              )}
            </div>
            <p className="font-mono text-sm text-[var(--color-muted-foreground)]">
              CRM {doctor.crm}/{doctor.crm_uf}
            </p>
            {doctor.specialty && (
              <p className="text-sm text-[var(--color-muted-foreground)]">{doctor.specialty}</p>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(true)}>
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
          </div>
        )}
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Identificação" icon={<User className="h-4 w-4" />}>
          <Row label="Nome completo" value={doctor.full_name} />
          {doctor.cpf && (
            <Row
              label="CPF"
              value={<span className="font-mono text-sm">{formatCpf(doctor.cpf)}</span>}
              icon={<IdCard className="h-4 w-4" />}
            />
          )}
          <Row
            label="CRM"
            value={
              <span className="font-mono text-sm">
                {doctor.crm}/{doctor.crm_uf}
              </span>
            }
            icon={<Stethoscope className="h-4 w-4" />}
          />
          {doctor.specialty && (
            <Row label="Especialidade" value={doctor.specialty} />
          )}
          {doctor.birth_date && (
            <Row
              label="Data de nascimento"
              value={formatDate(doctor.birth_date)}
              icon={<CalendarDays className="h-4 w-4" />}
            />
          )}
        </Card>

        <Card title="Contato" icon={<Phone className="h-4 w-4" />}>
          <Row
            label="Email"
            value={doctor.email || '—'}
            icon={<Mail className="h-4 w-4" />}
          />
          <Row
            label="Celular"
            value={formatPatientPhone(doctor.phone_mobile)}
            icon={<Phone className="h-4 w-4" />}
          />
        </Card>

        <Card title="Histórico" icon={<ClipboardList className="h-4 w-4" />} className="lg:col-span-2">
          <Row label="Cadastrado em" value={formatDateTime(doctor.created_at)} />
          <Row label="Última atualização" value={formatDateTime(doctor.updated_at)} />
        </Card>
      </section>

      <DoctorAvailabilitySection doctorId={doctor.id} />

      <DoctorFormDrawer
        open={drawerOpen}
        onOpenChange={(next) => {
          if (!next) setDrawerOpen(false)
        }}
        state={{ mode: 'edit', doctor }}
      />

      <DeleteDoctorDialog
        open={deleteOpen}
        onOpenChange={(next) => {
          if (!next) setDeleteOpen(false)
        }}
        doctor={doctor}
        onDeleted={() => navigate('/app/medicos', { replace: true })}
      />
    </div>
  )
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
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
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
      title="Médico não encontrado"
      description="O médico pode ter sido removido ou você não tem acesso ao registro."
      action={
        <Button type="button" variant="outline" onClick={() => navigate('/app/medicos')}>
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
      title="Não conseguimos carregar o médico"
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
