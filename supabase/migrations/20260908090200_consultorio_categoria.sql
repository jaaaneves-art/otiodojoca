-- CONSULTÓRIOS MÉDICOS — migration criada de raiz (o módulo original nunca
-- teve migration própria; gravava uma categoria "consultorio-medico" em
-- texto livre que não existia em lado nenhum).
-- Ver docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md
-- Corre no ambiente de teste local antes de produção.

INSERT INTO categories (name, slug, type, icon, description)
SELECT 'Consultório Médico', 'consultorio-medico', 'marketplace', '🩺', 'Consultórios e clínicas médicas'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'consultorio-medico');

CREATE INDEX IF NOT EXISTS idx_marketplace_ads_details_especialidades
  ON marketplace_ads USING GIN ((details -> 'especialidades'));
