-- Extensões de agenda, fila de espera e contato preferido (MediConnect).
-- Revise políticas RLS no Supabase após aplicar (espelhe `appointments` / `patients`).

-- Preferência de contato no cadastro do paciente
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS preferred_contact text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patients_preferred_contact_check'
  ) THEN
    ALTER TABLE public.patients
      ADD CONSTRAINT patients_preferred_contact_check
      CHECK (preferred_contact IS NULL OR preferred_contact IN ('phone', 'sms', 'email', 'whatsapp'));
  END IF;
END $$;

-- Campos adicionais nos agendamentos
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS appointment_type text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_appointment_type_check'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_appointment_type_check
      CHECK (appointment_type IS NULL OR appointment_type IN ('presencial', 'telemedicina'));
  END IF;
END $$;

-- Status inclui falta (no-show)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_status_check'
  ) THEN
    ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
  END IF;
END $$;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- Fila de espera
CREATE TABLE IF NOT EXISTS public.appointment_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors (id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  appointment_type text,
  notes text,
  window_start date NOT NULL,
  window_end date,
  status text NOT NULL DEFAULT 'waiting',
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT appointment_waitlist_status_check
    CHECK (status IN ('waiting', 'offered', 'booked', 'cancelled')),
  CONSTRAINT appointment_waitlist_appointment_type_check
    CHECK (appointment_type IS NULL OR appointment_type IN ('presencial', 'telemedicina'))
);

CREATE INDEX IF NOT EXISTS appointment_waitlist_doctor_idx ON public.appointment_waitlist (doctor_id);
CREATE INDEX IF NOT EXISTS appointment_waitlist_status_idx ON public.appointment_waitlist (status);

COMMENT ON TABLE public.appointment_waitlist IS 'Fila de espera para oferta de vagas';
