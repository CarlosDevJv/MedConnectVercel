import { zodResolver } from '@hookform/resolvers/zod'
import {
  Activity,
  Briefcase,
  Building2,
  Calendar,
  Heart,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Pill,
  User,
  Users,
} from 'lucide-react'
import * as React from 'react'
import { Controller, useForm, useWatch, type SubmitHandler } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldError } from '@/components/ui/field-error'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createPatientSchema,
  updatePatientSchema,
  type CreatePatientValues,
  type UpdatePatientValues,
} from '@/features/patients/schemas'
import {
  BLOOD_TYPE_OPTIONS,
  DOCUMENT_TYPES,
  MARITAL_STATUS_OPTIONS,
  PREFERRED_CONTACT_LABELS,
  PREFERRED_CONTACT_OPTIONS,
  RACE_OPTIONS,
  SEX_OPTIONS,
  type Patient,
} from '@/features/patients/types'
import { formatCpf } from '@/features/patients/utils/cpf'
import { formatRg } from '@/features/patients/utils/rg'
import { formatCep } from '@/features/patients/utils/cep'
import { formatPhone } from '@/features/patients/utils/phone'
import {
  calculateBmi,
  formatDecimal,
  numberToDecimalString,
  parseDecimal,
} from '@/features/patients/utils/decimal'
import { BRAZILIAN_STATES } from '@/features/patients/utils/uf'
import { lookupCep } from '@/lib/cep'
import { cn } from '@/lib/cn'

type CreateProps = {
  mode: 'create'
  defaultValues?: Partial<CreatePatientValues>
  onSubmit: SubmitHandler<CreatePatientValues>
  onCancel: () => void
  submitting?: boolean
}

type EditProps = {
  mode: 'edit'
  patient: Patient
  onSubmit: SubmitHandler<UpdatePatientValues>
  onCancel: () => void
  submitting?: boolean
}

export type PatientFormProps = CreateProps | EditProps

export interface PatientFormHandle {
  setFieldError: (
    field: keyof CreatePatientValues | keyof UpdatePatientValues,
    message: string
  ) => void
}

type FormValues = CreatePatientValues | UpdatePatientValues

function buildEditDefaults(patient: Patient): UpdatePatientValues {
  return {
    full_name: patient.full_name ?? '',
    social_name: patient.social_name ?? '',
    email: patient.email ?? '',
    cpf: patient.cpf ?? '',
    rg: patient.rg ?? '',
    document_type: (patient.document_type as UpdatePatientValues['document_type']) ?? '',
    document_number: patient.document_number ?? '',
    birth_date: patient.birth_date ?? '',
    phone_mobile: patient.phone_mobile ?? '',
    phone1: patient.phone1 ?? '',
    phone2: patient.phone2 ?? '',
    preferred_contact: (patient.preferred_contact as UpdatePatientValues['preferred_contact']) ?? '',
    sex: (patient.sex as UpdatePatientValues['sex']) ?? '',
    race: (patient.race as UpdatePatientValues['race']) ?? '',
    ethnicity: patient.ethnicity ?? '',
    nationality: patient.nationality ?? '',
    naturality: patient.naturality ?? '',
    profession: patient.profession ?? '',
    marital_status: (patient.marital_status as UpdatePatientValues['marital_status']) ?? '',
    mother_name: patient.mother_name ?? '',
    mother_profession: patient.mother_profession ?? '',
    father_name: patient.father_name ?? '',
    father_profession: patient.father_profession ?? '',
    guardian_name: patient.guardian_name ?? '',
    guardian_cpf: patient.guardian_cpf ?? '',
    spouse_name: patient.spouse_name ?? '',
    cep: patient.cep ?? '',
    street: patient.street ?? '',
    number: patient.number ?? '',
    complement: patient.complement ?? '',
    neighborhood: patient.neighborhood ?? '',
    city: patient.city ?? '',
    state: patient.state ?? '',
    reference: patient.reference ?? '',
    blood_type: (patient.blood_type as UpdatePatientValues['blood_type']) ?? '',
    weight_kg: numberToDecimalString(patient.weight_kg, 2),
    height_m: numberToDecimalString(patient.height_m, 2),
    notes: patient.notes ?? '',
    legacy_code: patient.legacy_code ?? '',
    rn_in_insurance: patient.rn_in_insurance ?? false,
    vip: patient.vip ?? false,

    insurance_company: patient.insurance_company ?? '',
    insurance_plan: patient.insurance_plan ?? '',
    insurance_member_number: patient.insurance_member_number ?? '',
    insurance_card_valid_until: patient.insurance_card_valid_until ?? '',
    allergies: patient.allergies ?? '',
    medications_in_use: patient.medications_in_use ?? '',
    chronic_conditions: patient.chronic_conditions ?? '',
  }
}

function buildCreateDefaults(input?: Partial<CreatePatientValues>): CreatePatientValues {
  return {
    full_name: input?.full_name ?? '',
    social_name: input?.social_name ?? '',
    email: input?.email ?? '',
    cpf: input?.cpf ?? '',
    rg: input?.rg ?? '',
    document_type: input?.document_type ?? '',
    document_number: input?.document_number ?? '',
    birth_date: input?.birth_date ?? '',
    phone_mobile: input?.phone_mobile ?? '',
    phone1: input?.phone1 ?? '',
    phone2: input?.phone2 ?? '',
    preferred_contact: input?.preferred_contact ?? '',
    sex: input?.sex ?? '',
    race: input?.race ?? '',
    ethnicity: input?.ethnicity ?? '',
    nationality: input?.nationality ?? 'Brasileira',
    naturality: input?.naturality ?? '',
    profession: input?.profession ?? '',
    marital_status: input?.marital_status ?? '',
    mother_name: input?.mother_name ?? '',
    mother_profession: input?.mother_profession ?? '',
    father_name: input?.father_name ?? '',
    father_profession: input?.father_profession ?? '',
    guardian_name: input?.guardian_name ?? '',
    guardian_cpf: input?.guardian_cpf ?? '',
    spouse_name: input?.spouse_name ?? '',
    cep: input?.cep ?? '',
    street: input?.street ?? '',
    number: input?.number ?? '',
    complement: input?.complement ?? '',
    neighborhood: input?.neighborhood ?? '',
    city: input?.city ?? '',
    state: input?.state ?? '',
    reference: input?.reference ?? '',
    blood_type: input?.blood_type ?? '',
    weight_kg: input?.weight_kg ?? '',
    height_m: input?.height_m ?? '',
    notes: input?.notes ?? '',
    legacy_code: input?.legacy_code ?? '',
    rn_in_insurance: input?.rn_in_insurance ?? false,
    vip: input?.vip ?? false,

    insurance_company: input?.insurance_company ?? '',
    insurance_plan: input?.insurance_plan ?? '',
    insurance_member_number: input?.insurance_member_number ?? '',
    insurance_card_valid_until: input?.insurance_card_valid_until ?? '',
    allergies: input?.allergies ?? '',
    medications_in_use: input?.medications_in_use ?? '',
    chronic_conditions: input?.chronic_conditions ?? '',
  }
}

export const PatientForm = React.forwardRef<PatientFormHandle, PatientFormProps>(
  function PatientForm(props, ref) {
    const isEdit = props.mode === 'edit'

    const {
      register,
      handleSubmit,
      control,
      setError,
      setValue,
      formState: { errors },
    } = useForm<FormValues>({
      // Resolver type: zod schema is interchangeable since updatePatientSchema extends create.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver((isEdit ? updatePatientSchema : createPatientSchema) as any),
      defaultValues: isEdit
        ? (buildEditDefaults(props.patient) as FormValues)
        : (buildCreateDefaults(props.defaultValues) as FormValues),
      shouldFocusError: true,
    })

    React.useImperativeHandle(ref, () => ({
      setFieldError: (field, message) => {
        setError(field as keyof FormValues, { message })
      },
    }))

    // Auto-fill address via ViaCEP when the CEP becomes valid.
    const cepAbortRef = React.useRef<AbortController | null>(null)
    const [cepLookupLoading, setCepLookupLoading] = React.useState(false)

    async function handleCepBlur(value: string) {
      const digits = value.replace(/\D+/g, '')
      if (digits.length !== 8) return
      cepAbortRef.current?.abort()
      const controller = new AbortController()
      cepAbortRef.current = controller
      setCepLookupLoading(true)
      try {
        const result = await lookupCep(digits, controller.signal)
        if (!result) return
        setValue('street', result.street, { shouldDirty: true })
        setValue('neighborhood', result.neighborhood, { shouldDirty: true })
        setValue('city', result.city, { shouldDirty: true })
        setValue('state', result.state, { shouldDirty: true })
      } finally {
        if (cepAbortRef.current === controller) {
          setCepLookupLoading(false)
        }
      }
    }

    React.useEffect(() => () => cepAbortRef.current?.abort(), [])

    return (
      <form
        id="patient-form"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSubmit={handleSubmit(props.onSubmit as any)}
        noValidate
        className="flex flex-col gap-5"
      >
        {/* ── Dados do paciente ── */}
        <FormSection
          title="Dados do paciente"
          description="Informações pessoais e documentação."
          icon={<User className="h-4 w-4" />}
          id="section-dados"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome" required error={errors.full_name?.message} className="md:col-span-1">
              <Input
                id="full_name"
                autoComplete="name"
                placeholder="Maria Silva"
                invalid={!!errors.full_name}
                {...register('full_name')}
              />
            </Field>

            <Field label="Nome social" error={errors.social_name?.message}>
              <Input id="social_name" placeholder="Como prefere ser chamado(a)" {...register('social_name')} />
            </Field>

            <Field label="CPF" required error={errors.cpf?.message}>
              <Controller
                control={control}
                name="cpf"
                render={({ field }) => (
                  <Input
                    id="cpf"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    leftIcon={<IdCard className="h-4 w-4" />}
                    invalid={!!errors.cpf}
                    value={formatCpf(field.value ?? '')}
                    onChange={(e) => field.onChange(formatCpf(e.target.value))}
                    onBlur={field.onBlur}
                    maxLength={14}
                    ref={field.ref}
                    disabled={isEdit}
                    readOnly={isEdit}
                  />
                )}
              />
            </Field>

            <Field label="RG" error={errors.rg?.message}>
              <Controller
                control={control}
                name="rg"
                render={({ field }) => (
                  <Input
                    id="rg"
                    placeholder="00.000.000-0"
                    invalid={!!errors.rg}
                    value={formatRg(field.value ?? '')}
                    onChange={(e) => field.onChange(formatRg(e.target.value))}
                    onBlur={field.onBlur}
                    maxLength={13}
                    ref={field.ref}
                  />
                )}
              />
            </Field>

            <Field label="Outros documentos de identidade" error={errors.document_type?.message}>
              <Controller
                control={control}
                name="document_type"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v === '__none' ? '' : v)}
                  >
                    <SelectTrigger className="w-full" aria-label="Tipo de documento">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Nenhum —</SelectItem>
                      {DOCUMENT_TYPES.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Número do documento" error={errors.document_number?.message}>
              <Input id="document_number" placeholder="Número" {...register('document_number')} />
            </Field>

            <Field label="Sexo" error={errors.sex?.message}>
              <Controller
                control={control}
                name="sex"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v === '__none' ? '' : v)}
                  >
                    <SelectTrigger className="w-full" aria-label="Sexo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Não informar —</SelectItem>
                      {SEX_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Data de nascimento" error={errors.birth_date?.message}>
              <Input
                id="birth_date"
                type="date"
                autoComplete="bday"
                leftIcon={<Calendar className="h-4 w-4" />}
                invalid={!!errors.birth_date}
                disabled={isEdit}
                readOnly={isEdit}
                {...register('birth_date')}
              />
            </Field>

            <Field label="Etnia" error={errors.ethnicity?.message}>
              <Input id="ethnicity" placeholder="Ex: Latina, Asiática..." {...register('ethnicity')} />
            </Field>

            <Field label="Raça (IBGE)" error={errors.race?.message}>
              <Controller
                control={control}
                name="race"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v === '__none' ? '' : v)}
                  >
                    <SelectTrigger className="w-full" aria-label="Raça">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Não declarada —</SelectItem>
                      {RACE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Naturalidade" error={errors.naturality?.message}>
              <Input id="naturality" placeholder="Cidade natal" {...register('naturality')} />
            </Field>

            <Field label="Nacionalidade" error={errors.nationality?.message}>
              <Input id="nationality" placeholder="Brasileira" {...register('nationality')} />
            </Field>

            <Field label="Profissão" error={errors.profession?.message}>
              <Input
                id="profession"
                leftIcon={<Briefcase className="h-4 w-4" />}
                placeholder="Ex: Engenheira"
                {...register('profession')}
              />
            </Field>

            <Field label="Estado civil" error={errors.marital_status?.message}>
              <Controller
                control={control}
                name="marital_status"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v === '__none' ? '' : v)}
                  >
                    <SelectTrigger className="w-full" aria-label="Estado civil">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Não informar —</SelectItem>
                      {MARITAL_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Nome da mãe" error={errors.mother_name?.message}>
              <Input id="mother_name" {...register('mother_name')} />
            </Field>

            <Field label="Profissão da mãe" error={errors.mother_profession?.message}>
              <Input id="mother_profession" {...register('mother_profession')} />
            </Field>

            <Field label="Nome do pai" error={errors.father_name?.message}>
              <Input id="father_name" {...register('father_name')} />
            </Field>

            <Field label="Profissão do pai" error={errors.father_profession?.message}>
              <Input id="father_profession" {...register('father_profession')} />
            </Field>

            <Field label="Nome do responsável" error={errors.guardian_name?.message}>
              <Input id="guardian_name" placeholder="Para menores ou dependentes" {...register('guardian_name')} />
            </Field>

            <Field label="CPF do responsável" error={errors.guardian_cpf?.message}>
              <Controller
                control={control}
                name="guardian_cpf"
                render={({ field }) => (
                  <Input
                    id="guardian_cpf"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    leftIcon={<IdCard className="h-4 w-4" />}
                    invalid={!!errors.guardian_cpf}
                    value={formatCpf(field.value ?? '')}
                    onChange={(e) => field.onChange(formatCpf(e.target.value))}
                    onBlur={field.onBlur}
                    maxLength={14}
                    ref={field.ref}
                  />
                )}
              />
            </Field>

            <Field label="Nome do esposo(a)" error={errors.spouse_name?.message} className="md:col-span-2">
              <Input id="spouse_name" {...register('spouse_name')} />
            </Field>

            <div className="md:col-span-2 flex flex-col gap-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <Controller
                control={control}
                name="rn_in_insurance"
                render={({ field }) => (
                  <ToggleRow
                    id="rn_in_insurance"
                    label="RN na Guia do convênio"
                    description="Marque se o paciente é Recém-Nascido cadastrado na guia do convênio."
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Controller
                control={control}
                name="vip"
                render={({ field }) => (
                  <ToggleRow
                    id="vip"
                    label="Paciente VIP"
                    description="Sinaliza atendimento prioritário."
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <Field label="Código legado" error={errors.legacy_code?.message}>
              <Input
                id="legacy_code"
                placeholder="ID em outro sistema"
                {...register('legacy_code')}
              />
            </Field>

            <Field
              label="Observações"
              error={errors.notes?.message}
              className="md:col-span-2"
              hint="Observações livres complementares ao prontuário."
            >
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/70 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                placeholder="Ex: Alergia a dipirona; usa marca-passo..."
              />
            </Field>
          </div>
        </FormSection>

        {/* ── Contato ── */}
        <FormSection
          title="Contato"
          description="Email e telefones para comunicação."
          icon={<Phone className="h-4 w-4" />}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="E-mail" required error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nome@exemplo.com"
                leftIcon={<Mail className="h-4 w-4" />}
                invalid={!!errors.email}
                {...register('email')}
              />
            </Field>

            <Field label="Celular" required error={errors.phone_mobile?.message}>
              <PhoneInput control={control} name="phone_mobile" invalid={!!errors.phone_mobile} />
            </Field>

            <Field label="Telefone 1" error={errors.phone1?.message}>
              <PhoneInput control={control} name="phone1" invalid={!!errors.phone1} />
            </Field>

            <Field label="Telefone 2" error={errors.phone2?.message}>
              <PhoneInput control={control} name="phone2" invalid={!!errors.phone2} />
            </Field>

            <Field label="Contato preferencial" error={errors.preferred_contact?.message}>
              <Controller
                control={control}
                name="preferred_contact"
                render={({ field }) => (
                  <Select value={field.value || '__none'} onValueChange={(v) => field.onChange(v === '__none' ? '' : v)}>
                    <SelectTrigger id="preferred_contact">
                      <SelectValue placeholder="Não informado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Não informado</SelectItem>
                      {PREFERRED_CONTACT_OPTIONS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {PREFERRED_CONTACT_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
        </FormSection>

        {/* ── Endereço ── */}
        <FormSection
          title="Endereço"
          description="Preencha o CEP para autopreencher os demais campos."
          icon={<MapPin className="h-4 w-4" />}
        >
          <div className="grid gap-4 md:grid-cols-6">
            <Field label="CEP" error={errors.cep?.message} className="md:col-span-2">
              <Controller
                control={control}
                name="cep"
                render={({ field }) => (
                  <Input
                    id="cep"
                    inputMode="numeric"
                    placeholder="00000-000"
                    invalid={!!errors.cep}
                    value={formatCep(field.value ?? '')}
                    onChange={(e) => field.onChange(formatCep(e.target.value))}
                    onBlur={(e) => {
                      field.onBlur()
                      void handleCepBlur(e.target.value)
                    }}
                    maxLength={9}
                    ref={field.ref}
                    rightSlot={
                      cepLookupLoading ? (
                        <span className="text-xs text-[var(--color-muted-foreground)]">…</span>
                      ) : null
                    }
                  />
                )}
              />
            </Field>

            <Field label="Endereço" error={errors.street?.message} className="md:col-span-4">
              <Input id="street" placeholder="Rua / Avenida" {...register('street')} />
            </Field>

            <Field label="Número" error={errors.number?.message} className="md:col-span-1">
              <Input id="number" inputMode="numeric" placeholder="123" {...register('number')} />
            </Field>

            <Field label="Complemento" error={errors.complement?.message} className="md:col-span-2">
              <Input id="complement" placeholder="Apto, bloco..." {...register('complement')} />
            </Field>

            <Field label="Bairro" error={errors.neighborhood?.message} className="md:col-span-3">
              <Input id="neighborhood" {...register('neighborhood')} />
            </Field>

            <Field label="Cidade" error={errors.city?.message} className="md:col-span-3">
              <Input id="city" {...register('city')} />
            </Field>

            <Field label="Estado" error={errors.state?.message} className="md:col-span-2">
              <Controller
                control={control}
                name="state"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v === '__none' ? '' : v)}
                  >
                    <SelectTrigger className="w-full" aria-label="Estado">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="__none">— Não informar —</SelectItem>
                      {BRAZILIAN_STATES.map((s) => (
                        <SelectItem key={s.uf} value={s.uf}>
                          {s.uf} — {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Ponto de referência" error={errors.reference?.message} className="md:col-span-6">
              <Input id="reference" placeholder="Próximo a..." {...register('reference')} />
            </Field>
          </div>
        </FormSection>

        {/* ── Convênio ── */}
        <FormSection
          title="Convênio"
          description="Operadora, plano e dados da carteira (quando aplicável)."
          icon={<Building2 className="h-4 w-4" />}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Operadora / convênio" error={errors.insurance_company?.message}>
              <Input
                id="insurance_company"
                placeholder="Ex: Unimed, Amil, SulAmérica"
                {...register('insurance_company')}
              />
            </Field>
            <Field label="Plano" error={errors.insurance_plan?.message}>
              <Input id="insurance_plan" placeholder="Nome do plano ou modalidade" {...register('insurance_plan')} />
            </Field>
            <Field label="Nº da matrícula / carteirinha" error={errors.insurance_member_number?.message}>
              <Input
                id="insurance_member_number"
                placeholder="Número na carteira"
                {...register('insurance_member_number')}
              />
            </Field>
            <Field label="Validade da carteira" error={errors.insurance_card_valid_until?.message}>
              <Input id="insurance_card_valid_until" type="date" {...register('insurance_card_valid_until')} />
            </Field>
          </div>
        </FormSection>

        {/* ── Informações Médicas ── */}
        <FormSection
          title="Informações Médicas"
          description="Sinais vitais, biometria e histórico clínico relevante."
          icon={<Heart className="h-4 w-4" />}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Tipo sanguíneo" error={errors.blood_type?.message}>
              <Controller
                control={control}
                name="blood_type"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v === '__none' ? '' : v)}
                  >
                    <SelectTrigger className="w-full" aria-label="Tipo sanguíneo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Não informar —</SelectItem>
                      {BLOOD_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Peso" error={errors.weight_kg?.message}>
              <Controller
                control={control}
                name="weight_kg"
                render={({ field }) => (
                  <Input
                    id="weight_kg"
                    inputMode="decimal"
                    placeholder="65,5"
                    rightSlot={<span className="text-xs text-[var(--color-muted-foreground)]">kg</span>}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(formatDecimal(e.target.value, 2))}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
            </Field>

            <Field label="Altura" error={errors.height_m?.message}>
              <Controller
                control={control}
                name="height_m"
                render={({ field }) => (
                  <Input
                    id="height_m"
                    inputMode="decimal"
                    placeholder="1,68"
                    rightSlot={<span className="text-xs text-[var(--color-muted-foreground)]">m</span>}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(formatDecimal(e.target.value, 2))}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
            </Field>

            <BmiDisplay control={control} className="md:col-span-3" />
          </div>

          <div className="mt-6 grid gap-4 border-t border-[var(--color-border)] pt-6 md:grid-cols-3">
            <Field
              label="Alergias"
              error={errors.allergies?.message}
              className="md:col-span-3"
              hint="Medicamentos, alimentos, látex, etc."
            >
              <textarea
                id="allergies"
                {...register('allergies')}
                rows={2}
                className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/70 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                placeholder="Ex: Dipirona; penicilina"
              />
            </Field>
            <Field
              label="Medicamentos em uso"
              error={errors.medications_in_use?.message}
              className="md:col-span-3"
            >
              <textarea
                id="medications_in_use"
                {...register('medications_in_use')}
                rows={2}
                className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/70 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                placeholder="Nome, dose e frequência quando souber"
              />
            </Field>
            <Field
              label="Condições crônicas"
              error={errors.chronic_conditions?.message}
              className="md:col-span-3"
            >
              <textarea
                id="chronic_conditions"
                {...register('chronic_conditions')}
                rows={2}
                className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/70 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                placeholder="HAS, DM, asma, etc."
              />
            </Field>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            <Pill className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" aria-hidden />
            Campos clínicos complementam o laudo e o atendimento; mantenha atualizado com o paciente.
          </p>
        </FormSection>

        {/* ── Footer ── */}
        <FormFooter onCancel={props.onCancel} submitting={props.submitting} isEdit={isEdit} />
      </form>
    )
  }
)

PatientForm.displayName = 'PatientForm'

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  className?: string
  hint?: string
  children: React.ReactNode
}

function Field({ label, required, error, className, hint, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label required={required}>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      )}
      <FieldError message={error} />
    </div>
  )
}

interface PhoneInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  name: 'phone_mobile' | 'phone1' | 'phone2'
  invalid?: boolean
}

function PhoneInput({ control, name, invalid }: PhoneInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Input
          id={name}
          type="tel"
          inputMode="numeric"
          autoComplete={name === 'phone_mobile' ? 'tel-national' : 'off'}
          placeholder="(11) 99999-9999"
          leftIcon={<Phone className="h-4 w-4" />}
          invalid={invalid}
          value={formatPhone((field.value as string) ?? '')}
          onChange={(e) => field.onChange(formatPhone(e.target.value))}
          onBlur={field.onBlur}
          maxLength={16}
          ref={field.ref}
        />
      )}
    />
  )
}

interface ToggleRowProps {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function ToggleRow({ id, label, description, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <label htmlFor={id} className="flex flex-1 cursor-pointer items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-foreground)]">{label}</p>
        {description && (
          <p className="text-xs text-[var(--color-muted-foreground)]">{description}</p>
        )}
      </div>
    </label>
  )
}

function BmiDisplay({
  control,
  className,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  className?: string
}) {
  const weightStr = useWatch({ control, name: 'weight_kg' }) as string | undefined
  const heightStr = useWatch({ control, name: 'height_m' }) as string | undefined
  const bmi = calculateBmi(parseDecimal(weightStr), parseDecimal(heightStr))

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label>IMC (calculado)</Label>
      <div className="flex h-11 items-center gap-3 rounded-[10px] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-3.5">
        <Activity className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        <span className="text-sm font-medium text-[var(--color-foreground)]">
          {bmi !== null ? `${numberToDecimalString(bmi, 2)} kg/m²` : '—'}
        </span>
        {bmi !== null && (
          <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
            {classifyBmi(bmi)}
          </span>
        )}
      </div>
    </div>
  )
}

function classifyBmi(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso'
  if (bmi < 25) return 'Peso normal'
  if (bmi < 30) return 'Sobrepeso'
  if (bmi < 35) return 'Obesidade grau I'
  if (bmi < 40) return 'Obesidade grau II'
  return 'Obesidade grau III'
}

function FormFooter({
  onCancel,
  submitting,
  isEdit,
}: {
  onCancel: () => void
  submitting?: boolean
  isEdit: boolean
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 flex flex-col-reverse gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
        <Users className="h-3.5 w-3.5" />
        {isEdit
          ? 'CPF e data de nascimento permanecem fixos após o cadastro.'
          : 'Campos com * são obrigatórios.'}
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  )
}
