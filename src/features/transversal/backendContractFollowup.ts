/**
 * Lista de lacunas entre a documentação de produto (seção 3 – transversal) e o contrato público RiseUP/APidog,
 * até existir novo OpenAPI ou tabelas/Edge Functions compatíveis. Use como backlog com o backend; não há chamadas runtime.
 */

export interface BackendContractGap {
  readonly id: string
  readonly category: string
  readonly expectation: string
  readonly blocker: string
}

export const BACKEND_CONTRACT_GAPS = [
  {
    id: 'web_push_subscription',
    category: '3.1 Push',
    expectation: 'Registro do dispositivo, preferências e servidor de disparo (FCM/APNs ou equivalente).',
    blocker: 'Nenhum endpoint publicado para subscription ou centro de alertas.',
  },
  {
    id: 'transactional_email',
    category: '3.1 Alertas por e-mail',
    expectation:
      'Fila/templates de envio além dos fluxos de Auth já documentados (ex.: Magic Link).',
    blocker: 'Apidog atual cobre apenas e-mails típicos de autenticação/admin de usuários.',
  },
  {
    id: 'whatsapp_business_channel',
    category: '3.1 Mensagens WhatsApp',
    expectation: 'Webhook / envio oficial WhatsApp Business (Twilio WhatsApp ou Cloud API Meta).',
    blocker: 'Contrato exposto equivale a SMS Twilio (`send-sms`), não WhatsApp dedicado.',
  },
  {
    id: 'internal_reminders_persistent',
    category: '3.1 Lembretes internos',
    expectation: 'Modelo persistido por usuário, agendamentos e ACK de leitura.',
    blocker: 'Sem tabela/endpoint público equivalente ao produto.',
  },
  {
    id: 'application_activity_audit',
    category: '3.2 Log de atividades',
    expectation: 'Trilhas por ator, recurso alterado e carimbo (exportável sob LGPD).',
    blocker: 'Sem recurso equivalente na lista do Apidog; exige `audit_log` + RLS + UI.',
  },
  {
    id: 'operational_backup_lgpd',
    category: '3.3 Backup e auditoria operacional LGPD',
    expectation: 'Evidências de backup, retenção, DSR (acesso/remoção) acopladas ao produto quando aplicável.',
    blocker:
      'Maioria é responsabilidade de infra/fornecedor (Supabase/organização) e política jurídica; não há API de “LGPD checklist” aqui.',
  },
] satisfies readonly BackendContractGap[]

export function summarizeGapsMarkdown(): string {
  return BACKEND_CONTRACT_GAPS.map(
    (g) => `- **${g.id}** (${g.category}): ${g.expectation} — _bloqueador_: ${g.blocker}`
  ).join('\n')
}
