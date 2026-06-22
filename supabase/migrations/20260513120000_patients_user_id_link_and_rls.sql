-- Pacientes: vínculo auth.users + trigger em novo signup + RLS (linha própria vs equipe).
-- Backfill: associa user_id por email normalizado onde ainda NULL.

-- 1) Coluna e índice único parcial (um auth user → no máximo um patient)
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS patients_user_id_unique
  ON public.patients (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS patients_email_lower_idx
  ON public.patients (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';

-- 2) Helpers JWT (roles em array ou string; metadata user ou app)
CREATE OR REPLACE FUNCTION public.jwt_role_texts()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_user jsonb;
  raw_app jsonb;
  out text[] := ARRAY[]::text[];
BEGIN
  raw_user := COALESCE(auth.jwt()->'user_metadata', '{}'::jsonb);
  raw_app := COALESCE(auth.jwt()->'app_metadata', '{}'::jsonb);

  IF raw_user ? 'roles' THEN
    IF jsonb_typeof(raw_user->'roles') = 'array' THEN
      out := out || ARRAY(SELECT jsonb_array_elements_text(raw_user->'roles'));
    ELSIF jsonb_typeof(raw_user->'roles') = 'string' THEN
      out := array_append(out, trim((raw_user->>'roles')));
    END IF;
  END IF;
  IF raw_user ? 'role' AND jsonb_typeof(raw_user->'role') = 'string' THEN
    out := array_append(out, trim(raw_user->>'role'));
  END IF;

  IF raw_app ? 'roles' THEN
    IF jsonb_typeof(raw_app->'roles') = 'array' THEN
      out := out || ARRAY(SELECT jsonb_array_elements_text(raw_app->'roles'));
    ELSIF jsonb_typeof(raw_app->'roles') = 'string' THEN
      out := array_append(out, trim((raw_app->>'roles')));
    END IF;
  END IF;
  IF raw_app ? 'role' AND jsonb_typeof(raw_app->'role') = 'string' THEN
    out := array_append(out, trim(raw_app->>'role'));
  END IF;

  RETURN ARRAY(SELECT DISTINCT lower(trim(u)) FROM unnest(out) AS u WHERE trim(u) <> '');
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_patients_as_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(public.jwt_role_texts()) AS r(role_norm)
    WHERE r.role_norm IN ('admin', 'gestor', 'medico', 'médico', 'secretaria', 'secretária')
  )
  OR EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.user_id IS NOT NULL AND d.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_delete_patient_record()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(public.jwt_role_texts()) AS r(role_norm)
    WHERE r.role_norm IN ('admin', 'secretaria', 'secretária')
  );
$$;

REVOKE ALL ON FUNCTION public.jwt_role_texts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jwt_role_texts() TO authenticated;

REVOKE ALL ON FUNCTION public.can_access_patients_as_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_patients_as_staff() TO authenticated;

REVOKE ALL ON FUNCTION public.can_delete_patient_record() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_delete_patient_record() TO authenticated;

-- 3) Trigger: novo usuário em auth.users → preenche user_id em patient existente (email ou CPF)
CREATE OR REPLACE FUNCTION public.link_patients_row_to_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm_email text;
  cpf_digits text;
  pid uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.patients p WHERE p.user_id = NEW.id LIMIT 1
  ) THEN
    RETURN NEW;
  END IF;

  IF NEW.email IS NOT NULL AND length(trim(NEW.email)) > 0 THEN
    norm_email := lower(trim(NEW.email));
    SELECT p.id INTO pid
    FROM public.patients p
    WHERE p.user_id IS NULL
      AND lower(trim(p.email)) = norm_email
    ORDER BY p.created_at ASC NULLS LAST
    LIMIT 1;

    IF pid IS NOT NULL THEN
      UPDATE public.patients SET user_id = NEW.id WHERE id = pid AND user_id IS NULL;
      RETURN NEW;
    END IF;
  END IF;

  cpf_digits := regexp_replace(COALESCE(NEW.raw_user_meta_data->>'cpf', ''), '\D', '', 'g');
  IF length(cpf_digits) < 11 THEN
    cpf_digits := regexp_replace(COALESCE(NEW.raw_app_meta_data->>'cpf', ''), '\D', '', 'g');
  END IF;

  IF length(cpf_digits) = 11 THEN
    SELECT p.id INTO pid
    FROM public.patients p
    WHERE p.user_id IS NULL
      AND regexp_replace(COALESCE(p.cpf, ''), '\D', '', 'g') = cpf_digits
    ORDER BY p.created_at ASC NULLS LAST
    LIMIT 1;

    IF pid IS NOT NULL THEN
      UPDATE public.patients SET user_id = NEW.id WHERE id = pid AND user_id IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_link_patient ON auth.users;

CREATE TRIGGER on_auth_user_created_link_patient
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.link_patients_row_to_new_auth_user();

-- 4) Backfill por email (um paciente por usuário auth; primeiro paciente mais antigo por email)
WITH pick AS (
  SELECT DISTINCT ON (u.id)
    p.id AS patient_id,
    u.id AS auth_uid
  FROM auth.users u
  INNER JOIN public.patients p
    ON u.email IS NOT NULL
    AND length(trim(u.email)) > 0
    AND lower(trim(p.email)) = lower(trim(u.email))
    AND p.user_id IS NULL
  ORDER BY u.id, p.created_at ASC NULLS LAST
),
pick_filtered AS (
  SELECT patient_id, auth_uid
  FROM pick pk
  WHERE NOT EXISTS (
    SELECT 1 FROM public.patients p2 WHERE p2.user_id = pk.auth_uid AND p2.id <> pk.patient_id
  )
)
UPDATE public.patients pat
SET user_id = pf.auth_uid
FROM pick_filtered pf
WHERE pat.id = pf.patient_id;

-- 5) RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patients_select_own ON public.patients;
DROP POLICY IF EXISTS patients_select_staff ON public.patients;
DROP POLICY IF EXISTS patients_insert_staff ON public.patients;
DROP POLICY IF EXISTS patients_update_staff ON public.patients;
DROP POLICY IF EXISTS patients_delete_restricted ON public.patients;

CREATE POLICY patients_select_own ON public.patients
  FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY patients_select_staff ON public.patients
  FOR SELECT TO authenticated
  USING (public.can_access_patients_as_staff());

CREATE POLICY patients_insert_staff ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_patients_as_staff());

CREATE POLICY patients_update_staff ON public.patients
  FOR UPDATE TO authenticated
  USING (public.can_access_patients_as_staff())
  WITH CHECK (public.can_access_patients_as_staff());

CREATE POLICY patients_delete_restricted ON public.patients
  FOR DELETE TO authenticated
  USING (public.can_delete_patient_record());
