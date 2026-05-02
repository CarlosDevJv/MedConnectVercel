import { env } from '@/env'
import { getSupabase } from '@/lib/supabase'

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string[]>
}

interface LegacyErrorPayload {
  error?: string
  code?: string
  details?: unknown
}

export class ApiError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string[]>
  raw?: unknown

  constructor(args: {
    message: string
    status: number
    code?: string
    fieldErrors?: Record<string, string[]>
    raw?: unknown
  }) {
    super(args.message)
    this.name = 'ApiError'
    this.status = args.status
    this.code = args.code
    this.fieldErrors = args.fieldErrors
    this.raw = args.raw
  }
}

interface RequestOptions {
  /** When true, omits the Authorization bearer header (used for public endpoints). */
  anonymous?: boolean
  signal?: AbortSignal
  headers?: Record<string, string>
}

interface RequestResult<T> {
  data: T
  headers: Headers
  status: number
}

async function buildHeaders(
  anonymous: boolean,
  extra?: Record<string, string>,
  hasBody?: boolean
): Promise<Headers> {
  const headers = new Headers()
  if (hasBody) headers.set('Content-Type', 'application/json')
  headers.set('apikey', env.SUPABASE_ANON_KEY)

  if (!anonymous) {
    const {
      data: { session },
    } = await getSupabase().auth.getSession()
    const token = session?.access_token ?? env.SUPABASE_ANON_KEY
    headers.set('Authorization', `Bearer ${token}`)
  } else {
    headers.set('Authorization', `Bearer ${env.SUPABASE_ANON_KEY}`)
  }

  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      headers.set(k, v)
    }
  }

  return headers
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('title' in value || 'detail' in value || 'status' in value)
  )
}

function isLegacyError(value: unknown): value is LegacyErrorPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('error' in (value as Record<string, unknown>) || 'code' in (value as Record<string, unknown>))
  )
}

async function parseError(response: Response, fallback: string): Promise<ApiError> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }

  if (isProblemDetails(body)) {
    return new ApiError({
      message: body.detail ?? body.title ?? fallback,
      status: response.status,
      fieldErrors: body.errors,
      raw: body,
    })
  }

  if (isLegacyError(body)) {
    return new ApiError({
      message: body.error ?? fallback,
      status: response.status,
      code: body.code,
      raw: body,
    })
  }

  return new ApiError({
    message: fallback,
    status: response.status,
    raw: body,
  })
}

async function parseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T
  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

interface RawRequestArgs {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  path: string
  body?: unknown
  options?: RequestOptions
}

async function rawRequest<T>({
  method,
  path,
  body,
  options = {},
}: RawRequestArgs): Promise<RequestResult<T>> {
  const url = path.startsWith('http') ? path : `${env.SUPABASE_URL}${path}`
  const hasBody = body !== undefined
  const headers = await buildHeaders(options.anonymous ?? false, options.headers, hasBody)

  const response = await fetch(url, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
    signal: options.signal,
  })

  if (!response.ok) {
    throw await parseError(response, `Falha ao chamar ${path} (HTTP ${response.status})`)
  }

  return {
    data: await parseBody<T>(response),
    headers: response.headers,
    status: response.status,
  }
}

export const apiClient = {
  async request<T>(args: RawRequestArgs): Promise<RequestResult<T>> {
    return rawRequest<T>(args)
  },

  async post<TRes, TBody = unknown>(
    path: string,
    body?: TBody,
    options: RequestOptions = {}
  ): Promise<TRes> {
    const result = await rawRequest<TRes>({ method: 'POST', path, body, options })
    return result.data
  },

  async get<TRes>(path: string, options: RequestOptions = {}): Promise<TRes> {
    const result = await rawRequest<TRes>({ method: 'GET', path, options })
    return result.data
  },

  async patch<TRes, TBody = unknown>(
    path: string,
    body?: TBody,
    options: RequestOptions = {}
  ): Promise<TRes> {
    const result = await rawRequest<TRes>({ method: 'PATCH', path, body, options })
    return result.data
  },

  async del<TRes = void>(path: string, options: RequestOptions = {}): Promise<TRes> {
    const result = await rawRequest<TRes>({ method: 'DELETE', path, options })
    return result.data
  },
}

/**
 * Parses the PostgREST `Content-Range` header (e.g. `0-19/142`) and returns the total count.
 * Returns `null` when the header is missing or malformed.
 */
export function parseContentRangeTotal(headers: Headers): number | null {
  const raw = headers.get('Content-Range')
  if (!raw) return null
  const slash = raw.lastIndexOf('/')
  if (slash === -1) return null
  const totalPart = raw.slice(slash + 1)
  if (totalPart === '*' || totalPart === '') return null
  const parsed = Number.parseInt(totalPart, 10)
  return Number.isFinite(parsed) ? parsed : null
}
