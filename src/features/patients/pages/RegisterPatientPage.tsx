import * as React from 'react'
import { Link } from 'react-router-dom'

import { BrandWordmark } from '@/features/auth/components/BrandWordmark'
import { RegisterPatientForm } from '@/features/patients/components/RegisterPatientForm'
import { RegisterSuccessCard } from '@/features/patients/components/RegisterSuccessCard'

export function RegisterPatientPage() {
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null)

  if (registeredEmail) {
    return <RegisterSuccessCard email={registeredEmail} />
  }

  return (
    <div className="w-full max-w-[520px]">
      <div className="mb-6 text-center animate-fade-in-up">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline"
        >
          <span aria-hidden="true">&larr;</span> Voltar para login
        </Link>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-9 py-10 shadow-[0_8px_30px_rgba(20,20,40,0.06)] animate-fade-in-up-delay-1">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <BrandWordmark size="md" />
          <h1 className="font-display text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
            Cadastro de paciente
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Crie sua conta para agendar consultas. Você receberá um link de acesso por email.
          </p>
        </div>

        <RegisterPatientForm onSuccess={setRegisteredEmail} />
      </div>
    </div>
  )
}
