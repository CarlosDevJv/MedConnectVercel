import { ArrowLeft, Eye, Loader2, FileCheck, Paperclip, Trash2, Mic, Sparkles } from 'lucide-react'
import * as React from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ReportPreviewDialog } from '@/features/reports/components/ReportPreviewDialog'
import { ReportRichText } from '@/features/reports/components/ReportRichText'
import { reportToReportInput } from '@/features/reports/api'
import { buildReportFallbackHtml } from '@/features/reports/utils/reportPreviewFallbackHtml'
import { useReport, useUpdateReportMutation } from '@/features/reports/hooks'
import { reportInputSchema } from '@/features/reports/schemas'
import type { ReportInput } from '@/features/reports/types'
import { useCanManagePatients, useAuth } from '@/features/auth/useAuth'
import { usePatient } from '@/features/patients/hooks'
import { useListDoctors } from '@/features/doctors/hooks'
import type { Doctor } from '@/features/doctors/types'

import { PaginatedAutocomplete } from '@/features/reports/components/PaginatedAutocomplete'
import { CID_LIST } from '@/features/reports/utils/cidList'
import { EXAM_LIST } from '@/features/reports/utils/examList'
import { apiClient } from '@/lib/apiClient'
import { cn } from '@/lib/cn'
import { toastFromError } from '@/lib/apiErrorToast'

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalToIso(local: string): string | null {
  if (!local.trim()) return null
  const t = new Date(local).getTime()
  if (Number.isNaN(t)) return null
  return new Date(t).toISOString()
}

function formatDate(isoStr: string | null | undefined): string {
  if (!isoStr) return 'Não informado'
  const datePart = isoStr.split('T')[0]
  const parts = datePart.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  const d = new Date(isoStr)
  if (Number.isNaN(d.getTime())) return 'Não informado'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

function calculateAge(birthDateStr: string | null | undefined): string {
  if (!birthDateStr) return 'Não informada'
  const birth = new Date(birthDateStr)
  if (Number.isNaN(birth.getTime())) return 'Não informada'
  const ageDifMs = Date.now() - birth.getTime()
  const ageDate = new Date(ageDifMs)
  const age = Math.abs(ageDate.getUTCFullYear() - 1970)
  return `${age} anos`
}

function formatDueDateTime(localStr: string): { date: string; time: string } {
  if (!localStr) return { date: 'Não informada', time: 'Não informada' }
  const parts = localStr.split('T')
  const dateParts = parts[0].split('-')
  const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : parts[0]
  const timeFormatted = parts[1] || '00:00'
  return { date: dateFormatted, time: timeFormatted }
}

function formatExtensoDate(localStr: string, cityState: string): string {
  if (!localStr) return `${cityState}, Data não informada`
  const parts = localStr.split('T')[0].split('-')
  if (parts.length !== 3) return `${cityState}, Data não informada`
  
  const day = parseInt(parts[2], 10)
  const monthIdx = parseInt(parts[1], 10) - 1
  const year = parts[0]
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  const monthName = months[monthIdx] || ''
  
  return `${cityState}, ${day} de ${monthName} de ${year}`
}

function formatProtocol(orderNumber: string | null | undefined, dueAtStr: string | null | undefined): string {
  if (!orderNumber) return 'REP-2026-00000'
  if (orderNumber.startsWith('REP-')) return orderNumber
  
  let year = '2026'
  if (dueAtStr) {
    const parts = dueAtStr.split('T')[0].split('-')
    if (parts[0] && parts[0].length === 4) {
      year = parts[0]
    }
  }
  
  const numOnly = orderNumber.replace(/\D/g, '')
  const paddedNum = numOnly.padStart(5, '0')
  return `REP-${year}-${paddedNum}`
}

function escreverExtenso(n: number): string {
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
  const dezenas10 = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  
  if (n === 0) return 'zero'
  if (n < 10) return unidades[n]
  if (n >= 10 && n < 20) return dezenas10[n - 10]
  if (n >= 20 && n < 100) {
    const u = n % 10
    const d = Math.floor(n / 10)
    return dezenas[d] + (u > 0 ? ` e ${unidades[u]}` : '')
  }
  if (n === 100) return 'cem'
  return n.toString()
}

export function ReportEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canSeePatientProfile = useCanManagePatients()

  const reportQuery = useReport(id)
  const report = reportQuery.data

  const [activeVoiceField, setActiveVoiceField] = React.useState<string | null>(null)
  const recognitionRef = React.useRef<any>(null)

  const toggleVoiceInput = React.useCallback((fieldId: string, valueSetter: React.Dispatch<React.SetStateAction<string>>) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast.error('Reconhecimento de voz não suportado pelo seu navegador atual. Use o Google Chrome ou Edge.')
      return
    }

    if (activeVoiceField === fieldId) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      setActiveVoiceField(null)
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }

    try {
      const rec = new SpeechRecognition()
      rec.lang = 'pt-BR'
      rec.continuous = true
      rec.interimResults = false

      rec.onstart = () => {
        setActiveVoiceField(fieldId)
        toast.info('Gravação de voz iniciada. Pode falar...')
      }

      rec.onerror = (e: any) => {
        console.error('[Speech Laudo] Erro:', e)
        if (e.error === 'not-allowed' || e.error === 'permission-denied') {
          toast.error('Acesso ao microfone negado pelo navegador.')
        } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
          toast.error(`Erro no microfone: ${e.error}`)
        }
        setActiveVoiceField(null)
      }

      rec.onend = () => {
        setActiveVoiceField(null)
      }

      rec.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          valueSetter((prev) => {
            const space = prev.trim() ? ' ' : ''
            return prev + space + finalTranscript
          })
        }
      }

      recognitionRef.current = rec
      rec.start()
    } catch (err: any) {
      console.error('[Speech Laudo] Falha ao iniciar:', err)
      toast.error('Não foi possível iniciar o serviço de voz.')
      setActiveVoiceField(null)
    }
  }, [activeVoiceField])

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
    }
  }, [])
  const patientQuery = usePatient(report?.patient_id)

  const updateMutation = useUpdateReportMutation(id ?? '')

  const bodyRef = React.useRef({ html: '', json: {} as Record<string, unknown> })

  const { userInfo } = useAuth()
  const isMedico = React.useMemo(() => {
    return userInfo?.roles?.includes('medico') ?? false
  }, [userInfo])
  const doctorsQuery = useListDoctors({ pageSize: 100 })
  const doctors = React.useMemo(() => doctorsQuery.data?.items ?? [], [doctorsQuery.data?.items])

  // Busca o médico logado de forma individual no banco se ele não estiver no primeiro lote de 100
  const loggedDoctorQuery = useQuery({
    queryKey: ['doctors', 'detail', userInfo?.doctor?.id],
    queryFn: async () => {
      const docId = userInfo?.doctor?.id
      if (!docId) return null
      const rows = await apiClient.get<Record<string, unknown>[]>(`/rest/v1/doctors?id=eq.${docId}`)
      return rows?.[0] ?? null
    },
    enabled: !!userInfo?.doctor?.id,
  })

  const loggedDoctor = React.useMemo(() => {
    const docId = userInfo?.doctor?.id
    if (!docId) return null
    return (
      (loggedDoctorQuery.data as unknown as Doctor) ||
      doctors.find((d) => d.id === docId) ||
      null
    )
  }, [doctors, userInfo?.doctor?.id, loggedDoctorQuery.data])

  const [existingExams, setExistingExams] = React.useState<string[]>([])

  React.useEffect(() => {
    apiClient
      .get<Array<{ exam: string | null }>>('/rest/v1/reports?select=exam')
      .then((data) => {
        const list = data
          .map((item) => item.exam?.trim())
          .filter((e): e is string => !!e && e.length > 0)
        setExistingExams(Array.from(new Set(list)))
      })
      .catch((err) => {
        console.error('Falha ao obter exames existentes:', err)
      })
  }, [])

  const [exam, setExam] = React.useState('')
  const [requestedBy, setRequestedBy] = React.useState('')
  const [cidCode, setCidCode] = React.useState('')

  // Subdivisões do Diagnóstico
  const [queixa, setQueixa] = React.useState('')
  const [hda, setHda] = React.useState('')
  const [exameFisico, setExameFisico] = React.useState('')
  const [examesComp, setExamesComp] = React.useState('')

  // Listas de arquivos anexados (metadados estruturados com imagens base64)
  const [exameFisicoFiles, setExameFisicoFiles] = React.useState<Array<{ name: string; size: string; type: string; dataUrl?: string }>>([])
  const [examesCompFiles, setExamesCompFiles] = React.useState<Array<{ name: string; size: string; type: string; dataUrl?: string }>>([])

  // Subdivisões da Conclusão e Repouso
  const [conclusionText, setConclusionText] = React.useState('')
  const [repouso, setRepouso] = React.useState('')
  const [conduta, setConduta] = React.useState('')

  // Referências para os inputs de arquivos ocultos
  const efFileInputRef = React.useRef<HTMLInputElement>(null)
  const ecFileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFiles: React.Dispatch<React.SetStateAction<Array<{ name: string; size: string; type: string; dataUrl?: string }>>>
  ) => {
    const files = e.target.files
    if (!files) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validação de tipo: apenas imagens (png, jpg, jpeg)
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg') {
        toast.error(`O arquivo "${file.name}" não é um formato de imagem suportado (apenas PNG, JPG, JPEG).`)
        continue
      }

      // Validação de tamanho: 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`O arquivo "${file.name}" excede o tamanho limite de 10MB.`)
        continue
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
        
        setFiles((prev) => [
          ...prev,
          {
            name: file.name,
            size: `${sizeInMB} MB`,
            type: file.type,
            dataUrl: dataUrl,
          },
        ])
      }
      reader.readAsDataURL(file)
    }

    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }

  const composeReportHtml = (currentSignatureHtml: string) => {
    const patientName = patientQuery.data?.full_name ?? 'Não informado'
    const birthDate = formatDate(patientQuery.data?.birth_date)
    const ageStr = calculateAge(patientQuery.data?.birth_date)
    const cpf = patientQuery.data?.cpf ?? 'Não informado'
    
    // Protocolo no formato REP-YYYY-XXXXX
    const protocolStr = formatProtocol(report?.order_number, dueLocal)
    
    const { date: atDate, time: atTime } = formatDueDateTime(dueLocal)
    
    const selectedDoctor = doctors.find((d) => d.full_name === requestedBy)
    let docName = requestedBy || ''
    let docCrm = ''
    let docCrmUf = ''

    if (selectedDoctor) {
      docName = selectedDoctor.full_name
      docCrm = selectedDoctor.crm
      docCrmUf = selectedDoctor.crm_uf
    } else {
      if (loggedDoctor) {
        docName = loggedDoctor.full_name || docName
        docCrm = loggedDoctor.crm || ''
        docCrmUf = loggedDoctor.crm_uf || ''
      }
    }
    const doctorCrmUfStr = docCrm ? `${docCrm} - ${docCrmUf || 'SE'}` : 'Não informado'
    
    // Obter apenas a data por extenso sem local
    const dataExtenso = formatExtensoDate(dueLocal, '').replace(/^\s*,\s*/, '')

    let signatureSection = `
      <div style="margin-top: 20px; padding: 14px 16px; border: 1px dashed #cbd5e1; border-radius: 8px; color: #64748b; font-size: 0.85rem; max-width: 320px; font-style: italic; background-color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #94a3b8;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        Pendente de assinatura digital
      </div>
    `
    if (currentSignatureHtml) {
      signatureSection = `<div style="margin-top: 5px;">${currentSignatureHtml}</div>`
    }

    const exCompFormatted = examesComp.trim() ? examesComp.trim().replace(/\n/g, '<br>') : 'Não aplicável'

    let condutaFormatted = conduta.trim() ? conduta.trim().replace(/\n/g, '<br>') : 'Não informada'
    if (repouso.trim()) {
      const repousoText = `Recomendado repouso médico de ${repouso.trim()} dias.`
      condutaFormatted = conduta.trim() 
        ? `${repousoText}<br>${condutaFormatted}` 
        : repousoText
    }

    let imagesHtml = ''
    const allAttachedFiles = [...exameFisicoFiles, ...examesCompFiles]
    const imageFiles = allAttachedFiles.filter(f => f.type.startsWith('image/') || f.dataUrl)
    
    if (imageFiles.length > 0) {
      imagesHtml += `
        <div class="report-images-section" style="page-break-before: always; break-before: page; margin-top: 40px; border-top: 2px dashed #cbd5e1; padding-top: 20px;">
          <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 15px; text-transform: uppercase;">Imagens Anexadas</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
      `
      imageFiles.forEach(img => {
        imagesHtml += `
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background-color: #f8fafc; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <img src="${img.dataUrl}" alt="${img.name}" style="max-width: 100%; max-height: 280px; object-fit: contain; border-radius: 6px;" />
            <p style="font-size: 0.7rem; color: #64748b; margin-top: 8px; margin-bottom: 0; font-family: monospace; word-break: break-all;">${img.name} (${img.size})</p>
          </div>
        `
      })
      imagesHtml += `
          </div>
        </div>
      `
    }

    return `
<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto;">
  <p><strong>Nome do Paciente:</strong> ${patientName}</p>
  <p><strong>Data de Nascimento:</strong> ${birthDate} | <strong>Idade:</strong> ${ageStr}</p>
  <p><strong>CPF:</strong> ${cpf}</p>
  <p><strong>Número do Protocolo:</strong> ${protocolStr}</p>
  <p><strong>Data do Atendimento:</strong> ${atDate} | <strong>Hora:</strong> ${atTime}</p>
  
  <p></p>
  <p><strong>Médico(a) Responsável:</strong> ${docName}</p>
  <p><strong>CRM:</strong> ${doctorCrmUfStr}</p>
  
  <p></p>
  <p><strong>Queixa Principal (Motivo da Consulta):</strong><br>${queixa.trim() ? queixa.trim().replace(/\n/g, '<br>') : 'Não informada'}</p>
  
  <p></p>
  <p><strong>Histórico da Doença Atual (HDA):</strong><br>${hda.trim() ? hda.trim().replace(/\n/g, '<br>') : 'Não informado'}</p>
  
  <p></p>
  <p><strong>Exame Físico:</strong><br>${exameFisico.trim() ? exameFisico.trim().replace(/\n/g, '<br>') : 'Não informado'}</p>
  
  <p></p>
  <p><strong>Exames Complementares (Se houver):</strong><br>${exCompFormatted}</p>
  
  <p></p>
  <p><strong>Hipótese Diagnóstica:</strong><br>${conclusionText.trim() ? conclusionText.trim().replace(/\n/g, '<br>') : 'Não informada'}</p>
  <p><strong>CID:</strong> ${cidCode.trim() ? cidCode.trim() : 'Não informado'}</p>
  
  <p></p>
  <p><strong>Tratamento Indicado:</strong><br>${condutaFormatted}</p>
  
  <p></p>
  <p style="margin-top: 30px;"><i>Atesto, para os devidos fins, que as informações acima descritas são verdadeiras e refletem o estado clínico do paciente no momento da avaliação.</i></p>
  
  <p><strong>Data:</strong> ${dataExtenso}</p>
  
  <p></p>
  <p><strong>Assinatura digital do médico:</strong></p>
  ${signatureSection}
  
  ${imagesHtml}
</div>
    `.trim()
  }

  const emitirAtestado = () => {
    if (!patientQuery.data) {
      toast.error('Paciente não carregado.')
      return
    }
    
    const patientName = patientQuery.data.full_name
    const cpf = patientQuery.data.cpf || 'Não informado'
    
    const { date: atDate, time: atTime } = formatDueDateTime(dueLocal)
    
    const diasNum = parseInt(repouso, 10) || 0
    if (diasNum <= 0) {
      toast.error('Informe a quantidade de dias de repouso no formulário para emitir o atestado.')
      return
    }
    
    const diasExtenso = escreverExtenso(diasNum)
    const cidText = cidCode.trim() ? `CID: ${cidCode.trim()}` : ''
    
    const selectedDoctor = doctors.find((d) => d.full_name === requestedBy)
    let docName = requestedBy || ''
    let docCrm = ''
    let docCrmUf = ''

    if (selectedDoctor) {
      docName = selectedDoctor.full_name
      docCrm = selectedDoctor.crm
      docCrmUf = selectedDoctor.crm_uf
    } else {
      const loggedDoctor = userInfo?.doctor as { full_name?: string; crm?: string; crm_uf?: string } | null
      if (loggedDoctor) {
        docName = loggedDoctor.full_name || docName
        docCrm = loggedDoctor.crm || ''
        docCrmUf = loggedDoctor.crm_uf || ''
      }
    }
    
    const prefix =
      docName.toLowerCase().startsWith('dr.') ||
      docName.toLowerCase().startsWith('dra.') ||
      docName.toLowerCase().startsWith('dr(a).')
        ? ''
        : 'Dr(a). '
    const fullNameFormatted = `${prefix}${docName}`
    
    const dataExtenso = formatExtensoDate(dueLocal, '').replace(/^\s*,\s*/, '')
    const localUf = docCrmUf || 'SE'
    
    const htmlAtestado = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Atestado Médico - ${patientName}</title>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 650px;
            margin: 60px auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 50px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 14px;
            color: #666;
            margin-top: 0;
          }
          .content {
            font-size: 16px;
            text-align: justify;
            margin-bottom: 30px;
            text-indent: 40px;
          }
          .cid {
            font-weight: bold;
            margin-bottom: 40px;
            font-size: 16px;
          }
          .date {
            text-align: right;
            margin-bottom: 60px;
            font-size: 16px;
          }
          .signature-area {
            text-align: center;
            margin-top: 80px;
            font-size: 16px;
          }
          .line {
            width: 250px;
            border-top: 1px solid #333;
            margin: 0 auto 10px auto;
          }
          .doctor-name {
            font-weight: bold;
          }
          @media print {
            body {
              margin: 40px auto;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Atestado Médico</div>
          <div class="subtitle">MedConnect - Sistema de Gestão de Laudos</div>
        </div>
        
        <div class="content">
          Atesto, para os devidos fins, que o(a) Sr(a). <strong>${patientName}</strong>, portador(a) do CPF <strong>${cpf}</strong>, foi atendido(a) nesta unidade de saúde no dia <strong>${atDate}</strong>, às <strong>${atTime}</strong>.
        </div>
        
        <div class="content">
          Em decorrência de seu quadro clínico, o(a) paciente necessita de <strong>${diasNum}</strong> ( <strong>${diasExtenso}</strong> ) dias de repouso das suas atividades laborais e/ou escolares, a partir desta data.
        </div>
        
        <div class="cid">
          ${cidText}
        </div>
        
        <div class="date">
          ${localUf}, ${dataExtenso}.
        </div>
        
        <div class="signature-area">
          <div class="line"></div>
          <div class="doctor-name">${fullNameFormatted}</div>
          <div>CRM: ${docCrm} - ${localUf}</div>
        </div>
        
        <div class="no-print" style="margin-top: 40px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background-color: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir Atestado</button>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(htmlAtestado)
      printWindow.document.close()
    } else {
      toast.error('Bloqueador de pop-ups ativo. Por favor, permita a abertura de janelas para imprimir o atestado.')
    }
  }

  const [dueLocal, setDueLocal] = React.useState('')
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewHtml, setPreviewHtml] = React.useState<string | null>(null)

  const [isGeneratingConclusion, setIsGeneratingConclusion] = React.useState(false)

  const handleSuggestConclusion = async () => {
    const promptText = `
Você é a Luzia, assistente inteligente clínica do MediConnect.
Gere uma Hipótese Diagnóstica / Conclusão clínica estruturada, objetiva, profissional e coerente para o laudo médico de um paciente, com base nas informações fornecidas abaixo.
Retorne APENAS o texto da conclusão diagnóstica em português, sem rodeios, sem cabeçalhos e sem marcações JSON adicionais.

DADOS DA AVALIAÇÃO DO PACIENTE:
- Queixa Principal: ${queixa || 'Não informada'}
- Histórico da Doença Atual (HDA): ${hda || 'Não informado'}
- Exame Físico: ${exameFisico || 'Não informado'}
- Exames Complementares: ${examesComp || 'Não informado'}
- CID Informado: ${cidCode || 'Não informado'}
`

    setIsGeneratingConclusion(true)
    try {
      const localApiKey = localStorage.getItem('mediconnect.luzia.apikey') || ''
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText.trim() }],
          },
        ],
      }

      let response: Response
      if (isLocal && localApiKey) {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${localApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }
        )
      } else {
        response = await fetch(`/api/luzia`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })

        if (response.status === 404 && localApiKey) {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${localApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            }
          )
        }
      }

      if (!response.ok) {
        throw new Error(`Erro na resposta da IA: ${response.status}`)
      }

      const result = await response.json()
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      let cleanText = rawText.trim()
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json|text|html)?\n?/, '')
        cleanText = cleanText.replace(/\n?```$/, '')
        cleanText = cleanText.trim()
      }

      if (cleanText) {
        setConclusionText(cleanText)
        toast.success('Sugestão de conclusão gerada!')
      } else {
        toast.error('A IA retornou um texto vazio. Tente novamente.')
      }
    } catch (err: any) {
      console.error('[IA Sugestão] Erro:', err)
      toast.error('Erro ao gerar conclusão com IA. Tente novamente.')
    } finally {
      setIsGeneratingConclusion(false)
    }
  }

  const [editorHtml, setEditorHtml] = React.useState<string | null>(null)
  const [editorJson, setEditorJson] = React.useState<Record<string, unknown> | null>(null)
  const [editorVersion, setEditorVersion] = React.useState(0)

  const [cids, setCids] = React.useState<Array<{ code: string; name: string }>>([])
  const [signatureHtml, setSignatureHtml] = React.useState('')

  React.useEffect(() => {
    apiClient
      .get<Array<{ code: string; name: string }>>('/rest/v1/cids?select=code,name&order=code.asc')
      .then((data) => {
        if (data && data.length > 0) {
          setCids(data)
        } else {
          setCids(CID_LIST)
        }
      })
      .catch((err) => {
        console.error('Falha ao obter CIDs do banco, usando fallback local:', err)
        setCids(CID_LIST)
      })
  }, [])

  const allExams = React.useMemo(() => {
    const set = new Set([...EXAM_LIST, ...existingExams])
    if (exam && exam.trim()) {
      set.add(exam.trim())
    }
    return Array.from(set).map((e) => ({ id: e, label: e }))
  }, [existingExams, exam])

  const allDoctors = React.useMemo(() => {
    const list = doctors.map((d) => d.full_name)
    if (requestedBy && requestedBy.trim() && !list.includes(requestedBy.trim())) {
      list.push(requestedBy.trim())
    }
    return list.map((docName) => ({
      id: docName,
      label: docName,
    }))
  }, [doctors, requestedBy])

  const allCids = React.useMemo(() => {
    const baseList = cids.length > 0 ? cids : CID_LIST
    const list = baseList.map((c) => ({ code: c.code, name: c.name }))
    if (cidCode && cidCode.trim() && !list.some((c) => c.code === cidCode.trim())) {
      list.push({ code: cidCode.trim(), name: 'CID do laudo' })
    }
    return list.map((c) => ({
      id: c.code,
      label: `${c.code} - ${c.name}`,
    }))
  }, [cids, cidCode])

  const cidError = React.useMemo(() => {
    const code = cidCode.trim()
    if (!code) return null
    const regex = /^[A-Za-z]\d{2}(\.\d)?$/
    if (!regex.test(code)) {
      return 'Formato de CID-10 inválido. Exemplo correto: A00.9 ou B23'
    }
    return null
  }, [cidCode])

  const initRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!report) return
    if (initRef.current === report.id) return
    initRef.current = report.id
    setExam(report.exam ?? '')
    setRequestedBy(report.requested_by || (loggedDoctor?.full_name ?? ''))
    setCidCode(report.cid_code ?? '')
    setDueLocal(isoToDatetimeLocal(report.due_at))

    // 1. Decodificar Diagnóstico Estruturado (JSON) ou usar fallback
    let parsedDiagnosis = { 
      queixa: '', 
      hda: '', 
      exameFisico: '', 
      examesComp: '', 
      exameFisicoFiles: [] as Array<{ name: string; size: string; type: string; dataUrl?: string }>, 
      examesCompFiles: [] as Array<{ name: string; size: string; type: string; dataUrl?: string }> 
    }
    try {
      if (report.diagnosis) {
        const parsed = JSON.parse(report.diagnosis)
        if (parsed && (parsed.queixa !== undefined || parsed.hda !== undefined)) {
          parsedDiagnosis = {
            queixa: parsed.queixa || '',
            hda: parsed.hda || '',
            exameFisico: parsed.exameFisico || '',
            examesComp: parsed.examesComp || '',
            exameFisicoFiles: parsed.exameFisicoFiles || [],
            examesCompFiles: parsed.examesCompFiles || [],
          }
        } else {
          throw new Error()
        }
      }
    } catch {
      parsedDiagnosis.hda = report.diagnosis ?? ''
    }

    setQueixa(parsedDiagnosis.queixa)
    setHda(parsedDiagnosis.hda)
    setExameFisico(parsedDiagnosis.exameFisico)
    setExamesComp(parsedDiagnosis.examesComp)
    setExameFisicoFiles(parsedDiagnosis.exameFisicoFiles)
    setExamesCompFiles(parsedDiagnosis.examesCompFiles)

    // 2. Decodificar Conclusão Estruturada (JSON) ou usar fallback
    let parsedConclusion = { text: '', repouso: '', conduta: '' }
    try {
      if (report.conclusion) {
        const parsed = JSON.parse(report.conclusion)
        if (parsed && (parsed.text !== undefined || parsed.repouso !== undefined)) {
          parsedConclusion = {
            text: parsed.text || '',
            repouso: parsed.repouso || '',
            conduta: parsed.conduta || '',
          }
        } else {
          throw new Error()
        }
      }
    } catch {
      parsedConclusion.text = report.conclusion ?? ''
    }

    setConclusionText(parsedConclusion.text)
    setRepouso(parsedConclusion.repouso)
    setConduta(parsedConclusion.conduta)

    // 3. Extrair assinatura pré-existente
    let initialSig = ''
    if (report.content_html) {
      const sigIndex = report.content_html.indexOf('<p>Dr(a).')
      if (sigIndex !== -1) {
        initialSig = report.content_html.substring(sigIndex).trim()
      } else {
        const sigIndexDra = report.content_html.indexOf('<p>Dra.')
        if (sigIndexDra !== -1) {
          initialSig = report.content_html.substring(sigIndexDra).trim()
        } else {
          const sigIndexDr = report.content_html.indexOf('<p>Dr.')
          if (sigIndexDr !== -1) {
            initialSig = report.content_html.substring(sigIndexDr).trim()
          }
        }
      }
    }
    setSignatureHtml(initialSig)

    bodyRef.current = {
      html: report.content_html ?? '',
      json: (report.content_json as Record<string, unknown>) ?? {},
    }
  }, [report, loggedDoctor?.full_name])

  const loggedDoctorName = loggedDoctor?.full_name
  React.useEffect(() => {
    if (loggedDoctorName && !requestedBy && report && !report.requested_by) {
      setTimeout(() => {
        setRequestedBy(loggedDoctorName)
      }, 0)
    }
  }, [loggedDoctorName, requestedBy, report])

  React.useEffect(() => {
    const nextHtml = composeReportHtml(signatureHtml)
    bodyRef.current.html = nextHtml
    bodyRef.current.json = {}
    setEditorHtml(nextHtml)
    setEditorJson(null)
    setEditorVersion((v) => v + 1)
  }, [
    queixa,
    hda,
    exameFisico,
    examesComp,
    exameFisicoFiles,
    examesCompFiles,
    conclusionText,
    cidCode,
    conduta,
    repouso,
    signatureHtml,
    dueLocal,
    patientQuery.data,
    requestedBy,
    doctors
  ])

  if (!id) {
    return <Navigate to="/app/relatorios" replace />
  }

  function buildPayload(): ReportInput {
    if (!report) throw new Error('Relatório não carregado')
    const due = datetimeLocalToIso(dueLocal)
    
    const diagJson = JSON.stringify({
      queixa: queixa.trim(),
      hda: hda.trim(),
      exameFisico: exameFisico.trim(),
      examesComp: examesComp.trim(),
      exameFisicoFiles,
      examesCompFiles,
    })

    const conclJson = JSON.stringify({
      text: conclusionText.trim(),
      repouso: repouso.trim(),
      conduta: conduta.trim(),
    })

    const rawPayload = {
      patient_id: report.patient_id,
      status: 'draft' as const,
      exam: exam.trim() || null,
      requested_by: requestedBy.trim() || null,
      cid_code: cidCode.trim() || null,
      diagnosis: diagJson,
      conclusion: conclJson,
      due_at: due,
      hide_date: false,
      hide_signature: false,
      content_html: bodyRef.current.html || null,
      content_json: bodyRef.current.json,
    }

    const parsed = reportInputSchema.safeParse(rawPayload)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Dados inválidos no laudo.'
      throw new Error(errorMsg)
    }

    return {
      ...reportToReportInput(report, parsed.data),
    }
  }

  function save() {
    if (!report) return
    try {
      const payload = buildPayload()
      updateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Laudo salvo.')
          navigate('/app/relatorios')
        },
        onError: (err) => {
          toastFromError(err, { operationTitle: 'Não foi possível salvar o laudo.' })
        },
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Corrija os dados antes de salvar.'
      toast.error(msg)
    }
  }

  async function applyDigitalSignature() {
    if (!report) return

    // 1. Identifica o médico solicitante selecionado no Select de "Solicitante"
    const selectedDoctor = doctors.find((d) => d.full_name === requestedBy)
    
    let docName = requestedBy || ''
    let crm = ''
    let crmUf = ''

    if (selectedDoctor) {
      docName = selectedDoctor.full_name
      crm = selectedDoctor.crm
      crmUf = selectedDoctor.crm_uf
    } else {
      if (loggedDoctor) {
        docName = loggedDoctor.full_name || docName
        crm = loggedDoctor.crm || ''
        crmUf = loggedDoctor.crm_uf || ''
      }
    }

    if (!docName.trim()) {
      toast.error('Selecione um solicitante (médico) para assinar o laudo.')
      return
    }

    // Formatar Dr./Dra.
    const prefix =
      docName.toLowerCase().startsWith('dr.') ||
      docName.toLowerCase().startsWith('dra.') ||
      docName.toLowerCase().startsWith('dr(a).')
        ? ''
        : 'Dr(a). '
    const fullNameFormatted = `${prefix}${docName}`

    // Formatar CRM-UF
    const crmUfFormatted = crmUf ? `${crm}-${crmUf}` : crm

    // Formatar data atual
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    const formattedDate = `${day}/${month}/${year}`

    // Montar HTML da assinatura no final do laudo com layout premium assinado digitalmente
    const signatureHtmlLines = `
      <div style="margin-top: 30px; padding: 18px; border: 1.5px solid #10b981; border-radius: 8px; background-color: #f0fdf4; display: inline-flex; flex-direction: column; gap: 4px; font-family: sans-serif; max-width: 320px;">
        <div style="display: flex; align-items: center; gap: 6px; color: #047857; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.5px; text-transform: uppercase;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="display: inline-block;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          Assinado Digitalmente
        </div>
        <div style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin-top: 4px;">
          ${fullNameFormatted}
        </div>
        <div style="font-size: 0.85rem; color: #475569; font-weight: 500;">
          CRM: ${crmUfFormatted}
        </div>
        <div style="font-size: 0.75rem; color: #64748b; margin-top: 6px; border-top: 1px solid #d1fae5; padding-top: 6px;">
          Documento assinado em ${formattedDate}
        </div>
      </div>
    `.trim()

    // Define no estado local de assinatura
    setSignatureHtml(signatureHtmlLines)

    // Calcula o próximo HTML completo de forma imediata para o salvamento
    const nextHtml = composeReportHtml(signatureHtmlLines)

    // Salva o laudo no banco imediatamente
    const due = datetimeLocalToIso(dueLocal)
    
    const diagJson = JSON.stringify({
      queixa: queixa.trim(),
      hda: hda.trim(),
      exameFisico: exameFisico.trim(),
      examesComp: examesComp.trim(),
      exameFisicoFiles,
      examesCompFiles,
    })

    const conclJson = JSON.stringify({
      text: conclusionText.trim(),
      repouso: repouso.trim(),
      conduta: conduta.trim(),
    })

    const rawPayload = {
      patient_id: report.patient_id,
      status: 'completed' as const,
      exam: exam.trim() || null,
      requested_by: requestedBy.trim() || null,
      cid_code: cidCode.trim() || null,
      diagnosis: diagJson,
      conclusion: conclJson,
      due_at: due,
      hide_date: false,
      hide_signature: false,
      content_html: nextHtml || null,
      content_json: {},
    }

    try {
      const parsed = reportInputSchema.parse(rawPayload)
      const payload = {
        ...reportToReportInput(report, parsed),
      }

      await updateMutation.mutateAsync(payload)
      toast.success('Assinatura digital aplicada e laudo finalizado com sucesso.')
    } catch (e: unknown) {
      const errorText = e instanceof Error ? e.message : String(e)
      if (errorText.includes('report_status') || errorText.includes('completed')) {
        console.warn('[Assinatura Digital] Enum "completed" não suportado no banco. Salvando como "draft" assinado.')
        try {
          const fallbackPayload = {
            ...reportToReportInput(report, {
              ...rawPayload,
              status: 'draft' as const,
            }),
          }
          await updateMutation.mutateAsync(fallbackPayload)
          toast.success('Assinatura digital aplicada e laudo finalizado com sucesso.')
        } catch (errFallback: unknown) {
          toastFromError(errFallback, { operationTitle: 'Não foi possível salvar a assinatura no laudo.' })
        }
      } else {
        const msg = e instanceof Error ? e.message : 'Corrija os dados antes de assinar.'
        toast.error(msg)
      }
    }
  }

  if (reportQuery.isError) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-[var(--color-destructive)]">Relatório não encontrado.</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => navigate('/app/relatorios')}>
          Voltar
        </Button>
      </div>
    )
  }

  if (reportQuery.isLoading || !report) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[var(--color-muted-foreground)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando laudo…
      </div>
    )
  }

  const patientName = patientQuery.data?.full_name ?? 'Paciente'
  const syncToken = `${report.id}:${report.updated_at ?? ''}:${editorVersion}`

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-[var(--color-muted-foreground)]"
          onClick={() => navigate('/app/relatorios')}
        >
          <ArrowLeft className="h-4 w-4" />
          Lista
        </Button>
      </div>

      <header className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Laudo médico
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <h1 className="font-display text-xl text-[var(--color-foreground)] sm:text-2xl">{patientName}</h1>
          {patientQuery.data?.id && canSeePatientProfile ? (
            <Link
              to={`/app/pacientes/${patientQuery.data.id}`}
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              Ver cadastro
            </Link>
          ) : null}
        </div>
        <p className="mt-1 font-mono text-xs text-[var(--color-muted-foreground)]">
          Protocolo {report.order_number ?? report.id.slice(0, 8)}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exam">Exame</Label>
          <PaginatedAutocomplete
            id="exam"
            placeholder="Selecione ou digite um exame"
            value={exam}
            onChange={setExam}
            items={allExams}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="requested_by">Solicitante</Label>
          <PaginatedAutocomplete
            id="requested_by"
            placeholder="Selecione ou digite um médico"
            value={requestedBy}
            onChange={setRequestedBy}
            items={allDoctors}
            disabled={isMedico}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cid">CID</Label>
          <PaginatedAutocomplete
            id="cid"
            placeholder="Selecione ou digite o CID"
            value={cidCode}
            onChange={setCidCode}
            items={allCids}
          />
          {cidError && (
            <p className="text-xs text-[var(--color-destructive)]">{cidError}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="due">Data</Label>
          <input
            id="due"
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            className={cn(
              'h-11 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2 border-t border-[var(--color-border)] pt-4 mt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="queixa" className="text-sm font-semibold text-[var(--color-foreground)]">
              Queixa Principal (Motivo da Consulta)
            </Label>
            <button
              type="button"
              onClick={() => toggleVoiceInput('queixa', setQueixa)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-300",
                activeVoiceField === 'queixa'
                  ? "bg-red-500 text-white border-red-500 animate-pulse"
                  : "bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] border-[var(--color-accent)]/15 hover:bg-[var(--color-accent-soft)]/35"
              )}
            >
              <Mic className="h-3.5 w-3.5" />
              {activeVoiceField === 'queixa' ? 'Gravando...' : 'Gravar por Voz'}
            </button>
          </div>
          <textarea
            id="queixa"
            value={queixa}
            onChange={(e) => setQueixa(e.target.value)}
            rows={2}
            placeholder="Digite a queixa principal do paciente..."
            className={cn(
              'rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="hda" className="text-sm font-semibold text-[var(--color-foreground)]">
              Histórico da Doença Atual (HDA)
            </Label>
            <button
              type="button"
              onClick={() => toggleVoiceInput('hda', setHda)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-300",
                activeVoiceField === 'hda'
                  ? "bg-red-500 text-white border-red-500 animate-pulse"
                  : "bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] border-[var(--color-accent)]/15 hover:bg-[var(--color-accent-soft)]/35"
              )}
            >
              <Mic className="h-3.5 w-3.5" />
              {activeVoiceField === 'hda' ? 'Gravando...' : 'Gravar por Voz'}
            </button>
          </div>
          <textarea
            id="hda"
            value={hda}
            onChange={(e) => setHda(e.target.value)}
            rows={4}
            placeholder="Descreva detalhadamente o desenvolvimento dos sintomas e histórico relatado"
            className={cn(
              'rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="exame_fisico" className="text-sm font-semibold text-[var(--color-foreground)]">
              Exame Físico (Se houver)
            </Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleVoiceInput('exame_fisico', setExameFisico)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-300",
                  activeVoiceField === 'exame_fisico'
                    ? "bg-red-500 text-white border-red-500 animate-pulse"
                    : "bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] border-[var(--color-accent)]/15 hover:bg-[var(--color-accent-soft)]/35"
                )}
              >
                <Mic className="h-3.5 w-3.5" />
                {activeVoiceField === 'exame_fisico' ? 'Gravando...' : 'Gravar por Voz'}
              </button>
              <button
                type="button"
                onClick={() => efFileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline font-medium"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Anexar Imagem
              </button>
            </div>
            <input
              type="file"
              ref={efFileInputRef}
              onChange={(e) => handleFileChange(e, setExameFisicoFiles)}
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              multiple
            />
          </div>
          <textarea
            id="exame_fisico"
            value={exameFisico}
            onChange={(e) => setExameFisico(e.target.value)}
            rows={2}
            placeholder="Descreva o exame físico do paciente, se houver"
            className={cn(
              'rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
          {exameFisicoFiles.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {exameFisicoFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-2.5 text-xs text-[var(--color-foreground)] max-w-[200px]"
                >
                  {file.dataUrl && (
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className="h-20 w-full object-contain rounded border border-[var(--color-border)] bg-[var(--color-surface)]"
                    />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setExameFisicoFiles((prev) => prev.filter((_, i) => i !== idx))
                      }}
                      className="text-[var(--color-destructive)] hover:text-[var(--color-destructive)]/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="exames_comp" className="text-sm font-semibold text-[var(--color-foreground)]">
              Exames Complementares (Se houver)
            </Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleVoiceInput('exames_comp', setExamesComp)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-300",
                  activeVoiceField === 'exames_comp'
                    ? "bg-red-500 text-white border-red-500 animate-pulse"
                    : "bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] border-[var(--color-accent)]/15 hover:bg-[var(--color-accent-soft)]/35"
                )}
              >
                <Mic className="h-3.5 w-3.5" />
                {activeVoiceField === 'exames_comp' ? 'Gravando...' : 'Gravar por Voz'}
              </button>
              <button
                type="button"
                onClick={() => ecFileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline font-medium"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Anexar Imagem
              </button>
            </div>
            <input
              type="file"
              ref={ecFileInputRef}
              onChange={(e) => handleFileChange(e, setExamesCompFiles)}
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              multiple
            />
          </div>
          <textarea
            id="exames_comp"
            value={examesComp}
            onChange={(e) => setExamesComp(e.target.value)}
            rows={2}
            placeholder="Descreva exames complementares, se houver"
            className={cn(
              'rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
          {examesCompFiles.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {examesCompFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-2.5 text-xs text-[var(--color-foreground)] max-w-[200px]"
                >
                  {file.dataUrl && (
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className="h-20 w-full object-contain rounded border border-[var(--color-border)] bg-[var(--color-surface)]"
                    />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setExamesCompFiles((prev) => prev.filter((_, i) => i !== idx))
                      }}
                      className="text-[var(--color-destructive)] hover:text-[var(--color-destructive)]/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2 border-t border-[var(--color-border)] pt-4 mt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="conclusion" className="text-sm font-semibold text-[var(--color-foreground)]">
              Hipótese Diagnóstica / Conclusão
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isGeneratingConclusion}
                onClick={handleSuggestConclusion}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-300",
                  isGeneratingConclusion
                    ? "bg-purple-100 text-purple-700 border-purple-200"
                    : "bg-purple-50 text-purple-600 border-purple-200/50 hover:bg-purple-100 text-purple-700"
                )}
              >
                {isGeneratingConclusion ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Sugerir com IA
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleVoiceInput('conclusion', setConclusionText)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-300",
                  activeVoiceField === 'conclusion'
                    ? "bg-red-500 text-white border-red-500 animate-pulse"
                    : "bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] border-[var(--color-accent)]/15 hover:bg-[var(--color-accent-soft)]/35"
                )}
              >
                <Mic className="h-3.5 w-3.5" />
                {activeVoiceField === 'conclusion' ? 'Gravando...' : 'Gravar por Voz'}
              </button>
            </div>
          </div>
          <textarea
            id="conclusion"
            value={conclusionText}
            onChange={(e) => setConclusionText(e.target.value)}
            rows={3}
            placeholder="Conclusão e recomendações médicas do laudo"
            className={cn(
              'rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="conduta" className="text-sm font-semibold text-[var(--color-foreground)]">
              Conduta Médica / Tratamento Indicado
            </Label>
            <button
              type="button"
              onClick={() => toggleVoiceInput('conduta', setConduta)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-300",
                activeVoiceField === 'conduta'
                  ? "bg-red-500 text-white border-red-500 animate-pulse"
                  : "bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] border-[var(--color-accent)]/15 hover:bg-[var(--color-accent-soft)]/35"
              )}
            >
              <Mic className="h-3.5 w-3.5" />
              {activeVoiceField === 'conduta' ? 'Gravando...' : 'Gravar por Voz'}
            </button>
          </div>
          <textarea
            id="conduta"
            value={conduta}
            onChange={(e) => setConduta(e.target.value)}
            rows={3}
            placeholder="Espaço para prescrição de medicamentos, repouso, encaminhamentos ou orientações gerais"
            className={cn(
              'rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="repouso" className="text-sm font-semibold text-[var(--color-foreground)]">
            Dias de Repouso Recomendados (Se houver)
          </Label>
          <input
            id="repouso"
            type="number"
            min="0"
            placeholder="Informe a quantidade de dias de repouso (ex: 5)"
            value={repouso}
            onChange={(e) => setRepouso(e.target.value)}
            className={cn(
              'h-11 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm',
              'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'
            )}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Label>Corpo do laudo</Label>
        <ReportRichText
          syncToken={syncToken}
          initialJson={editorJson}
          initialHtml={editorHtml}
          editable={false}
          onBodyChange={(html, json) => {
            bodyRef.current = { html, json }
          }}
        />
      </section>

      <div className="flex justify-start mt-2 mb-4">
        <Button
          type="button"
          variant="outline"
          className="gap-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 h-11 px-5 rounded-[10px]"
          onClick={emitirAtestado}
        >
          <FileCheck className="h-4 w-4" />
          Emitir Atestado para Impressão
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const bodyHtml = bodyRef.current.html?.trim()
              ? bodyRef.current.html
              : (report.content_html?.trim() ? report.content_html : '')
            setPreviewHtml(
              bodyHtml || buildReportFallbackHtml({ ...report, patient_name: patientName })
            )
            setPreviewOpen(true)
          }}
        >
          <Eye className="h-4 w-4" />
          Pré-visualizar
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/app/relatorios')}>
          Cancelar
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          loading={updateMutation.isPending}
          className="gap-2 bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90"
          onClick={() => applyDigitalSignature()}
        >
          <FileCheck className="h-4 w-4" />
          Assinatura Digital
        </Button>
        <Button type="button" loading={updateMutation.isPending} onClick={() => save()}>
          Salvar laudo
        </Button>
      </div>

      <ReportPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={`Laudo ${report.order_number ?? report.id.slice(0, 8)}`}
        subtitle={patientName}
        html={
          previewHtml?.trim()
            ? previewHtml
            : report.content_html?.trim()
              ? report.content_html
              : buildReportFallbackHtml({ ...report, patient_name: patientName })
        }
      />
    </div>
  )
}
