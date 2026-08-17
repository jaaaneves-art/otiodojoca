-- Adicional a sql/culturas_guia_seed.sql: 12 culturas novas (a Cevada do
-- ficheiro original era duplicada -- já existe em culturas_guia_seed.sql
-- com o mesmo ciclo/meses -- por isso foi removida daqui).
--
-- Correções face ao ficheiro recebido (~/culturas_guia_adicional_final.sql):
-- - categorias uniformizadas para Title Case, consistente com as 6
--   categorias já semeadas (Hortaliça, Legume, Cereal, Fruteira,
--   Aromática, Apicultura) -- o ficheiro original tinha minúsculas.
-- - Batata-doce: não havia categoria "Tubérculo" nas já existentes;
--   mapeada para "Hortaliça", mesmo critério usado para Batata, Cenoura,
--   Beterraba no seed original.
-- - ON CONFLICT (nome) DO NOTHING acrescentado, como no seed original,
--   para correr em segurança mesmo que algum nome já exista.
--
-- Nota de proveniência: estas 10 culturas não vêm de
-- docs/camada-2/VOLUME_IV_DADOS_AGRICOLAS_EXTRAIDOS.md -- fonte externa
-- não verificada por este processo.

INSERT INTO culturas_guia (nome, categoria, ciclo_dias_min, ciclo_dias_max, meses_semeadura, meses_colheita, dicas)
VALUES
  ('Tremoço', 'Legume', 120, 150, 'Setembro, Outubro', 'Junho, Julho', 'Cultura de cobertura ou consumo; semeadura no outono'),
  ('Corgete', 'Hortaliça', 45, 60, 'Abril, Maio, Junho', 'Junho, Julho, Agosto', 'Colheita precoce enquanto macio; ciclo curto'),
  ('Batata-doce', 'Hortaliça', 90, 150, 'Abril, Maio', 'Setembro, Outubro, Novembro', 'Plantação de estolhos; colheita após geada'),
  ('Kiwi', 'Fruteira', 365, 1095, 'Primavera (mudas)', 'Setembro, Outubro, Novembro', 'Planta perene; primeiros frutos após 2-3 anos; necessita suporte'),
  ('Amora', 'Fruteira', 365, 730, 'Primavera (mudas)', 'Julho, Agosto, Setembro', 'Arbustiva; frutos anuais; poda anual recomendada'),
  ('Salva', 'Aromática', 60, 90, 'Primavera', 'Primavera, Verão', 'Perene; colheita contínua de folhas'),
  ('Alecrim', 'Aromática', 90, 180, 'Primavera', 'Primavera, Verão, Outono', 'Perene lenhoso; robusto e tolerante à seca'),
  ('Orégão', 'Aromática', 60, 90, 'Primavera', 'Primavera, Verão', 'Perene; colheita contínua'),
  ('Manjerona', 'Aromática', 50, 80, 'Primavera', 'Verão', 'Anual; gosto delicado, usado seco ou fresco'),
  ('Girassol', 'Cereal', 90, 120, 'Abril, Maio', 'Agosto, Setembro', 'Flores grandes; sementes para óleo ou consumo directo; robusto'),
  ('Laranjeira', 'Fruteira', 365, 1825, 'Primavera (mudas)', 'Outubro, Novembro, Dezembro', 'Árvore perene; flor de laranjeira em Março; frutos no outono/inverno'),
  ('Limoeiro', 'Fruteira', 365, 1095, 'Primavera (mudas)', 'Setembro a Junho (contínuo)', 'Árvore perene; produção contínua; flores e frutos simultaneamente; tolerante à secura')
ON CONFLICT (nome) DO NOTHING;
