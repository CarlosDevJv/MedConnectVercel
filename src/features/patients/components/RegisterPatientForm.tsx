import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, IdCard, Mail, Phone, User } from 'lucide-react'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { registerPatient } from '@/features/patients/api'
import {
  registerPatientSchema,
  type RegisterPatientValues,
} from '@/features/patients/schemas'
import { formatCpf, stripNonDigits } from '@/features/patients/utils/cpf'
import { formatPhone } from '@/features/patients/utils/phone'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/apiClient'

interface RegisterPatientFormProps {
  onSuccess: (email: string) => void
}

const RATE_LIMIT_LOCK_SECONDS = 60

export function RegisterPatientForm({ onSuccess }: RegisterPatientFormProps) {
  const [secondsLeft, setSecondsLeft] = React.useState(0)

  React.useEffect(() => {
    if (secondsLeft <= 0) return
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [secondsLeft])

  const isLocked = secondsLeft > 0

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPatientValues>({
    resolver: zodResolver(registerPatientSchema),
    defaultValues: {
      full_name: '',
      email: '',
      cpf: '',
      phone_mobile: '',
      birth_date: '',
    },
  })

  async function onSubmit(values: RegisterPatientValues) {
    try {
      const response = await registerPatient({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        cpf: stripNonDigits(values.cpf),
        phone_mobile: stripNonDigits(values.phone_mobile),
        birth_date: values.birth_date || undefined,
      })
      onSuccess(response.email ?? values.email.trim())
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          if (error.code === 'CPF_EXISTS') {
            setError('cpf', { message: error.message || 'CPF já cadastrado.' })
            return
          }
          if (error.code === 'EMAIL_EXISTS') {
            setError('email', { message: error.message || 'Email já cadastrado.' })
            return
          }
          const lower = error.message.toLowerCase()
          if (lower.includes('cpf')) {
            setError('cpf', { message: error.message })
            return
          }
          if (lower.includes('email')) {
            setError('email', { message: error.message })
            return
          }
          toast.error('Cadastro duplicado', { description: error.message })
          return
        }

        if (error.status === 429) {
          setSecondsLeft(RATE_LIMIT_LOCK_SECONDS)
          toast.error('Muitas tentativas', {
            description: 'Tente novamente em alguns instantes.',
          })
          return
        }

        if (error.status === 400) {
          if (error.code === 'INVALID_CPF') {
            setError('cpf', { message: error.message || 'CPF inválido.' })
            return
          }
          if (error.fieldErrors) {
            const map: Record<string, keyof RegisterPatientValues> = {
              cpf: 'cpf',
              email: 'email',
              full_name: 'full_name',
              phone_mobile: 'phone_mobile',
              birth_date: 'birth_date',
            }
            for (const [apiField, msgs] of Object.entries(error.fieldErrors)) {
              const formField = map[apiField]
              if (formField) {
                setError(formField, { message: msgs.join(', ') })
              }
            }
            return
          }
          toast.error('Dados inválidos', { description: error.message })
          return
        }

        toast.error('Erro ao processar cadastro', {
          description: error.message || 'Tente novamente.',
        })
        return
      }

      toast.error('Erro inesperado', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="full_name" required>
            Nome completo
          </Label>
          <Input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Maria Silva"
            leftIcon={<User className="h-4 w-4" />}
            invalid={!!errors.full_name}
            aria-describedby={errors.full_name ? 'full_name-error' : undefined}
            {...register('full_name')}
          />
          <FieldError id="full_name-error" message={errors.full_name?.message} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="register-email" required>
            Email
          </Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="nome@exemplo.com"
            leftIcon={<Mail className="h-4 w-4" />}
            invalid={!!errors.email}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            {...register('email')}
          />
          <FieldError id="register-email-error" message={errors.email?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cpf" required>
            CPF
          </Label>
          <Controller
            control={control}
            name="cpf"
            render={({ field }) => (
              <Input
                id="cpf"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                leftIcon={<IdCard className="h-4 w-4" />}
                invalid={!!errors.cpf}
                aria-describedby={errors.cpf ? 'cpf-error' : undefined}
                value={formatCpf(field.value)}
                onChange={(e) => field.onChange(formatCpf(e.target.value))}
                onBlur={field.onBlur}
                maxLength={14}
                ref={field.ref}
              />
            )}
          />
          <FieldError id="cpf-error" message={errors.cpf?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone_mobile" required>
            Celular
          </Label>
          <Controller
            control={control}
            name="phone_mobile"
            render={({ field }) => (
              <Input
                id="phone_mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="(11) 99999-9999"
                leftIcon={<Phone className="h-4 w-4" />}
                invalid={!!errors.phone_mobile}
                aria-describedby={errors.phone_mobile ? 'phone_mobile-error' : undefined}
                value={formatPhone(field.value)}
                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                onBlur={field.onBlur}
                maxLength={16}
                ref={field.ref}
              />
            )}
          />
          <FieldError id="phone_mobile-error" message={errors.phone_mobile?.message} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="birth_date">Data de nascimento (opcional)</Label>
          <Input
            id="birth_date"
            type="date"
            autoComplete="bday"
            leftIcon={<Calendar className="h-4 w-4" />}
            invalid={!!errors.birth_date}
            aria-describedby={errors.birth_date ? 'birth_date-error' : undefined}
            {...register('birth_date')}
          />
          <FieldError id="birth_date-error" message={errors.birth_date?.message} />
        </div>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Ao continuar, você concorda em receber um email com link de acesso à plataforma.
      </p>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={isLocked}
        className="mt-1"
      >
        {isLocked
          ? `Aguarde ${secondsLeft}s para tentar novamente`
          : isSubmitting
            ? 'Criando conta...'
            : 'Criar conta'}
      </Button>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        Já tem conta?{' '}
        <Link to="/login" className="text-[var(--color-accent)] hover:underline">
          Faça login
        </Link>
      </p>
    </form>
  )
}
