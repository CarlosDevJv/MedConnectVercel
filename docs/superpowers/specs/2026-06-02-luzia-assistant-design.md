# Especificação de Design: Luzia - Assistente Virtual Inteligente Contextual

Este documento especifica a arquitetura, interface e integração da **Luzia**, a assistente virtual de inteligência artificial baseada no Gemini 2.5 Flash, para o sistema MediConnect.

---

## 1. Visão Geral e Requisitos

A Luzia é um componente flutuante disponível em todas as páginas do sistema MediConnect (exceto na Landing Page `/`), fornecendo suporte e automação por meio de texto e voz.

### Requisitos Principais:
1. **Interface Flutuante:** Botão de acesso rápido no canto inferior direito com a foto da Luzia. Ao clicar, abre uma janela de chat compacta e moderna.
2. **Entrada de Voz (Speech-to-Text):** Uso da Web Speech API nativa do navegador para transcrever a voz do usuário diretamente no campo de texto de forma simples e responsiva.
3. **Contexto de Tela Avançado:** Capacidade de ler dados da tela ativa e URL atual para responder de forma inteligente ao contexto do usuário.
4. **Luzia Actions (Automação de Interface):** Capacidade da IA de disparar ações no front-end como navegar para rotas específicas, fazer logout, realizar buscas e pré-preencher formulários baseado no desejo do usuário.
5. **Configuração de Chave de API Flexível:** Leitura automática de `VITE_GEMINI_API_KEY` do ambiente, com fallback de configuração local no localStorage para fins de teste.

---

## 2. Arquitetura e Fluxo de Dados

A Luzia funcionará inteiramente do lado do cliente (front-end), preservando a regra de não alterar banco de dados e backend.

```
+-------------------------------------------------------------+
|                       LuziaProvider                         |
|  - Gerencia o histórico de mensagens                        |
|  - Armazena a chave de API (env / localStorage)            |
|  - Mantém o contexto de tela ativo (pageContext)            |
|  - Intercepta e executa comandos de automação (Actions)     |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
   +------------------+                  +------------------+
   |   LuziaChat      |                  | Páginas do App   |
   |   (Interface UI) |                  | (Detalhes, etc.) |
   +------------------+                  +--------+---------+
                                                  | (useLuziaPageContext)
                                                  v
                                         [Registra Metadados]
```

### Formato de Comunicação Estruturado (JSON Mode)
Para que a Luzia consiga interagir com o sistema, todas as chamadas ao Gemini 2.5 Flash serão configuradas para responder no formato JSON estruturado (`responseMimeType: "application/json"`).

**Esquema de Resposta:**
```json
{
  "text": "Mensagem em linguagem natural respondendo ao usuário.",
  "action": {
    "type": "NAVIGATE" | "LOGOUT" | "SEARCH",
    "payload": {
      "path": "/app/agendar",
      "queryParams": {
        "data": "2026-06-15",
        "hora": "14:00"
      },
      "query": "Carlos",
      "target": "pacientes"
    }
  }
}
```

---

## 3. Detalhamento dos Componentes

### 3.1 `LuziaContext` (`src/features/luzia/context/LuziaContext.tsx`)
Contexto central que encapsula o estado do chatbot:
*   `isOpen`: booleano indicando se a janela está aberta.
*   `messages`: array de mensagens (histórico da sessão).
*   `isRecording`: booleano indicando se a Web Speech API está ativa.
*   `pageContext`: objeto dinâmico contendo metadados da tela ativa.
*   `setPageContext(context)`: função para registrar dados da página atual.
*   `sendMessage(text)`: envia o prompt + contexto ao Gemini e processa a resposta estruturada.
*   `apiKey`: chave ativa do Gemini para as chamadas.

### 3.2 Componente Visual `LuziaChat` (`src/features/luzia/components/LuziaChat.tsx`)
A interface visual usará Tailwind CSS para garantir integração perfeita com o design moderno do MediConnect:
*   **Botão Flutuante:** Fixo em `fixed bottom-6 right-6 z-50`. Exibe a foto da Luzia em formato circular com efeitos de pulsação suave em tons de lilás.
*   **Janela de Chat:**
    *   Fundo fosco com efeito de vidro (glassmorphism) e cantos arredondados.
    *   Cabeçalho contendo a foto da Luzia, status "Online", botão para redefinir o chat e fechar.
    *   Área de rolagem exibindo a conversa.
    *   Formulário inferior com input, botão de microfone (Speech-to-Text) com feedback visual quando gravando, e botão de envio.

### 3.3 Speech-to-Text (Web Speech API)
Utiliza `window.SpeechRecognition` (ou `webkitSpeechRecognition` no Safari/Chrome):
*   Ativa ao clicar no botão do microfone.
*   Transcreve em tempo real e insere o texto no campo de input.
*   Tratamento de permissões de áudio e erros silenciosos caso o microfone não esteja disponível.

---

## 4. Prompt de Sistema e Personagem

O prompt de instrução de sistema (systemInstruction) guiará a personalidade e inteligência de automação da Luzia:

```text
Você é a Luzia, assistente virtual inteligente e proativa do sistema MediConnect.
O MediConnect é uma plataforma de gestão clínica.
Sua personalidade é acolhedora, empática, eficiente e extremamente ética.
Você tem a capacidade de interagir com o sistema e realizar ações para o usuário através de comandos.

Instruções para Ações:
- Se o usuário quiser ir para alguma tela, inclua uma ação do tipo NAVIGATE com o caminho correspondente (ex: /app/agenda).
- Se o usuário quiser agendar, leve-o para /app/agendar passando data e hora como queryParams se ele tiver informado.
- Se o usuário quiser pesquisar um paciente, inclua a ação SEARCH com o query correspondente.
- Se o usuário pedir para sair, inclua a ação LOGOUT.

Responda sempre em formato JSON estruturado com os campos 'text' (obrigatório) e 'action' (opcional, quando aplicável).
```

---

## 5. Plano de Validação e Testes

1.  **Validação de Interface:**
    *   Verificar o botão flutuante em telas desktop e mobile.
    *   Testar transições de abertura/fechamento do chat.
2.  **Validação de Integração Gemini:**
    *   Testar chamadas com chave válida e inválida.
    *   Verificar o parse da resposta JSON e execução das Luzia Actions.
3.  **Validação do Speech-to-Text:**
    *   Testar o acionamento do microfone e a digitação automática da transcrição.
    *   Garantir feedback visual animado durante a gravação.
4.  **Validação de Contexto Dinâmico:**
    *   Entrar na tela de detalhes de um paciente e perguntar "Luzia, quem é este paciente?", verificando se ela lê os dados injetados via `useLuziaPageContext`.
