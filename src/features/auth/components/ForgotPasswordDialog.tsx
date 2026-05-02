import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, MailCheck } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { requestPasswordReset } from '@/features/auth/api'
import { emailOnlySchema, type EmailOnlyValues } from '@/features/auth/schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/apiClient'

interface ForgotPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail?: string
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail,
}: ForgotPasswordDialogProps) {
  const [sentTo, setSentTo] = React.useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailOnlyValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: defaultEmail ?? '' },
  })

  function handleOpenChange(next: boolean) {
    if (next) {
      reset({ email: defaultEmail ?? '' })
      setSentTo(null)
    }
    onOpenChange(next)
  }

  async function onSubmit(values: EmailOnlyValues) {
    try {
      await requestPasswordReset(values.email)
      setSentTo(values.email)
      toast.success('Email enviado!', {
        description: 'Verifique sua caixa de entrada.',
      })
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors?.email) {
        setError('email', { message: error.fieldErrors.email.join(', ') })
      } else {
        toast.error('Não foi possível enviar o email', {
          description:
            error instanceof Error ? error.message : 'Tente novamente em alguns instantes.',
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {sentTo ? (
          <div className="flex flex-col items-center gap-4 py-3 text-center" role="status">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <MailCheck className="h-6 w-6" />
            </div>
            <DialogHeader className="items-center text-center sm:text-center">
              <DialogTitle>Email enviado</DialogTitle>
              <DialogDescription>
                Enviamos um link para redefinir sua senha para{' '}
                <span className="font-medium text-[var(--color-foreground)]">{sentTo}</span>.
                Verifique sua caixa de entrada (e a pasta de spam).
              </DialogDescription>
            </DialogHeader>
            <Button variant="outline" fullWidth onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogHeader>
              <DialogTitle>Redefinir senha</DialogTitle>
              <DialogDescription>
                Informe seu email cadastrado e enviaremos um link para criar uma nova senha.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 flex flex-col gap-1.5">
              <Label htmlFor="reset-email" required>
                Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="nome@mediconnect.com"
                leftIcon={<Mail className="h-4 w-4" />}
                invalid={!!errors.email}
                aria-describedby={errors.email ? 'reset-email-error' : undefined}
                {...register('email')}
              />
              <FieldError id="reset-email-error" message={errors.email?.message} />
            </div>

            <Button type="submit" fullWidth className="mt-5" loading={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar link'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
