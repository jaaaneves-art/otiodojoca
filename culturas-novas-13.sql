-- ============================================================================
-- INSERÇÃO DE 13 CULTURAS NOVAS
-- Projeto: O Tio do Joca — Agenda Agrícola
-- Data: 2026-08-18
-- Schema: culturas_guia (18 colunas, sem coluna 'perene')
-- Nota: Culturas perenes = NULL em ciclo_dias_min/max
-- ============================================================================

INSERT INTO culturas_guia (
  nome,
  nome_cientifico,
  categoria,
  ciclo_dias_min,
  ciclo_dias_max,
  mes_plantacao_inicio,
  mes_plantacao_fim,
  mes_colheita_inicio,
  mes_colheita_fim,
  fase_lunar_ideal,
  profundidade_semente_cm,
  espacamento_linhas_cm,
  espacamento_plantas_cm,
  dias_para_germinacao,
  temperatura_minima_c,
  temperatura_otima_c,
  umidade_solo_percentual,
  dicas_cultivo
) VALUES

-- 1. COUVE GALEGA
(
  'Couve Galega',
  'Brassica oleracea subsp. acephala',
  'Hortaliça',
  90, 120,
  1, 2,
  6, 11,
  'Lua Minguante',
  1.5,
  40,
  45,
  7,
  5,
  18,
  70,
  'Resistente ao frio. Colheita folha-a-folha a partir de 3-4 meses. Evitar áreas com brassicas anteriores. Rega regular sem encharcar.'
),

-- 2. SALSA
(
  'Salsa',
  'Petroselinum crispum',
  'Aromática',
  60, 90,
  1, 8,
  3, 11,
  'Lua Crescente',
  1,
  25,
  30,
  21,
  5,
  20,
  65,
  'Bienal: folhas 1º ano, sementes 2º ano. Germinação lenta (2-3 semanas). Sol pleno a meia-sombra. Essencial em sopas e peixes.'
),

-- 3. CIDREIRA (Erva-Cidreira)
(
  'Cidreira',
  'Melissa officinalis',
  'Aromática/Medicinal',
  NULL, NULL,
  3, 6,
  6, 10,
  'Lua Crescente',
  NULL,
  50,
  60,
  15,
  0,
  22,
  60,
  'Perene, resistente ao frio. Poda anual no final do inverno. Infusão calmante. Atrai polinizadores. Óleos concentram-se em Lua Minguante.'
),

-- 4. TANGERINEIRA
(
  'Tangerineira',
  'Citrus reticulata',
  'Fruteira',
  NULL, NULL,
  10, 2,
  10, 12,
  'Quarto Minguante',
  NULL,
  400,
  500,
  NULL,
  5,
  25,
  70,
  'Perene, colheita a partir do 3º-4º ano. Poda em Quarto Minguante (jan-fev). Enxertia em Lua Crescente. Gota-a-gota recomendado. Variedades: Arrábida, Aveiro.'
),

-- 5. RUBABARBO
(
  'Rubabarbo',
  'Rheum rhabarbarum',
  'Hortaliça/Perene',
  NULL, NULL,
  10, 2,
  4, 6,
  'Lua Crescente',
  NULL,
  80,
  100,
  75,
  -5,
  18,
  75,
  'Perene europeia, prefere clima frio. Rega abundante. Colheita de pecíolos (hastes) apenas - folhas são tóxicas. Compotas, tartes. Divisão a cada 4-5 anos.'
),

-- 6. COUVE DE BRUXELAS
(
  'Couve de Bruxelas',
  'Brassica oleracea var. gemmifera',
  'Hortaliça',
  120, 150,
  3, 5,
  11, 2,
  'Lua Minguante',
  1.5,
  50,
  60,
  7,
  5,
  18,
  70,
  'Cultura fria (resgua). Colheita de baixo para cima. Clima frio-temperado (norte/centro). Rota com outras brassicas. Vitamina C e glucosinolatos.'
),

-- 7. CHILA (Chuchu)
(
  'Chila',
  'Sechium edule',
  'Curcubitácea',
  90, 120,
  3, 6,
  8, 10,
  'Lua Crescente',
  3,
  200,
  300,
  10,
  15,
  28,
  65,
  'Clima quente-temperado. Suporte/latada obrigatório (planta vigorosa). Fruto abutinhado, sabor neutro. Sementes e raízes também comestíveis. Rega regular.'
),

-- 8. AMENDOEIRA
(
  'Amendoeira',
  'Prunus amygdalus',
  'Fruteira',
  NULL, NULL,
  10, 2,
  8, 9,
  'Quarto Minguante',
  NULL,
  600,
  800,
  NULL,
  5,
  25,
  50,
  'Perene, ideal para sul/Alentejo. Tolerante à seca. Poda em Quarto Minguante. Não podar em Lua Crescente. Floração precoce (risco geada). Produção: 100-200 kg/árvore.'
),

-- 9. NOGUEIRA
(
  'Nogueira',
  'Juglans regia',
  'Fruteira/Florestal',
  NULL, NULL,
  10, 2,
  9, 10,
  'Quarto Minguante',
  NULL,
  800,
  1000,
  NULL,
  -10,
  20,
  60,
  'Perene, produção a partir do 5º-7º ano. Longevidade 150+ anos. Enraizamento profundo. Poda mínima. Raízes alelopáticas (custa outras plantas). "Quando cai, está pronta."'
),

-- 10. CEBOLINHO
(
  'Cebolinho',
  'Allium schoenoprasum',
  'Aromática',
  60, 90,
  3, 9,
  5, 10,
  'Lua Crescente',
  1,
  25,
  30,
  10,
  0,
  20,
  60,
  'Perene, resistente ao frio. Colheita contínua (corte de folhas). Flores comestíveis (maio-junho). Divisão de touceiras a cada 3-4 anos. Sabor suave a cebola.'
),

-- 11. LAVANDA
(
  'Lavanda',
  'Lavandula angustifolia',
  'Flor/Aromática',
  NULL, NULL,
  3, 7,
  6, 9,
  'Lua Minguante',
  0.5,
  50,
  80,
  15,
  0,
  25,
  50,
  'Perene 10-15 anos. Muito tolerante à seca (mediterrânica). Sol pleno obrigatório. Poda anual (final inverno). Óleos máximos em Lua Minguante. Atrai abelhas, borboletas. Não tolera encharcamento.'
),

-- 12. ESPARGOS
(
  'Espargos',
  'Asparagus officinalis',
  'Hortaliça/Perene',
  NULL, NULL,
  1, 11,
  4, 6,
  'Lua Crescente',
  NULL,
  40,
  40,
  30,
  -5,
  20,
  70,
  'Perene, produção 15-20 anos. Plantação garras (não sementes). Solo profundo 50+ cm. Colheita 3º-4º ano. Limpeza de infestantes essencial. Sulcos elevados (drenagem). 1 kg/m² adulto.'
),

-- 13. BRÓCULOS
(
  'Bróculos',
  'Brassica oleracea var. italica',
  'Hortaliça',
  70, 90,
  1, 2,
  5, 6,
  'Lua Minguante',
  1.5,
  40,
  60,
  7,
  5,
  20,
  75,
  'Clima frio-temperado. Rega regular (sensível à seca). "Cabeça" central 1º, depois brócolos laterais. Muito viável norte/centro. Vitamina C superior ao tomate. Sulforafano (anti-cancer).'
);

-- ============================================================================
-- VALIDAÇÃO PÓS-INSERÇÃO
-- ============================================================================

-- Verificar inserção bem-sucedida
SELECT COUNT(*) as total_culturas FROM culturas_guia;
-- Esperado: 76 (63 anteriores + 13 novas)

-- Listar as 13 novas
SELECT nome, nome_cientifico, categoria, ciclo_dias_min, ciclo_dias_max
FROM culturas_guia
WHERE nome IN (
  'Couve Galega', 'Salsa', 'Cidreira', 'Tangerineira', 'Rubabarbo',
  'Couve de Bruxelas', 'Chila', 'Amendoeira', 'Nogueira', 'Cebolinho',
  'Lavanda', 'Espargos', 'Bróculos'
)
ORDER BY nome;

-- Verificar culturas perenes (NULL em ciclo)
SELECT nome, ciclo_dias_min, ciclo_dias_max
FROM culturas_guia
WHERE ciclo_dias_min IS NULL AND ciclo_dias_max IS NULL
ORDER BY nome;
-- Esperado: 13 perenes + anteriores (Castanha, Cereja, etc.)

-- Verificar fases lunares
SELECT DISTINCT fase_lunar_ideal FROM culturas_guia WHERE nome IN (
  'Couve Galega', 'Salsa', 'Cidreira', 'Tangerineira', 'Rubabarbo',
  'Couve de Bruxelas', 'Chila', 'Amendoeira', 'Nogueira', 'Cebolinho',
  'Lavanda', 'Espargos', 'Bróculos'
);

-- ============================================================================
-- FIM DA INSERÇÃO
-- ============================================================================
