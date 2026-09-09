-- RETAILING (mercearias, mini mercados, supermercados, hipermercados)
-- CORRIGIDO 08/09/2026 — a versão anterior inseria em
-- `marketplace_categories(slug, nome, icone, descricao, cor_tema)`, uma
-- tabela que na prática não é usada pela FK de marketplace_ads.category_id
-- (essa FK aponta para `categories`, não para `marketplace_categories`).
-- Ver docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md.
--
-- Corre isto primeiro no ambiente de teste local (nunca direto em
-- produção): supabase db reset --local (ou supabase migration up --local)

-- 1. Categorias de retailing em `categories` (type='marketplace')
INSERT INTO categories (name, slug, type, icon, description)
SELECT v.name, v.slug, 'marketplace', v.icon, v.description
FROM (VALUES
  ('Mercearia', 'retailing-mercearia', '🛒', 'Mercearias e lojas pequenas de produtos alimentares'),
  ('Mini Mercado', 'retailing-mini-mercado', '🏪', 'Mini mercados e lojas pequenas-médias de conveniência'),
  ('Supermercado', 'retailing-supermercado', '🏬', 'Supermercados e lojas médias com múltiplos departamentos'),
  ('Hipermercado', 'retailing-hipermercado', '🏢', 'Hipermercados e grande distribuição com ampla variedade')
) AS v(name, slug, icon, description)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = v.slug);

-- 2. Índice para pesquisa por departamentos/serviços/métodos de pagamento
--    (não filtrado por categoria — os IDs são atribuídos pela BD e não são
--    conhecidos à partida; o índice cobre todos os anúncios)
CREATE INDEX IF NOT EXISTS idx_marketplace_ads_details_departamentos
  ON marketplace_ads USING GIN ((details -> 'departamentos'));

CREATE INDEX IF NOT EXISTS idx_marketplace_ads_details_cae
  ON marketplace_ads ((details ->> 'cae'));

-- Nota: `marketplace_ads` já tem um trigger genérico
-- (marketplace_ads_updated_at) que mantém `updated_at` para todos os
-- anúncios — não é preciso criar um trigger por módulo.
