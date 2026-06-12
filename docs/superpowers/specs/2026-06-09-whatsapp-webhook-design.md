# Especificação de Design: Webhook de WhatsApp com IA Luzia (Read-Only)

Este documento especifica a arquitetura, o fluxo de dados e a segurança do Webhook do WhatsApp para o sistema MediConnect. O Webhook é desenvolvido em Supabase Edge Functions (Deno) e opera em regime de **Somente Leitura (Read-Only)** no Postgres, utilizando **Deno KV** para memória de sessão e **Gemini** para respostas inteligentes.

---

## 1. Visão Geral e Restrições

O Webhook receberá mensagens de pacientes enviadas via API de Nuvem do WhatsApp (Meta Cloud API) e gerará respostas de IA personalizadas (como se fosse a assistente virtual Luzia). 

### Restrições Arquiteturais Estritas:
1. **Banco de Dados Somente Leitura (Read-Only):** Este Webhook não pode realizar nenhuma operação de alteração (`INSERT`, `UPDATE`, `DELETE`) ou criação de tabelas (`CREATE TABLE`/migrations) no Postgres do Supabase. Ele realiza apenas consultas (`SELECT`).
2. **Memória de Conversa Temporária (Deno KV):** Todo o histórico de conversa com o paciente é armazenado de forma efêmera no Deno KV com um tempo de expiração (TTL) automático de **24 horas** a partir da última interação.
3. **Fila de Eventos via Console (Regra de Ação):** Caso o paciente decida confirmar, remarcar ou desmarcar consultas, a IA gerará uma ação estruturada em JSON que será gravada no `console.log`. Esta fila simulada permite que um processador externo de logs ou a equipe de recepção execute os ajustes manuais necessários.

---

## 2. Arquitetura e Fluxo de Dados

O diagrama abaixo apresenta o processamento de mensagens no Webhook:

```
               [ Mensagem do WhatsApp (Meta API) ]
                                |
                                v
               [ Supabase Edge Function: Deno ]
                                |
        +-----------------------+-----------------------+
        | (GET)                                         | (POST)
        v                                               v
[ Validação Meta ]                         [ Processar Mensagem ]
                                                        |
                                                        v
                                         [ 1. Validar Assinatura Meta ]
                                                        |
                                                        v
                                         [ 2. Ler Histórico no Deno KV ]
                                                        |
                                                        v
                                         [ 3. Buscar Paciente por Sufixo ]
                                                        |
                                                        v
                                         [ 4. Buscar Consultas e Laudos ]
                                                        |
                                                        v
                                         [ 5. Chamar Gemini (Luzia UI) ]
                                                        |
                                                        v
                                         [ 6. Analisar Intenção da Resposta ]
                                                        |
                        +-------------------------------+-------------------------------+
                        |                                                               |
                        v (Se Ação Detectada)                                           v (Conversa Geral)
         [ 7a. Logar Evento JSON no console.log ]                         [ 7b. Salvar nova msg no KV ]
                        |                                                               |
                        +-------------------------------+-------------------------------+
                                                        |
                                                        v
                                         [ 8. Responder via Meta API ]
```

### 2.1 Estrutura do Deno KV (Memória)
Para persistir a sessão sem tocar no banco de dados, utilizaremos o Deno KV nativo da Supabase Edge Function:
*   **Chave:** `["whatsapp_sessions", phone_number]`
*   **Valor:** 
    ```typescript
    interface WhatsAppSession {
      messages: Array<{
        role: 'user' | 'model';
        content: string;
      }>;
      updated_at: number; // timestamp
    }
    ```
*   **TTL:** 24 horas (`86400000` milissegundos).

### 2.2 Formato do Evento de Ação (Fila Simulada)
Quando a IA Luzia identifica uma solicitação que altera o estado do sistema, a Edge Function gera e imprime o log estruturado:

```json
{
  "event_type": "whatsapp_patient_action",
  "timestamp": "2026-06-09T18:00:00.000Z",
  "patient": {
    "id": "e5b8d960-9f5b-42fa-9d0a-6e21606085a2",
    "name": "Gabriel Silva",
    "phone": "5511999998888"
  },
  "action": "CONFIRM" | "RESCHEDULE" | "CANCEL",
  "raw_message": "Quero confirmar meu agendamento de amanhã.",
  "details": {
    "date": "2026-06-10",
    "time": "14:00",
    "notes": "Confirmado via WhatsApp do paciente."
  }
}
```

---

## 3. Integração com Gemini e Prompt de Sistema

Para coordenar a conversação e identificar ações, chamaremos a API do Gemini utilizando o formato JSON estruturado (`responseMimeType: "application/json"`).

### 3.1 Schema de Resposta Esperado do Gemini
```json
{
  "reply": "Olá, Gabriel! Entendi que quer confirmar seu exame. Anotei seu pedido e enviei para a recepção confirmar no sistema. Logo eles te dão um retorno!",
  "action": {
    "type": "CONFIRM" | "RESCHEDULE" | "CANCEL",
    "details": {
      "date": "2026-06-10",
      "time": "14:00",
      "notes": "Solicitado via WhatsApp"
    }
  }
}
```

### 3.2 Prompt do Sistema (Luzia para WhatsApp)
```text
Você é a Luzia, a assistente virtual inteligente do sistema de gestão clínica MediConnect.
Seu canal atual é o WhatsApp. Sua personalidade é acolhedora, empática, clara e profissional.
Você tem acesso aos dados cadastrais do paciente, seus agendamentos futuros e status de laudos médicos.

Instruções Cruciais:
1. Sempre responda no formato JSON estruturado com os campos 'reply' (string) e 'action' (objeto ou null).
2. Se o paciente pedir para confirmar, desmarcar (cancelar) ou reagendar (remarcar) uma consulta:
   - Configure o campo 'action' com o tipo adequado ("CONFIRM", "CANCEL", "RESCHEDULE") e extraia os detalhes disponíveis.
   - No campo 'reply', informe ao paciente de forma simpática que a solicitação foi anotada e que a equipe de recepção foi notificada para realizar o ajuste no sistema. Nunca afirme que a consulta já foi alterada no sistema.
3. Se o paciente perguntar sobre suas consultas ou laudos, use as informações fornecidas no contexto do paciente para responder.
4. Caso o número do WhatsApp não pertença a nenhum paciente cadastrado no banco, converse de forma acolhedora, peça educadamente o nome completo ou CPF para que possamos localizá-lo e oriente que a recepção fará a associação.
```

---

## 4. Detalhes de Implementação e Casamento de Telefone

### 4.1 Casamento Flexível de Telefone (Abordagem A)
Para mitigar a inconsistência do nono dígito em números de telefone brasileiros no WhatsApp, o Webhook adotará a seguinte lógica de matching:
1. Limpar o número de entrada para conter apenas dígitos (ex: de `+55 (11) 99999-8888` para `5511999998888`).
2. Extrair o sufixo numérico (últimos 8 dígitos, ex: `99998888`).
3. Fazer uma consulta no banco via Supabase utilizando `.ilike('phone_mobile', '%99998888')` para buscar candidatos.
4. Em memória, no Deno, verificar qual candidato possui correspondência mais próxima (considerando DDD).

### 4.2 Tratamento de Mensagens Não-Texto (Mídias)
*   **Mensagem de Áudio (`type: "audio"`):** Responde automaticamente com: `"Desculpe, mas eu ainda não consigo ouvir mensagens de voz por aqui. Você poderia escrever o que precisa, por favor?"`.
*   **Outras Mídias (`image`, `video`, `document`, `location`):** Responde automaticamente com: `"No momento, eu só consigo ler e responder a mensagens de texto por aqui. Como posso te ajudar hoje?"`.
*   *Nota: Ambas as mensagens de fallback ignoram chamadas ao Gemini, poupando tokens.*

---

## 5. Segurança e Validação de Origem

1.  **GET / Verification:** O endpoint de webhook verifica a assinatura com o `WHATSAPP_VERIFY_TOKEN` configurado nas variáveis de ambiente do Supabase.
2.  **POST / Assinatura:** Para produção, as requisições recebidas via `POST` devem conter o cabeçalho `X-Hub-Signature-256`. Validaremos a assinatura do payload utilizando o segredo do aplicativo `WHATSAPP_APP_SECRET` em um algoritmo HMAC-SHA256, rejeitando chamadas falsas com `status: 401`.

---

## 6. Plano de Testes e Validação

1.  **Teste de Handshake (GET):** Chamar o webhook simulando a Meta (`hub.mode=subscribe`, `hub.challenge=test_challenge`, `hub.verify_token=valido`). Deve retornar `200` com `test_challenge`.
2.  **Teste de Identificação (POST):** Enviar payload simulando mensagem de texto de número cadastrado e verificar se a IA recupera o nome do paciente correto.
3.  **Teste de Fallback de Ação:** Enviar mensagem `"Quero confirmar minha consulta"` e verificar se:
    - O console emite o log estruturado JSON com `"action": "CONFIRM"`.
    - A resposta enviada ao paciente avisa que a equipe de recepção foi notificada.
4.  **Teste de Expiração KV:** Aguardar ou simular expiração no KV para garantir que o histórico limpa após 24 horas.
