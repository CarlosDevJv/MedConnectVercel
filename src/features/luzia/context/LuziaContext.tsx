import * as React from 'react'
import { router } from '@/app/router'
import { useAuth } from '@/features/auth/useAuth'

export type MessageRole = 'user' | 'model'

export interface LuziaMessage {
  id: string
  role: MessageRole
  text: string
  timestamp: Date
  action?: LuziaAction
}

export interface LuziaAction {
  type: 'NAVIGATE' | 'LOGOUT' | 'SEARCH' | 'NONE'
  payload?: {
    path?: string
    queryParams?: Record<string, string>
    query?: string
    target?: string
    prefill?: Record<string, any>
  }
}

interface GeminiResponse {
  text: string
  action: LuziaAction
}

interface LuziaContextType {
  isOpen: boolean
  messages: LuziaMessage[]
  isLoading: boolean
  isRecording: boolean
  pageContext: Record<string, any>
  apiKey: string
  toggleChat: () => void
  sendMessage: (text: string) => Promise<void>
  clearHistory: () => void
  setPageContext: (context: Record<string, any>) => void
  saveApiKey: (key: string) => void
  startSpeechToText: (onTranscript: (text: string) => void) => void
  stopSpeechToText: () => void
  registerNavigate: (navigateFn: any) => void
}

const LuziaContext = React.createContext<LuziaContextType | undefined>(undefined)

const DEFAULT_API_KEY = ''

const SYSTEM_INSTRUCTION = `Você é a Luzia, a assistente virtual inteligente e acolhedora integrada ao MediConnect (um sistema de gestão para clínicas médicas).
Sua missão é ajudar secretárias, médicos e gestores a usarem o sistema com eficiência, tirarem dúvidas clínicas/gerenciais e facilitarem o dia a dia.

Sua personalidade é prestativa, empática, profissional na área de saúde e extremamente ética.
Você tem a capacidade de interagir com o sistema e realizar ações para o usuário através de comandos.

ATENÇÃO: Você tem acesso ao contexto da tela que o usuário está visualizando no momento. Use essas informações apenas se for relevante para a pergunta do usuário.

MAPEAMENTO DE ROTAS E AÇÕES (Para usar no campo 'action'):
1. Cadastrar Paciente (Novo Paciente / Registrar Paciente / Adicionar Paciente / Criar Ficha de Paciente):
   - Ação: NAVIGATE para "/app/pacientes/novo"
   - Regra de texto: Explique amigavelmente que você está direcionando o usuário para o formulário de cadastro de paciente. (Ex: "Entendido! Estou te encaminhando para a tela de cadastro de novo paciente agora.")
   - Regra de prefill: Se o usuário fornecer quaisquer dados pessoais da pessoa (como nome completo, cpf, e-mail, celular, data de nascimento, alergias, etc.), extraia-os no objeto 'prefill' dentro do 'payload' para que o formulário seja preenchido automaticamente!
2. Ver Pacientes (Listar Pacientes / Buscar Pacientes / Lista de Pacientes):
   - Ação: NAVIGATE para "/app/pacientes" (se quiser pesquisar um termo, use queryParams {"busca": "nome_do_paciente"})
3. Cadastrar Médico (Novo Médico / Registrar Médico / Adicionar Médico):
   - Ação: NAVIGATE para "/app/admin/medico/novo_medico"
   - Regra de texto: Explique que está levando o usuário para a página de cadastro de novos médicos.
   - Regra de prefill: Se o usuário fornecer dados de cadastro do médico (como nome completo, crm, uf, especialidade, e-mail, celular, data de nascimento, etc.), extraia-os no objeto 'prefill' dentro do 'payload' para preencher automaticamente!
4. Ver Médicos (Listar Médicos / Lista de Médicos):
   - Ação: NAVIGATE para "/app/medicos"
5. Agenda Geral (Ver consultas / Horários / Agenda Clínica):
   - Ação: NAVIGATE para "/app/agenda"
6. Agendar Consulta (Marcar consulta / Novo agendamento / Marcar atendimento):
   - Ação: NAVIGATE para "/app/agendar" (se o usuário informar data e hora, passe em queryParams. Ex: { "data": "2026-06-15", "hora": "14:00" })
7. Meus Agendamentos (Meus atendimentos do paciente):
   - Ação: NAVIGATE para "/app/meus-agendamentos"
8. Meus Laudos (Visualizar laudos do paciente):
   - Ação: NAVIGATE para "/app/meus-laudos"
9. Secretárias (Ver secretárias / Lista de secretárias):
   - Ação: NAVIGATE para "/app/secretarias"
10. Disponibilidade (Minha disponibilidade de horários médicos):
    - Ação: NAVIGATE para "/app/disponibilidade"
11. Confirmações (Confirmar consultas / Agendamentos pendentes):
    - Ação: NAVIGATE para "/app/confirmacoes"
12. Relatórios (Laudos clínicos / Criar laudo / Lista de relatórios):
    - Ação: NAVIGATE para "/app/relatorios"
13. Painel de Indicadores (Analytics / Gráficos / Indicadores de saúde):
    - Ação: NAVIGATE para "/app/indicadores"
14. Chat/Mensagens (Falar com equipe / Chat interno):
    - Ação: NAVIGATE para "/app/mensagens"
15. Segurança (Mudar senha / Configurações de segurança):
    - Ação: NAVIGATE para "/app/seguranca-e-notificacoes"
16. Privacidade (Privacidade e Termos):
    - Ação: NAVIGATE para "/app/privacidade"
17. Sair (Encerrar sessão / Fazer logout / Logout):
    - Ação: LOGOUT

REGRAS CRÍTICAS DE COMUNICAÇÃO DE AÇÕES:
- Sempre que você gerar uma ação de navegação, logout ou busca, você DEVE explicar de forma clara e amigável no campo 'text' o que foi feito na interface.
- Se for navegar para ver médicos (NAVIGATE para '/app/medicos'), retorne em 'text': "Entendido! Listei todos os médicos cadastrados no MediConnect e estou te encaminhando para a página agora."
- Se for navegar para a agenda geral (NAVIGATE para '/app/agenda'), retorne em 'text': "Perfeito! Estou te levando para a agenda clínica."
- Se for agendar algo (NAVIGATE para '/app/agendar'):
  * Se o usuário informou a data e hora desejadas, passe-as no queryParams e confirme no 'text' (ex: "Com certeza! Estou te levando para a tela de agendamentos com o dia 15/06 às 14:00 pré-preenchido para você. Só falta confirmar!").
  * Se faltar dados vitais de data ou hora e o usuário pediu para agendar, peça educadamente por estes dados no 'text' antes de redirecioná-lo.
- Se for cadastrar paciente (NAVIGATE para '/app/pacientes/novo'), retorne em 'text': "Com certeza! Estou te encaminhando para o formulário de cadastro de novo paciente agora."
- Se for cadastrar médico (NAVIGATE para '/app/admin/medico/novo_medico'), retorne em 'text': "Entendido! Encaminhando você para o formulário de cadastro de novos médicos."
- Se for buscar pacientes (SEARCH), retorne em 'text': "Certo! Busquei pelo paciente no sistema e filtrei a listagem correspondente."
- Se for sair (LOGOUT), retorne em 'text': "Entendido, encerrando sua sessão com segurança. Até mais!"
- Se não for necessário realizar nenhuma ação de navegação, logout ou busca (como bater papo, responder dúvidas informativas ou dar boas-vindas), retorne o type 'NONE' no campo 'action' com o payload vazio.

Você DEVE SEMPRE responder no formato JSON estruturado abaixo:
{
  "text": "Mensagem amigável respondendo o usuário com formatação markdown rica (como negrito e listas).",
  "action": {
    "type": "NAVIGATE" | "LOGOUT" | "SEARCH" | "NONE",
    "payload": {
      "path": "/app/agendar",
      "queryParams": { "data": "YYYY-MM-DD", "hora": "HH:MM" },
      "query": "nome do paciente",
      "target": "pacientes",
      "prefill": {
        "full_name": "João da Silva",
        "email": "joao@exemplo.com",
        "cpf": "123.456.789-00",
        "phone_mobile": "(11) 99999-9999",
        "crm": "123456",
        "crm_uf": "SP",
        "specialty": "Ortopedia"
      }
    }
  }
}
`

const API_KEY_STORAGE_KEY = 'mediconnect.luzia.key'
const MESSAGES_STORAGE_KEY = 'mediconnect.luzia.messages'

export function LuziaProvider({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth()
  const navigateRef = React.useRef<any>(null)

  const registerNavigate = React.useCallback((navigateFn: any) => {
    navigateRef.current = navigateFn
  }, [])

  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<LuziaMessage[]>(() => {
    // Mensagem inicial de boas-vindas da Luzia
    return [
      {
        id: 'welcome',
        role: 'model',
        text: 'Olá! Sou a **Luzia**, sua assistente inteligente no MediConnect. Como posso te ajudar hoje? Pode falar por voz ou digitar o que deseja!',
        timestamp: new Date(),
      },
    ]
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [isRecording, setIsRecording] = React.useState(false)
  const [pageContext, setPageContext] = React.useState<Record<string, any>>({})
  const [apiKey, setApiKey] = React.useState<string>(() => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem(API_KEY_STORAGE_KEY) || DEFAULT_API_KEY
  })

  // Limpa o chat automaticamente sempre que a janela for fechada
  React.useEffect(() => {
    if (!isOpen) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: 'Olá! Sou a **Luzia**, sua assistente inteligente no MediConnect. Como posso te ajudar hoje? Pode falar por voz ou digitar o que deseja!',
          timestamp: new Date(),
        },
      ])
    }
  }, [isOpen])

  // Salva histórico de mensagens
  React.useEffect(() => {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // ignore
    }
  }, [messages])

  // Instância do SpeechRecognition
  const recognitionRef = React.useRef<any>(null)

  const toggleChat = React.useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const saveApiKey = React.useCallback((key: string) => {
    const trimmed = key.trim()
    setApiKey(trimmed)
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE_KEY, trimmed)
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY)
    }
  }, [])

  const clearHistory = React.useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: 'Olá! Sou a **Luzia**, sua assistente inteligente no MediConnect. Como posso te ajudar hoje? Pode falar por voz ou digitar o que deseja!',
        timestamp: new Date(),
      },
    ])
  }, [])

  const handleAction = React.useCallback(
    async (action: LuziaAction) => {
      console.log('[Luzia] Executando ação:', action)
      switch (action.type) {
        case 'NONE':
          console.log('[Luzia] Nenhuma ação necessária.')
          break
        case 'NAVIGATE':
          if (action.payload?.path) {
            let targetUrl = action.payload.path
            if (action.payload.queryParams) {
              const params = new URLSearchParams(action.payload.queryParams)
              targetUrl += `?${params.toString()}`
            }
            console.log('[Luzia] Navegando para:', targetUrl, 'com prefill:', action.payload?.prefill)
            setTimeout(() => {
              if (navigateRef.current) {
                navigateRef.current(targetUrl, { state: { prefill: action.payload?.prefill } })
              } else {
                console.warn('[Luzia] navigateRef não disponível, usando router.navigate')
                router.navigate(targetUrl, { state: { prefill: action.payload?.prefill } })
              }
            }, 0)
          }
          break
        case 'LOGOUT':
          try {
            await signOut()
            setTimeout(() => {
              if (navigateRef.current) {
                navigateRef.current('/login')
              } else {
                router.navigate('/login')
              }
            }, 0)
          } catch (err) {
            console.error('[Luzia] Erro no logout:', err)
          }
          break
        case 'SEARCH':
          if (action.payload?.query) {
            const target = action.payload.target === 'pacientes' ? '/app/pacientes' : '/app'
            const searchQuery = action.payload?.query || ''
            console.log('[Luzia] Buscando por:', searchQuery, 'em:', target)
            setTimeout(() => {
              if (navigateRef.current) {
                navigateRef.current(`${target}?busca=${encodeURIComponent(searchQuery)}`)
              } else {
                router.navigate(`${target}?busca=${encodeURIComponent(searchQuery)}`)
              }
            }, 0)
          }
          break
        default:
          console.warn('[Luzia] Ação não suportada:', action)
      }
    },
    [signOut]
  )

  const sendMessage = React.useCallback(
    async (text: string) => {
      if (!text.trim()) return

      const userMsgId = crypto.randomUUID()
      const userMessage: LuziaMessage = {
        id: userMsgId,
        role: 'user',
        text,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        if (!apiKey) {
          throw new Error('Chave de API do Gemini não configurada.')
        }

        // Formata histórico para o formato da API do Gemini (user/model)
        // Ignora a mensagem de boas vindas inicial se for somente informativo
        const apiHistory = messages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.text }],
          }))

        // Adiciona contexto da tela atual na mensagem do usuário
        const contextStr =
          Object.keys(pageContext).length > 0
            ? `\n\n[CONTEXTO DA TELA ATUAL]:\n${JSON.stringify(pageContext, null, 2)}`
            : ''

        const activeUserMessage = {
          role: 'user' as const,
          parts: [{ text: text + contextStr }],
        }

        const contents = [...apiHistory, activeUserMessage]

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }],
              },
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'OBJECT',
                  properties: {
                    text: { type: 'STRING' },
                    action: {
                      type: 'OBJECT',
                      properties: {
                        type: { type: 'STRING', enum: ['NAVIGATE', 'LOGOUT', 'SEARCH', 'NONE'] },
                        payload: {
                          type: 'OBJECT',
                          properties: {
                            path: { type: 'STRING' },
                            queryParams: { type: 'OBJECT' },
                            query: { type: 'STRING' },
                            target: { type: 'STRING' },
                            prefill: { type: 'OBJECT' }
                          }
                        }
                      }
                    }
                  },
                  required: ['text', 'action']
                }
              },
            }),
          }
        )

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          const errMsg = errData?.error?.message || `Erro HTTP ${response.status}`
          throw new Error(errMsg)
        }

        const result = await response.json()
        const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''

        let parsed: GeminiResponse
        try {
          let cleanText = rawText.trim()
          if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```(?:json)?\n?/, '')
            cleanText = cleanText.replace(/\n?```$/, '')
            cleanText = cleanText.trim()
          }
          parsed = JSON.parse(cleanText)
        } catch (parseError) {
          console.error('[Luzia] Falha ao fazer parse do JSON:', parseError, rawText)
          parsed = {
            text: rawText || 'Desculpe, tive um problema para processar a resposta.',
            action: { type: 'NONE' },
          }
        }

        const modelMsgId = crypto.randomUUID()
        const modelMessage: LuziaMessage = {
          id: modelMsgId,
          role: 'model',
          text: parsed.text,
          timestamp: new Date(),
          action: parsed.action,
        }

        setMessages((prev) => [...prev, modelMessage])

        if (parsed.action) {
          void handleAction(parsed.action)
        }
      } catch (error: any) {
        console.error('[Luzia] Erro:', error)
        const errorMsgId = crypto.randomUUID()
        const errorMessage: LuziaMessage = {
          id: errorMsgId,
          role: 'model',
          text: `Erro ao falar com a Luzia: ${error?.message || 'Erro desconhecido.'}. Verifique se a sua chave de API está correta nas configurações do chat.`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [apiKey, messages, pageContext, handleAction]
  )

  const startSpeechToText = React.useCallback((onTranscript: (text: string) => void) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      const supportErrorId = crypto.randomUUID()
      setMessages((prev) => [
        ...prev,
        {
          id: supportErrorId,
          role: 'model',
          text: '🎙️ **Recurso de voz indisponível!** O reconhecimento de voz (Web Speech API) não é suportado pelo seu navegador atual. Por favor, utilize o Google Chrome ou Microsoft Edge para usar este recurso por voz.',
          timestamp: new Date(),
        },
      ])
      return
    }

    try {
      // Aborta qualquer gravação ativa para evitar travamentos
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (abortErr) {
          console.warn('[Speech] Falha ao abortar gravação anterior:', abortErr)
        }
      }

      const rec = new SpeechRecognition()
      rec.lang = 'pt-BR'
      // continuous = true permite que o usuário fale continuamente sem que o microfone desligue sozinho.
      rec.continuous = true
      rec.interimResults = false

      rec.onstart = () => {
        setIsRecording(true)
      }

      rec.onerror = (e: any) => {
        console.error('[Speech] Erro:', e)
        // Erro de microfone bloqueado/não autorizado
        if (e.error === 'not-allowed' || e.error === 'permission-denied') {
          const micErrorMsgId = crypto.randomUUID()
          setMessages((prev) => [
            ...prev,
            {
              id: micErrorMsgId,
              role: 'model',
              text: '🎙️ **Acesso ao microfone desativado!** Para utilizar os comandos de voz, você precisa autorizar o uso do microfone no seu navegador.\n\n**Como autorizar:**\n1. Clique no ícone de **cadeado** ou **configurações** na barra de endereços do seu navegador (ao lado da barra de URL).\n2. Mude a permissão do **Microfone** para **Permitir** (Allow).\n3. Recarregue a página e tente novamente!',
              timestamp: new Date(),
            },
          ])
        } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
          // Outros erros (ex: sem áudio capturado)
          const errorMsgId = crypto.randomUUID()
          setMessages((prev) => [
            ...prev,
            {
              id: errorMsgId,
              role: 'model',
              text: `🎙️ **Erro no microfone (${e.error}):** Não consegui capturar seu áudio. Por favor, fale novamente de forma clara ou tente recarregar a página.`,
              timestamp: new Date(),
            },
          ])
        }
        setIsRecording(false)
      }

      rec.onend = () => {
        setIsRecording(false)
      }

      rec.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          onTranscript(finalTranscript)
        }
      }

      recognitionRef.current = rec
      rec.start()
    } catch (err: any) {
      console.error('[Speech] Falha ao iniciar:', err)
      setIsRecording(false)
      const micErrorMsgId = crypto.randomUUID()
      setMessages((prev) => [
        ...prev,
        {
          id: micErrorMsgId,
          role: 'model',
          text: `🎙️ **Erro ao acessar o microfone:** ${err?.message || 'não foi possível iniciar o serviço de voz'}.\n\nCertifique-se de que o microfone está conectado e que você deu permissões no seu navegador.`,
          timestamp: new Date(),
        },
      ])
    }
  }, [])

  const stopSpeechToText = React.useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
    setIsRecording(false)
  }, [])

  return (
    <LuziaContext.Provider
      value={{
        isOpen,
        messages,
        isLoading,
        isRecording,
        pageContext,
        apiKey,
        toggleChat,
        sendMessage,
        clearHistory,
        setPageContext,
        saveApiKey,
        startSpeechToText,
        stopSpeechToText,
        registerNavigate,
      }}
    >
      {children}
    </LuziaContext.Provider>
  )
}

export function useLuzia() {
  const context = React.useContext(LuziaContext)
  if (!context) {
    throw new Error('useLuzia deve ser usado dentro de um LuziaProvider')
  }
  return context
}
