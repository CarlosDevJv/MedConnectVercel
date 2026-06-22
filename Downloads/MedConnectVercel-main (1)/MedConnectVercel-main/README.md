# MediConnect — Frontend

Sistema de gestão de clínica em React + Vite + TypeScript, integrado à API do MediConnect (Supabase).

Esta primeira etapa entrega a fundação do projeto e o fluxo público de autenticação:

- Tela de **Login** com email/senha
- "Esqueceu sua senha?" via dialog (endpoint público de reset)
- "Cadastre-se" em página dedicada (`/cadastro`) — auto-cadastro de paciente com Magic Link automático
- Botão "Entrar com Google" exposto, porém desabilitado (em breve)
- Skeleton mínimo da área autenticada (`/app`) para validar a sessão de ponta a ponta

## Stack

- Vite + React 19 + TypeScript estrito
- Tailwind CSS v4 (tokens em `src/styles/globals.css`)
- React Router v6 (data router)
- TanStack Query v5
- react-hook-form + Zod
- @supabase/supabase-js (sessão + JWT auto-refresh)
- Sonner (toasts), Lucide (ícones), Radix UI (primitives)
- Tipografia: Fraunces (display) + Plus Jakarta Sans (corpo) via @fontsource

## Pré-requisitos

- Node.js 18+
- npm (vem junto com Node)

## Instalação

```bash
npm install
```

## Configuração

Copie o arquivo de exemplo e preencha as credenciais do Supabase:

```bash
cp .env.example .env.local
```

Variáveis obrigatórias em `.env.local`:

```
VITE_SUPABASE_URL=https://yuanqfswhberkoevtmfr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxx
VITE_APP_URL=http://localhost:5173
```

A `VITE_SUPABASE_ANON_KEY` é a **publishable key** do projeto (formato `sb_publishable_...`). Solicite ao backend ou pegue no painel do Supabase. O arquivo `.env.local` é ignorado pelo Git.

### Ambiente e dados de demonstração

Cada squad pode usar um **projeto Supabase próprio** (`VITE_SUPABASE_URL`). Por isso contagens de pacientes/médicos na demo podem diferir de outros squads que compartilham o mesmo banco. Documente no README da entrega qual URL/projeto foi usado para o avaliador contextualizar números na primeira tela.

## Scripts

```bash
npm run dev      # sobe o servidor de desenvolvimento em http://localhost:5173
npm run build    # gera o bundle de produção em dist/
npm run preview  # serve o bundle de produção localmente
npm run lint     # ESLint
```

## Rotas atuais

| Rota         | Acesso         | Descrição                                        |
| ------------ | -------------- | ------------------------------------------------ |
| `/`          | público        | Redireciona para `/login`                        |
| `/login`     | público        | Tela de login                                    |
| `/cadastro`  | público        | Auto-cadastro de paciente (Magic Link)           |
| `/app`       | autenticado    | Placeholder com nome, email e roles do usuário   |

## Estrutura de pastas

```
src/
├─ app/                       # composição da aplicação
│  ├─ layouts/                # PublicLayout, AppShell
│  ├─ pages/                  # HomePlaceholder
│  ├─ providers.tsx           # QueryClient, Toaster, AuthProvider
│  └─ router.tsx              # createBrowserRouter
├─ components/ui/             # primitives (Button, Input, Label, ...)
├─ features/
│  ├─ auth/                   # login, reset, sessão, guards
│  └─ patients/               # auto-cadastro de paciente
├─ lib/
│  ├─ supabase.ts             # client Supabase (sessão persistida)
│  ├─ apiClient.ts            # fetch wrapper (apikey + bearer + ProblemDetails)
│  └─ queryClient.ts
├─ styles/globals.css         # tokens + tailwind v4
├─ types/user.ts              # UserRole, UserInfo
└─ env.ts                     # leitura/validação de variáveis VITE_*
```

## Próximas etapas

- CRUD de pacientes (admin/gestor/secretaria)
- Médicos, disponibilidades, exceções
- Agenda (calendário, slots)
- Relatórios médicos
- Painel administrativo (admin/gestor)
