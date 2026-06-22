# Portal do paciente — telas MVP e mapeamento Apidog

Base de referência: [Apidog RiseUP](https://do5wegrct3.apidog.io) e índice [llms.txt](https://do5wegrct3.apidog.io/llms.txt). Prefixos são relativos ao host do projeto Supabase (Auth/REST/functions no mesmo deployment).

Todos os endpoints autenticados seguem o padrão documentado (**Bearer JWT** + **`apikey`** no header). O escopo efetivo (paciente só acessar o próprio `patient_id`) depende de **RLS** e validações nas Edge Functions; a UI apenas consome os mesmos paths.

---

## Fluxo transversal (antes de entrar nas telas)

| Objetivo | Método e path Apidog | Uso na UI MVP |
| --- | --- | --- |
| Sessão (email/senha) | `POST /auth/v1/token` (grant `password`) | Login — hoje via cliente Supabase (`signInWithPassword`), que conversa com Auth. |
| Contexto “quem sou” + vínculo `patient` | `POST /functions/v1/user-info` ([doc Informações do usuário](https://do5wegrct3.apidog.io/informa%C3%A7%C3%B5es-do-usu%C3%A1rio-autenticado-34388573e0.md)) | Obter `roles`, `patient` (ex.: `{ id }` do registro em `patients`), `profile`. |
| Sair | `POST /auth/v1/logout` ou equivalente SDK | Logout (`signOut`). |
| Primeiro cadastro público | Endpoints públicos de auto-cadastro documentados no Apidog (Auth + papel `paciente` + linha em `patients`) | Fora do escopo das 4 telas; necessário apenas para onboarding. |

---

## 1. Perfil (cadastro do paciente)

**Objetivo:** exibir e editar dados cadastrais do paciente ligado ao usuário logado.

| Ação | Método e path | Parâmetros / corpo relevantes |
| --- | --- | --- |
| Resolver ID do paciente | `POST /functions/v1/user-info` | Resposta `patient.id` (ou equivalente documentado). |
| Carregar dados | `GET /rest/v1/patients` | PostgREST: `select=*`, `id=eq.{patient_id}`, `limit=1`. |
| Salvar edição | `PATCH /rest/v1/patients` | PostgREST: `id=eq.{patient_id}`; corpo conforme schema (campos mutáveis; CPF frequentemente imutável no backend). |

**Implementação de referência no app:** [`src/features/patients/api.ts`](../src/features/patients/api.ts) — `getPatient`, `updatePatient`.

---

## 2. Meus agendamentos

**Objetivo:** listar agendamentos do paciente atual (filtros opcionais por período e status).

| Ação | Método e path | Parâmetros relevantes |
| --- | --- | --- |
| Listar | `GET /rest/v1/appointments` | PostgREST: `patient_id=eq.{patient_id}`, `order=scheduled_at.asc`; opcional `scheduled_at` via `and=(scheduled_at.gte.{from},scheduled_at.lte.{to})`; opcional `status=eq.{status}`. |
| Cancelar / ajustes permitidos | `PATCH /rest/v1/appointments` | PostgREST: `id=eq.{appointment_id}`; corpo parcial (`status`, `notes`, etc.) conforme políticas (ex.: `cancelled`). |

**Implementação de referência:** [`src/features/agenda/api.ts`](../src/features/agenda/api.ts) — `listAppointments` com `patient_id`, `updateAppointment`.

---

## 3. Agendar (escolher slot e confirmar)

**Objetivo:** escolher médico, consultar horários livres e criar agendamento (MVP: status inicial típico `requested`).

| Etapa | Método e path | Detalhes |
| --- | --- | --- |
| Listar médicos para escolha | `GET /rest/v1/doctors` | PostgREST: ex. `active=eq.true`, paginação `limit`/`offset`, `order`, busca por nome conforme spec. |
| Calcular / buscar slots | `POST /functions/v1/get-available-slots` | Corpo **por dia** ou **por intervalo** (documentado no Apidog: “Calcular” / “Buscar”). |
| Criar agendamento | `POST /rest/v1/appointments` | Corpo alinhado ao OpenAPI (`doctor_id`, `patient_id`, `scheduled_at`, `duration_minutes`, `status`, `appointment_type`, `notes`, `created_by`, etc.). O app interno preenche `created_by` com o `user.id` da sessão ([`NewAppointmentSheet`](../src/features/agenda/components/NewAppointmentSheet.tsx)); o portal do paciente deve seguir o mesmo contrato **se** a API exigir o campo. |

**Implementação de referência:** [`src/features/agenda/api.ts`](../src/features/agenda/api.ts) — `listDoctors` em [`src/features/doctors/api.ts`](../src/features/doctors/api.ts), `postGetAvailableSlots`, `createAppointment`.

---

## 4. Laudos concluídos

**Objetivo:** listar e abrir laudos **finalizados** do paciente (`status` = `completed` na spec).

| Ação | Método e path | Parâmetros relevantes |
| --- | --- | --- |
| Listar finalizados | `GET /rest/v1/reports` | PostgREST: `patient_id=eq.{patient_id}`, `status=eq.completed`, `order` (ex. `created_at.desc`), `limit`/`offset` + `Prefer: count=exact` para total. |
| Detalhe de um laudo | `GET /rest/v1/reports` | `id=eq.{report_id}`, `limit=1` (e `select` conforme colunas expostas). |

**Documentação Apidog:** [Listar relatórios médicos](https://do5wegrct3.apidog.io/listar-relat%C3%B3rios-m%C3%A9dicos-23131760e0).

**Implementação de referência:** [`src/features/reports/api.ts`](../src/features/reports/api.ts) — `listReports` / `getReport` com `patient_id` e `status: 'completed'`.

---

## Resumo rápido

| Tela MVP | Paths principais |
| --- | --- |
| Perfil | `POST /functions/v1/user-info`, `GET` + `PATCH /rest/v1/patients` |
| Meus agendamentos | `GET` + `PATCH /rest/v1/appointments` |
| Agendar com slot | `GET /rest/v1/doctors`, `POST /functions/v1/get-available-slots`, `POST /rest/v1/appointments` |
| Laudos concluídos | `GET /rest/v1/reports` (`patient_id` + `status=completed`) |
