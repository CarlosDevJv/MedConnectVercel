-- Garante `appointment_waitlist` + RLS (para ambientes onde 20260206120000 não foi aplicada).
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
  CONSTRAINT appointment_waitlist_status_check CHECK (
    status IN ('waiting', 'offered', 'booked', 'cancelled')
  ),
  CONSTRAINT appointment_waitlist_appointment_type_check CHECK (
    appointment_type IS NULL
    OR appointment_type IN ('presencial', 'telemedicina')
  )
);

CREATE INDEX IF NOT EXISTS appointment_waitlist_doctor_idx ON public.appointment_waitlist (doctor_id);

CREATE INDEX IF NOT EXISTS appointment_waitlist_status_idx ON public.appointment_waitlist (status);

COMMENT ON TABLE public.appointment_waitlist IS 'Fila de espera para oferta de vagas';

ALTER TABLE public.appointment_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS appointment_waitlist_select_auth ON public.appointment_waitlist;

DROP POLICY IF EXISTS appointment_waitlist_insert_auth ON public.appointment_waitlist;

DROP POLICY IF EXISTS appointment_waitlist_update_auth ON public.appointment_waitlist;

DROP POLICY IF EXISTS appointment_waitlist_delete_auth ON public.appointment_waitlist;

CREATE POLICY appointment_waitlist_select_auth ON public.appointment_waitlist FOR SELECT TO authenticated USING (true);

CREATE POLICY appointment_waitlist_insert_auth ON public.appointment_waitlist FOR INSERT TO authenticated
WITH
  CHECK (true);

CREATE POLICY appointment_waitlist_update_auth ON public.appointment_waitlist FOR UPDATE TO authenticated USING (true)
WITH
  CHECK (true);

CREATE POLICY appointment_waitlist_delete_auth ON public.appointment_waitlist FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_waitlist TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_waitlist TO service_role;

-- PostgREST: atualiza schema cache para o novo objeto aparecer na API REST.
NOTIFY pgrst, 'reload schema';
