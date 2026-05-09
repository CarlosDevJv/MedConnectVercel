-- Prontuário: consultas clínicas consumidas em `GET /rest/v1/clinical_consultations` (features/emr).

CREATE TABLE IF NOT EXISTS public.clinical_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  doctor_id uuid,
  consultation_at timestamptz NOT NULL DEFAULT now(),
  anamnesis text,
  physical_exam text,
  diagnostic_hypotheses text,
  medical_conduct text,
  prescriptions text,
  requested_exams text,
  follow_up_at timestamptz,
  cid10 text,
  diagnoses text,
  evolution text,
  attachments_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE INDEX IF NOT EXISTS idx_clinical_consultations_patient ON public.clinical_consultations (patient_id);

CREATE INDEX IF NOT EXISTS idx_clinical_consultations_consultation_at ON public.clinical_consultations (consultation_at DESC);

COMMENT ON TABLE public.clinical_consultations IS 'Registros de consulta do prontuário (MediConnect EMR)';

ALTER TABLE public.clinical_consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinical_consultations_select_auth ON public.clinical_consultations;

DROP POLICY IF EXISTS clinical_consultations_insert_auth ON public.clinical_consultations;

DROP POLICY IF EXISTS clinical_consultations_update_auth ON public.clinical_consultations;

DROP POLICY IF EXISTS clinical_consultations_delete_auth ON public.clinical_consultations;

CREATE POLICY clinical_consultations_select_auth ON public.clinical_consultations FOR SELECT TO authenticated USING (true);

CREATE POLICY clinical_consultations_insert_auth ON public.clinical_consultations FOR INSERT TO authenticated
WITH
  CHECK (true);

CREATE POLICY clinical_consultations_update_auth ON public.clinical_consultations FOR UPDATE TO authenticated USING (true)
WITH
  CHECK (true);

CREATE POLICY clinical_consultations_delete_auth ON public.clinical_consultations FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_consultations TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_consultations TO service_role;
