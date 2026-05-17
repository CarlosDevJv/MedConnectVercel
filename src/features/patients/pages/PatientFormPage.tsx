import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Skeleton } from '@/components/ui/skeleton'
import {
  PatientForm,
  type PatientFormHandle,
} from '@/features/patients/components/PatientForm'
import {
  createPatient,
  type CreatePatientPayload,
  registerPatientWithPassword,
  type UpdatePatientPayload,
  updatePatient,
} from '@/features/patients/api'
import { patientKeys, usePatient, useUpdatePatient } from '@/features/patients/hooks'
import type { CreatePatientValues, UpdatePatientValues } from '@/features/patients/schemas'
import { stripNonDigits } from '@/features/patients/utils/cpf'
import { parseDecimal } from '@/features/patients/utils/decimal'
import { createUserWithPassword } from '@/features/users/api'
import { ApiError } from '@/lib/apiClient'
import { toastFromError } from '@/lib/apiErrorToast'

const REGISTER_CONFLICT_CODE = 'PATIENT_REGISTER_CONFLICT'

interface PatientFormPageProps {
  mode: 'create' | 'edit'
}

export function PatientFormPage({ mode }: PatientFormPageProps) {
  return mode === 'create' ? <CreatePatientPage /> : <EditPatientPage />
}

function CreatePatientPage() {
  const navigate = useNavigate()
  const formRef = React.useRef<PatientFormHandle>(null)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (values: CreatePatientValues) => {
      const password = values.password?.trim() ?? ''
      if (password) {
        const res = await registerPatientWithPassword({
          email: values.email.trim(),
          password,
          full_name: values.full_name.trim(),
          phone_mobile: stripNonDigits(values.phone_mobile),
          cpf: stripNonDigits(values.cpf),
          birth_date: values.birth_date?.trim() ?? '',
        })
        const patientId = res.patient_id
        if (!patientId) {
          throw new ApiError({
            message:
              res.message ??
              'Conta criada, mas a API não retornou o ID do paciente. Verifique na lista ou tente editar após corrigir no backend.',
            status: 502,
            raw: res,
          })
        }
        await updatePatient(patientId, toUpdatePayloadFromCreate(values))
        return { patient_id: patientId }
      }
      return createPatient(buildCreatePayload(values))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all })
    },
  })

  async function handleSubmit(values: CreatePatientValues) {
    try {
      const response = await createMutation.mutateAsync(values)
      const withPortal = Boolean(values.password?.trim())
      toast.success(withPortal ? 'Paciente cadastrado com acesso' : 'Paciente cadastrado', {
        description: withPortal
          ? `${values.full_name.trim()} pode entrar com e-mail e senha definidos.`
          : `${values.full_name.trim()} foi adicionado(a) à base.`,
      })
      if (response.patient_id) {
        navigate(`/app/pacientes/${response.patient_id}`, { replace: true })
      } else {
        navigate('/app/pacientes', { replace: true })
      }
    } catch (error) {
      handleApiError(error, 'create', formRef)
    }
  }

  return (
    <PageShell
      title="Novo paciente"
      subtitle="Preencha o cadastro completo. Apenas os campos com * são obrigatórios. Opcionalmente defina senha inicial para o paciente acessar o portal."
      onBack={() => navigate('/app/pacientes')}
    >
      <PatientForm
        ref={formRef}
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/app/pacientes')}
        submitting={createMutation.isPending}
      />
    </PageShell>
  )
}

function EditPatientPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const formRef = React.useRef<PatientFormHandle>(null)

  const query = usePatient(id)
  const updateMutation = useUpdatePatient(id ?? '')

  async function handleSubmit(values: UpdatePatientValues) {
    try {
      const password = values.password?.trim() ?? ''
      const payload = buildUpdatePayload(values)
      const updated = await updateMutation.mutateAsync(payload)
      if (password) {
        const phoneDigits = stripNonDigits(values.phone1 ?? '')
        await createUserWithPassword({
          email: updated.email.trim(),
          password,
          full_name: updated.full_name.trim(),
          cpf: stripNonDigits(updated.cpf),
          role: 'paciente',
          existing_patient_id: updated.id,
          phone_mobile: stripNonDigits(updated.phone_mobile ?? ''),
          ...(phoneDigits ? { phone: phoneDigits } : {}),
        })
      }
      toast.success('Paciente atualizado', {
        description: password
          ? `${updated.full_name}: dados salvos e portal habilitado com a senha definida.`
          : `As alterações em ${updated.full_name} foram salvas.`,
      })
      navigate(`/app/pacientes/${updated.id}`, { replace: true })
    } catch (error) {
      handleApiError(error, 'update', formRef)
    }
  }

  if (query.isLoading) {
    return (
      <PageShell
        title="Editar paciente"
        subtitle="Carregando dados do paciente…"
        onBack={() => navigate('/app/pacientes')}
      >
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </PageShell>
    )
  }

  if (query.isError || !query.data) {
    return (
      <PageShell
        title="Editar paciente"
        subtitle="Não conseguimos carregar este paciente."
        onBack={() => navigate('/app/pacientes')}
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Tente novamente ou volte para a lista.
        </p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={`Editar — ${query.data.full_name}`}
      subtitle="Atualize os dados do paciente. CPF e data de nascimento são imutáveis."
      onBack={() => navigate(`/app/pacientes/${query.data.id}`)}
    >
      <PatientForm
        ref={formRef}
        mode="edit"
        patient={query.data}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/app/pacientes/${query.data.id}`)}
        submitting={updateMutation.isPending}
      />
    </PageShell>
  )
}

function PageShell({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string
  subtitle: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Cadastros • Pacientes
        </p>
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">{title}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{subtitle}</p>
      </header>

      {children}
    </div>
  )
}

function toUpdatePayloadFromCreate(values: CreatePatientValues): UpdatePatientPayload {
  const { password: _omit, ...rest } = values
  return buildUpdatePayload(rest as UpdatePatientValues)
}

function buildCreatePayload(values: CreatePatientValues): CreatePatientPayload {
  return {
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    cpf: stripNonDigits(values.cpf),
    phone_mobile: stripNonDigits(values.phone_mobile),
    ...optionalString('social_name', values.social_name),
    ...optionalString('rg', values.rg),
    ...optionalString('document_type', values.document_type),
    ...optionalString('document_number', values.document_number),
    ...optionalString('birth_date', values.birth_date),

    ...optionalDigits('phone1', values.phone1),
    ...optionalDigits('phone2', values.phone2),
    ...optionalString('preferred_contact', values.preferred_contact),

    ...optionalString('sex', values.sex),
    ...optionalString('race', values.race),
    ...optionalString('ethnicity', values.ethnicity),
    ...optionalString('nationality', values.nationality),
    ...optionalString('naturality', values.naturality),
    ...optionalString('profession', values.profession),
    ...optionalString('marital_status', values.marital_status),

    ...optionalString('mother_name', values.mother_name),
    ...optionalString('mother_profession', values.mother_profession),
    ...optionalString('father_name', values.father_name),
    ...optionalString('father_profession', values.father_profession),
    ...optionalString('guardian_name', values.guardian_name),
    ...optionalDigits('guardian_cpf', values.guardian_cpf),
    ...optionalString('spouse_name', values.spouse_name),

    ...optionalDigits('cep', values.cep),
    ...optionalString('street', values.street),
    ...optionalString('number', values.number),
    ...optionalString('complement', values.complement),
    ...optionalString('neighborhood', values.neighborhood),
    ...optionalString('city', values.city),
    ...optionalString('state', values.state),
    ...optionalString('reference', values.reference),

    ...optionalString('blood_type', values.blood_type),
    ...optionalNumber('weight_kg', values.weight_kg),
    ...optionalNumber('height_m', values.height_m),
    ...optionalString('legacy_code', values.legacy_code),
    ...(values.rn_in_insurance ? { rn_in_insurance: true } : {}),
    ...(values.vip ? { vip: true } : {}),
    ...optionalString('notes', values.notes),

    ...optionalString('insurance_company', values.insurance_company),
    ...optionalString('insurance_plan', values.insurance_plan),
    ...optionalString('insurance_member_number', values.insurance_member_number),
    ...optionalString('insurance_card_valid_until', values.insurance_card_valid_until),
    ...optionalString('allergies', values.allergies),
    ...optionalString('medications_in_use', values.medications_in_use),
    ...optionalString('chronic_conditions', values.chronic_conditions),
  }
}

function buildUpdatePayload({ password: _omit, ...values }: UpdatePatientValues): UpdatePatientPayload {
  const nullableString = (value: string | undefined) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
  }
  const nullableDigits = (value: string | undefined) => {
    const digits = stripNonDigits(value ?? '')
    return digits ? digits : null
  }
  const nullableEnum = (value: string | undefined) => (value ? value : null)

  return {
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    phone_mobile: stripNonDigits(values.phone_mobile),

    social_name: nullableString(values.social_name),
    rg: nullableString(values.rg),
    document_type: nullableEnum(values.document_type),
    document_number: nullableString(values.document_number),
    birth_date: nullableString(values.birth_date),

    phone1: nullableDigits(values.phone1),
    phone2: nullableDigits(values.phone2),
    preferred_contact: nullableEnum(values.preferred_contact),

    sex: nullableEnum(values.sex),
    race: nullableEnum(values.race),
    ethnicity: nullableString(values.ethnicity),
    nationality: nullableString(values.nationality),
    naturality: nullableString(values.naturality),
    profession: nullableString(values.profession),
    marital_status: nullableEnum(values.marital_status),

    mother_name: nullableString(values.mother_name),
    mother_profession: nullableString(values.mother_profession),
    father_name: nullableString(values.father_name),
    father_profession: nullableString(values.father_profession),
    guardian_name: nullableString(values.guardian_name),
    guardian_cpf: nullableDigits(values.guardian_cpf),
    spouse_name: nullableString(values.spouse_name),

    cep: nullableDigits(values.cep),
    street: nullableString(values.street),
    number: nullableString(values.number),
    complement: nullableString(values.complement),
    neighborhood: nullableString(values.neighborhood),
    city: nullableString(values.city),
    state: nullableString(values.state),
    reference: nullableString(values.reference),

    blood_type: nullableEnum(values.blood_type),
    weight_kg: parseDecimal(values.weight_kg),
    height_m: parseDecimal(values.height_m),
    legacy_code: nullableString(values.legacy_code),
    rn_in_insurance: values.rn_in_insurance ?? false,
    vip: values.vip ?? false,
    notes: nullableString(values.notes),

    insurance_company: nullableString(values.insurance_company),
    insurance_plan: nullableString(values.insurance_plan),
    insurance_member_number: nullableString(values.insurance_member_number),
    insurance_card_valid_until: nullableString(values.insurance_card_valid_until),
    allergies: nullableString(values.allergies),
    medications_in_use: nullableString(values.medications_in_use),
    chronic_conditions: nullableString(values.chronic_conditions),
  }
}

function optionalString<K extends string>(key: K, value: string | undefined): Partial<Record<K, string>> {
  if (!value) return {}
  const trimmed = value.trim()
  return trimmed ? ({ [key]: trimmed } as Partial<Record<K, string>>) : {}
}

function optionalDigits<K extends string>(key: K, value: string | undefined): Partial<Record<K, string>> {
  if (!value) return {}
  const digits = stripNonDigits(value)
  return digits ? ({ [key]: digits } as Partial<Record<K, string>>) : {}
}

function optionalNumber<K extends string>(key: K, value: string | undefined): Partial<Record<K, number>> {
  const parsed = parseDecimal(value)
  if (parsed === null) return {}
  return { [key]: parsed } as Partial<Record<K, number>>
}

function handleApiError(
  error: unknown,
  action: 'create' | 'update',
  formRef: React.RefObject<PatientFormHandle | null>
) {
  if (error instanceof ApiError) {
    if (error.status === 429 || error.status === 500) {
      toastFromError(error, {})
      return
    }

    if (error.status === 403) {
      toastFromError(error, {
        permissionDescription: 'Você não tem permissão para realizar essa ação.',
      })
      return
    }

    if (error.status === 409) {
      if (error.code === REGISTER_CONFLICT_CODE) {
        toastFromError(error, { conflict: 'registration' })
        return
      }
      if (error.code === 'CPF_EXISTS' || /cpf/i.test(error.message)) {
        formRef.current?.setFieldError('cpf', error.message || 'CPF já cadastrado.')
        return
      }
      if (error.code === 'EMAIL_EXISTS' || /email/i.test(error.message)) {
        formRef.current?.setFieldError('email', error.message || 'Email já cadastrado.')
        return
      }
      toastFromError(error, { conflict: 'registration' })
      return
    }

    if (error.status === 400) {
      if (error.fieldErrors) {
        const fieldMap: Record<string, keyof CreatePatientValues> = {
          phone: 'phone_mobile',
        }
        for (const [field, msgs] of Object.entries(error.fieldErrors)) {
          const target = (fieldMap[field] ?? field) as keyof CreatePatientValues
          formRef.current?.setFieldError(target, msgs.join(', '))
        }
        return
      }
      toastFromError(error, {})
      return
    }

    toastFromError(error, {
      operationTitle:
        action === 'create' ? 'Erro ao cadastrar paciente' : 'Erro ao atualizar paciente',
    })
    return
  }

  toastFromError(error, {})
}
