-- Relatórios médicos (lista / edição em `features/reports`).
-- Sem esta tabela, o PostgREST retorna erro (ex.: tabela não exposta ao schema ou inexistente) e a UI mostra falha ao carregar.

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text,
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'draft',
  exam text,
  requested_by text,
  cid_code text,
  diagnosis text,
  conclusion text,
  content_html text,
  content_json jsonb,
  hide_date boolean DEFAULT false,
  hide_signature boolean DEFAULT false,
  due_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_status_check CHECK (status IN ('draft', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_reports_patient_id ON public.reports (patient_id);

CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports (status, created_at DESC);

COMMENT ON TABLE public.reports IS 'Laudos médicos; exposto como /rest/v1/reports para o MediConnect';

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_select_auth ON public.reports;

DROP POLICY IF EXISTS reports_insert_auth ON public.reports;

DROP POLICY IF EXISTS reports_update_auth ON public.reports;

DROP POLICY IF EXISTS reports_delete_auth ON public.reports;

-- Baseline permissivo para `authenticated`; restrinja por papel (ex.: `medico` vs outros) no painel Supabase em produção.
CREATE POLICY reports_select_auth ON public.reports FOR SELECT TO authenticated USING (true);

CREATE POLICY reports_insert_auth ON public.reports FOR INSERT TO authenticated
WITH
  CHECK (true);

CREATE POLICY reports_update_auth ON public.reports FOR UPDATE TO authenticated USING (true)
WITH
  CHECK (true);

CREATE POLICY reports_delete_auth ON public.reports FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO service_role;
