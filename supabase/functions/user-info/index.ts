/**
 * POST /functions/v1/user-info — sem ALTER TABLE: vínculo do paciente vem do JWT
 * (`user_metadata`/`app_metadata` com `patient_id` ou objeto `patient.id`) e opcionalmente
 * de leitura em `patients` pelo e‑mail Auth (colunas existentes apenas).
 *
 * Deploy: `supabase functions deploy user-info` (secrets padrão do projeto).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

type UserRole = 'admin' | 'gestor' | 'medico' | 'secretaria' | 'paciente' | 'user'

const INTERNAL_STAFF: ReadonlySet<UserRole> = new Set([
  'admin',
  'gestor',
  'medico',
  'secretaria',
])

const KNOWN = new Set<UserRole>([
  'admin',
  'gestor',
  'medico',
  'secretaria',
  'paciente',
  'user',
])

const SYNONYMS: Record<string, UserRole> = {
  admin: 'admin',
  gestor: 'gestor',
  medico: 'medico',
  médico: 'medico',
  doctor: 'medico',
  secretaria: 'secretaria',
  secretária: 'secretaria',
  paciente: 'paciente',
  patient: 'paciente',
  user: 'user',
}

function isUuidLike(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim()
  )
}

function patientIdFromMeta(meta: Record<string, unknown> | undefined | null): string | undefined {
  if (!meta || typeof meta !== 'object') return undefined
  for (const k of ['patient_id', 'patientId'] as const) {
    const v = meta[k]
    if (typeof v === 'string' && isUuidLike(v)) return v.trim()
  }
  const nested = meta.patient
  if (nested && typeof nested === 'object') {
    const id = (nested as Record<string, unknown>).id
    if (typeof id === 'string' && isUuidLike(id)) return id.trim()
  }
  return undefined
}

function dedupeRoles(roles: UserRole[]): UserRole[] {
  const seen = new Set<UserRole>()
  const out: UserRole[] = []
  for (const r of roles) {
    if (!seen.has(r)) {
      seen.add(r)
      out.push(r)
    }
  }
  return out
}

function coerceRoles(val: unknown): UserRole[] {
  if (!val) return []
  const raw = Array.isArray(val) ? val : [val]
  const out: UserRole[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const s = item.normalize('NFKC').trim().toLowerCase()
    const n = SYNONYMS[s] ?? (KNOWN.has(s as UserRole) ? (s as UserRole) : null)
    if (n) out.push(n)
  }
  return dedupeRoles(out)
}

function rolesFromSingleMeta(meta: Record<string, unknown>): UserRole[] {
  let r = coerceRoles(meta.roles)
  if (r.length) return r
  r = coerceRoles(meta.role)
  if (r.length) return r
  return coerceRoles(meta.user_role)
}

/** Papéis em `app_metadata` e `user_metadata` (cadastro por e‑mail costuma usar só um deles). */
function rolesFromUser(user: {
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}): UserRole[] {
  const app = user.app_metadata ?? {}
  const umeta = user.user_metadata ?? {}
  return dedupeRoles([...rolesFromSingleMeta(app), ...rolesFromSingleMeta(umeta)])
}

function stripNonDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

function cpf11FromPayload(
  meta: Record<string, unknown> | undefined,
  appMeta: Record<string, unknown> | undefined
): string | undefined {
  for (const m of [meta, appMeta]) {
    if (!m || typeof m !== 'object') continue
    for (const key of ['cpf', 'CPF'] as const) {
      const v = m[key]
      if (typeof v === 'string') {
        const d = stripNonDigits(v).slice(0, 11)
        if (d.length === 11) return d
      }
    }
  }
  return undefined
}

function collectSignupEmails(opts: {
  authEmail: string
  meta: Record<string, unknown> | undefined
  appMeta: Record<string, unknown> | undefined
}): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  function push(em: unknown) {
    if (typeof em !== 'string') return
    const t = em.trim()
    if (!t) return
    const k = t.toLowerCase()
    if (seen.has(k)) return
    seen.add(k)
    out.push(t)
  }
  push(opts.authEmail)
  const um = opts.meta
  const am = opts.appMeta
  if (um && typeof um === 'object') {
    push(um.email)
    push(um.user_email)
    push(um.contact_email)
    push(um.secondary_email)
  }
  if (am && typeof am === 'object') {
    push(am.email)
    push(am.contact_email)
  }
  return out
}

function pickSingletonPatientUuidFromRows(rows: { id?: string }[] | null): string | undefined {
  const ids = [
    ...new Set(
      (rows ?? [])
        .map((r) => r.id)
        .filter((id): id is string => typeof id === 'string' && isUuidLike(id))
        .map((s) => s.trim())
    ),
  ]
  return ids.length === 1 ? ids[0] : undefined
}

async function lookupPatientRowBySignupEmails(
  admin: ReturnType<typeof createClient>,
  emails: string[]
): Promise<string | undefined> {
  for (const raw of emails) {
    const e = raw.trim()
    if (!e) continue

    const eqRes = await admin.from('patients').select('id').eq('email', e)
    if (eqRes.error) console.warn('[user-info] patients eq(email):', eqRes.error.message)
    const eqPick = pickSingletonPatientUuidFromRows(eqRes.data as { id?: string }[] | null)
    if (eqPick) return eqPick

    const ilikeRes = await admin.from('patients').select('id').ilike('email', e)
    if (ilikeRes.error) {
      console.warn('[user-info] patients ilike(email):', ilikeRes.error.message)
      continue
    }
    const likePick = pickSingletonPatientUuidFromRows(ilikeRes.data as { id?: string }[] | null)
    if (likePick) return likePick
  }
  return undefined
}

async function lookupPatientRowByCpfDigits(
  admin: ReturnType<typeof createClient>,
  cpf11: string
): Promise<string | undefined> {
  if (!/^\d{11}$/.test(cpf11)) return undefined
  const res = await admin.from('patients').select('id').eq('cpf', cpf11)
  if (res.error) {
    console.warn('[user-info] patients eq(cpf):', res.error.message)
    return undefined
  }
  return pickSingletonPatientUuidFromRows(res.data as { id?: string }[] | null)
}

function ensurePacientePortalRole(
  roles: UserRole[],
  patient: { id: string } | null
): UserRole[] {
  const next = dedupeRoles(roles)
  if (!patient?.id) return next
  if (next.includes('paciente')) return next
  if (next.some((x) => INTERNAL_STAFF.has(x))) return next
  next.push('paciente')
  return dedupeRoles(next)
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: 'Servidor não configurado' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const tokenMatch = /^Bearer\s+(.+)$/i.exec(authHeader)
  const jwt = tokenMatch?.[1]
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'Token ausente' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: 'Sessão inválida ou expirada' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const user = userData.user
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const appMeta = user.app_metadata as Record<string, unknown> | undefined

  let patientId = patientIdFromMeta(meta) ?? patientIdFromMeta(appMeta)

  const email = (user.email ?? '').trim()

  /** Colunas já existentes: `email`, `cpf` em `patients`; service role só lê, sem DDL novo. */
  if (!patientId) {
    const emailCandidates = collectSignupEmails({
      authEmail: email,
      meta,
      appMeta,
    })
    patientId = await lookupPatientRowBySignupEmails(admin, emailCandidates)
  }

  if (!patientId) {
    const cpf11 = cpf11FromPayload(meta, appMeta)
    if (cpf11) {
      patientId = await lookupPatientRowByCpfDigits(admin, cpf11)
    }
  }

  const patientRecord = patientId ? { id: patientId } : null
  let roles = rolesFromUser(user)
  roles = ensurePacientePortalRole(roles, patientRecord)

  const doctorRes = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
  if (doctorRes.error) {
    console.warn('[user-info] doctors lookup:', doctorRes.error.message)
  }
  const doctor =
    !doctorRes.error && doctorRes.data && typeof doctorRes.data.id === 'string'
      ? { id: doctorRes.data.id as string }
      : null

  const um = meta ?? {}
  const profile = {
    full_name:
      (typeof um.full_name === 'string' && um.full_name) ||
      (typeof um.name === 'string' && um.name) ||
      null,
    phone: typeof um.phone === 'string' ? um.phone : null,
    avatar_url: typeof um.avatar_url === 'string' ? um.avatar_url : null,
  }

  const body = {
    user: {
      id: user.id,
      email,
    },
    profile,
    roles,
    permissions: {
      isAdmin: roles.includes('admin'),
      canManageUsers: roles.includes('admin') || roles.includes('gestor'),
    },
    doctor,
    patient: patientRecord,
  }

  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
