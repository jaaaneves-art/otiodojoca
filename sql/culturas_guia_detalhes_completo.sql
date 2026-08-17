-- ============================================================
-- CULTURAS GUIA — INFORMAÇÃO DETALHADA (ATUALIZAÇÃO)
-- ============================================================
-- Data: 17 ago 2026
-- Adiciona: nome_cientifico, temp_min_germinacao, temp_otima, 
--          humidade_ideal, descricao, associacoes_beneficas
--
-- INSTRUÇÕES:
-- 1. Corre DEPOIS de culturas_guia_seed.sql e culturas_guia_seed_adicional.sql
-- 2. Supabase SQL Editor → New Query
-- 3. Cola este ficheiro
-- 4. Clica: Run
--
-- CORREÇÕES face ao ficheiro recebido (~/culturas_guia_detalhes_completo.sql):
-- - 'Couve' e 'Repolho' eram 2 UPDATE separados; a minha tabela só tem
--   UMA linha "Couve / Repolho" (ver culturas_guia_seed.sql). Fundidos
--   num único UPDATE, mantendo o binómio de "Couve".
-- - 'Maçã' → 'Macieira' e 'Pera' → 'Pereira': as minhas fruteiras estão
--   nomeadas pela árvore, não pelo fruto.
-- - 'Manjericão' nunca tinha sido semeado (o UPDATE afetava 0 linhas) --
--   substituído por um INSERT com os mesmos dados de detalhe, mais
--   ciclo_dias_min/max e meses de semeadura/colheita estimados por mim
--   (não vêm da fonte deste ficheiro nem do Volume_IV).

-- ============================================================
-- HORTALIÇAS
-- ============================================================

UPDATE culturas_guia SET
  nome_cientifico = 'Lactuca sativa',
  temp_min_germinacao = 4,
  temp_otima = 18,
  humidade_ideal = '60-70%',
  descricao = 'Hortaliça de folha com ciclo curto. Prefere climas temperados. Sensível ao calor (monta em flor acima dos 25°C).',
  associacoes_beneficas = 'Beterraba, Cenoura, Morango, Rabanete'
WHERE nome = 'Alface';

UPDATE culturas_guia SET
  nome_cientifico = 'Solanum lycopersicum',
  temp_min_germinacao = 12,
  temp_otima = 24,
  humidade_ideal = '60-80%',
  descricao = 'Solanácea termófila. Alfobre em Março, transplante em Maio. Requer tutores ou suportes. Sensível a doenças fúngicas em humidade alta.',
  associacoes_beneficas = 'Manjericão, Cenoura, Cebola, Salsa'
WHERE nome = 'Tomate';

UPDATE culturas_guia SET
  nome_cientifico = 'Capsicum annuum',
  temp_min_germinacao = 15,
  temp_otima = 25,
  humidade_ideal = '60-80%',
  descricao = 'Solanácea termófila. Ciclo longo (70-90 dias). Alfobre em Março, colheita de Agosto em diante. Exigente em rega.',
  associacoes_beneficas = 'Tomate, Cebola, Espinafre'
WHERE nome = 'Pimento';

UPDATE culturas_guia SET
  nome_cientifico = 'Solanum melongena',
  temp_min_germinacao = 15,
  temp_otima = 26,
  humidade_ideal = '60-80%',
  descricao = 'Solanácea muito termófila. Exigente em temperatura e rega. Prefere solo fértil e bem drenado.',
  associacoes_beneficas = 'Tomate, Pimento'
WHERE nome = 'Beringela';

UPDATE culturas_guia SET
  nome_cientifico = 'Allium cepa',
  temp_min_germinacao = 8,
  temp_otima = 20,
  humidade_ideal = '60-70%',
  descricao = 'Bolbo com ciclo longo (120-150 dias). Variedades de dia curto (Portugal: até 14h luz). Plantação de semente ou bolbilho. Colheita quando seca o folhado.',
  associacoes_beneficas = 'Cenoura, Beterraba, Alface, Morango'
WHERE nome = 'Cebola';

UPDATE culturas_guia SET
  nome_cientifico = 'Solanum tuberosum',
  temp_min_germinacao = 5,
  temp_otima = 18,
  humidade_ideal = '70-80%',
  descricao = 'Tubérculo. Plantação de "seed potato" em Março. Ciclo 70-90 dias. Colheita quando secam as folhas. Cuidado com míldio (Phytophthora).',
  associacoes_beneficas = 'Milho, Feijão, Alface'
WHERE nome = 'Batata';

UPDATE culturas_guia SET
  nome_cientifico = 'Daucus carota subsp. sativus',
  temp_min_germinacao = 5,
  temp_otima = 18,
  humidade_ideal = '60-70%',
  descricao = 'Raiz carnuda. Germinação lenta (2-3 semanas). Requer desbaste. Colheita com 8-10 cm diâmetro. Tolerante ao frio.',
  associacoes_beneficas = 'Cebola, Alface, Tomate, Ervilha'
WHERE nome = 'Cenoura';

UPDATE culturas_guia SET
  nome_cientifico = 'Beta vulgaris subsp. vulgaris',
  temp_min_germinacao = 5,
  temp_otima = 18,
  humidade_ideal = '60-70%',
  descricao = 'Raiz com folhas comestíveis. Ciclo 70-90 dias. Tolerante à seca. Colheita de raízes com 5-8 cm diâmetro.',
  associacoes_beneficas = 'Alface, Cebola, Feijão'
WHERE nome = 'Beterraba';

UPDATE culturas_guia SET
  nome_cientifico = 'Raphanus sativus',
  temp_min_germinacao = 5,
  temp_otima = 15,
  humidade_ideal = '60-70%',
  descricao = 'Raiz pequena, ciclo muito curto (30-40 dias). Colheita precoce. Pode ser cultivado em sucessão contínua (plantações escalonadas).',
  associacoes_beneficas = 'Alface, Cenoura, Melancia'
WHERE nome = 'Rabanete';

UPDATE culturas_guia SET
  nome_cientifico = 'Spinacia oleracea',
  temp_min_germinacao = 5,
  temp_otima = 15,
  humidade_ideal = '70-80%',
  descricao = 'Folhagem comestível. Ciclo curto (40-50 dias). Preferência por clima fresco. Monta facilmente em calor e dias longos.',
  associacoes_beneficas = 'Tomate, Rabanete, Morango'
WHERE nome = 'Espinafre';

-- Fundido com o UPDATE original de 'Repolho' (linha 154 do ficheiro
-- recebido): a minha tabela só tem UMA linha "Couve / Repolho" (ver
-- sql/culturas_guia_seed.sql), não duas. Mantive o binómio de "Couve"
-- (Brassica oleracea var. acephala) por ser o primeiro nome da entrada
-- combinada; "var. capitata" (repolho de cabeça) descartado para não
-- inventar uma fusão taxonómica que a fonte não deu.
UPDATE culturas_guia SET
  nome_cientifico = 'Brassica oleracea var. acephala',
  temp_min_germinacao = 5,
  temp_otima = 18,
  humidade_ideal = '70-80%',
  descricao = 'Brassicácea de folha. Ciclo longo (90-120 dias). Tolerante ao frio (melhora após geadas). Sensível a traças da couve.',
  associacoes_beneficas = 'Beterraba, Cebola, Tomate'
WHERE nome = 'Couve / Repolho';

UPDATE culturas_guia SET
  nome_cientifico = 'Brassica oleracea var. botrytis',
  temp_min_germinacao = 5,
  temp_otima = 18,
  humidade_ideal = '70-80%',
  descricao = 'Brassicácea de inflorescência. Ciclo longo (90-120 dias). Plantação de sementes ou mudas. Sensível a doenças fúngicas. Colheita do buquê central.',
  associacoes_beneficas = 'Beterraba, Cebola'
WHERE nome = 'Couve-flor';

UPDATE culturas_guia SET
  nome_cientifico = 'Citrullus lanatus',
  temp_min_germinacao = 15,
  temp_otima = 28,
  humidade_ideal = '60-70%',
  descricao = 'Cucurbitácea termófila. Ciclo 70-100 dias. Requer muito espaço (ramos longos). Colheita quando o fruto "soa a vazio".',
  associacoes_beneficas = 'Milho, Feijão, Rabanete'
WHERE nome = 'Melancia';

UPDATE culturas_guia SET
  nome_cientifico = 'Cucumis melo',
  temp_min_germinacao = 15,
  temp_otima = 28,
  humidade_ideal = '60-70%',
  descricao = 'Cucurbitácea termófila. Ciclo 70-90 dias. Colheita quando o fruto tem aroma e cede à pressão na base.',
  associacoes_beneficas = 'Milho, Feijão'
WHERE nome = 'Melão';

UPDATE culturas_guia SET
  nome_cientifico = 'Cucurbita pepo',
  temp_min_germinacao = 15,
  temp_otima = 25,
  humidade_ideal = '60-70%',
  descricao = 'Cucurbitácea. Ciclo longo (90-120 dias). Requer muito espaço e rega abundante. Armazenamento em local fresco.',
  associacoes_beneficas = 'Milho, Feijão'
WHERE nome = 'Abóbora';

UPDATE culturas_guia SET
  nome_cientifico = 'Brassica rapa subsp. rapa',
  temp_min_germinacao = 5,
  temp_otima = 18,
  humidade_ideal = '70-80%',
  descricao = 'Raiz brassicácea. Ciclo 70-90 dias. Tolerante ao frio. Colheita quando a raiz tem 5-8 cm. Folhas também comestíveis.',
  associacoes_beneficas = 'Cebola, Tomate'
WHERE nome = 'Nabo';

UPDATE culturas_guia SET
  nome_cientifico = 'Petroselinum crispum',
  temp_min_germinacao = 8,
  temp_otima = 18,
  humidade_ideal = '70-80%',
  descricao = 'Aromática bienal (colheita no 1º ano). Germinação lenta. Colheita contínua de folhas exteriores.',
  associacoes_beneficas = 'Tomate, Cenoura'
WHERE nome = 'Salsa';

UPDATE culturas_guia SET
  nome_cientifico = 'Coriandrum sativum',
  temp_min_germinacao = 10,
  temp_otima = 18,
  humidade_ideal = '60-70%',
  descricao = 'Aromática anual. Folhas frescas (colheita precoce antes da floração) ou sementes (colheita quando secam). Prefere clima fresco.',
  associacoes_beneficas = 'Tomate, Beterraba'
WHERE nome = 'Coentro';

UPDATE culturas_guia SET
  nome_cientifico = 'Nasturtium officinale',
  temp_min_germinacao = 5,
  temp_otima = 12,
  humidade_ideal = '80-90%',
  descricao = 'Crucífera aquática ou semi-aquática. Cresce em solos permanentemente húmidos. Colheita de folhas tenras. Gosto picante.',
  associacoes_beneficas = 'Nenhuma confirmada em companion planting'
WHERE nome = 'Agrião';

-- 'Manjericão' nunca tinha sido semeado (não estava em nenhum dos dois
-- ficheiros de seed) -- este UPDATE afetava 0 linhas. Substituído por um
-- INSERT com os dados de detalhe que a fonte deu (nome científico,
-- temperaturas, descrição, associações) mais ciclo_dias_min/max e meses
-- de semeadura/colheita estimados por mim (conhecimento hortícola geral,
-- não vem do Volume_IV nem da fonte deste ficheiro) -- mesmo critério
-- usado em sql/culturas_guia_seed_adicional.sql.
INSERT INTO culturas_guia (
  nome, categoria, perene, ciclo_dias_min, ciclo_dias_max,
  meses_semeadura, meses_colheita,
  nome_cientifico, temp_min_germinacao, temp_otima, humidade_ideal,
  descricao, associacoes_beneficas
) VALUES (
  'Manjericão', 'Aromática', false, 50, 75,
  'Abril, Maio', 'Junho, Julho, Agosto, Setembro',
  'Ocimum basilicum', 12, 22, '60-70%',
  'Aromática anual termófila. Colheita contínua de folhas. Remova flores para prolongar produção. Sensível ao frio.',
  'Tomate, Pimento'
)
ON CONFLICT (nome) DO NOTHING;

-- ============================================================
-- LEGUMES
-- ============================================================

UPDATE culturas_guia SET
  nome_cientifico = 'Phaseolus vulgaris',
  temp_min_germinacao = 12,
  temp_otima = 24,
  humidade_ideal = '60-70%',
  descricao = 'Leguminosa anual. Ciclo 60-80 dias. Fixação de nitrogénio. Variedades: grão seco ou vagem verde. Colheita escalonada.',
  associacoes_beneficas = 'Milho, Abóbora, Tomate'
WHERE nome = 'Feijão';

UPDATE culturas_guia SET
  nome_cientifico = 'Pisum sativum',
  temp_min_germinacao = 5,
  temp_otima = 15,
  humidade_ideal = '70-80%',
  descricao = 'Leguminosa anual de inverno/primavera. Ciclo 60-70 dias. Variedades: ervilha de açúcar (vagem comestível) ou ervilha de grão. Fixação de nitrogénio.',
  associacoes_beneficas = 'Cenoura, Nabo, Rabanete'
WHERE nome = 'Ervilha';

UPDATE culturas_guia SET
  nome_cientifico = 'Cicer arietinum',
  temp_min_germinacao = 10,
  temp_otima = 20,
  humidade_ideal = '50-60%',
  descricao = 'Leguminosa anual. Ciclo 120+ dias. Plantação no outono, colheita em Junho. Tolerante à seca. Grão seco para consumo directo.',
  associacoes_beneficas = 'Cereais de inverno'
WHERE nome = 'Grão';

UPDATE culturas_guia SET
  nome_cientifico = 'Lupinus albus',
  temp_min_germinacao = 8,
  temp_otima = 16,
  humidade_ideal = '60-70%',
  descricao = 'Leguminosa anual. Cultura de cobertura (aduba solo com nitrogénio). Pode ser incorporada como adubo verde. Sementes comestíveis após processo de desamarização.',
  associacoes_beneficas = 'Qualquer cultura (melhora solo)'
WHERE nome = 'Tremoço';

-- ============================================================
-- CEREAIS
-- ============================================================

UPDATE culturas_guia SET
  nome_cientifico = 'Triticum aestivum',
  temp_min_germinacao = 5,
  temp_otima = 18,
  humidade_ideal = '60-70%',
  descricao = 'Cereal de inverno. Ciclo 180-200 dias (set/out a mai/jun). Semeadura directa no campo. Colheita quando amadurece (palha amarela).',
  associacoes_beneficas = 'Leguminosas (em rotação)'
WHERE nome = 'Trigo';

UPDATE culturas_guia SET
  nome_cientifico = 'Secale cereale',
  temp_min_germinacao = 5,
  temp_otima = 18,
  humidade_ideal = '60-70%',
  descricao = 'Cereal de inverno. Ciclo 180-200 dias. Mais tolerante ao frio que trigo. Semeadura Outubro-Novembro. Colheita Maio-Junho.',
  associacoes_beneficas = 'Leguminosas (em rotação)'
WHERE nome = 'Centeio';

UPDATE culturas_guia SET
  nome_cientifico = 'Hordeum vulgare',
  temp_min_germinacao = 5,
  temp_otima = 18,
  humidade_ideal = '60-70%',
  descricao = 'Cereal de inverno. Ciclo 160-180 dias. Variedades: cevada para cerveja (malte) ou para consumo directo. Semeadura out/nov, colheita mai/jun.',
  associacoes_beneficas = 'Leguminosas (em rotação)'
WHERE nome = 'Cevada';

UPDATE culturas_guia SET
  nome_cientifico = 'Zea mays',
  temp_min_germinacao = 12,
  temp_otima = 28,
  humidade_ideal = '60-70%',
  descricao = 'Cereal de verão termófilo. Ciclo 90-120 dias. Semeadura em Maio após risco de geada. Exige muita rega. Colheita agosto-setembro.',
  associacoes_beneficas = 'Feijão, Abóbora (consociação tradicional dos "3 Irmãs")'
WHERE nome = 'Milho';

UPDATE culturas_guia SET
  nome_cientifico = 'Helianthus annuus',
  temp_min_germinacao = 8,
  temp_otima = 24,
  humidade_ideal = '50-60%',
  descricao = 'Cereal oleaginoso com flores vistosas. Ciclo 90-120 dias. Tolerante à seca. Colheita de sementes quando floração murcha e seque. Atrai abelhas.',
  associacoes_beneficas = 'Nenhuma confirmada (ligeiramente alelopático)'
WHERE nome = 'Girassol';

-- ============================================================
-- FRUTEIRAS
-- ============================================================

UPDATE culturas_guia SET
  nome_cientifico = 'Prunus persica',
  temp_min_germinacao = NULL,
  temp_otima = 20,
  humidade_ideal = '60-70%',
  descricao = 'Árvore caducifólia perene. Floração cedo (Março). Poda em Quarto Minguante (janeiro-março). Ciclo de fruto 90-120 dias após floração. Colheita julho-agosto.',
  associacoes_beneficas = 'Plantações de diversidade (polinizadores)'
WHERE nome = 'Pessegueiro';

UPDATE culturas_guia SET
  nome_cientifico = 'Prunus armeniaca',
  temp_min_germinacao = NULL,
  temp_otima = 18,
  humidade_ideal = '60-70%',
  descricao = 'Árvore caducifólia. Floração precoce (fevereiro-março). Poda em QM. Ciclo de fruto 100-120 dias. Frutos Junho-Julho.',
  associacoes_beneficas = 'Plantações de diversidade'
WHERE nome = 'Ameixieira';

UPDATE culturas_guia SET
  nome_cientifico = 'Malus domestica',
  temp_min_germinacao = NULL,
  temp_otima = 15,
  humidade_ideal = '60-70%',
  descricao = 'Árvore caducifólia. Floração Abril. Poda em QM (janeiro-fevereiro). Ciclo de fruto 150-180 dias (floração a colheita). Colheita setembro-outubro.',
  associacoes_beneficas = 'Plantações de diversidade'
WHERE nome = 'Macieira'; -- ficheiro recebido tinha 'Maçã'; a minha entrada chama-se pela árvore, não pelo fruto

UPDATE culturas_guia SET
  nome_cientifico = 'Pyrus communis',
  temp_min_germinacao = NULL,
  temp_otima = 15,
  humidade_ideal = '60-70%',
  descricao = 'Árvore caducifólia. Floração Abril. Poda em QM. Ciclo de fruto 150-180 dias. Colheita setembro-outubro (alguns até novembro).',
  associacoes_beneficas = 'Plantações de diversidade'
WHERE nome = 'Pereira'; -- ficheiro recebido tinha 'Pera'; a minha entrada chama-se pela árvore, não pelo fruto

UPDATE culturas_guia SET
  nome_cientifico = 'Ficus carica',
  temp_min_germinacao = NULL,
  temp_otima = 25,
  humidade_ideal = '50-60%',
  descricao = 'Árvore mediterrânea semi-caducifólia. Poda ligeira em QM. Ciclo de fruto 120-180 dias. Colheita Agosto-Setembro. Muito tolerante à seca.',
  associacoes_beneficas = 'Plantações xerófitas'
WHERE nome = 'Figueira';

UPDATE culturas_guia SET
  nome_cientifico = 'Vitis vinifera',
  temp_min_germinacao = NULL,
  temp_otima = 20,
  humidade_ideal = '50-60%',
  descricao = 'Trepadeira lenhosa perene. Poda de rejuvenescimento em QM (janeiro-fevereiro). Ciclo de fruto 120-150 dias. Colheita Setembro-Outubro (vindima).',
  associacoes_beneficas = 'Plantas baixas no sub-coberto'
WHERE nome = 'Videira';

UPDATE culturas_guia SET
  nome_cientifico = 'Olea europaea',
  temp_min_germinacao = NULL,
  temp_otima = 25,
  humidade_ideal = '40-50%',
  descricao = 'Árvore mediterrânea perene. Floração Abril-Maio (tarda). Poda em QM. Ciclo de fruto 180-200 dias. Colheita Outubro-Novembro. Extremamente tolerante à seca.',
  associacoes_beneficas = 'Plantações xerófitas'
WHERE nome = 'Oliveira';

UPDATE culturas_guia SET
  nome_cientifico = 'Diospyros kaki',
  temp_min_germinacao = NULL,
  temp_otima = 20,
  humidade_ideal = '60-70%',
  descricao = 'Árvore caducifólia perene. Floração junho. Poda ligeira em QM. Ciclo de fruto 180-200 dias. Colheita Outubro-Novembro. Frutos após geada.',
  associacoes_beneficas = 'Plantações de diversidade'
WHERE nome = 'Diospireiro';

UPDATE culturas_guia SET
  nome_cientifico = 'Rubus idaeus',
  temp_min_germinacao = NULL,
  temp_otima = 18,
  humidade_ideal = '70-80%',
  descricao = 'Arbusto caducifólio. Poda anual de canas velhas em QM. Ciclo de fruto 120-150 dias. Colheita Junho-Julho. Prefere clima fresco e humidade.',
  associacoes_beneficas = 'Nenhuma confirmada'
WHERE nome = 'Framboesa';

UPDATE culturas_guia SET
  nome_cientifico = 'Fragaria x ananassa',
  temp_min_germinacao = 5,
  temp_otima = 18,
  humidade_ideal = '70-80%',
  descricao = 'Planta herbácea semi-perene. Ciclo de fruto 60-80 dias (após flor). Variedades: dias longos (uma colheita) ou remontantes (várias colheitas). Multiplicação por estolhos.',
  associacoes_beneficas = 'Alface, Espinafre, Beterraba'
WHERE nome = 'Morango';

UPDATE culturas_guia SET
  nome_cientifico = 'Actinidia deliciosa',
  temp_min_germinacao = NULL,
  temp_otima = 18,
  humidade_ideal = '70-80%',
  descricao = 'Trepadeira lenhosa perene. Floração Junho. Poda em QM. Ciclo de fruto 180-200 dias (floração a colheita). Colheita Outubro-Novembro. Requer suporte.',
  associacoes_beneficas = 'Plantações com suporte estruturado'
WHERE nome = 'Kiwi';

UPDATE culturas_guia SET
  nome_cientifico = 'Rubus species',
  temp_min_germinacao = NULL,
  temp_otima = 18,
  humidade_ideal = '70-80%',
  descricao = 'Arbusto caducifólio. Poda anual em QM (ramos de 1 ano produzem). Ciclo de fruto 120-150 dias. Colheita Julho-Setembro. Múltiplas floradas.',
  associacoes_beneficas = 'Nenhuma confirmada'
WHERE nome = 'Amora';

UPDATE culturas_guia SET
  nome_cientifico = 'Citrus sinensis',
  temp_min_germinacao = NULL,
  temp_otima = 25,
  humidade_ideal = '60-70%',
  descricao = 'Árvore perene (não caducifólia). Floração Março (flor de laranjeira). Ciclo de fruto 180-200 dias. Colheita Outubro-Dezembro. Sensível a geadas severas.',
  associacoes_beneficas = 'Plantações de citros'
WHERE nome = 'Laranjeira';

UPDATE culturas_guia SET
  nome_cientifico = 'Citrus limon',
  temp_min_germinacao = NULL,
  temp_otima = 25,
  humidade_ideal = '60-70%',
  descricao = 'Árvore perene. Produção contínua (flores e frutos simultaneamente). Ciclo de fruto variável (120-180 dias). Colheita ano todo. Tolerante à seca relativa.',
  associacoes_beneficas = 'Plantações de citros'
WHERE nome = 'Limoeiro';

-- ============================================================
-- AROMÁTICAS
-- ============================================================

UPDATE culturas_guia SET
  nome_cientifico = 'Mentha x piperita',
  temp_min_germinacao = 5,
  temp_otima = 18,
  humidade_ideal = '70-80%',
  descricao = 'Perene herbácea. Multiplica-se por rizomas. Colheita contínua de folhas. Prefere humidade. Invasora (controlar espaço).',
  associacoes_beneficas = 'Melhor isolada ou em vasos'
WHERE nome = 'Hortelã';

UPDATE culturas_guia SET
  nome_cientifico = 'Thymus vulgaris',
  temp_min_germinacao = 10,
  temp_otima = 20,
  humidade_ideal = '40-50%',
  descricao = 'Perene lenhosa mediterrânea. Colheita contínua. Muito tolerante à seca. Poda ligeira após floração. Duração 3-5 anos.',
  associacoes_beneficas = 'Plantações xerófitas, polinizadores'
WHERE nome = 'Tomilho';

UPDATE culturas_guia SET
  nome_cientifico = 'Salvia officinalis',
  temp_min_germinacao = 12,
  temp_otima = 20,
  humidade_ideal = '50-60%',
  descricao = 'Perene lenhosa. Colheita contínua de folhas. Tolerante à seca. Poda anual em primavera. Duração 4-6 anos. Flores comestíveis.',
  associacoes_beneficas = 'Plantações de aromáticas e polinizadores'
WHERE nome = 'Salva';

UPDATE culturas_guia SET
  nome_cientifico = 'Rosmarinus officinalis',
  temp_min_germinacao = 15,
  temp_otima = 22,
  humidade_ideal = '40-50%',
  descricao = 'Perene lenhoso mediterrânico. Colheita contínua. Extremamente tolerante à seca. Poda anual. Duração 6-8 anos. Flores para chá.',
  associacoes_beneficas = 'Plantações xerófitas, polinizadores'
WHERE nome = 'Alecrim';

UPDATE culturas_guia SET
  nome_cientifico = 'Origanum vulgare',
  temp_min_germinacao = 12,
  temp_otima = 20,
  humidade_ideal = '50-60%',
  descricao = 'Perene herbácea-lenhosa. Colheita contínua (melhor antes da floração). Tolerante à seca. Poda anual. Duração 3-5 anos.',
  associacoes_beneficas = 'Qualquer cultura (melhora biodiversidade)'
WHERE nome = 'Orégão';

UPDATE culturas_guia SET
  nome_cientifico = 'Origanum majorana',
  temp_min_germinacao = 12,
  temp_otima = 22,
  humidade_ideal = '50-60%',
  descricao = 'Perene anual (em clima frio). Colheita contínua. Gosto mais suave que orégão. Poda anual. Duração 2-3 anos.',
  associacoes_beneficas = 'Qualquer cultura'
WHERE nome = 'Manjerona';

-- ============================================================
-- TUBÉRCULO
-- ============================================================

UPDATE culturas_guia SET
  nome_cientifico = 'Ipomoea batatas',
  temp_min_germinacao = 15,
  temp_otima = 28,
  humidade_ideal = '70-80%',
  descricao = 'Tubérculo tropical. Plantação de estolhos em Abril-Maio. Ciclo 90-150 dias. Colheita Setembro-Outubro (antes da geada). Armazenamento em local fresco.',
  associacoes_beneficas = 'Leguminosas (em rotação)'
WHERE nome = 'Batata-doce';

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================

-- Selecciona algumas entradas com detalhes
-- SELECT nome, categoria, nome_cientifico, temp_otima, humidade_ideal FROM culturas_guia LIMIT 10;

-- Conta registos completos
-- SELECT COUNT(*) as total, COUNT(nome_cientifico) as com_cientifico, COUNT(descricao) as com_descricao FROM culturas_guia;
