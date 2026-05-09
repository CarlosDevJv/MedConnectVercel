#!/usr/bin/env node
/**
 * Cria usuário demo com papel `paciente` + registro em `patients`
 * via POST /functions/v1/create-user-with-password (contrato igual ao frontend).
 *
 * Uso (na pasta mediconnect/):
 *
 *   $env:MEDIACONNECT_ADMIN_ACCESS_TOKEN="<jwt do admin>"
 *   node scripts/create-demo-patient.mjs
 *
 * No PowerShell você pode pegar o JWT após login como admin/gestor:
 * DevTools → Application → Local Storage → chave sb-*-auth-token → access_token (string JSON dentro do objeto de sessão)
 * ou inspecionar qualquer chamada à API e copiar Authorization: Bearer …
 *
 * Variáveis opcionais:
 *   MEDIACONNECT_ADMIN_ACCESS_TOKEN  (obrigatório)
 *   DEMO_PATIENT_EMAIL (padrão: paciente-demo@example.com — troque se der 409)
 *   DEMO_PATIENT_PASSWORD (padrão: MediconnectDemoPaciente2026!)
 *   DEMO_PATIENT_CPF (11 dígitos válidos — padrão: 52998224725)
 *   DEMO_PATIENT_NAME, DEMO_PATIENT_PHONE_MOBILE
 *
 * Opcionalmente lê ../.env.local para VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY se não estiver no ambiente.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

function loadDotEnvLocal() {
  const p = join(PROJECT_ROOT, '.env.local')
  if (!existsSync(p)) return
  const text = readFileSync(p, 'utf8')
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

function argFlag(name) {
  return process.argv.includes(name)
}

loadDotEnvLocal()

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
const ANON = process.env.VITE_SUPABASE_ANON_KEY ?? ''
const ADMIN_TOKEN =
  process.env.MEDIACONNECT_ADMIN_ACCESS_TOKEN ??
  process.env.ADMIN_ACCESS_TOKEN ??
  ''

const DEFAULT_EMAIL = 'paciente-demo@example.com'
const DEFAULT_PASSWORD = 'MediconnectDemoPaciente2026!'
const DEFAULT_CPF = '52998224725'
const DEFAULT_NAME = 'Paciente Demonstração'
const DEFAULT_PHONE = '11999990001'

if (argFlag('--help') || argFlag('-h')) {
  console.log(`\
Cria conta demo (role paciente + create_patient_record).

Pré-requisito: token JWT de usuário com permissão na Edge Function (habitualmente admin ou gestor).

Exemplo PowerShell:
  cd mediconnect
  $env:MEDIACONNECT_ADMIN_ACCESS_TOKEN = "<seu_jwt>"
  node scripts/create-demo-patient.mjs

Variáveis: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (ou .env.local), MEDIACONNECT_ADMIN_ACCESS_TOKEN.
Opcionais: DEMO_PATIENT_EMAIL, DEMO_PATIENT_PASSWORD, DEMO_PATIENT_CPF, DEMO_PATIENT_NAME, DEMO_PATIENT_PHONE_MOBILE.
`)
  process.exit(0)
}

if (!SUPABASE_URL) {
  console.error('Defina VITE_SUPABASE_URL (ou use .env.local na raiz do mediconnect).')
  process.exit(1)
}
if (!ANON) {
  console.error('Defina VITE_SUPABASE_ANON_KEY (ou use .env.local).')
  process.exit(1)
}
if (!ADMIN_TOKEN) {
  console.error(
    'Defina MEDIACONNECT_ADMIN_ACCESS_TOKEN com o JWT de um admin/gestor autenticado no mesmo projeto Supabase.'
  )
  process.exit(1)
}

const body = {
  email: (process.env.DEMO_PATIENT_EMAIL ?? DEFAULT_EMAIL).trim(),
  password: process.env.DEMO_PATIENT_PASSWORD ?? DEFAULT_PASSWORD,
  full_name: (process.env.DEMO_PATIENT_NAME ?? DEFAULT_NAME).trim(),
  cpf: (process.env.DEMO_PATIENT_CPF ?? DEFAULT_CPF).replace(/\D/g, ''),
  role: 'paciente',
  create_patient_record: true,
  phone_mobile: (process.env.DEMO_PATIENT_PHONE_MOBILE ?? DEFAULT_PHONE).replace(/\D/g, ''),
}

const url = `${SUPABASE_URL}/functions/v1/create-user-with-password`

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: ANON,
    Authorization: `Bearer ${ADMIN_TOKEN}`,
  },
  body: JSON.stringify(body),
})

const text = await res.text()
let json
try {
  json = JSON.parse(text)
} catch {
  json = { raw: text }
}

if (!res.ok) {
  console.error('Falha ao criar paciente demo:', res.status, json)
  process.exit(1)
}

console.log('')
console.log('Paciente de demonstração criado (ou já existia com sucesso na API).')
console.log('— Email:   ', body.email)
console.log('— Senha:   ', body.password)
console.log('— Resposta:', JSON.stringify(json, null, 2))
console.log('')
console.log('Faça login em /login com as credenciais acima (mesmo projeto Supabase).')
