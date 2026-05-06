import { ArrowLeft } from 'lucide-react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  DoctorForm,
  type DoctorFormHandle,
} from '@/features/doctors/components/DoctorForm'
import { useCreateDoctor } from '@/features/doctors/hooks'
import type { CreateDoctorValues, CreateDoctorWithPasswordValues } from '@/features/doctors/schemas'
import { stripNonDigits } from '@/features/patients/utils/cpf'
import { ApiError } from '@/lib/apiClient'

export function DoctorPasswordCreatePage() {
  const navigate = useNavigate()
  const formRef = React.useRef<DoctorFormHandle>(null)
  const createMutation = useCreateDoctor()

  async function handleSubmit(values: CreateDoctorWithPasswordValues) {
    try {
      const response = await createMutation.mutateAsync({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        cpf: stripNonDigits(values.cpf),
        crm: stripNonDigits(values.crm),
        crm_uf: values.crm_uf.toUpperCase(),
        password: values.password,
        phone_mobile: values.phone_mobile ? stripNonDigits(values.phone_mobile) : undefined,
        specialty: values.specialty?.trim() || undefined,
        birth_date: values.birth_date || undefined,
      })
      toast.success('Médico cadastrado com senha', {
        description: `${values.full_name.trim()} já pode entrar na plataforma.`,
      })
      if (response.doctor_id) {
        navigate(`/app/medicos/${response.doctor_id}`, { replace: true })
      } else {
        navigate('/app/medicos', { replace: true })
      }
    } catch (error) {
      handleDoctorCreatePasswordError(error, formRef)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/app/medicos')}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Admin • Médico
        </p>
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">
          Novo médico (senha + CRM)
        </h1>
        <p className="max-w-[640px] text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          Fluxo RiseUP / Apidog:{' '}
          <code className="rounded-md bg-[var(--color-muted)] px-1 font-mono text-xs">
            POST /functions/v1/create-user-with-password
          </code>{' '}
          com <code className="rounded-md bg-[var(--color-muted)] px-1 font-mono text-xs">role</code>{' '}
          <span className="font-mono text-xs">medico</span> e dados de CRM para criar o perfil médico com
          senha inicial (e-mail auto-confirmado).
        </p>
      </header>

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <DoctorForm
          ref={formRef}
          mode="create"
          withPassword
          onSubmit={handleSubmit}
          onCancel={() => navigate('/app/medicos')}
          submitting={createMutation.isPending}
        />
      </section>
    </div>
  )
}

function handleDoctorCreatePasswordError(
  error: unknown,
  formRef: React.RefObject<DoctorFormHandle | null>
) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      toast.error('Sem permissão', {
        description: 'Você não tem permissão para realizar essa ação.',
      })
      return
    }

    if (error.status === 409) {
      if (error.code === 'CPF_EXISTS' || /cpf/i.test(error.message)) {
        formRef.current?.setFieldError('cpf', error.message || 'CPF já cadastrado.')
        return
      }
      if (error.code === 'EMAIL_EXISTS' || /email/i.test(error.message)) {
        formRef.current?.setFieldError('email', error.message || 'Email já cadastrado.')
        return
      }
      if (/crm/i.test(error.message)) {
        formRef.current?.setFieldError('crm', error.message || 'CRM já cadastrado.')
        return
      }
      toast.error('Cadastro duplicado', { description: error.message })
      return
    }

    if (error.status === 400) {
      if (error.fieldErrors) {
        for (const [field, msgs] of Object.entries(error.fieldErrors)) {
          formRef.current?.setFieldError(
            field as keyof CreateDoctorValues | 'password',
            msgs.join(', ')
          )
        }
        return
      }
      toast.error('Dados inválidos', { description: error.message })
      return
    }

    toast.error('Erro ao cadastrar médico', {
      description: error.message || 'Tente novamente.',
    })
    return
  }

  toast.error('Erro inesperado', {
    description: error instanceof Error ? error.message : 'Tente novamente.',
  })
}
