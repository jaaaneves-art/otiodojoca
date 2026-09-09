-- BELEZA (unhas, cabeleireiro, esteticista, barba & conexos)
-- CORRIGIDO 08/09/2026 — ver docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md
-- Corre no ambiente de teste local antes de produção.

INSERT INTO categories (name, slug, type, icon, description)
SELECT v.name, v.slug, 'marketplace', v.icon, v.description
FROM (VALUES
  ('Serviços de Unhas', 'beleza-unhas', '💅', 'Manicure, pedicure, gel, acrílico'),
  ('Cabeleireiro', 'beleza-cabelo', '💇', 'Cortes, coloração, tratamentos capilares'),
  ('Esteticista', 'beleza-esteticista', '✨', 'Depilação, limpeza facial, massagem'),
  ('Barba & Serviços Conexos', 'beleza-barba-conexos', '🧔', 'Corte barba, barbear, penteado')
) AS v(name, slug, icon, description)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = v.slug);

CREATE INDEX IF NOT EXISTS idx_marketplace_ads_details_servicos
  ON marketplace_ads USING GIN ((details -> 'servicos'));
