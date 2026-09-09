-- Quatro tabelas do domínio das culturas estavam sem RLS.

-- Catálogo: leitura pública, escrita só por service role
ALTER TABLE public.culturas_aptidoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY culturas_aptidoes_read_public ON public.culturas_aptidoes
  FOR SELECT USING (true);

ALTER TABLE public.culturas_produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY culturas_produtos_read_public ON public.culturas_produtos
  FOR SELECT USING (true);

-- Backups de agosto: RLS sem policies = fechados a tudo menos service
-- role. Por decidir se saem de vez.
ALTER TABLE public.culturas_guia_backup_20260820 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.culturas_guia_backup_fase7_20260820 ENABLE ROW LEVEL SECURITY;
