import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  BarChart3,
  Bell,
  Calendar,
  Clock,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  Stethoscope,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import * as React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useOptionalInAppNotifications } from '@/app/notifications/InAppNotificationsContext'
import { RolelessBanner } from '@/app/layouts/RolelessBanner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { BrandWordmark } from '@/features/auth/components/BrandWordmark'
import { MediConnectLogoMark } from '@/features/auth/components/MediConnectLogoMark'
import { useAuth } from '@/features/auth/useAuth'
import { ROLE_LABELS, pickPrimaryRole, type UserRole } from '@/types/user'
import {
  AGENDA_ROLES,
  ANALYTICS_ROLES,
  COMMUNICATIONS_ROLES,
  DOCTOR_DIRECTORY_ROLES,
  PATIENT_READ_ROLES,
  REPORT_ROLES,
  SECRETARIA_MANAGEMENT_ROLES,
  SIDEBAR_DASHBOARD_FALLBACK_ROLES,
} from '@/lib/roleGroups'
import { AppointmentRemindersRunner } from '@/features/agenda/components/AppointmentRemindersRunner'
import { cn } from '@/lib/cn'

const SIDEBAR_STORAGE_KEY = 'mediconnect.sidebar'

/** Documentação oficial RiseUP/publicada para o contrato REST deste aplicativo */
const RISEUP_APIDOG_URL = 'https://do5wegrct3.apidog.io'

const DROPDOWN_PANEL_CLASS =
  'z-50 min-w-[260px] max-w-[calc(100vw-2rem)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-xl'

const HEADER_ICON_BTN_CLASS =
  'grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] outline-none transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]/35'

function HeaderIconActions() {
  const navigate = useNavigate()
  const notifications = useOptionalInAppNotifications()

  return (
    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className={HEADER_ICON_BTN_CLASS} aria-label="Notificações">
            <Bell className="h-[18px] w-[18px]" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className={cn(DROPDOWN_PANEL_CLASS, 'overflow-hidden')}
          >
            <div className="border-b border-[var(--color-border)] px-3 py-2.5">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">Notificações</p>
            </div>
            <div className="max-h-64 overflow-y-auto px-1 py-2">
              {notifications?.items.length ? (
                <>
                  {notifications.items.map((n) => (
                    <div
                      key={n.id}
                      className="border-b border-[var(--color-border)]/70 px-2 py-2 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-[var(--color-foreground)]">{n.title}</p>
                      {n.body ? (
                        <p className="mt-0.5 text-xs leading-snug text-[var(--color-muted-foreground)]">
                          {n.body}
                        </p>
                      ) : null}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-xs font-medium text-[var(--color-accent)] hover:underline"
                    onClick={() => notifications.clear()}
                  >
                    Limpar lista
                  </button>
                </>
              ) : (
                <>
                  <p className="px-2 pb-1 text-sm text-[var(--color-foreground)]">
                    Nenhuma notificação nova.
                  </p>
                  <p className="px-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                    Lembretes por SMS aparecem aqui quando enviados (app aberto).
                  </p>
                </>
              )}
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className={HEADER_ICON_BTN_CLASS} aria-label="Configurações">
            <Settings className="h-[18px] w-[18px]" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={6} className={cn(DROPDOWN_PANEL_CLASS, 'p-1')}>
            <div className="px-2 py-2 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Conta
              </p>
            </div>
            <DropdownMenu.Item
              className="cursor-pointer rounded-[6px] px-3 py-2 text-sm outline-none hover:bg-[var(--color-accent-soft)] focus:bg-[var(--color-accent-soft)]"
              onSelect={() => navigate('/app/seguranca-e-notificacoes')}
            >
              <span className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 shrink-0" />
                Segurança
              </span>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              disabled
              className="cursor-not-allowed rounded-[6px] px-3 py-2 text-sm outline-none opacity-50"
            >
              Perfil e segurança
            </DropdownMenu.Item>
            <DropdownMenu.Item
              disabled
              className="cursor-not-allowed rounded-[6px] px-3 py-2 text-sm outline-none opacity-50"
            >
              Preferências do sistema
            </DropdownMenu.Item>
            <div className="px-3 py-2 pt-1">
              <p className="text-[11px] text-[var(--color-muted-foreground)]">Disponível em breve.</p>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className={HEADER_ICON_BTN_CLASS} aria-label="Ajuda">
            <HelpCircle className="h-[18px] w-[18px]" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className={cn(DROPDOWN_PANEL_CLASS, 'overflow-hidden')}
          >
            <div className="border-b border-[var(--color-border)] px-3 py-2.5">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">Ajuda</p>
            </div>
            <DropdownMenu.Item
              className="cursor-pointer rounded-[6px] px-3 py-2.5 text-sm outline-none hover:bg-[var(--color-accent-soft)] focus:bg-[var(--color-accent-soft)]"
              onSelect={() => {
                window.open(RISEUP_APIDOG_URL, '_blank', 'noopener,noreferrer')
              }}
            >
              Abrir documentação RiseUP (Apidog)
            </DropdownMenu.Item>
            <div className="px-3 py-3">
              <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                Contrato HTTP público das operações usadas pelo app.
              </p>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

function getInitialExpanded(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) return stored === 'true'
  } catch {
    // ignore
  }
  return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
}

interface NavItem {
  id: string
  icon: LucideIcon
  label: string
  to?: string
  comingSoon?: boolean
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: 'Início',
    to: '/app',
    roles: [...SIDEBAR_DASHBOARD_FALLBACK_ROLES],
  },
  {
    id: 'pacientes',
    icon: Users,
    label: 'Pacientes',
    to: '/app/pacientes',
    roles: [...PATIENT_READ_ROLES],
  },
  {
    id: 'medicos',
    icon: Stethoscope,
    label: 'Médicos',
    to: '/app/medicos',
    roles: [...DOCTOR_DIRECTORY_ROLES],
  },
  {
    id: 'minha-disponibilidade',
    icon: Clock,
    label: 'Minha disponibilidade',
    to: '/app/disponibilidade',
    roles: ['medico'],
  },
  {
    id: 'secretarias',
    icon: UserPlus,
    label: 'Secretárias',
    to: '/app/secretarias',
    roles: [...SECRETARIA_MANAGEMENT_ROLES],
  },
  {
    id: 'agenda',
    icon: Calendar,
    label: 'Agenda',
    to: '/app/agenda',
    roles: [...AGENDA_ROLES],
  },
  {
    id: 'reports',
    icon: FileText,
    label: 'Relatórios',
    to: '/app/relatorios',
    roles: [...REPORT_ROLES],
  },
  {
    id: 'indicadores',
    icon: BarChart3,
    label: 'Indicadores',
    to: '/app/indicadores',
    roles: [...ANALYTICS_ROLES],
  },
  {
    id: 'chat',
    icon: MessageSquare,
    label: 'Mensagens',
    to: '/app/mensagens',
    roles: [...COMMUNICATIONS_ROLES],
  },
]

export function AppShell() {
  const { userInfo, signOut } = useAuth()
  const navigate = useNavigate()
  const [expanded, setExpanded] = React.useState(getInitialExpanded)
  const [signingOut, setSigningOut] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  const role = pickPrimaryRole(userInfo?.roles)
  const fullName = userInfo?.profile?.full_name ?? userInfo?.user?.email ?? 'Usuário'
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!userInfo?.roles?.length) return item.id === 'dashboard'
    return item.roles.some((r) => userInfo.roles.includes(r))
  })

  function toggleExpanded() {
    setExpanded((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        toggleExpanded()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      toast.success('Sessão encerrada.')
      navigate('/login', { replace: true })
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível encerrar a sessão.')
      setSigningOut(false)
    }
  }

  const sidebarSupportClass = cn(
    'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-[13px] font-medium text-[var(--color-muted-foreground)] outline-none transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]/35',
    !expanded && 'justify-center px-0 py-2'
  )

  return (
    <div className="flex min-h-dvh bg-[var(--color-background)]">
      <AppointmentRemindersRunner />
      <aside
        className={cn(
          'hidden sm:flex shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-sidebar)] transition-[width] duration-200',
          expanded ? 'w-[260px]' : 'w-[76px]'
        )}
        aria-expanded={expanded}
      >
        <div
          className={cn(
            'flex min-h-16 shrink-0 items-center border-b border-[var(--color-border)] py-3',
            expanded ? 'gap-3 px-4' : 'justify-center px-2'
          )}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <MediConnectLogoMark
              className="h-[22px] w-[22px]"
              title={expanded ? undefined : 'MediConnect'}
            />
          </div>
          {expanded && (
            <div className="min-w-0 flex-1">
              <BrandWordmark
                variant="textOnly"
                size="sm"
                className="block truncate leading-tight"
              />
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
          {expanded && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Principal
            </p>
          )}
          {visibleItems.map((item) => (
            <SidebarItem key={item.id} item={item} expanded={expanded} />
          ))}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-[var(--color-border)] p-2">
          <a
            href={RISEUP_APIDOG_URL}
            target="_blank"
            rel="noreferrer"
            className={sidebarSupportClass}
            aria-label="Documentação da API RiseUP (Apidog)"
          >
            <FileText className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
            {expanded && <span>API RiseUP</span>}
          </a>

          {expanded ? (
            <div className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)]">
                {initials || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight text-[var(--color-foreground)]">{fullName}</p>
                <p className="truncate text-[11px] leading-tight text-[var(--color-muted-foreground)]">
                  {ROLE_LABELS[role]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                aria-label="Sair"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                aria-label="Sair"
                className="mx-auto grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-50"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-full max-w-[320px] flex-col bg-[var(--color-surface-sidebar)] p-0" showClose>
          <SheetHeader className="border-b border-[var(--color-border)]">
            <SheetTitle className="text-lg font-semibold text-[var(--color-foreground)]">Menu</SheetTitle>
          </SheetHeader>
          <SheetBody className="flex flex-1 flex-col gap-1 py-4">
            {visibleItems.map((item) => (
              <MobileNavRow key={item.id} item={item} onNavigate={() => setMobileNavOpen(false)} />
            ))}
          </SheetBody>
          <div className="shrink-0 space-y-3 border-t border-[var(--color-border)] p-4">
            <a
              href={RISEUP_APIDOG_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-muted)]/50"
              onClick={() => setMobileNavOpen(false)}
            >
              <FileText className="h-4 w-4 shrink-0" />
              Documentação da API
            </a>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)]">
                {initials || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-foreground)]">{fullName}</p>
                <p className="truncate text-xs text-[var(--color-muted-foreground)]">{ROLE_LABELS[role]}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSignOut()}
                loading={signingOut}
                aria-label="Sair"
                className="shrink-0"
              >
                Sair
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_3px_rgba(22,18,40,0.06)]">
          <div className="flex h-14 items-center gap-2 px-4 sm:h-[60px] sm:gap-3 sm:px-5">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menu de navegação"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] sm:hidden"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>

            <button
              type="button"
              onClick={toggleExpanded}
              aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
              className="hidden h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] sm:grid"
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>

            <BrandWordmark size="sm" className="min-w-0 flex-1 truncate sm:hidden" />

            <div className="hidden min-h-px flex-1 sm:block" />

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <HeaderIconActions />
              <div
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)] sm:flex"
                aria-hidden
              >
                {initials || 'U'}
              </div>
              <div className="flex items-center gap-2 sm:hidden">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)]">
                  {initials || 'U'}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void handleSignOut()}
                  loading={signingOut}
                  aria-label="Sair"
                  className="shrink-0"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <RolelessBanner />

        <main className="flex-1 px-5 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>

    </div>
  )
}

interface MobileNavRowProps {
  item: NavItem
  onNavigate: () => void
}

function MobileNavRow({ item, onNavigate }: MobileNavRowProps) {
  const Icon = item.icon
  const isDisabled = item.comingSoon || !item.to

  const rowClass = cn(
    'group relative flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[var(--color-muted-foreground)] transition-colors',
    !isDisabled && 'hover:bg-[var(--color-accent-soft)]/80 hover:text-[var(--color-foreground)]'
  )

  if (isDisabled) {
    return (
      <button type="button" disabled className={cn(rowClass, 'cursor-not-allowed opacity-40')} aria-label={item.label}>
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1 truncate text-left text-[14px] font-medium">{item.label}</span>
        {item.comingSoon && (
          <span className="shrink-0 rounded-full border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-medium leading-none">
            em breve
          </span>
        )}
      </button>
    )
  }

  return (
    <NavLink
      to={item.to!}
      end={item.to === '/app'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          rowClass,
          'group',
          isActive &&
            'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]'
        )
      }
    >
      <span className="absolute right-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-l-full bg-[var(--color-accent)] opacity-0 transition-opacity group-[[aria-current=page]]:opacity-100" />
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1 truncate text-left text-[14px] font-medium">{item.label}</span>
    </NavLink>
  )
}

interface SidebarItemProps {
  item: NavItem
  expanded: boolean
}

function SidebarItem({ item, expanded }: SidebarItemProps) {
  const Icon = item.icon
  const isDisabled = item.comingSoon || !item.to

  const baseItemClass = cn(
    'group relative flex h-11 items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] transition-colors',
    expanded ? 'gap-3 px-3' : 'mx-auto w-11 justify-center'
  )

  const content = (
    <>
      <span className="absolute right-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-l-full bg-[var(--color-accent)] opacity-0 transition-opacity group-[[aria-current=page]]:opacity-100" />
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {expanded && (
        <>
          <span className="flex-1 truncate text-[13.5px] font-medium">{item.label}</span>
          {item.comingSoon && (
            <span className="shrink-0 rounded-full border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-medium leading-none text-[var(--color-muted-foreground)]">
              em breve
            </span>
          )}
        </>
      )}
    </>
  )

  if (isDisabled) {
    return (
      <button
        type="button"
        disabled
        aria-label={item.label}
        className={cn(baseItemClass, 'cursor-not-allowed opacity-40')}
      >
        {content}
      </button>
    )
  }

  return (
    <NavLink
      to={item.to!}
      end={item.to === '/app'}
      aria-label={item.label}
      className={({ isActive }) =>
        cn(
          baseItemClass,
          'hover:bg-[var(--color-muted)]/80 hover:text-[var(--color-foreground)]',
          isActive && 'bg-[var(--color-accent-soft)]/90 font-semibold text-[var(--color-accent)]'
        )
      }
    >
      {content}
    </NavLink>
  )
}
