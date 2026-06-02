import * as React from 'react'
import { useLuzia } from '../context/LuziaContext'

/**
 * Hook para que páginas ou componentes individuais registrem dados contextuais na Luzia.
 * Ao desmontar o componente, o contexto é limpo automaticamente.
 * 
 * @param context Objeto com dados relevantes da tela atual (ex: { patientName: "João", id: 1 })
 */
export function useLuziaPageContext(context: Record<string, any>) {
  const { setPageContext } = useLuzia()

  // Serializa em string para comparar mudanças reais e evitar loops de re-render
  const contextStr = JSON.stringify(context)

  React.useEffect(() => {
    try {
      const parsed = JSON.parse(contextStr)
      // Adiciona metadados genéricos adicionais
      const fullContext = {
        url: window.location.pathname + window.location.search,
        timestamp: new Date().toISOString(),
        ...parsed,
      }
      setPageContext(fullContext)
    } catch {
      // ignore
    }

    return () => {
      setPageContext({})
    }
  }, [contextStr, setPageContext])
}
