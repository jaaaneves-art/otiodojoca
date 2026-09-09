-- MEDIAÇÃO DE SEGUROS & CRÉDITOS
-- CORRIGIDO 08/09/2026 — ver docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md
-- Corre no ambiente de teste local antes de produção.

INSERT INTO categories (name, slug, type, icon, description)
SELECT v.name, v.slug, 'marketplace', v.icon, v.description
FROM (VALUES
  ('Mediação de Seguros', 'mediacao-seguros', '🛡️', 'Corretores e agentes de seguros'),
  ('Mediação de Créditos', 'mediacao-creditacao', '💳', 'Consultores e assessores de crédito')
) AS v(name, slug, icon, description)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = v.slug);

-- Nota: o índice em (details -> 'especialidades') já é criado pela
-- migration do Consultórios (mesma expressão, cobre todos os anúncios) —
-- não se repete aqui para evitar um índice duplicado.
CREATE INDEX IF NOT EXISTS idx_marketplace_ads_details_parceiros
  ON marketplace_ads USING GIN ((details -> 'parceiros'));
