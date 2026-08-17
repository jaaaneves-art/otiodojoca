-- Gerado por scripts/gerar-culturas-guia-seed.mjs a partir de
-- docs/camada-2/VOLUME_IV_DADOS_AGRICOLAS_EXTRAIDOS.md, cruzado com as
-- fases lunares por categoria de lib/calendario/tradicao.ts. Correr
-- depois de sql/AGENDA_AGRICOLA.sql. Campos sem dado na fonte ficam
-- NULL -- nada inventado; ver comentário "dicas" nas entradas incompletas.

INSERT INTO culturas_guia (
  nome, categoria, perene, ciclo_dias_min, ciclo_dias_max,
  semeadura_fase_lunar, poda_fase_lunar,
  meses_semeadura, meses_colheita, meses_poda,
  temp_otima, dicas
) VALUES
  ('Alface', 'Hortaliça', false, 30, 50, 'crescente', NULL, 'Janeiro, Fevereiro, Setembro', 'Fevereiro, Abril, Novembro', NULL, 15, NULL),
  ('Tomate', 'Hortaliça', false, 60, 80, 'crescente', NULL, 'Março (alfobre)', 'Julho a Setembro', NULL, 22.5, NULL),
  ('Pimento', 'Hortaliça', false, 70, 90, 'crescente', NULL, 'Março (alfobre)', 'Julho a Setembro', NULL, 22.5, NULL),
  ('Beringela', 'Hortaliça', false, 70, 85, 'crescente', NULL, 'Março (alfobre)', 'Julho a Setembro', NULL, 25, NULL),
  ('Cebola', 'Hortaliça', false, 120, 150, 'minguante', NULL, 'Janeiro, Fevereiro', 'Maio, Junho', NULL, 16, NULL),
  ('Batata', 'Hortaliça', false, 70, 90, 'minguante', NULL, 'Março', 'Junho', NULL, 17.5, NULL),
  ('Cenoura', 'Hortaliça', false, 60, 80, 'minguante', NULL, 'Janeiro, Fevereiro', 'Abril, Maio', NULL, 17.5, NULL),
  ('Beterraba', 'Hortaliça', false, 70, 90, 'minguante', NULL, 'Janeiro, Fevereiro, Setembro', 'Abril a Junho, Novembro', NULL, 17.5, NULL),
  ('Rabanete', 'Hortaliça', false, 30, 40, 'minguante', NULL, 'Janeiro, Fevereiro, Setembro', 'Fevereiro a Abril, Outubro, Novembro', NULL, 15, NULL),
  ('Espinafre', 'Hortaliça', false, 40, 50, 'crescente', NULL, 'Janeiro, Fevereiro, Setembro', 'Fevereiro a Abril, Outubro, Novembro', NULL, 12.5, NULL),
  ('Couve / Repolho', 'Hortaliça', false, 90, 120, 'crescente', NULL, 'Fevereiro, Setembro', 'Maio, Outubro, Novembro', NULL, 16.5, NULL),
  ('Couve-flor', 'Hortaliça', false, 90, 120, 'crescente', NULL, 'Fevereiro, Setembro', 'Abril, Maio, Outubro, Novembro', NULL, 17.5, NULL),
  ('Melancia', 'Hortaliça', false, 70, 100, 'crescente', NULL, 'Março, Abril', 'Julho, Agosto', NULL, 27.5, NULL),
  ('Melão', 'Hortaliça', false, 70, 90, 'crescente', NULL, 'Março, Abril', 'Julho, Agosto', NULL, 27.5, NULL),
  ('Abóbora', 'Hortaliça', false, 90, 120, 'crescente', NULL, 'Abril, Maio', 'Agosto, Setembro', NULL, 22.5, NULL),
  ('Nabo', 'Hortaliça', false, NULL, NULL, 'minguante', NULL, NULL, 'Outubro', NULL, NULL, 'Volume_IV só cita este dia em texto corrido (sementeira janeiro, colheita outubro); sem ciclo em dias nem temperatura.'),
  ('Salsa', 'Hortaliça', false, NULL, NULL, 'crescente', NULL, 'Janeiro', NULL, NULL, NULL, 'Volume_IV só cita sementeira de janeiro em texto corrido; sem ciclo em dias, colheita nem temperatura.'),
  ('Coentro', 'Hortaliça', false, NULL, NULL, 'crescente', NULL, 'Janeiro', NULL, NULL, NULL, 'Volume_IV só cita sementeira de janeiro em texto corrido; sem ciclo em dias, colheita nem temperatura.'),
  ('Agrião', 'Hortaliça', false, NULL, NULL, 'crescente', NULL, 'Janeiro', NULL, NULL, NULL, 'Volume_IV só cita sementeira de janeiro em texto corrido; sem ciclo em dias, colheita nem temperatura.'),
  ('Feijão', 'Legume', false, 60, 80, 'crescente', NULL, 'Março, Abril', 'Julho, Agosto', NULL, NULL, NULL),
  ('Ervilha', 'Legume', false, 60, 70, 'crescente', NULL, 'Janeiro, Fevereiro', 'Abril, Maio', NULL, NULL, NULL),
  ('Grão', 'Legume', false, 120, 150, 'crescente', NULL, 'Março, Abril', 'Agosto, Setembro', NULL, NULL, 'Volume_IV indica ciclo "120+ dias"; o máximo aqui (150) é uma estimativa a validar.'),
  ('Trigo', 'Cereal', false, 180, 200, 'crescente', NULL, 'Outubro, Novembro', 'Junho, Julho', NULL, NULL, NULL),
  ('Cevada', 'Cereal', false, 160, 180, 'crescente', NULL, 'Outubro, Novembro', 'Maio, Junho', NULL, NULL, NULL),
  ('Centeio', 'Cereal', false, 180, 200, 'crescente', NULL, 'Outubro, Novembro', 'Junho, Julho', NULL, NULL, NULL),
  ('Milho', 'Cereal', false, 90, 120, 'crescente', NULL, 'Abril, Maio', 'Agosto, Setembro', NULL, NULL, NULL),
  ('Pessegueiro', 'Fruteira', true, NULL, NULL, NULL, 'minguante', NULL, 'Julho, Agosto', 'Janeiro, Fevereiro', NULL, NULL),
  ('Ameixieira', 'Fruteira', true, NULL, NULL, NULL, 'minguante', NULL, 'Junho, Julho', 'Janeiro, Fevereiro', NULL, NULL),
  ('Macieira', 'Fruteira', true, NULL, NULL, NULL, 'minguante', NULL, 'Setembro, Outubro', 'Janeiro a Março', NULL, NULL),
  ('Pereira', 'Fruteira', true, NULL, NULL, NULL, 'minguante', NULL, 'Agosto, Setembro', 'Janeiro a Março', NULL, NULL),
  ('Figueira', 'Fruteira', true, NULL, NULL, NULL, 'minguante', NULL, 'Agosto, Setembro', 'Janeiro', NULL, NULL),
  ('Diospireiro', 'Fruteira', true, NULL, NULL, NULL, 'minguante', NULL, 'Outubro, Novembro', 'Janeiro', NULL, NULL),
  ('Videira', 'Fruteira', true, NULL, NULL, NULL, 'minguante', NULL, 'Setembro', 'Janeiro a Março', NULL, NULL),
  ('Oliveira', 'Fruteira', true, NULL, NULL, NULL, 'minguante', NULL, 'Outubro, Novembro', 'Outubro a Janeiro', NULL, NULL),
  ('Framboesa', 'Fruteira', true, NULL, NULL, NULL, NULL, NULL, 'Junho', 'Janeiro', NULL, 'Volume_IV não especifica a fase lunar da poda para esta cultura.'),
  ('Morango', 'Fruteira', true, NULL, NULL, NULL, NULL, NULL, 'Maio, Junho', NULL, NULL, 'Volume_IV indica poda "conforme a variedade", sem mês nem fase lunar definidos.'),
  ('Hortelã', 'Aromática', true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Volume_IV só cita o nome na lista-resumo; sem ciclo, meses nem temperatura.'),
  ('Tomilho', 'Aromática', true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Volume_IV só cita o nome na lista-resumo; sem ciclo, meses nem temperatura.'),
  ('Abelhas', 'Apicultura', true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Atividade sazonal (Volume_IV): repouso/consumo de mel em janeiro-fevereiro; despertar em março; floração e pico de mel de abril a setembro; preparação de inverno em outubro-novembro.')
ON CONFLICT (nome) DO NOTHING;
