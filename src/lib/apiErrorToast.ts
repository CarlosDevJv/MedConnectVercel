import { toast } from 'sonner'

import { ApiError } from '@/lib/apiClient'
import {
  HTTP_ERROR_DUPLICATE_IDENTITY,
  HTTP_ERROR_INTERNAL,
  HTTP_ERROR_RATE_LIMIT,
} from '@/lib/httpErrorMessages'

export {
  HTTP_ERROR_DUPLICATE_IDENTITY,
  HTTP_ERROR_INTERNAL,
  HTTP_ERROR_RATE_LIMIT,
} from '@/lib/httpErrorMessages'

export interface ToastFromErrorOptions {
  permissionDescription?: string
  /** 409: duplicidade de cadastro (CPF/e-mail) vs. outro conflito (ex.: FK na exclusão). */
  conflict?: 'registration' | 'general'
  /** Título quando o status não tem mensagem fixa ou para `conflict: 'general'`. */
  operationTitle?: string
}

/** Texto de validação para toast (400) a partir de ProblemDetails.errors ou message. */
export function describeValidationError(error: ApiError): string {
  if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
    return Object.entries(error.fieldErrors)
      .map(([k, msgs]) => `${k}: ${msgs.join(', ')}`)
      .join(' · ')
  }
  const msg = error.message?.trim()
  return msg || 'Verifique os dados informados.'
}

/**
 * Exibe um toast sonner consistente com o contrato ProblemDetails (status + errors + detail).
 * Não substitui validação campo a campo: o caller deve tratar `fieldErrors` antes e retornar sem chamar isto.
 */
function looksLikeConnectionProblem(message: string): boolean {
  return /failed to fetch|network\s*error|network request failed|load failed|aborted|abort|timeout|conex[aã]o|internet/i.test(
    message,
  )
}

/** Erros genéricos (fora da API): linguagem simples, sem inglês técnico do navegador. */
export function toastFromUnknownError(error: unknown): void {
  if (error instanceof Error && error.message && looksLikeConnectionProblem(error.message)) {
    toast.error('Sem conexão no momento', {
      description: 'Não conseguimos enviar. Confira sua internet e tente de novo.',
    })
    return
  }
  toast.error('Algo deu errado', {
    description: 'Tente de novo daqui a pouco.',
  })
}

export function toastFromError(error: unknown, options: ToastFromErrorOptions = {}): void {
  if (!(error instanceof ApiError)) {
    toastFromUnknownError(error)
    return
  }

  const { status } = error

  if (status === 429) {
    toast.error(HTTP_ERROR_RATE_LIMIT)
    return
  }

  if (status === 500) {
    toast.error(HTTP_ERROR_INTERNAL)
    return
  }

  if (status === 403) {
    toast.error('Sem permissão', {
      description:
        options.permissionDescription ?? 'Você não tem permissão para realizar essa ação.',
    })
    return
  }

  if (status === 409) {
    if (options.conflict === 'general') {
      toast.error(options.operationTitle ?? 'Não foi possível concluir', {
        description:
          error.message?.trim() ||
          'Há registros relacionados que podem impedir esta operação. Tente novamente ou verifique os dados.',
      })
      return
    }
    const extra =
      error.message && error.message !== HTTP_ERROR_DUPLICATE_IDENTITY ? error.message : undefined
    toast.error(HTTP_ERROR_DUPLICATE_IDENTITY, extra ? { description: extra } : undefined)
    return
  }

  if (status === 400) {
    toast.error('Dados inválidos', { description: describeValidationError(error) })
    return
  }

  toast.error(options.operationTitle ?? 'Falha na solicitação', {
    description: error.message || 'Tente novamente.',
  })
}
