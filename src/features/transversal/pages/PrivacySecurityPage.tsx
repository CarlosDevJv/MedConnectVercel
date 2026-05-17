import { Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function PrivacySecurityPage() {
  return (
    <div className="relative mx-auto max-w-[740px]">
      <div
        aria-hidden="true"
        className="dot-pattern absolute -inset-6 bottom-auto left-[-4%] right-auto top-[-2rem] z-0 h-48 max-w-xl opacity-[0.12]"
      />

      <header className="relative mb-10 flex flex-col gap-5 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-emerald-800">
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

        <Alert variant="warning" className="border-amber-300/70">
          <AlertTitle>Substituir texto por versão oficial do jurídico/DPO</AlertTitle>
          <AlertDescription>
            Os parágrafos abaixo são esqueleto informativo para orientar o uso do aplicativo MediConnect até o parecer jurídico final.
            Voltar também ao hub em{' '}
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
          <h2 className="font-display text-[1.125rem] font-medium text-[var(--color-foreground)]">4. Auditoria operacional vs. relatório clínico</h2>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Esta aplicação <strong>não disponibiliza auditoria granular de todas as ações de usuários</strong> até existir recurso técnico e contrato
            explícitos com o produto/backend. Histórico de SMS via <code>sms_logs</code> faz parte apenas do fluxo já documentado de comunicação pelo Twilio quando habilitado.
          </p>
        </section>

        <footer className="border-t border-[var(--color-border)] pt-6">
          <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
            <strong className="text-[var(--color-foreground)]">Contatos</strong> — Definir e-mail institucional (ex.: privacidade@clinica…) e SLA de resposta antes de disponibilização em produção.
          </p>
        </footer>
      </article>
    </div>
  )
}
