import type { UserRole } from '@/types/user'

/** Cadastro / edição / exclusão de pacientes (API Pacientes). */
export const PATIENT_FORM_ROLES: UserRole[] = ['admin', 'gestor', 'secretaria', 'medico']

/** Leitura de cadastro (API Pacientes). */
export const PATIENT_READ_ROLES: UserRole[] = [...PATIENT_FORM_ROLES]

export const AGENDA_ROLES: UserRole[] = ['admin', 'gestor', 'medico', 'secretaria']

/** Listagem/detalhe de médicos + disponibilidade na agenda (RiseUP: admin/gestor/secretaria). Cadastro/edição de médico: DOCTOR_MANAGEMENT_ROLES. */
export const DOCTOR_DIRECTORY_ROLES: UserRole[] = ['admin', 'gestor', 'secretaria']

export const DOCTOR_MANAGEMENT_ROLES: UserRole[] = ['admin', 'gestor']

export const SECRETARIA_MANAGEMENT_ROLES: UserRole[] = ['admin', 'gestor']

/** Laudos (lista, edição, pré-visualização) — admin, gestão e médicos. Sem acesso pela secretaria. */
export const REPORT_ROLES: UserRole[] = ['admin', 'gestor', 'medico']

/** Indicadores executivos — admin e gestor apenas (sem médico). */
export const ANALYTICS_ROLES: UserRole[] = ['admin', 'gestor']

/** Visualizar ou agendar em várias agendas; exclusivo do perfil apenas-médico (ver AgendaPage). */
export const MULTI_DOCTOR_AGENDA_ROLES: UserRole[] = ['admin', 'gestor', 'secretaria']

export function canUseMultiDoctorAgenda(roles: UserRole[]): boolean {
  return roles.some((r) => MULTI_DOCTOR_AGENDA_ROLES.includes(r))
}

export const COMMUNICATIONS_ROLES: UserRole[] = ['admin', 'gestor', 'medico', 'secretaria']

/** Itens de navegação visíveis a qualquer sessão autenticada até roles carregarem. */
export const SIDEBAR_DASHBOARD_FALLBACK_ROLES: UserRole[] = [
  'admin',
  'gestor',
  'medico',
  'secretaria',
  'paciente',
  'user',
]
