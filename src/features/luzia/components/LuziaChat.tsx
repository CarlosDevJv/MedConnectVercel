import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { useLuzia } from '../context/LuziaContext'
import { cn } from '@/lib/cn'

// Função auxiliar simples para renderizar markdown básico
function renderMarkdown(text: string) {
  return text.split('\n').map((line, idx) => {
    // Negrito: **texto**
    let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[var(--color-accent)]">$1</strong>')
    // Itálico: *texto*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Listas: "- item" ou "* item"
    if (formatted.trim().startsWith('- ') || formatted.trim().startsWith('* ')) {
      formatted = `<span class="inline-block mr-1.5 text-purple-500">•</span> ${formatted.substring(2)}`
    }
    return (
      <div
        key={idx}
        dangerouslySetInnerHTML={{ __html: formatted }}
        className="min-h-[1.2em] leading-relaxed text-[13.5px]"
      />
    )
  })
}

export function LuziaChat() {
  const navigate = useNavigate()
  const {
    isOpen,
    messages,
    isLoading,
    isRecording,
    toggleChat,
    sendMessage,
    startSpeechToText,
    stopSpeechToText,
    registerNavigate,
  } = useLuzia()

  React.useEffect(() => {
    registerNavigate(navigate)
  }, [navigate, registerNavigate])

  const lastProcessedMessageId = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (
      lastMsg.role === 'model' &&
      lastMsg.action &&
      lastMsg.id !== lastProcessedMessageId.current
    ) {
      lastProcessedMessageId.current = lastMsg.id
      const { type, payload } = lastMsg.action

      const payloadAny = payload as any
      const targetUrl = payloadAny?.path || payloadAny?.route || payloadAny?.url || (typeof payload === 'string' ? payload : '')

      if (type !== 'NONE') {
        toast.success('Encaminhado com sucesso')
      }

      if (type === 'NAVIGATE') {
        if (targetUrl) {
          let fullUrl = targetUrl
          if (payload?.queryParams) {
            const params = new URLSearchParams(payload.queryParams)
            fullUrl += `?${params.toString()}`
          }
          console.log('[LuziaChat] Navegando localmente para:', fullUrl, 'com prefill:', payload?.prefill)
          try {
            navigate(fullUrl, { state: { prefill: payload?.prefill } })
          } catch (err: any) {
            console.error('[LuziaChat] Erro na ação de navigate:', err)
            toast.error('Erro de Navegação da Luzia', {
              description: `Não foi possível navegar para ${targetUrl}. Detalhes: ${err?.message || err}`
            })
          }
        } else {
          console.warn('[LuziaChat] Ação NAVIGATE recebida, mas nenhum caminho de destino foi encontrado no payload:', payload)
        }
      } else if (type === 'SEARCH' && payload?.query) {
        const target = payload.target === 'pacientes' ? '/app/pacientes' : '/app'
        const searchQuery = payload.query || ''
        const targetUrl = `${target}?busca=${encodeURIComponent(searchQuery)}`
        console.log('[LuziaChat] Navegando localmente para busca:', targetUrl)
        try {
          navigate(targetUrl)
        } catch (err: any) {
          console.error('[LuziaChat] Erro na ação de busca:', err)
          toast.error('Erro de Busca da Luzia', {
            description: `Não foi possível buscar por ${payload.query}. Detalhes: ${err?.message || err}`
          })
        }
      } else if (type === 'LOGOUT') {
        console.log('[LuziaChat] Redirecionando para login localmente devido a logout')
        try {
          navigate('/login')
        } catch (err: any) {
          console.error('[LuziaChat] Erro ao redirecionar para login:', err)
        }
      }
    }
  }, [messages, navigate])

  const [inputValue, setInputValue] = React.useState('')

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Scroll automático para a última mensagem
  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isLoading])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const textToSend = inputValue
    setInputValue('')
    await sendMessage(textToSend)
  }

  const handleSpeech = () => {
    if (isRecording) {
      stopSpeechToText()
    } else {
      startSpeechToText((transcript) => {
        setInputValue((prev) => {
          const space = prev.trim() ? ' ' : ''
          return prev + space + transcript
        })
      })
    }
  }

  return (
    <>
      {/* Botão Flutuante da Luzia */}
      <button
        type="button"
        onClick={toggleChat}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)] shadow-lg cursor-pointer select-none border border-purple-400/20 outline-none transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
          isOpen ? 'rotate-90 scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        )}
        aria-label="Abrir assistente virtual Luzia"
      >
        <span className="absolute -inset-0.5 animate-ping rounded-full bg-purple-500/10 duration-1000" />
        <span className="absolute -inset-1 rounded-full border border-purple-400/5 shadow-[0_0_15px_rgba(147,51,234,0.15)]" />
        <img
          src="/luzia.png"
          alt="Luzia Avatar"
          className="h-full w-full rounded-full object-cover p-0.5"
          onError={(e) => {
            // Fallback se a imagem não carregar
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-zinc-900" />
      </button>

      {/* Janela de Chat */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-[540px] w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] flex-col rounded-2xl border border-zinc-200 bg-zinc-50 shadow-2xl outline-none transition-all duration-300',
          isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-12 scale-90 opacity-0 pointer-events-none'
        )}
      >
        {/* Cabeçalho */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-150 px-4 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="relative h-10 w-10 shrink-0 rounded-full border border-zinc-200 bg-zinc-50">
              <img
                src="/luzia.png"
                alt="Luzia Avatar"
                className="h-full w-full rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-[var(--color-accent)]">Luzia</span>
                <Sparkles className="h-3 w-3 text-purple-500 fill-purple-400" />
              </div>
              <span className="block text-[11px] font-medium text-zinc-500">Assistente do MediConnect</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleChat}
              className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-650"
              title="Minimizar"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Corpo principal (Chat) */}
        <div className="relative flex-1 overflow-hidden">

          {/* Área do Histórico de Conversas */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 overflow-y-auto space-y-3.5 bg-zinc-50/30">
            <div className="flex-1 space-y-3.5 pr-0.5">
              {messages.map((msg) => {
                const isModel = msg.role === 'model'
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex w-full flex-col max-w-[85%]',
                      isModel ? 'self-start' : 'self-end ml-auto items-end'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-xs shadow-sm border',
                        isModel
                          ? 'bg-white border-zinc-200 text-zinc-800 rounded-tl-sm'
                          : 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white rounded-tr-sm shadow-[0_1px_3px_rgba(147,51,234,0.15)]'
                      )}
                    >
                      {isModel ? renderMarkdown(msg.text) : msg.text}
                    </div>
                    <span className="mt-1 block text-[9px] text-zinc-400 dark:text-zinc-500">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex w-full flex-col max-w-[85%] self-start">
                  <div className="rounded-2xl rounded-tl-sm bg-white border border-zinc-200 px-3.5 py-3 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)] [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)] [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Rodapé - Formulário de Input */}
        <div className="shrink-0 border-t border-zinc-150 p-3 bg-white rounded-b-2xl">
          <form onSubmit={handleSend} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSpeech}
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-[var(--color-accent)] transition-all hover:bg-zinc-100 hover:text-[var(--color-accent)]',
                isRecording && 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100 animate-pulse'
              )}
              title={isRecording ? 'Parar gravação' : 'Falar por voz'}
            >
              {isRecording ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isRecording ? 'Gravando voz...' : 'Escreva para a Luzia...'}
                disabled={isLoading}
                className="w-full rounded-xl border border-zinc-200/80 bg-zinc-50 px-3.5 py-2.5 text-xs outline-none transition-colors focus:border-[var(--color-accent)] focus:bg-white focus:ring-1 focus:ring-[var(--color-accent)] text-zinc-900 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-accent)] text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-40 disabled:shadow-none cursor-pointer"
              title="Enviar mensagem"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
