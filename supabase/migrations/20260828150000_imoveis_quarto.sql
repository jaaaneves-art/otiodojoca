-- ============================================================
-- IMÓVEIS — categoria "Quarto" (arrendamento/partilha de casa/estudantes)
-- ============================================================
-- Parte do alargamento de Imóveis pedido em 28/08/2026 (arrendamento,
-- permuta, troca por companhia, quartos/partilha/estudantes — ver
-- claude/IMOVEIS-ARRENDAMENTO-PERMUTA-QUARTO-20260828.md no projeto
-- Claude). Os novos tipos de anúncio ("arrendamento", "permuta",
-- "companhia") não precisam de migration nenhuma — marketplace_ads.type
-- é texto livre, sem CHECK a restringir valores (só price_type tem, e
-- continua a aceitar null para os tipos sem preço fixo). "Para estudantes"
-- e "vagas disponíveis" também não precisam de coluna nova — vivem em
-- details (jsonb), tal como área/quartos/WC já vivem. Esta migration só
-- acrescenta a categoria em falta: hoje só é possível anunciar um imóvel
-- inteiro (Apartamento/Moradia/...), não um quarto avulso dentro de uma
-- casa partilhada.

insert into "public"."categories" (name, slug, type, icon, sort_order) values
  ('Quarto', 'imoveis-quarto', 'imoveis', '🛏️', 10)
on conflict (slug) do nothing;
