-- ============================================================================
-- CULTURAS FALTANTES — OTJ Agenda Agrícola
-- Extraídas de Volume IV (calendário agrícola português)
-- Total: 12 novas culturas em PRIORIDADE 1 + 2
--
-- CORREÇÕES face ao ficheiro recebido (~/culturas-guia-faltantes-CORRIGIDO.sql):
-- - A coluna 'perene' EXISTE (sql/AGENDA_AGRICOLA.sql) -- o ficheiro
--   recebido tinha-a removido por engano ("não existe"). Sem ela, as 10
--   árvores/perenes ficavam com perene=false por omissão, inconsistente
--   com as fruteiras já semeadas (todas true) e mostrando "Ciclo por
--   confirmar" em vez de "Perene" na UI. Reposta: true para as 10
--   árvores/perenes, false para Alho e Lentilha (culturas anuais).
-- - Alho: semeadura_fase_lunar vinha 'crescente'; corrigido para
--   'minguante' -- lib/calendario/tradicao.ts já lista "alho" em
--   Raízes/Tubérculos (fase Minguante), a fonte que decidimos manter
--   como autoridade sobre fase lunar (ver sql/culturas_guia_seed.sql).
-- - ON CONFLICT (nome) DO NOTHING acrescentado a ambos os INSERT, como
--   nos outros ficheiros de seed, para correr em segurança.
--
-- Categorias novas introduzidas por este ficheiro (não existiam nas 6
-- originais): "Fruto Florestal" (Bolota), "Árvore Florestal" (Sobreiro,
-- Azinheira, Castanheiro), "Flor/Ornamental" (Roseira) -- aceites como
-- estão, preparam o módulo Floresta/Paisagem mencionado na auditoria.
--
-- Nomes verificados sem colisão com as 52 culturas já existentes.
-- ============================================================================

-- PRIORIDADE 1: Muito frequentes na documentação (5+ menções)

INSERT INTO culturas_guia (
  nome, nome_cientifico, categoria, perene,
  ciclo_dias_min, ciclo_dias_max,
  temp_min_germinacao, temp_otima, humidade_ideal,
  meses_semeadura, meses_colheita,
  semeadura_fase_lunar, poda_fase_lunar, colheita_fase_lunar,
  descricao, associacoes_beneficas, dicas
) VALUES
(
  'Castanha',
  'Castanea sativa',
  'Fruteira', true,
  null, null,
  10, 20, '60-70%',
  'Setembro, Outubro, Novembro',
  'Setembro, Outubro, Novembro',
  null, 'minguante', null,
  'Árvore de grande valor tradicional em Portugal, especialmente em Trás-os-Montes. A colheita ocorre quando os ouriços naturalmente se abrem e os frutos caem ao chão. Variedades locais incluem longal, martaínha e judia. Historicamente essencial na alimentação rural portuguesa.',
  'Aumento de biodiversidade em soutos (castanheiros); habitat para fauna selvagem',
  'Não colher diretamente da árvore — aguardar queda natural dos frutos. Varejamento tradicional com vara facilita a apanha. Ideal em Quarto Minguante para operações florestais. Magusto tradicional em Dia de S. Martinho (11 de novembro).'
),
(
  'Cereja',
  'Prunus avium',
  'Fruteira', true,
  null, null,
  8, 22, '55-65%',
  'Março, Abril, Maio',
  'Maio, Junho, Julho',
  null, 'minguante', null,
  'Fruta de caroço precoce, colheita concentrada entre maio e julho, com variedades que maturem em diferentes épocas. Tradição menciona que em maio se comem "cerejas ao borralho" (junto à lareira). Particularmente importante em regiões de altitude como Cova da Beira.',
  'Abelhas (polinização); flores atraem insetos benéficos',
  'Poda em Quarto Minguante, preferencialmente entre janeiro e março. Evitar poda em períodos de geada. Colheita manual, cacho a cacho, para melhor qualidade e manuseio.'
),
(
  'Amêndoa',
  'Prunus amygdalus',
  'Fruteira', true,
  null, null,
  10, 23, '50-60%',
  'Março, Abril',
  'Agosto, Setembro',
  null, 'minguante', null,
  'Fruta seca tradicional em Portugal. Floresce no final do inverno (Fevereiro-Março), sendo particularmente sensível a geadas tardias. Adaptada a climas mediterraneanos e continental de baixa altitude. Colheita quando o fruto cai naturalmente no verão.',
  'Flores (recurso apícola); suporta culturas diversas sob copa',
  'Poda em Quarto Minguante durante repouso vegetativo (janeiro-março). Amêndoas que caem espontaneamente indicam maturação. Variedades tradicionais mais resistentes em regiões do Centro-Sul.'
),
(
  'Noz',
  'Juglans regia',
  'Fruteira', true,
  null, null,
  12, 20, '60-70%',
  'Março, Abril',
  'Setembro, Outubro',
  null, 'minguante', null,
  'Árvore de grande longevidade e porte. Colheita entre finais de setembro e finais de outubro. Fruto amadurece quando o carpelo se fende naturalmente, indicando maturação completa. Historicamente cultivada para consumo direto e óleo.',
  'Sombra natural para outras culturas; vida útil longa beneficia paisagem',
  'Não colher imediatamente — aguardar fenda natural do carpelo. Varejamento tradicional acelera apanha. Poda mínima — apenas estrutural em Quarto Minguante se necessário.'
)
ON CONFLICT (nome) DO NOTHING;

-- PRIORIDADE 2: Mencionadas, bem documentadas (2-4 menções)

INSERT INTO culturas_guia (
  nome, nome_cientifico, categoria, perene,
  ciclo_dias_min, ciclo_dias_max,
  temp_min_germinacao, temp_otima, humidade_ideal,
  meses_semeadura, meses_colheita,
  semeadura_fase_lunar, poda_fase_lunar, colheita_fase_lunar,
  descricao, associacoes_beneficas, dicas
) VALUES
(
  'Alho',
  'Allium sativum',
  'Hortaliça', false,
  180, 210,
  6, 15, '65-70%',
  'Outubro, Novembro, Dezembro, Fevereiro',
  'Maio, Junho, Julho',
  'minguante', null, null,
  'Plantação tradicional em novembro, mas admite-se prolongamento até fevereiro com adubação potássica reforçada. Ciclo longo (6-7 meses). Essencial na culinária portuguesa e com propriedades reconhecidas. Colheita quando folha amarela e morre.',
  'Repele insetos; proteção contra doenças em culturas adjacentes',
  'Plantar em Lua Minguante, como as demais raízes/tubérculos. Mês ideal: novembro para melhor rendimento. Plantação atrasada (fevereiro) requer adubação cuidadosa. Armazenar em local seco após colheita.'
),
(
  'Lentilha',
  'Lens culinaris',
  'Legume', false,
  75, 90,
  8, 18, '55-65%',
  'Fevereiro, Março, Outubro, Novembro',
  'Junho, Julho, Agosto, Maio',
  'crescente', null, null,
  'Legume tradicional de ciclo curto. Mencionada em fevereiro como sementeira continuada de inverno. Fixação natural de azoto no solo. Cultura de relevância nutricional e económica histórica.',
  'Fixadora de azoto; melhora fertilidade do solo para culturas seguintes',
  'Ciclo rápido permite duas colheitas por ano em clima favorável. Sementeira em crescente. Não necessita poda. Colheita quando as vagens secam completamente.'
),
(
  'Damasqueiro',
  'Prunus armeniaca',
  'Fruteira', true,
  null, null,
  8, 22, '55-65%',
  'Março, Abril, Maio',
  'Junho, Julho, Agosto',
  null, 'minguante', null,
  'Fruta de caroço com floração precoce. Fevereiro menciona explicitamente: "não podar nesta fase". Fruto seco ou fresco, de grande valor em culinária tradicional portuguesa (doces, compotas). Sensível a geadas tardias na floração.',
  'Abelhas (polinização forte); flores precoces atraem insetos',
  'NÃO podar em fevereiro — já tem seiva ativa. Poda em dezembro-janeiro se necessário. Floresce muito cedo (janelas de geada perigosas). Colheita quando fruto cede levemente ao toque.'
),
(
  'Bolota',
  'Quercus spp.',
  'Fruto Florestal', true,
  null, null,
  12, 20, '60-75%',
  'Setembro, Outubro, Novembro',
  'Setembro, Outubro, Novembro',
  null, null, null,
  'Fruto de carvalhos e outras espécies de Quercus. Colheita entre setembro e novembro. Historicamente relevante na alimentação portuguesa como alimento e forragem animal. Fruto cai espontaneamente quando maduro.',
  'Habitat essencial para fauna selvagem; base de ecossistemas florestais',
  'Recolher fruto caído naturalmente do chão. Variedades doces mais palatáveis. Secagem prolongada necessária antes de consumo humano (processamento tradicional). Época de apanha coincide com castanha e noz.'
),
(
  'Sobreiro',
  'Quercus suber',
  'Árvore Florestal', true,
  null, null,
  12, 20, '60-75%',
  'Outubro, Novembro',
  'Setembro, Outubro',
  null, null, null,
  'Árvore endémica do Mediterrânico ocidental. Importância económica e ecológica em Portugal (cortiça). Sementeira em viveiro em janeiro-fevereiro. Crescimento lento. Protegida por legislação ambiental.',
  'Estrutura de ecossistema florestal único; suporta biodiversidade extremamente alta',
  'Sementeira em canteiro com grande cuidado. Transplante após 2-3 anos. Ciclo muito longo até primeiro corte de cortiça (15+ anos). Espécie protegida — consultar regulações locais.'
),
(
  'Azinheira',
  'Quercus ilex',
  'Árvore Florestal', true,
  null, null,
  12, 20, '60-75%',
  'Outubro, Novembro',
  'Setembro, Outubro',
  null, null, null,
  'Carvalho perenifolio típico do Mediterrânico. Sementeira em viveiro em janeiro-fevereiro. Adaptada a solos calcários. Lento crescimento. Importante para conservação e fauna (bolotas para aves, mamíferos).',
  'Estrutura de ecossistema florestal; suporta fauna diversa',
  'Sementeira em canteiro com humidade controlada. Resistência a seca notável. Crescimento muito lento até tamanho produtivo. Espécie de elevado valor ecológico — consultar regulações.'
),
(
  'Roseira',
  'Rosa spp.',
  'Flor/Ornamental', true,
  null, null,
  10, 20, '60-70%',
  'Outubro, Novembro',
  'Maio, Junho, Julho',
  null, 'minguante', null,
  'Plantação em repouso vegetativo (outubro-novembro). Fevereiro é época tradicional de poda de inverno para roseiras. Florescem em primavera-verão. Uso ornamental e produção de flores cortadas. Tradição milenar em Portugal.',
  'Atrai polinizadores; flores atraem abelhas e borboletas',
  'Poda de inverno em fevereiro em Quarto Minguante. Remover madeira morta e ramos frágeis. Plantação em outono facilita enraizamento com chuva. Adubação na primavera favorece floração abundante.'
),
(
  'Castanheiro',
  'Castanea sativa',
  'Árvore Florestal', true,
  null, null,
  12, 20, '60-70%',
  'Setembro, Outubro, Novembro',
  'Setembro, Outubro, Novembro',
  null, 'minguante', null,
  'Mesma espécie de Castanha. Referência na documentação como árvore florestal em contexto de viveiro (janeiro-fevereiro). Importância ecológica e económica em Trás-os-Montes. Crescimento lento até produção completa.',
  'Habitat para insetos e pequena fauna; estrutura paisagística importante',
  'Sementeira em canteiro em janeiro-fevereiro. Transplante após 2-3 anos de viveiro. Poda mínima em repouso vegetativo (Quarto Minguante). Protegido em várias regiões por legislação de conservação.'
)
ON CONFLICT (nome) DO NOTHING;

-- ============================================================================
-- VALIDAÇÃO PÓS-EXECUÇÃO
-- ============================================================================
-- Execute a seguir:
--
-- SELECT COUNT(*) FROM culturas_guia;
-- -- Resultado esperado: 63 (51 atuais + 12 novas)
--
-- SELECT nome, nome_cientifico, categoria 
-- FROM culturas_guia 
-- WHERE nome IN ('Castanha', 'Cereja', 'Alho', 'Noz', 'Lentilha', 
--                'Damasqueiro', 'Bolota', 'Sobreiro', 'Azinheira', 
--                'Roseira', 'Castanheiro')
-- ORDER BY categoria, nome;
--
-- ============================================================================
