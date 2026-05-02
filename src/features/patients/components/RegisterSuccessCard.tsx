import { MailCheck } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router-dom'

import { BrandWordmark } from '@/features/auth/components/BrandWordmark'
import { Button } from '@/components/ui/button'

interface RegisterSuccessCardProps {
  email: string
}

export function RegisterSuccessCard({ email }: RegisterSuccessCardProps) {
  const titleRef = React.useRef<HTMLHeadingElement>(null)

  React.useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <div className="w-full max-w-[520px]" role="status" aria-live="polite">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-9 py-12 shadow-[0_8px_30px_rgba(20,20,40,0.06)] animate-fade-in-up">
        <div className="text-center">
          <BrandWordmark size="md" />
        </div>

        <div className="mt-8 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <MailCheck className="h-7 w-7" />
          </div>

          <h1
            ref={titleRef}
            tabIndex={-1}
            className="mt-5 font-display text-2xl font-semibold tracking-tight text-[var(--color-foreground)] outline-none"
          >
            Cadastro realizado!
          </h1>

          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            Enviamos um link de acesso para{' '}
            <span className="font-medium text-[var(--color-foreground)]">{email}</span>. Verifique
            sua caixa de entrada (e a pasta de spam) para entrar na plataforma.
          </p>

          <Button asChild fullWidth className="mt-7" size="lg">
            <Link to="/login">Voltar para login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
