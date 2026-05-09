import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'

import { contactMailtoHref, specialistMailtoHref } from '@/features/marketing/data'

export function LandingPricing() {
  return (
    <section
      aria-labelledby="pricing-heading"
      id="contato"
      className="scroll-mt-24 border-t border-[var(--color-border)] bg-[var(--color-surface-sidebar)] py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="pricing-heading"
          className="text-center font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl"
        >
          Escolha o plano ideal para você.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-[var(--color-muted-foreground)]">
          Planos que acompanham o crescimento da clínica: evolua módulos usuários ou SLA sempre que sua operação exigir.
        </p>

        <div className="mt-14 grid gap-8 lg:grid-cols-3 lg:items-stretch">
          <article className="flex flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">Básico</p>
            <p className="mt-4 text-5xl font-bold tracking-tight text-[var(--color-accent-ink)]">
              R$ 297<span className="text-2xl font-semibold text-[var(--color-muted-foreground)]"> /mês</span>
            </p>
            <p className="mt-4 text-[15px] text-[var(--color-muted-foreground)]">
              Base sólida para agenda comunicação inicial cadastro pacientes relatórios operação diária primeira unidade.
            </p>
            <ul className="mt-10 flex flex-1 flex-col gap-3 text-sm text-[var(--color-muted-foreground)]">
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Agenda inteligente com confirmação integrada</span>
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Cadastro e histórico básicos de pacientes</span>
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Relatório operação essencial</span>
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Suporte por email</span>
              </li>
            </ul>
            <Link
              to="/login"
              className="mt-10 inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-solid)] text-base font-semibold text-white hover:bg-[var(--color-accent-solid-hover)]"
            >
              Começar agora
            </Link>
          </article>

          <article className="relative flex flex-col rounded-[var(--radius-md)] border-2 border-[var(--color-accent-solid)] bg-[var(--color-surface)] p-8 pt-10 shadow-[var(--shadow-elevated)] ring-[6px] ring-[var(--color-accent-soft)]/90">
            <span className="absolute -top-4 left-1/2 inline-flex -translate-x-1/2 rounded-full bg-[var(--color-accent-solid)] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              Mais popular
            </span>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Profissional
            </p>
            <p className="mt-4 text-5xl font-bold tracking-tight text-[var(--color-accent-ink)]">
              R$ 397<span className="text-2xl font-semibold text-[var(--color-muted-foreground)]"> /mês</span>
            </p>
            <p className="mt-4 text-[15px] text-[var(--color-muted-foreground)]">
              Operações em ritmo forte com pacientes, agenda, SMS e relatórios clínicos conforme a API RiseUP.
            </p>
            <ul className="mt-10 flex flex-1 flex-col gap-3 text-sm text-[var(--color-muted-foreground)]">
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Tudo do plano Básico</span>
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Cadastro de pacientes e laudos (recursos documentados)</span>
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Relatórios clínicos e operacionais</span>
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>SMS transacional (contrato RiseUP)</span>
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Suporte estendido e armazenamento ampliado</span>
              </li>
            </ul>
            <Link
              to="/login"
              className="mt-10 inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-solid)] text-base font-semibold text-white hover:bg-[var(--color-accent-solid-hover)]"
            >
              Começar agora
            </Link>
          </article>

          <article className="flex flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">Consultoria</p>
            <p className="mt-8 text-[2rem] font-bold leading-snug tracking-tight text-[var(--color-accent-ink)] sm:text-[2.35rem]">
              Fale com um consultor
            </p>
            <p className="mt-4 text-[15px] text-[var(--color-muted-foreground)]">
              Redes com múltiplas unidades integrações sob medida SLA dedicado e projeto de implantação acompanhado de perto.
            </p>
            <ul className="mt-10 flex flex-1 flex-col gap-3 text-sm text-[var(--color-muted-foreground)]">
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Contrato personalizado com roadmap combinado</span>
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Multi-unidade com governança reforçada</span>
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Treinamentos e suporte priorizado</span>
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <span>Trilhas de compliance alinhadas ao seu jurídico</span>
              </li>
            </ul>
            <a
              href={contactMailtoHref}
              className="mt-10 inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] border-2 border-[var(--color-accent-solid)] text-base font-semibold text-[var(--color-accent-solid)] hover:bg-[var(--color-accent-soft)]"
            >
              Entrar em contato
            </a>
          </article>
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-card)]">
          <p className="text-[15px] text-[var(--color-muted-foreground)]">
            Monte combinações de módulos SLA e projeto de onboarding com ajuda direta da equipe comercial MediConnect.
          </p>
          <a
            href={specialistMailtoHref}
            className="mt-8 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-solid)] px-10 text-base font-semibold text-white hover:bg-[var(--color-accent-solid-hover)] sm:mx-auto"
          >
            Conversar com um especialista
          </a>
        </div>
      </div>
    </section>
  )
}
