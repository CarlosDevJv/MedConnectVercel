import { ApiError } from '@/lib/apiClient'

/** Mensagens curtas para paciente: sem URLs, paths de API nem detalhes técnicos. */
export function friendlyPortalLoadError(error: unknown): string {
  if (error instanceof ApiError) {
    const { status } = error
    if (status === 401) return 'Sessão expirada ou inválida.'
    if (status === 403) return 'Você não tem permissão para ver estes dados.'
    if (status === 404) return 'Dados não encontrados.'
    if (status === 429) return 'Muitas tentativas. Aguarde e tente de novo.'
    if (status >= 500 && status <= 599) return 'Serviço temporariamente indisponível. Tente mais tarde.'
    if (status >= 400 && status <= 499) return 'Não foi possível concluir a solicitação.'
  }
  const errObj = typeof error === 'object' && error !== null ? (error as { message?: string; name?: string }) : {}
  const name = typeof errObj.name === 'string' ? errObj.name : ''
  const message = typeof errObj.message === 'string' ? errObj.message : ''
  if (/AbortError|aborted/i.test(name) || /abort|timeout/i.test(message)) {
    return 'Tempo da operação esgotado.'
  }
  if (/failed to fetch|network|load failed/i.test(message)) return 'Sem conexão ou serviço indisponível.'
  return 'Não foi possível carregar. Tente novamente.'
}
