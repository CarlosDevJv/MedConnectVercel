import type { UserRole } from '@/types/user'

/** Cadastro / edição / exclusão de pacientes (API Pacientes). */
export const PATIENT_FORM_ROLES: UserRole[] = ['admin', 'gestor', 'secretaria', 'medico']

/** Abrir formulário “Novo paciente” na UI — sem `medico` (cadastro inicial costuma ser da secretaria). */
export const PATIENT_CREATE_ROLES: UserRole[] = ['admin', 'gestor', 'secretaria']

/** Quem pode excluir paciente na UI — médicos e gestor ficam sem a ação (apenas admin/secretaria). */
export const PATIENT_DELETE_ROLES: UserRole[] = ['admin', 'secretaria']

/** Leitura de cadastro (API Pacientes). */
export const PATIENT_READ_ROLES: UserRole[] = [...PATIENT_FORM_ROLES]

export const AGENDA_ROLES: UserRole[] = ['admin', 'gestor', 'medico', 'secretaria']

/** Listagem/detalhe de médicos + disponibilidade na agenda (RiseUP: admin/gestor/secretaria). Cadastro/edição de médico: DOCTOR_MANAGEMENT_ROLES. */
export const DOCTOR_DIRECTORY_ROLES: UserRole[] = ['admin', 'gestor', 'secretaria']

export const DOCTOR_MANAGEMENT_ROLES: UserRole[] = ['admin', 'gestor']

export const SECRETARIA_MANAGEMENT_ROLES: UserRole[] = ['admin', 'gestor']

/** Laudos (lista, edição, pré-visualização) — admin, gestão e médicos. Sem acesso pela secretaria. */
export const REPORT_ROLES: UserRole[] = ['admin', 'gestor', 'medico']

/** Equipe operacional da clínica (não vê rotas só do portal paciente). */
export const CLINICAL_STAFF_ROLES: UserRole[] = ['admin', 'gestor', 'medico', 'secretaria']

export function isClinicalStaffRole(roles: readonly UserRole[] | undefined | null): boolean {
  if (!roles?.length) return false
  return roles.some((r) => CLINICAL_STAFF_ROLES.includes(r))
}

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
