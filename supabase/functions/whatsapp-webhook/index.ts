import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

// Estruturas de tipos
interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

interface WhatsAppSession {
  messages: ChatMessage[]
  updated_at: number
}

// Configuração de CORS (caso necessário para testes no browser)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

/**
 * Valida a assinatura HMAC SHA-256 enviada pela Meta para garantir a origem da requisição.
 */
export async function verifyMetaSignature(
  payload: string,
  signatureHeader: string | null,
  appSecret: string
): Promise<boolean> {
  if (!signatureHeader) return false
  
  // O cabeçalho vem no formato: sha256=xxxxx
  const signature = signatureHeader.replace('sha256=', '')
  const encoder = new TextEncoder()
  const keyData = encoder.encode(appSecret)
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const hashArray = Array.from(new Uint8Array(mac))
  const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return calculatedSignature === signature
}

/**
 * Normaliza e escolhe o melhor paciente correspondente com base no sufixo de telefone.
 */
export function findBestPatient(candidates: any[], incomingPhone: string) {
  if (!candidates || candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]
  
  const incomingDigits = incomingPhone.replace(/\D/g, '')
  // Tenta desambiguar pelo DDD brasileiro (posições de índice 2 e 3 de um número 55XXXXXXXXX...)
  const ddd = incomingDigits.length >= 4 ? incomingDigits.slice(2, 4) : ''
  if (ddd) {
    const matched = candidates.find(c => {
      const pDigits = (c.phone_mobile || '').replace(/\D/g, '')
      return pDigits.includes(ddd)
    })
    if (matched) return matched
  }
  return candidates[0]
}

/**
 * Envia uma mensagem via Meta Cloud API
 */
async function sendWhatsAppMessage(
  to: string,
  bodyText: string,
  phoneNumberId: string,
  accessToken: string
) {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        body: bodyText,
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error(`[WhatsApp API Error] Falha ao enviar mensagem para ${to}:`, errText)
    throw new Error(`Falha no envio do WhatsApp: ${response.statusText}`)
  }
}

/**
 * Chama a API do Gemini 2.5 Flash para processar a conversação e intenções
 */
async function callGemini(
  systemInstruction: string,
  history: ChatMessage[],
  currentMessage: string,
  apiKey: string
): Promise<{ reply: string; action: any }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  
  const contents = [
    ...history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })),
    {
      role: 'user',
      parts: [{ text: currentMessage }]
    }
  ]

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        responseMimeType: 'application/json'
      }
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('[Gemini API Error] Falha ao invocar o Gemini:', errText)
    throw new Error(`Erro na API do Gemini: ${response.statusText}`)
  }

  const data = await response.json()
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!textResponse) {
    throw new Error('Resposta vazia do Gemini')
  }

  try {
    return JSON.parse(textResponse)
  } catch (err) {
    console.error('[Gemini Parse Error] Resposta do Gemini não era um JSON válido:', textResponse, err)
    throw new Error('Falha no parse do JSON do Gemini')
  }
}

// Handler da Edge Function
Deno.serve(async (req) => {
  const method = req.method

  // 1. Tratar requisições OPTIONS (CORS)
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 2. Tratar GET (Handshake/Validação de Webhook da Meta)
  if (method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    const localVerifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'mediconnect_verify_token'

    if (mode === 'subscribe' && token === localVerifyToken) {
      console.log('[Webhook Validation] Validado com sucesso!')
      return new Response(challenge, { status: 200 })
    } else {
      console.warn('[Webhook Validation] Falha na validação. Token incorreto.')
      return new Response('Forbidden', { status: 403 })
    }
  }

  // 3. Tratar POST (Recebimento de Mensagens)
  if (method === 'POST') {
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('X-Hub-Signature-256')
    const appSecret = Deno.env.get('WHATSAPP_APP_SECRET')

    // Validar assinatura se configurada no ambiente
    if (appSecret) {
      const isValid = await verifyMetaSignature(rawBody, signatureHeader, appSecret)
      if (!isValid) {
        console.warn('[Security] Assinatura inválida. Acesso negado.')
        return new Response('Unauthorized', { status: 401 })
      }
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch (err) {
      console.error('[Webhook POST] Falha ao parsear JSON:', err)
      return new Response('Bad Request', { status: 400 })
    }

    // A Meta envia eventos dentro do array entry
    const entry = payload.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]

    // Se não houver mensagem, retorna 200 ok (pode ser atualização de status de entrega)
    if (!message) {
      return new Response('ok', { status: 200 })
    }

    const patientPhone = message.from // Ex: 5511999998888
    const messageId = message.id
    const messageType = message.type
    const timestamp = message.timestamp

    const phoneNumberId = value?.metadata?.phone_number_id
    const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!phoneNumberId || !whatsappAccessToken || !geminiApiKey) {
      console.error('[Webhook Configuration] Faltam secrets de ambiente (Meta ou Gemini)')
      return new Response('Internal Server Error', { status: 500 })
    }

    // Inicializar Deno KV
    const kv = await Deno.openKv()
    const sessionKey = ['whatsapp_sessions', patientPhone]

    try {
      // 1. Tratar mensagens Não-Texto (Mídias)
      if (messageType !== 'text') {
        let fallbackReply = 'No momento, eu só consigo ler e responder a mensagens de texto por aqui. Como posso te ajudar hoje?'
        if (messageType === 'audio') {
          fallbackReply = 'Desculpe, mas eu ainda não consigo ouvir mensagens de voz por aqui. Você poderia escrever o que precisa, por favor?'
        }

        // Enviar fallback direto para o paciente
        await sendWhatsAppMessage(patientPhone, fallbackReply, phoneNumberId, whatsappAccessToken)

        // Salvar fallback no KV para histórico
        const sessionRes = await kv.get<WhatsAppSession>(sessionKey)
        const session = sessionRes.value || { messages: [], updated_at: Date.now() }
        session.messages.push({ role: 'user', content: `[Envio de mídia tipo: ${messageType}]` })
        session.messages.push({ role: 'model', content: fallbackReply })
        session.updated_at = Date.now()
        await kv.set(sessionKey, session, { expireIn: 24 * 60 * 60 * 1000 })

        return new Response('ok', { status: 200 })
      }

      const userMessageText = message.text?.body || ''

      // 2. Buscar Paciente e Contexto no Postgres (Read-Only)
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      
      let patientData: any = null
      let appointmentsContext = 'Nenhum agendamento futuro encontrado.'
      let reportsContext = 'Nenhum laudo recente encontrado.'

      if (supabaseUrl && supabaseServiceKey) {
        const admin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })

        // Casamento Flexível de Telefone (Últimos 8 dígitos)
        const cleanPhone = patientPhone.replace(/\D/g, '')
        const suffix = cleanPhone.slice(-8)

        const { data: candidates, error: patientsErr } = await admin
          .from('patients')
          .select('id, full_name, phone_mobile, cpf')
          .ilike('phone_mobile', `%${suffix}`)

        if (patientsErr) {
          console.warn('[Webhook Postgres] Erro ao buscar paciente:', patientsErr.message)
        }

        patientData = findBestPatient(candidates || [], patientPhone)

        if (patientData) {
          const todayIso = new Date().toISOString()

          // Consultar agendamentos futuros do paciente (Read-Only)
          const { data: appointments, error: apptsErr } = await admin
            .from('appointments')
            .select('scheduled_at, status, appointment_type, notes, doctor:doctors(full_name)')
            .eq('patient_id', patientData.id)
            .gte('scheduled_at', todayIso)
            .order('scheduled_at', { ascending: true })
            .limit(3)

          if (apptsErr) {
            console.warn('[Webhook Postgres] Erro ao buscar agendamentos:', apptsErr.message)
          } else if (appointments && appointments.length > 0) {
            appointmentsContext = appointments
              .map((a: any) => `- Dr(a). ${a.doctor?.full_name || 'Desconhecido'} em ${new Date(a.scheduled_at).toLocaleString('pt-BR')} (${a.appointment_type || 'Presencial'}) [Status atual: ${a.status}]`)
              .join('\n')
          }

          // Consultar laudos recentes do paciente (Read-Only)
          const { data: reports, error: reportsErr } = await admin
            .from('reports')
            .select('id, exam, status, diagnosis, created_at')
            .eq('patient_id', patientData.id)
            .order('created_at', { ascending: false })
            .limit(3)

          if (reportsErr) {
            console.warn('[Webhook Postgres] Erro ao buscar laudos:', reportsErr.message)
          } else if (reports && reports.length > 0) {
            reportsContext = reports
              .map((r: any) => `- Exame/Laudo: ${r.exam || 'Geral'} em ${new Date(r.created_at).toLocaleDateString('pt-BR')} [Status: ${r.status}]`)
              .join('\n')
          }
        }
      }

      // 3. Ler Histórico no Deno KV
      const sessionRes = await kv.get<WhatsAppSession>(sessionKey)
      const session = sessionRes.value || { messages: [], updated_at: Date.now() }
      
      // Limitar histórico a no máximo 10 mensagens para economizar tokens
      if (session.messages.length > 10) {
        session.messages = session.messages.slice(-10)
      }

      // 4. Construir Prompt de Sistema
      const todayPtBr = new Date().toLocaleDateString('pt-BR')
      const patientName = patientData?.full_name || 'Paciente Não Identificado'
      
      const systemInstruction = `Você é a Luzia, a assistente virtual inteligente do sistema de gestão clínica MediConnect.
Seu canal atual é o WhatsApp. Sua personalidade é acolhedora, empática, clara e profissional.
Você tem acesso aos dados cadastrais do paciente, seus agendamentos futuros e status de laudos médicos.

CONVENCÕES E CONTEXTO ATUAL:
- Data de Hoje: ${todayPtBr}
- Nome do Paciente: ${patientName}
- Telefone do Paciente: ${patientPhone}

DADOS CADASTRAIS E CONSULTAS DO PACIENTE:
Consultas Futuras:
${appointmentsContext}

Laudos e Exames Recentes:
${reportsContext}

Instruções Cruciais:
1. Sempre responda no formato JSON estruturado com os campos 'reply' (string) e 'action' (objeto ou null).
2. Se o paciente pedir para confirmar, desmarcar (cancelar) ou reagendar (remarcar) uma consulta:
   - Configure o campo 'action' com o tipo adequado ("CONFIRM", "CANCEL", "RESCHEDULE") e extraia os detalhes disponíveis (ex: data, hora da consulta desejada).
   - No campo 'reply', informe ao paciente de forma simpática que a solicitação foi anotada e que a equipe de recepção foi notificada para realizar o ajuste no sistema. Nunca afirme que a consulta já foi alterada no sistema, pois nosso sistema é de processamento assíncrono.
3. Se o paciente perguntar sobre suas consultas ou laudos, use as informações fornecidas no contexto do paciente para responder.
4. Caso o número do WhatsApp não pertença a nenhum paciente cadastrado no banco (Paciente Não Identificado), converse de forma acolhedora, peça educadamente o nome completo ou CPF para que possamos localizá-lo e oriente que a recepção fará a associação do contato.`

      // 5. Chamar Gemini API
      const geminiResponse = await callGemini(
        systemInstruction,
        session.messages,
        userMessageText,
        geminiApiKey
      )

      const replyText = geminiResponse.reply
      const actionData = geminiResponse.action

      // 6. Tratar Intenção de Ação (Geração de Log de Ação para a Recepção)
      if (actionData && actionData.type) {
        const actionLog = {
          event_type: 'whatsapp_patient_action',
          timestamp: new Date().toISOString(),
          patient: {
            id: patientData?.id || null,
            name: patientName,
            phone: patientPhone,
            cpf: patientData?.cpf || null,
          },
          action: actionData.type,
          raw_message: userMessageText,
          details: actionData.details || {},
        }
        console.log('[ACTION EVENT]', JSON.stringify(actionLog))
      }

      // 7. Salvar nova iteração de mensagens no Deno KV com TTL de 24h
      session.messages.push({ role: 'user', content: userMessageText })
      session.messages.push({ role: 'model', content: replyText })
      session.updated_at = Date.now()
      await kv.set(sessionKey, session, { expireIn: 24 * 60 * 60 * 1000 })

      // 8. Disparar resposta via Meta Cloud API para o WhatsApp do paciente
      await sendWhatsAppMessage(patientPhone, replyText, phoneNumberId, whatsappAccessToken)

      return new Response('ok', { status: 200 })
    } catch (err) {
      console.error('[Webhook Processing Error] Falha ao processar requisição POST:', err)

      // Fallback amigável de contingência
      try {
        const fallbackReply = 'Olá! Peço desculpas, mas tive um pequeno problema técnico ao processar sua mensagem agora. Você poderia tentar novamente em instantes ou me dizer se deseja falar com um atendente?'
        await sendWhatsAppMessage(patientPhone, fallbackReply, phoneNumberId, whatsappAccessToken)
      } catch (fallbackErr) {
        console.error('[Webhook Fallback Error] Não foi possível enviar a resposta de fallback:', fallbackErr)
      }

      return new Response('Internal Server Error', { status: 500 })
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders })
})
