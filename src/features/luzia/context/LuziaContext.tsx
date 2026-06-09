import * as React from 'react'
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

const DEFAULT_API_KEY = 'AQ.Ab8RN6KmvvJNfw0LPF5Q5NkikIvCPNLBBhBdt69vWpSf3pCc1g'

function getSystemInstruction(userInfo: any) {
  const roles = userInfo?.roles ?? []
  
  // Determina a role principal do usuário
  let primaryRole = 'user'
  if (roles.includes('admin')) primaryRole = 'admin'
  else if (roles.includes('gestor')) primaryRole = 'gestor'
  else if (roles.includes('medico')) primaryRole = 'medico'
  else if (roles.includes('secretaria')) primaryRole = 'secretaria'
  else if (roles.includes('paciente')) primaryRole = 'paciente'

  let rotasPermitidas = ''
  
  if (primaryRole === 'paciente') {
    rotasPermitidas = `Como PACIENTE, o usuário possui acesso APENAS às seguintes rotas e ações:
1. Agendar Consulta (Marcar consulta / Novo agendamento / Marcar atendimento):
   - Ação: NAVIGATE para "/app/agendar" (se o usuário informar data e hora, passe em queryParams. Ex: { "data": "2026-06-15", "hora": "14:00" })
   - Regra de texto: Explique que está levando o usuário para a tela de agendamento de consultas.
2. Meus Agendamentos (Listar/Visualizar consultas marcadas pelo paciente):
   - Ação: NAVIGATE para "/app/meus-agendamentos"
3. Meus Laudos (Visualizar laudos e exames do paciente):
   - Ação: NAVIGATE para "/app/meus-laudos"
4. Segurança e Senha (Mudar senha / Configurações de segurança):
   - Ação: NAVIGATE para "/app/seguranca-e-notificacoes"
5. Privacidade e Termos:
   - Ação: NAVIGATE para "/app/privacidade"
6. Sair (Fazer logout):
   - Ação: LOGOUT

ATENÇÃO CRÍTICA: Como PACIENTE, o usuário NÃO possui acesso a nenhuma tela da equipe clínica. Se o usuário paciente pedir para ver a agenda de outros médicos, ver a lista de pacientes da clínica, cadastrar um médico, cadastrar outro paciente, ver laudos médicos gerais, etc., você deve responder de forma simpática que ele está no Portal do Paciente e estas ações são restritas aos profissionais de saúde e administradores. Não tente redirecioná-lo para caminhos como "/app/agenda", "/app/pacientes", "/app/admin/medico/novo_medico" ou "/app/secretarias", pois ele receberá erro de Acesso Negado.`
  } else if (primaryRole === 'medico') {
    rotasPermitidas = `Como MÉDICO, o usuário possui acesso às seguintes rotas e ações:
1. Agenda Clínica (Ver consultas da clínica / Minha agenda / Agenda de atendimentos):
   - Ação: NAVIGATE para "/app/agenda"
   - Regra de texto: Explique que está levando o usuário para a agenda clínica.
2. Ver Pacientes (Listar Pacientes / Buscar Pacientes da clínica):
   - Ação: NAVIGATE para "/app/pacientes" (se quiser pesquisar um termo, use queryParams {"busca": "nome_do_paciente"})
3. Laudos Clínicos e Relatórios (Ver laudos, Criar laudo, Lista de relatórios médicos):
   - Ação: NAVIGATE para "/app/relatorios"
4. Minha Disponibilidade (Configurar meus horários de atendimento / Escala de trabalho):
   - Ação: NAVIGATE para "/app/disponibilidade"
5. Chat/Mensagens Internas (Falar com a equipe clínica / Conversas):
   - Ação: NAVIGATE para "/app/mensagens"
6. Segurança e Notificações (Mudar senha / Configurações de segurança):
   - Ação: NAVIGATE para "/app/seguranca-e-notificacoes"
7. Privacidade:
   - Ação: NAVIGATE para "/app/privacidade"
8. Sair (Fazer logout):
   - Ação: LOGOUT

ATENÇÃO CRÍTICA: Como MÉDICO, se o usuário pedir para "Agendar Consulta" ou "Marcar Consulta", você deve levá-lo para a Agenda Clínica ("/app/agenda"), onde ele poderá marcar horários. Médicos NÃO têm acesso à rota "/app/agendar" (portal do paciente) nem a cadastro administrativo de médicos ("/app/admin/medico/novo_medico"), lista de secretárias ("/app/secretarias"), painel de indicadores ("/app/indicadores") ou confirmações de agendamentos pendentes da recepção ("/app/confirmacoes"). Se ele pedir por estas páginas administrativas, explique educadamente que elas são reservadas para gestores e administradores.`
  } else if (primaryRole === 'secretaria') {
    rotasPermitidas = `Como SECRETÁRIA, o usuário possui acesso às seguintes rotas e ações:
1. Cadastrar Paciente (Novo Paciente / Registrar Paciente / Adicionar Paciente):
   - Ação: NAVIGATE para "/app/pacientes/novo"
   - Regra de prefill: Se o usuário fornecer quaisquer dados da pessoa (como nome completo, cpf, e-mail, celular, data de nascimento, alergias, etc.), extraia-os no objeto 'prefill' dentro do 'payload' para que o formulário seja preenchido automaticamente!
2. Ver Pacientes (Listar Pacientes / Buscar Pacientes):
   - Ação: NAVIGATE para "/app/pacientes" (se quiser pesquisar um termo, use queryParams {"busca": "nome_do_paciente"})
3. Agenda Clínica (Ver consultas da clínica / Agenda Geral / Marcar Consulta):
   - Ação: NAVIGATE para "/app/agenda"
   - Nota: Se o usuário secretária pedir para "Agendar Consulta", "Marcar consulta" ou "Novo agendamento", direcione-a para a Agenda Clínica ("/app/agenda"), onde ela pode selecionar o horário e marcar. Ela NÃO tem acesso à rota "/app/agendar" (portal do paciente).
4. Ver Médicos (Lista de Médicos da clínica):
   - Ação: NAVIGATE para "/app/medicos"
5. Confirmações (Confirmar consultas / Agendamentos pendentes da recepção):
   - Ação: NAVIGATE para "/app/confirmacoes"
6. Chat/Mensagens Internas (Conversar com a equipe):
   - Ação: NAVIGATE para "/app/mensagens"
7. Segurança e Notificações (Mudar senha / Configurações de segurança):
   - Ação: NAVIGATE para "/app/seguranca-e-notificacoes"
8. Privacidade:
   - Ação: NAVIGATE para "/app/privacidade"
9. Sair (Fazer logout):
   - Ação: LOGOUT

ATENÇÃO CRÍTICA: Como SECRETÁRIA, o usuário NÃO possui permissão para cadastrar médicos ("novo médico" / "/app/admin/medico/novo_medico"), cadastrar/gerenciar secretárias ("/app/secretarias"), visualizar laudos/relatórios médicos ("/app/relatorios") ou ver indicadores de gestão/analytics ("/app/indicadores"). Se ela tentar fazer alguma dessas ações, explique de forma simpática que estas funções exigem perfil de administrador ou gestor da clínica.`
  } else {
    // Admin ou Gestor
    rotasPermitidas = `Como ADMINISTRADOR/GESTOR, o usuário possui acesso TOTAL ao sistema, incluindo todas as rotas e ações abaixo:
1. Cadastrar Paciente (Novo Paciente):
   - Ação: NAVIGATE para "/app/pacientes/novo"
   - Regra de prefill: Se fornecidos dados pessoais, passe no objeto 'prefill' do 'payload' para preencher automaticamente!
2. Ver Pacientes (Lista/Buscar Pacientes):
   - Ação: NAVIGATE para "/app/pacientes" (queryParams {"busca": "nome_do_paciente"})
3. Cadastrar Médico (Novo Médico / Registrar Médico):
   - Ação: NAVIGATE para "/app/admin/medico/novo_medico"
   - Regra de prefill: Se fornecidos dados (nome, crm, especialidade, etc.), passe no objeto 'prefill' do 'payload' para preencher automaticamente!
4. Ver Médicos (Lista de Médicos):
   - Ação: NAVIGATE para "/app/medicos"
5. Cadastrar/Gerenciar Secretárias (Ver secretárias / Lista de secretárias):
   - Ação: NAVIGATE para "/app/secretarias"
   - Regra de prefill: Se fornecidos dados de cadastro (nome, e-mail, telefone), passe no objeto 'prefill' do 'payload' para preencher automaticamente!
6. Agenda Clínica (Ver consultas / Horários / Agenda Geral):
   - Ação: NAVIGATE para "/app/agenda"
7. Agendar no Portal do Paciente (Marcar consulta / Novo agendamento / Marcar atendimento no portal):
   - Ação: NAVIGATE para "/app/agendar" (se o usuário informar data e hora, passe em queryParams. Ex: { "data": "2026-06-15", "hora": "14:00" })
8. Meus Agendamentos (Consultas do paciente):
   - Ação: NAVIGATE para "/app/meus-agendamentos"
9. Meus Laudos (Laudos do paciente):
   - Ação: NAVIGATE para "/app/meus-laudos"
10. Confirmações (Confirmar consultas / Agendamentos pendentes):
   - Ação: NAVIGATE para "/app/confirmacoes"
11. Laudos Clínicos e Relatórios (Ver laudos, Criar laudo, Lista de relatórios):
   - Ação: NAVIGATE para "/app/relatorios"
12. Painel de Indicadores (Analytics / Gráficos / Indicadores de saúde):
   - Ação: NAVIGATE para "/app/indicadores"
13. Chat/Mensagens Internas (Falar com equipe):
    - Ação: NAVIGATE para "/app/mensagens"
14. Segurança e Notificações (Mudar senha / Configurações de segurança):
    - Ação: NAVIGATE para "/app/seguranca-e-notificacoes"
15. Privacidade:
    - Ação: NAVIGATE para "/app/privacidade"
16. Sair (Fazer logout):
    - Ação: LOGOUT

ATENÇÃO: Como Administrador ou Gestor, o usuário possui privilégios de acesso universal. Ele pode acessar tanto as telas operacionais da clínica quanto as telas do portal do paciente ("/app/agendar", "/app/meus-agendamentos" ou "/app/meus-laudos"). Leve-o exatamente para a rota correspondente à tela que ele solicitar!`
  }

  return `Você é a Luzia, a assistente virtual inteligente e acolhedora integrada ao MediConnect (um sistema de gestão para clínicas médicas).
Sua missão é ajudar o usuário atual de acordo com o seu perfil de acesso no sistema.
Sua personalidade é prestativa, empática, profissional na área de saúde e extremamente ética.
Você tem a capacidade de interagir com o sistema e realizar ações para o usuário através de comandos de navegação ou logout.

ATENÇÃO: O usuário atual logado possui o papel (role) primário: "${primaryRole}" e seu nome completo é "${userInfo?.profile?.full_name ?? 'Usuário'}" (e-mail: ${userInfo?.user?.email ?? 'não informado'}).

${rotasPermitidas}

REGRAS CRÍTICAS DE COMUNICAÇÃO DE AÇÕES:
- Sempre que você gerar uma ação de navegação, logout ou busca, você DEVE explicar de forma clara e amigável no campo 'text' o que foi feito na interface.
- Se a ação for "NAVIGATE", o campo "action.payload.path" é OBRIGATÓRIO e deve conter a string da rota exata (ex: "/app/agenda" ou "/app/agendar"). NUNCA deixe o campo "path" vazio ou omitido dentro do payload se o tipo for NAVIGATE!
- Se não for necessário realizar nenhuma ação de navegação, logout ou busca (como bater papo, responder dúvidas informativas ou dar boas-vindas), retorne o type 'NONE' no campo 'action' com o payload vazio.

Você DEVE SEMPRE responder no formato JSON estruturado abaixo:
{
  "text": "Mensagem amigável respondendo o usuário com formatação markdown rica (como negrito e listas).",
  "action": {
    "type": "NAVIGATE" | "LOGOUT" | "SEARCH" | "NONE",
    "payload": {
      "path": "/app/...",
      "queryParams": { "busca": "termo" },
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
}

const API_KEY_STORAGE_KEY = 'mediconnect.luzia.key'
const MESSAGES_STORAGE_KEY = 'mediconnect.luzia.messages'

export function LuziaProvider({ children }: { children: React.ReactNode }) {
  const { signOut, userInfo } = useAuth()
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
      console.log('[Luzia] Executando ação de retaguarda:', action)
      switch (action.type) {
        case 'LOGOUT':
          try {
            await signOut()
            console.log('[Luzia] Sessão encerrada no backend.')
          } catch (err) {
            console.error('[Luzia] Erro no logout do backend:', err)
          }
          break
        default:
          console.log('[Luzia] Navegação física delegada ao componente LuziaChat.')
          break
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
                parts: [{ text: getSystemInstruction(userInfo) }],
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
                        path: { type: 'STRING' },
                        queryParams: { type: 'OBJECT' },
                        query: { type: 'STRING' },
                        target: { type: 'STRING' },
                        prefill: { type: 'OBJECT' }
                      },
                      required: ['type']
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
        const parsedAction = parsed.action as any
        const mappedAction: LuziaAction = {
          type: parsedAction?.type || 'NONE',
          payload: {
            path: parsedAction?.path,
            queryParams: parsedAction?.queryParams,
            query: parsedAction?.query,
            target: parsedAction?.target,
            prefill: parsedAction?.prefill,
          }
        }

        const modelMessage: LuziaMessage = {
          id: modelMsgId,
          role: 'model',
          text: parsed.text,
          timestamp: new Date(),
          action: mappedAction,
        }

        setMessages((prev) => [...prev, modelMessage])

        if (mappedAction) {
          void handleAction(mappedAction)
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
    [apiKey, messages, pageContext, handleAction, userInfo]
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
