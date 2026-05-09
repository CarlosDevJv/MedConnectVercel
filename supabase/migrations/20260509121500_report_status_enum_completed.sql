-- Alinha o Postgres ao OpenAPI RiseUP (reports.status ∈ draft | completed).
-- Doc: https://do5wegrct3.apidog.io/listar-relat%C3%B3rios-m%C3%A9dicos-23131760e0
--
-- Resolve: invalid input value for enum report_status: "completed".
-- PostgreSQL ≥ 15: ADD VALUE IF NOT EXISTS. Mais antigo: remova IF NOT EXISTS e aplique valores em falta à mão.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'report_status'
  ) THEN
    CREATE TYPE public.report_status AS ENUM ('draft', 'completed');
  END IF;
END $$;

ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'draft';

ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'completed';
