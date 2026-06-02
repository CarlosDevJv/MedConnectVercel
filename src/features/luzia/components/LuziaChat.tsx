import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send,
  Mic,
  MicOff,
  X,
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
    apiKey,
    toggleChat,
    sendMessage,
    saveApiKey,
    startSpeechToText,
    stopSpeechToText,
    registerNavigate,
  } = useLuzia()

  React.useEffect(() => {
    registerNavigate(navigate)
  }, [navigate, registerNavigate])

  const [inputValue, setInputValue] = React.useState('')
  const [showConfig, setShowConfig] = React.useState(false)
  const [tempKey, setTempKey] = React.useState(apiKey)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Scroll automático para a última mensagem
  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isLoading])

  // Sincroniza a chave temporária
  React.useEffect(() => {
    setTempKey(apiKey)
  }, [apiKey])

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

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault()
    saveApiKey(tempKey)
    setShowConfig(false)
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

          <div className="flex items-center">
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

        {/* Corpo principal (Chat ou Configuração) */}
        <div className="relative flex-1 overflow-hidden">
          {/* Tela de Configurações da API Key */}
          <div
            className={cn(
              'absolute inset-0 z-10 flex flex-col bg-white p-5 transition-transform duration-300 dark:bg-zinc-900',
              showConfig || !apiKey ? 'translate-y-0' : '-translate-y-full'
            )}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Configuração da API Key</span>
              {apiKey && (
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSaveKey} className="mt-4 flex flex-1 flex-col justify-between">
              <div className="space-y-4">
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Para que a Luzia responda usando a inteligência do Gemini, insira sua chave da API da Google AI Studio abaixo. A chave será salva localmente de forma segura no seu navegador para testes.
                </p>
                <div className="space-y-1.5">
                  <label htmlFor="api-key-input" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Gemini API Key
                  </label>
                  <input
                    id="api-key-input"
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="Cole sua AI_KEY aqui..."
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs shadow-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="rounded-lg bg-purple-50/50 p-2.5 border border-purple-100/30 text-[11px] text-purple-700 dark:bg-purple-950/20 dark:text-purple-300 leading-relaxed">
                  <strong>💡 Dica:</strong> Se você configurar a variável <code>VITE_GEMINI_API_KEY</code> no seu arquivo <code>.env</code> do projeto, ela será lida automaticamente.
                </div>
              </div>

              <div className="flex gap-2">
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => setShowConfig(false)}
                    className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!tempKey.trim()}
                  className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-medium text-white shadow hover:opacity-90 disabled:opacity-50"
                >
                  Salvar Chave
                </button>
              </div>
            </form>
          </div>

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
