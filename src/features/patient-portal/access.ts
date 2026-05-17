import { useQuery } from '@tanstack/react-query'

import { useAuth, useRoles } from '@/features/auth/useAuth'
import {
  collectPatientLookupEmails,
  cpfDigitsFromAuthPayload,
  extractPatientRecordId,
  looksLikePatientUuid,
  patientIdFromAuthClaims,
} from '@/features/patient-portal/patientId'
import { getSupabase } from '@/lib/supabase'
import { isClinicalStaffRole } from '@/lib/roleGroups'

type PatientRowPick = { id?: unknown }

async function pickIdFromPatientsQuery(
  run: PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>
): Promise<string | undefined> {
  const { data, error } = await run
  if (error || data == null) return undefined
  if (typeof data !== 'object') return undefined
  const id = (data as PatientRowPick).id
  return typeof id === 'string' && looksLikePatientUuid(id) ? id.trim() : undefined
}

/**
 * Fallback client-only quando `patient.id` não vem na sessão/API: mesmo JWT + políticas que
 * permitam leitura de `patients` para o próprio usuário (ex.: e-mail igual ao cadastro ou CPF em metadados).
 */
async function lookupPatientSelfRowByProfile(opts: {
  authUserId?: string
  emails: string[]
  cpfDigits?: string
}): Promise<string | undefined> {
  const sb = getSupabase()
  const uid = opts.authUserId?.trim()
  if (uid) {
    const byUser = await pickIdFromPatientsQuery(
      sb.from('patients').select('id').eq('user_id', uid).maybeSingle()
    )
    if (byUser) return byUser
  }

  const emailNormSeen = new Set<string>()

  for (let raw of opts.emails) {
    raw = raw.trim()
    if (!raw) continue
    const lower = raw.toLowerCase()
    if (emailNormSeen.has(lower)) continue
    emailNormSeen.add(lower)

    const variants = lower === raw ? [raw] : [raw, lower]
    const uniqVariants = [...new Set(variants)]
    for (const v of uniqVariants) {
      const eq = await pickIdFromPatientsQuery(sb.from('patients').select('id').eq('email', v).maybeSingle())
      if (eq) return eq
    }

    const ilike = await pickIdFromPatientsQuery(sb.from('patients').select('id').ilike('email', raw).maybeSingle())
    if (ilike) return ilike

    const ilikeLc = raw !== lower
      ? await pickIdFromPatientsQuery(sb.from('patients').select('id').ilike('email', lower).maybeSingle())
      : undefined
    if (ilikeLc) return ilikeLc
  }

  const cpf = opts.cpfDigits?.replace(/\D/g, '').slice(0, 11)
  if (cpf && cpf.length === 11) {
    const byCpf = await pickIdFromPatientsQuery(sb.from('patients').select('id').eq('cpf', cpf).maybeSingle())
    if (byCpf) return byCpf
  }

  return undefined
}

/** Resolve `patient.id` para o portal (user-info/JWT primeiro; depois várias tentativas em `patients`, se RLS permitir). */
export function usePatientPortalPatientResolution() {
  const { userInfo, session, status, userEnrichmentSynced } = useAuth()
  const roles = useRoles()

  const staff = isClinicalStaffRole(roles)
  const jwtResolved =
    extractPatientRecordId(userInfo?.patient ?? null) ??
    patientIdFromAuthClaims(session?.user ?? undefined)

  const u = session?.user
  const emails = collectPatientLookupEmails({
    sessionEmail: u?.email ?? undefined,
    userInfoEmail: userInfo?.user?.email ?? undefined,
    userMetadata: (u?.user_metadata ?? undefined) as Record<string, unknown> | undefined,
    appMetadata: (u?.app_metadata ?? undefined) as Record<string, unknown> | undefined,
  })

  const cpfDigits =
    cpfDigitsFromAuthPayload({
      userMetadata: u?.user_metadata as Record<string, unknown> | undefined,
      appMetadata: u?.app_metadata as Record<string, unknown> | undefined,
    }) ?? undefined

  const authUserId = u?.id?.trim() ?? ''
  const lookupKeyEmails = [...emails].sort().join('|')

  const hasEmailCandidate = emails.some((e) => e.trim().length > 0)
  const hasCpfCandidate = Boolean(cpfDigits && cpfDigits.replace(/\D/g, '').length === 11)
  const hasAuthUidCandidate = Boolean(authUserId)

  const canLookupProfile =
    status === 'authenticated' &&
    userEnrichmentSynced &&
    !staff &&
    jwtResolved === undefined &&
    (hasAuthUidCandidate || hasEmailCandidate || hasCpfCandidate)

  const lookup = useQuery({
    queryKey: ['patient-portal', 'self-local', authUserId, lookupKeyEmails, cpfDigits ?? ''],
    enabled: Boolean(
      canLookupProfile && (hasAuthUidCandidate || hasEmailCandidate || hasCpfCandidate)
    ),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    queryFn: () =>
      lookupPatientSelfRowByProfile({ authUserId: authUserId || undefined, emails, cpfDigits }),
  })

  const resolvedId = jwtResolved ?? lookup.data ?? undefined

  const pendingEmailLookup = Boolean(
    canLookupProfile &&
      jwtResolved === undefined &&
      (lookup.isPending || (lookup.isFetching && lookup.data === undefined))
  )

  return {
    resolvedId,
    jwtResolved,
    pendingEmailLookup,
    patientIdForLists: resolvedId,
  }
}

/**
 * Portal paciente nas rotas / menu / início:
 * - equipe clínica nunca usa essas telas pelo guard (vê os próprios painéis);
 * - demais usuários autentificados entram sempre; páginas usam `patient.id` quando houver vínculo, senão explicativas vazias — dados seguem filtros + RLS.
 */
export function usePatientPortalRouteGate(): {
  allowed: boolean
  /** Compatível com chamadas antigas; não bloqueia mais menu/rotas enquanto resolve `patient.id`. */
  pending: boolean
  resolvedPatientId: string | undefined
} {
  const roles = useRoles()
  const staff = isClinicalStaffRole(roles)
  const { resolvedId } = usePatientPortalPatientResolution()

  const allowed = !staff
  const pending = false

  return { allowed, pending, resolvedPatientId: resolvedId }
}
