import { LockKeyhole, ShieldCheck } from 'lucide-react'

export function LandingSecurity() {
  return (
    <section
      aria-labelledby="security-heading"
      className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="security-heading"
          className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl"
        >
          Seus dados <span className="text-[var(--color-accent-ink)]">protegidos</span>.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted-foreground)]">
          Dados médicos são ativos estratégicos — por isso confidencialidade disponibilidade e conformidade ficam lado a lado
          com performance operacional.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-solid)]">
              <ShieldCheck className="h-7 w-7" aria-hidden />
            </span>
            <h3 className="mt-8 text-xl font-semibold text-[var(--color-foreground)]">Conforme com LGPD</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
              Governança alinhada à LGPD — bases legais, registro de tratamento e transparência com pacientes, sempre dentro
              da conta da sua clínica.
            </p>
          </article>
          <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-solid)]">
              <LockKeyhole className="h-7 w-7" aria-hidden />
            </span>
            <h3 className="mt-8 text-xl font-semibold text-[var(--color-foreground)]">Dados seguros</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
              Conexões criptografadas armazenamento em provedores alinhados a boas práticas de segurança e políticas de
              acesso atualizadas.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
