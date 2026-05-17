import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { loginWithPassword } from '@/features/auth/api'
import { BrandWordmark } from '@/features/auth/components/BrandWordmark'
import { logoutSession } from '@/features/auth/logoutSession'
import { ForgotPasswordDialog } from '@/features/auth/components/ForgotPasswordDialog'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HTTP_ERROR_RATE_LIMIT } from '@/lib/httpErrorMessages'
import { getSupabase } from '@/lib/supabase'

export function LoginCard() {
  const navigate = useNavigate()
  const { refreshUserInfo } = useAuth()
  const [loginGateReady, setLoginGateReady] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [forgotOpen, setForgotOpen] = React.useState(false)
  const [defaultForgotEmail, setDefaultForgotEmail] = React.useState('')

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: true,
    },
  })

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const {
          data: { session },
        } = await getSupabase().auth.getSession()
        if (cancelled) return
        if (session) await logoutSession()
      } catch {
        // sessão residual ou storage bloqueado — segue para o formulário
      } finally {
        if (!cancelled) setLoginGateReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function openForgotDialog() {
    setDefaultForgotEmail(getValues('email') ?? '')
    setForgotOpen(true)
  }

  async function onSubmit(values: LoginValues) {
    try {
      await loginWithPassword({
        email: values.email,
        password: values.password,
        remember: values.remember ?? true,
      })
      await refreshUserInfo()
      toast.success('Login realizado com sucesso.')
      navigate('/app', { replace: true })
    } catch (error) {
      const rawMsg = error instanceof Error ? error.message : ''
      const lower = rawMsg.toLowerCase()
      if (
        lower.includes('rate') ||
        lower.includes('too many') ||
        lower.includes('429') ||
        lower.includes('over_email_send_rate')
      ) {
        toast.error(HTTP_ERROR_RATE_LIMIT)
        return
      }
      const message =
        error instanceof Error
          ? lower.includes('invalid login')
            ? 'Email ou senha incorretos.'
            : error.message
          : 'Não foi possível autenticar. Tente novamente.'
      toast.error('Falha no login', { description: message })
    }
  }

  if (!loginGateReady) {
    return (
      <div
        role="status"
        aria-label="Carregando"
        className="grid w-full max-w-[420px] place-items-center py-16"
      >
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
      </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-[420px]">
        <div className="mb-6 text-center animate-fade-in-up">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline"
          >
            <span aria-hidden="true">&larr;</span> Voltar ao início
          </Link>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-9 py-10 shadow-[0_8px_30px_rgba(20,20,40,0.06)] animate-fade-in-up-delay-1">
          <div className="mb-7 text-center">
            <BrandWordmark size="lg" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nome@mediconnect.com"
                leftIcon={<Mail className="h-4 w-4" />}
                invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              <FieldError id="email-error" message={errors.email?.message} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="********"
                leftIcon={<Lock className="h-4 w-4" />}
                invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...register('password')}
              />
              <FieldError id="password-error" message={errors.password?.message} />
            </div>

            <div className="flex items-center justify-between">
              <Controller
                control={control}
                name="remember"
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-foreground)]">
                    <Checkbox
                      checked={field.value ?? true}
                      onCheckedChange={(value) => field.onChange(value === true)}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                    Lembrar-me
                  </label>
                )}
              />
              <button
                type="button"
                onClick={openForgotDialog}
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                Esqueceu sua senha?
              </button>
            </div>

            <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="mt-1.5">
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>

      <ForgotPasswordDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        defaultEmail={defaultForgotEmail}
      />
    </>
  )
}
