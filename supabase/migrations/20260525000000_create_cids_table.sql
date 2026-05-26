-- Migração para criação da tabela de CIDs
CREATE TABLE IF NOT EXISTS public.cids (
  code text PRIMARY KEY,
  name text NOT NULL
);

ALTER TABLE public.cids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cids_select_auth ON public.cids;
CREATE POLICY cids_select_auth ON public.cids FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.cids TO authenticated;
GRANT SELECT ON public.cids TO service_role;

INSERT INTO public.cids (code, name) VALUES
('A09', 'Diarreia e gastroenterite de origem infecciosa presumida'),
('B34', 'Doenças por vírus, de localização não especificada'),
('E11', 'Diabetes mellitus não-insulinodependente'),
('E78', 'Distúrbios do metabolismo de lipoproteínas e outras lipidemias'),
('F32', 'Episódios depressivos'),
('F41', 'Outros transtornos ansiosos'),
('G43', 'Enxaqueca'),
('I10', 'Hipertensão essencial (primária)'),
('J00', 'Nasofaringite aguda (resfriado comum)'),
('J03', 'Amigdalite aguda'),
('J30', 'Rinite alérgica e vasomotora'),
('J45', 'Asma'),
('K29', 'Gastrite e duodenite'),
('M54', 'Dorsalgia (dor nas costas)'),
('N39', 'Outros transtornos do aparelho urinário (infecção urinária)'),
('R50', 'Febre de origem desconhecida'),
('R51', 'Cefaleia'),
('Z00', 'Exame geral e investigação de pessoas sem queixas')
ON CONFLICT (code) DO NOTHING;
