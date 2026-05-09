import { Link } from 'react-router-dom'

import { BrandWordmark } from '@/features/auth/components/BrandWordmark'
import { contactMailtoHref, specialistMailtoHref } from '@/features/marketing/data'

export function LandingFooter() {
  return (
    <footer id="sobre" className="scroll-mt-24 bg-[var(--color-footer-bg)] py-16 text-[var(--color-footer-muted)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <BrandWordmark size="md" className="!text-[var(--color-accent)]" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed">
              MediConnect reúne agenda, pacientes, relatórios e comunicação numa só base alinhada à API RiseUP — dados
              confiáveis e rastreáveis.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">Soluções</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#solucoes" className="hover:text-[var(--color-surface)]">
                  Agenda inteligente
                </a>
              </li>
              <li>
                <a href="#solucoes" className="hover:text-[var(--color-surface)]">
                  Pacientes e laudos
                </a>
              </li>
              <li>
                <a href="#solucoes" className="hover:text-[var(--color-surface)]">
                  Comunicação automática
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">Produto</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#plataforma" className="hover:text-[var(--color-surface)]">
                  Funcionalidades principais
                </a>
              </li>
              <li>
                <a href="#contato" className="hover:text-[var(--color-surface)]">
                  Preços
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-[var(--color-surface)]">
                  Login corporativo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">Contato</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href={contactMailtoHref} className="hover:text-[var(--color-surface)]">
                  Suporte
                </a>
              </li>
              <li>
                <a href={specialistMailtoHref} className="hover:text-[var(--color-surface)]">
                  Vendas
                </a>
              </li>
              <li>
                <Link to="/cadastro" className="hover:text-[var(--color-surface)]">
                  Cadastro pacientes
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-[var(--color-footer-divider)] pt-8 text-center text-xs opacity-65">
          © {new Date().getFullYear()} MediConnect. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
