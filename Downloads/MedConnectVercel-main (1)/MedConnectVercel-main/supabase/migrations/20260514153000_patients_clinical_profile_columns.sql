-- Campos opcionais usados pelo formulário / PATCH REST em `patients` (alinha ao front + types).

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS allergies text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medications_in_use text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS chronic_conditions text;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS insurance_company text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS insurance_plan text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS insurance_member_number text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS insurance_card_valid_until text;

NOTIFY pgrst, 'reload schema';
