import { ArrowLeft, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function PrivacySecurityPage() {
  return (
    <div className="relative mx-auto max-w-[740px]">
      <div
        aria-hidden="true"
        className="dot-pattern absolute -inset-6 bottom-auto left-[-4%] right-auto top-[-2rem] z-0 h-48 max-w-xl opacity-[0.12]"
      />

      <Button
        type="button"
        variant="ghost"
        className="w-fit gap-2 px-2 text-[var(--color-muted-foreground)] mb-6"
        asChild
      >
        <Link to="/app/seguranca-e-notificacoes">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Segurança
        </Link>
      </Button>

      <header className="relative mb-10 flex flex-col gap-5 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)]">
            <Shield className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted-foreground)]">
              Institucional
            </p>
            <h1 className="font-display mt-1 text-[2rem] font-medium tracking-tight text-[var(--color-foreground)]">
              Privacidade, segurança e dados
            </h1>
          </div>
        </div>

        <Alert variant="info">
          <AlertTitle>Diretrizes de Segurança e Privacidade</AlertTitle>
          <AlertDescription>
            As diretrizes abaixo apresentam as políticas de segurança e proteção de dados em conformidade com as normas vigentes.
            Você também pode gerenciar as suas notificações em{' '}
            <Link to="/app/seguranca-e-notificacoes" className="font-medium underline-offset-4 hover:underline">
              Segurança &amp; canais de aviso
            </Link>
            .
          </AlertDescription>
        </Alert>
      </header>

      <article className="relative flex animate-fade-in-up-delay-1 flex-col gap-10 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-10 shadow-xl">
        <section className="space-y-3">
          <h2 className="font-display text-[1.125rem] font-medium text-[var(--color-foreground)]">1. Dados tratados na plataforma</h2>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Dados cadastrais, clínicos e operacionais inseridos por usuários autorizados. A finalidade, base legal e retenção dependem das práticas
            da instituição de saúde — este template não substitui registro ou avaliações de conformidade próprios.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-[1.125rem] font-medium text-[var(--color-foreground)]">2. Direitos sob a LGPD (resumo)</h2>
          <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            <li>Confirmar existência de tratamento e solicitar cópia de dados pessoais, quando aplicável.</li>
            <li>Cadastrar inconsistências ou pedir anonimização/eliminação conforme permissões médicas-legais aplicáveis.</li>
            <li>Registrar reclamações à Autoridade Nacional de Proteção de Dados (ANPD) nos termos vigentes.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-[1.125rem] font-medium text-[var(--color-foreground)]">3. Segurança técnica (alto nível)</h2>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Credenciais (JWT/API keys configuradas pelo cliente Supabase), transporte criptografado via HTTPS nas integrações públicas ao browser e
            funções hospedadas no provedor configurado pela equipe. Detalhar em documentação interna a matriz IAM/RLS.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-[1.125rem] font-medium text-[var(--color-foreground)]">4. Em desenvolvimento</h2>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Novos recursos de auditoria e relatórios de atividades estão em fase de desenvolvimento e serão disponibilizados nas próximas atualizações do sistema.
          </p>
        </section>

        <footer className="border-t border-[var(--color-border)] pt-6">
          <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
            <strong className="text-[var(--color-foreground)]">MediConnect 2026</strong>
          </p>
        </footer>
      </article>
    </div>
  )
}
