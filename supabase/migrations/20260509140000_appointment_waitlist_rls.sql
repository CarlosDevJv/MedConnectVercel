-- RLS e permissões REST para appointment_waitlist (fila de espera).
-- Alinha com clinical_consultations / reports (usuários authenticated).

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
