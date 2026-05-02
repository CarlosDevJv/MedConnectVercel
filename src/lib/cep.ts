/**
 * ViaCEP integration. Looks up a Brazilian postal code (CEP) and returns the
 * street, neighborhood, city and state. Falls back to `null` on any error or
 * when the CEP doesn't exist (ViaCEP returns `{ erro: true }`).
 *
 * Public API, no key required: https://viacep.com.br/
 */
export interface CepLookupResult {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
}

interface ViaCepResponse {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

export async function lookupCep(rawCep: string, signal?: AbortSignal): Promise<CepLookupResult | null> {
  const digits = rawCep.replace(/\D+/g, '')
  if (digits.length !== 8) return null

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const data = (await response.json()) as ViaCepResponse
    if (data.erro) return null

    return {
      cep: digits,
      street: data.logradouro?.trim() ?? '',
      neighborhood: data.bairro?.trim() ?? '',
      city: data.localidade?.trim() ?? '',
      state: (data.uf ?? '').toUpperCase(),
    }
  } catch {
    return null
  }
}
