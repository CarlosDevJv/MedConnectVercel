import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Phone, Send, User } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInviteSecretaria } from '@/features/secretarias/hooks'
import {
  inviteSecretariaSchema,
  type InviteSecretariaValues,
} from '@/features/secretarias/schemas'
import { stripNonDigits } from '@/features/patients/utils/cpf'
import { formatPhone } from '@/features/patients/utils/phone'
import { ApiError } from '@/lib/apiClient'

export function SecretariaInviteForm() {
  const mutation = useInviteSecretaria()

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteSecretariaValues>({
    resolver: zodResolver(inviteSecretariaSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
    },
  })

  async function onSubmit(values: InviteSecretariaValues) {
    try {
      const response = await mutation.mutateAsync({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        phone: values.phone ? stripNonDigits(values.phone) : undefined,
      })
      toast.success('Convite enviado!', {
        description: response.message
          ? response.message
          : `Enviamos um Magic Link para ${values.email.trim()}.`,
      })
      reset()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          toast.error('Sem permissão', {
            description: 'Apenas admin/gestor podem convidar secretárias.',
          })
          return
        }

        if (error.status === 409) {
          if (error.code === 'EMAIL_EXISTS' || /email/i.test(error.message)) {
            setError('email', { message: error.message || 'Email já cadastrado.' })
            return
          }
          toast.error('Cadastro duplicado', { description: error.message })
          return
        }

        if (error.status === 400) {
          if (error.fieldErrors) {
            for (const [field, msgs] of Object.entries(error.fieldErrors)) {
              if (field === 'email' || field === 'full_name' || field === 'phone') {
                setError(field, { message: msgs.join(', ') })
              }
            }
            return
          }
          toast.error('Dados inválidos', { description: error.message })
          return
        }

        toast.error('Erro ao enviar convite', {
          description: error.message || 'Tente novamente.',
        })
        return
      }

      toast.error('Erro inesperado', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const submitting = isSubmitting || mutation.isPending

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="secretaria-name" required>
            Nome completo
          </Label>
          <Input
            id="secretaria-name"
            autoComplete="name"
            placeholder="Maria Souza"
            leftIcon={<User className="h-4 w-4" />}
            invalid={!!errors.full_name}
            {...register('full_name')}
          />
          <FieldError message={errors.full_name?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="secretaria-email" required>
            Email
          </Label>
          <Input
            id="secretaria-email"
            type="email"
            autoComplete="email"
            placeholder="maria@clinica.com"
            leftIcon={<Mail className="h-4 w-4" />}
            invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="secretaria-phone">Telefone</Label>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Input
                id="secretaria-phone"
                type="tel"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                leftIcon={<Phone className="h-4 w-4" />}
                invalid={!!errors.phone}
                value={formatPhone(field.value ?? '')}
                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                onBlur={field.onBlur}
                maxLength={16}
                ref={field.ref}
              />
            )}
          />
          <FieldError message={errors.phone?.message} />
        </div>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        A pessoa receberá um Magic Link por email para definir a senha e acessar a plataforma.
      </p>

      <Button type="submit" loading={submitting} className="self-end">
        <Send className="h-4 w-4" />
        {submitting ? 'Enviando convite...' : 'Enviar convite'}
      </Button>
    </form>
  )
}
