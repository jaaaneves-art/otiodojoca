-- =====================================================================
-- OTJ — AUDITORIA CULTURAS_GUIA
-- FASE 5: TESTES DE VALIDAÇÃO
-- =====================================================================
-- Execute APÓS a migração (COMMIT)
-- =====================================================================

\echo '✅ INICIANDO TESTES DE VALIDAÇÃO PÓS-MIGRAÇÃO'
\echo '=================================================='

-- =====================================================================
-- TESTE 1: CONTAGEM TOTAL
-- =====================================================================

\echo '\n📊 TESTE 1: Contagem Total'
\echo '─────────────────────────'

SELECT COUNT(*) as total_registos FROM culturas_guia;

-- ESPERADO: 72-76 (alguns removidos: Bolota, Amêndoa, Noz, Castanha)
-- OK SE: 72 (removidas as 4 inválidas)

-- =====================================================================
-- TESTE 2: NENHUMA CATEGORIA NULA
-- =====================================================================

\echo '\n✅ TESTE 2: Nenhuma categoria nula'
\echo '─────────────────────────────────'

SELECT COUNT(*) as nulas
FROM culturas_guia
WHERE categoria IS NULL OR TRIM(categoria) = '';

-- ESPERADO: 0
-- ❌ FALHAR SE: > 0

-- =====================================================================
-- TESTE 3: NENHUMA CATEGORIA HÍBRIDA
-- =====================================================================

\echo '\n🔀 TESTE 3: Nenhuma categoria híbrida (com /)'
\echo '────────────────────────────────────────────'

SELECT COUNT(*) as hibridas
FROM culturas_guia
WHERE categoria ILIKE '%/%';

-- ESPERADO: 0
-- ❌ FALHAR SE: > 0

-- =====================================================================
-- TESTE 4: CATEGORIAS VÁLIDAS APENAS
-- =====================================================================

\echo '\n🏷️  TESTE 4: Categorias válidas'
\echo '───────────────────────────────'

SELECT DISTINCT categoria
FROM culturas_guia
ORDER BY categoria;

-- ESPERADO: Apenas estas 9 categorias canónicas:
-- - Aromática
-- - Árvore Florestal
-- - Cereal
-- - Fruteira
-- - Hortaliça
-- - Legume
-- - Ornamental
-- - Tubérculo

-- Verificar se há alguma categoria fora da lista
SELECT categoria, COUNT(*) as quantidade
FROM culturas_guia
WHERE categoria NOT IN (
    'Aromática',
    'Árvore Florestal',
    'Cereal',
    'Fruteira',
    'Hortaliça',
    'Legume',
    'Ornamental',
    'Tubérculo'
)
GROUP BY categoria;

-- ❌ FALHAR SE: houver registos nesta query

-- =====================================================================
-- TESTE 5: NENHUM PRODUTO COMO CULTURA
-- =====================================================================

\echo '\n🌳 TESTE 5: Nenhum produto como cultura'
\echo '─────────────────────────────────────────'

SELECT COUNT(*) as confusoes_produto_planta
FROM culturas_guia
WHERE nome IN ('Maçã', 'Pera', 'Castanha', 'Cereja', 'Amêndoa', 'Noz', 'Bolota');

-- ESPERADO: 0
-- ❌ FALHAR SE: > 0

-- Se houver, listar:
SELECT nome, categoria, nome_cientifico
FROM culturas_guia
WHERE nome IN ('Maçã', 'Pera', 'Castanha', 'Cereja', 'Amêndoa', 'Noz', 'Bolota');

-- =====================================================================
-- TESTE 6: NOMES CORRECTOS (APÓS CORRECÇÕES)
-- =====================================================================

\echo '\n✏️  TESTE 6: Nomes corrigidos'
\echo '───────────────────────────'

SELECT COUNT(*) as erros_digitacao
FROM culturas_guia
WHERE nome IN ('Chila', 'Bróculos', 'Rubabarbo', 'Salva', 'Corgete');

-- ESPERADO: 0
-- ❌ FALHAR SE: > 0

-- Se houver, listar:
SELECT nome, categoria, nome_cientifico
FROM culturas_guia
WHERE nome IN ('Chila', 'Bróculos', 'Rubabarbo', 'Salva', 'Corgete');

-- =====================================================================
-- TESTE 7: NENHUM NOME NULO
-- =====================================================================

\echo '\n📝 TESTE 7: Nenhum nome nulo'
\echo '─────────────────────────────'

SELECT COUNT(*) as nomes_nulos
FROM culturas_guia
WHERE nome IS NULL OR TRIM(nome) = '';

-- ESPERADO: 0
-- ❌ FALHAR SE: > 0

-- =====================================================================
-- TESTE 8: TODOS COM NOME CIENTÍFICO
-- =====================================================================

\echo '\n🧬 TESTE 8: Todos com nome científico'
\echo '────────────────────────────────────'

SELECT COUNT(*) as sem_cientifico
FROM culturas_guia
WHERE nome_cientifico IS NULL OR TRIM(nome_cientifico) = '';

-- ESPERADO: 0
-- ❌ FALHAR SE: > 0

-- =====================================================================
-- TESTE 9: NENHUMA CAPITALIZAÇÃO INCONSISTENTE
-- =====================================================================

\echo '\n🔤 TESTE 9: Nenhuma capitalização inconsistente'
\echo '──────────────────────────────────────────────'

SELECT COUNT(*) as capitalizacao_problemas
FROM culturas_guia
WHERE categoria ~ '^[a-z]';  -- Começa com minúscula

-- ESPERADO: 0
-- ❌ FALHAR SE: > 0

-- Se houver, listar:
SELECT DISTINCT categoria
FROM culturas_guia
WHERE categoria ~ '^[a-z]';

-- =====================================================================
-- TESTE 10: NENHUM DUPLICADO EXACTO (NOME + CATEGORIA)
-- =====================================================================

\echo '\n🔁 TESTE 10: Nenhum duplicado exacto'
\echo '───────────────────────────────────'

SELECT COUNT(*) as duplicados
FROM (
    SELECT nome, categoria, COUNT(*) as ocorrencias
    FROM culturas_guia
    GROUP BY nome, categoria
    HAVING COUNT(*) > 1
) duplicados;

-- ESPERADO: 0
-- ❌ FALHAR SE: > 0

-- Se houver duplicados, listar:
SELECT nome, categoria, COUNT(*) as ocorrencias
FROM culturas_guia
GROUP BY nome, categoria
HAVING COUNT(*) > 1
ORDER BY ocorrencias DESC;

-- =====================================================================
-- TESTE 11: NOMES CIENTÍFICOS DUPLICADOS
-- =====================================================================

\echo '\n🧬 TESTE 11: Validar nomes científicos duplicados (referência)'
\echo '──────────────────────────────────────────────────────────────'

SELECT
    nome_cientifico,
    COUNT(*) as ocorrencias,
    ARRAY_AGG(DISTINCT nome) as nomes,
    ARRAY_AGG(DISTINCT categoria) as categorias
FROM culturas_guia
WHERE nome_cientifico IS NOT NULL
GROUP BY nome_cientifico
HAVING COUNT(*) > 1
ORDER BY ocorrencias DESC;

-- INFORMAÇÃO: Mostrar casos onde uma planta tem múltiplas entradas
-- ESPERADO (após consolidação):
-- - Malus domestica: apenas Macieira
-- - Pyrus communis: apenas Pereira
-- - Prunus amygdalus: apenas Amendoeira
-- - Juglans regia: apenas Nogueira
-- - Castanea sativa: apenas Castanheiro (Fruteira ou Árvore Florestal)

-- =====================================================================
-- TESTE 12: DISTRIBUIÇÃO DE CATEGORIAS
-- =====================================================================

\echo '\n📊 TESTE 12: Distribuição de categorias'
\echo '──────────────────────────────────────'

SELECT
    categoria,
    COUNT(*) as quantidade,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM culturas_guia), 1) as percentagem
FROM culturas_guia
GROUP BY categoria
ORDER BY quantidade DESC;

-- ESPERADO (APROXIMADO):
-- Hortaliça    ~27 registos (~36%)
-- Fruteira     ~22 registos (~30%)
-- Aromática    ~10 registos (~13%)
-- Árvore Florestal ~3 registos (~4%)
-- Cereal       ~5 registos (~7%)
-- Legume       ~5 registos (~7%)
-- Tubérculo    ~1 registo (~1%)
-- Ornamental   ~1 registo (~1%)
-- Grande Cultura: 0 (não tem, ok)
-- Apicultura: 0 (não tem, ok)

-- =====================================================================
-- TESTE 13: INTEGRIDADE REFERENCIAL
-- =====================================================================

\echo '\n🔐 TESTE 13: Integridade básica'
\echo '──────────────────────────────'

-- Verificar se ID é único
SELECT COUNT(*) as ids_duplicados
FROM (
    SELECT id, COUNT(*) FROM culturas_guia GROUP BY id HAVING COUNT(*) > 1
) dups;

-- ESPERADO: 0
-- ❌ FALHAR SE: > 0

-- =====================================================================
-- TESTE 14: COMPARAÇÃO PRÉ/PÓS MIGRAÇÃO
-- =====================================================================

\echo '\n📈 TESTE 14: Comparação pré/pós migração'
\echo '──────────────────────────────────────'

SELECT
    (SELECT COUNT(*) FROM culturas_guia_backup_20260820) as registos_antes,
    (SELECT COUNT(*) FROM culturas_guia) as registos_depois,
    (SELECT COUNT(*) FROM culturas_guia_backup_20260820) -
    (SELECT COUNT(*) FROM culturas_guia) as removidos,
    (SELECT COUNT(DISTINCT categoria) FROM culturas_guia_backup_20260820) as categorias_antes,
    (SELECT COUNT(DISTINCT categoria) FROM culturas_guia) as categorias_depois;

-- ESPERADO:
-- removidos: 4 (Bolota, Amêndoa, Noz, Castanha)
-- categorias_antes: 18
-- categorias_depois: 9

-- =====================================================================
-- TESTE 15: VALIDAÇÃO FINAL (CHECKLIST)
-- =====================================================================

\echo '\n✅ TESTE 15: Checklist Final'
\echo '────────────────────────────'

WITH validacoes AS (
    SELECT
        'Nenhuma categoria nula' as teste,
        CASE WHEN (SELECT COUNT(*) FROM culturas_guia WHERE categoria IS NULL) = 0 THEN '✅' ELSE '❌' END as resultado
    UNION ALL
    SELECT 'Nenhuma categoria híbrida',
        CASE WHEN (SELECT COUNT(*) FROM culturas_guia WHERE categoria ILIKE '%/%') = 0 THEN '✅' ELSE '❌' END
    UNION ALL
    SELECT 'Nenhum produto como cultura',
        CASE WHEN (SELECT COUNT(*) FROM culturas_guia WHERE nome IN ('Maçã', 'Pera', 'Castanha', 'Cereja', 'Amêndoa', 'Noz', 'Bolota')) = 0 THEN '✅' ELSE '❌' END
    UNION ALL
    SELECT 'Nenhum erro de digitação (Chila, Bróculos, etc)',
        CASE WHEN (SELECT COUNT(*) FROM culturas_guia WHERE nome IN ('Chila', 'Bróculos', 'Rubabarbo', 'Salva', 'Corgete')) = 0 THEN '✅' ELSE '❌' END
    UNION ALL
    SELECT 'Nenhum nome nulo',
        CASE WHEN (SELECT COUNT(*) FROM culturas_guia WHERE nome IS NULL OR TRIM(nome) = '') = 0 THEN '✅' ELSE '❌' END
    UNION ALL
    SELECT 'Todos com nome científico',
        CASE WHEN (SELECT COUNT(*) FROM culturas_guia WHERE nome_cientifico IS NULL OR TRIM(nome_cientifico) = '') = 0 THEN '✅' ELSE '❌' END
    UNION ALL
    SELECT 'Nenhum duplicado exacto',
        CASE WHEN (SELECT COUNT(*) FROM culturas_guia GROUP BY nome, categoria HAVING COUNT(*) > 1) = 0 THEN '✅' ELSE '❌' END
    UNION ALL
    SELECT 'Apenas categorias canónicas',
        CASE WHEN (SELECT COUNT(DISTINCT categoria) FROM culturas_guia WHERE categoria NOT IN ('Aromática', 'Árvore Florestal', 'Cereal', 'Fruteira', 'Hortaliça', 'Legume', 'Ornamental', 'Tubérculo')) = 0 THEN '✅' ELSE '❌' END
)
SELECT teste, resultado FROM validacoes ORDER BY teste;

-- =====================================================================
-- RESUMO FINAL
-- =====================================================================

\echo '\n=================================================='
\echo '✅ TESTES CONCLUÍDOS'
\echo '=================================================='
\echo 'Se todos os testes mostrarem ✅, a migração foi bem-sucedida!'
\echo 'Se houver ❌, investigar e executar ROLLBACK se necessário.'
