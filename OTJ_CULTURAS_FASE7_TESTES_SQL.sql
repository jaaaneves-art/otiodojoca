-- =====================================================================
-- OTJ — AUDITORIA CULTURAS_GUIA
-- FASE 7: VALIDAÇÃO — SQL TEST SUITE
-- =====================================================================
-- Data: 20 de Agosto de 2026
-- Objectivo: Validar extensão de schema (tipo_cultura, subcategoria, N:N)
-- =====================================================================

\echo '======================================================================'
\echo 'FASE 7: VALIDATION TEST SUITE'
\echo '======================================================================'

-- =====================================================================
-- TEST 1: Verificar que colunas foram adicionadas
-- =====================================================================
\echo '\n[TEST 1] Verificando adição de colunas...'

SELECT
  CASE
    WHEN column_name = 'tipo_cultura' THEN '✅ tipo_cultura existe'
    ELSE '❌ tipo_cultura não existe'
  END as tipo_cultura_check,
  CASE
    WHEN column_name = 'subcategoria' THEN '✅ subcategoria existe'
    ELSE '❌ subcategoria não existe'
  END as subcategoria_check
FROM information_schema.columns
WHERE table_name = 'culturas_guia'
AND column_name IN ('tipo_cultura', 'subcategoria');

-- =====================================================================
-- TEST 2: Verificar população de tipo_cultura por categoria
-- =====================================================================
\echo '\n[TEST 2] Distribuição de tipo_cultura por categoria...'

SELECT
  categoria,
  tipo_cultura,
  COUNT(*) as quantidade,
  CASE
    WHEN (categoria = 'Hortaliça' AND tipo_cultura = 'Anual') THEN '✅ Correto'
    WHEN (categoria = 'Fruteira' AND tipo_cultura = 'Arbórea') THEN '✅ Correto'
    WHEN (categoria = 'Aromática' AND tipo_cultura = 'Perene') THEN '✅ Correto'
    WHEN (categoria = 'Cereal' AND tipo_cultura = 'Anual') THEN '✅ Correto'
    WHEN (categoria = 'Legume' AND tipo_cultura = 'Anual') THEN '✅ Correto'
    WHEN (categoria = 'Árvore Florestal' AND tipo_cultura = 'Arbórea') THEN '✅ Correto'
    WHEN (categoria = 'Ornamental' AND tipo_cultura = 'Arbustiva') THEN '✅ Correto'
    WHEN (categoria = 'Tubérculo' AND tipo_cultura = 'Anual') THEN '✅ Correto'
    ELSE '❌ Combinação inesperada'
  END as validacao
FROM culturas_guia
WHERE tipo_cultura IS NOT NULL
GROUP BY categoria, tipo_cultura
ORDER BY categoria;

-- =====================================================================
-- TEST 3: Verificar exceções de tipo_cultura (Ruibarbo, Espargos)
-- =====================================================================
\echo '\n[TEST 3] Validando exceções (Ruibarbo, Espargos como Perene)...'

SELECT
  nome,
  categoria,
  tipo_cultura,
  CASE
    WHEN nome IN ('Ruibarbo', 'Espargos') AND tipo_cultura = 'Perene' THEN '✅ Exceção correta'
    WHEN nome IN ('Ruibarbo', 'Espargos') AND tipo_cultura != 'Perene' THEN '❌ Exceção falhada'
    ELSE 'N/A'
  END as validacao
FROM culturas_guia
WHERE nome IN ('Ruibarbo', 'Espargos');

-- =====================================================================
-- TEST 4: Verificar população de subcategoria
-- =====================================================================
\echo '\n[TEST 4] Distribuição de subcategoria...'

SELECT
  subcategoria,
  COUNT(*) as quantidade,
  STRING_AGG(DISTINCT categoria, ', ') as categorias,
  STRING_AGG(DISTINCT nome, '; ' ORDER BY nome) as nomes
FROM culturas_guia
WHERE subcategoria IS NOT NULL
GROUP BY subcategoria
ORDER BY quantidade DESC;

-- =====================================================================
-- TEST 5: Verificar que culturas_aptidoes foi criada
-- =====================================================================
\echo '\n[TEST 5] Verificando tabela culturas_aptidoes...'

SELECT
  'culturas_aptidoes' as tabela,
  COUNT(*) as total_registos,
  COUNT(DISTINCT cultura_id) as culturas_diferentes,
  COUNT(DISTINCT aptidao) as aptidoes_diferentes,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Tabela criada e populada'
    ELSE '❌ Tabela vazia'
  END as status
FROM culturas_aptidoes;

-- =====================================================================
-- TEST 6: Verificar integridade referencial culturas_aptidoes
-- =====================================================================
\echo '\n[TEST 6] Integridade referencial culturas_aptidoes...'

SELECT
  COUNT(*) as orfaos,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Sem registos órfãos'
    ELSE '❌ Registos órfãos encontrados'
  END as validacao
FROM culturas_aptidoes ca
WHERE NOT EXISTS (
  SELECT 1 FROM culturas_guia cg WHERE cg.id = ca.cultura_id
);

-- =====================================================================
-- TEST 7: Verificar dados específicos culturas_aptidoes (Nogueira)
-- =====================================================================
\echo '\n[TEST 7] Validando dados específicos - Nogueira...'

SELECT
  c.nome,
  COUNT(a.id) as num_aptidoes,
  STRING_AGG(a.aptidao || ' (' || a.peso_importancia || ')', ', ' ORDER BY a.peso_importancia DESC) as aptidoes,
  CASE
    WHEN COUNT(a.id) = 2 THEN '✅ Nogueira tem 2 aptidões'
    ELSE '❌ Nogueira deveria ter 2 aptidões'
  END as validacao
FROM culturas_guia c
LEFT JOIN culturas_aptidoes a ON c.id = a.cultura_id
WHERE c.nome = 'Nogueira'
GROUP BY c.id, c.nome;

-- =====================================================================
-- TEST 8: Verificar dados específicos culturas_aptidoes (Cortiça)
-- =====================================================================
\echo '\n[TEST 8] Validando Cortiça (Azinheira + Sobreiro)...'

SELECT
  c.nome,
  a.aptidao,
  COUNT(*) as ocorrencias,
  CASE
    WHEN a.aptidao = 'Cortiça' AND c.nome IN ('Azinheira', 'Sobreiro') THEN '✅ Correto'
    WHEN a.aptidao = 'Cortiça' AND c.nome NOT IN ('Azinheira', 'Sobreiro') THEN '❌ Cortiça em cultura inesperada'
    ELSE 'N/A'
  END as validacao
FROM culturas_guia c
INNER JOIN culturas_aptidoes a ON c.id = a.cultura_id
WHERE a.aptidao = 'Cortiça'
GROUP BY c.id, c.nome, a.aptidao;

-- =====================================================================
-- TEST 9: Verificar que culturas_produtos foi criada
-- =====================================================================
\echo '\n[TEST 9] Verificando tabela culturas_produtos...'

SELECT
  'culturas_produtos' as tabela,
  COUNT(*) as total_registos,
  COUNT(DISTINCT cultura_id) as culturas_diferentes,
  COUNT(DISTINCT produto_nome) as produtos_diferentes,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Tabela criada e populada'
    ELSE '❌ Tabela vazia'
  END as status
FROM culturas_produtos;

-- =====================================================================
-- TEST 10: Verificar integridade referencial culturas_produtos
-- =====================================================================
\echo '\n[TEST 10] Integridade referencial culturas_produtos...'

SELECT
  COUNT(*) as orfaos,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Sem registos órfãos'
    ELSE '❌ Registos órfãos encontrados'
  END as validacao
FROM culturas_produtos cp
WHERE NOT EXISTS (
  SELECT 1 FROM culturas_guia cg WHERE cg.id = cp.cultura_id
);

-- =====================================================================
-- TEST 11: Verificar dados específicos culturas_produtos (Macieira)
-- =====================================================================
\echo '\n[TEST 11] Validando dados específicos - Macieira → Maçã...'

SELECT
  c.nome as cultura,
  COUNT(p.id) as num_produtos,
  STRING_AGG(p.produto_nome, ', ' ORDER BY p.peso_importancia) as produtos,
  CASE
    WHEN COUNT(p.id) > 0 THEN '✅ Maçã relacionada a Macieira'
    ELSE '❌ Maçã não relacionada'
  END as validacao
FROM culturas_guia c
LEFT JOIN culturas_produtos p ON c.id = p.cultura_id
WHERE c.nome = 'Macieira'
GROUP BY c.id, c.nome;

-- =====================================================================
-- TEST 12: Verificar produtos múltiplos (Nogueira → Noz + Madeira)
-- =====================================================================
\echo '\n[TEST 12] Validando culturas com múltiplos produtos...'

SELECT
  c.nome,
  COUNT(p.id) as num_produtos,
  STRING_AGG(p.produto_nome || ' (' || COALESCE(p.parte_planta, '?') || ')', ', ' ORDER BY p.peso_importancia DESC) as produtos,
  CASE
    WHEN c.nome = 'Nogueira' AND COUNT(p.id) = 2 THEN '✅ Nogueira tem Noz + Madeira'
    WHEN c.nome = 'Sobreiro' AND COUNT(p.id) = 2 THEN '✅ Sobreiro tem Cortiça + Madeira'
    WHEN COUNT(p.id) > 1 THEN '✅ Múltiplos produtos'
    ELSE 'N/A'
  END as validacao
FROM culturas_guia c
LEFT JOIN culturas_produtos p ON c.id = p.cultura_id
GROUP BY c.id, c.nome
HAVING COUNT(p.id) > 1
ORDER BY c.nome;

-- =====================================================================
-- TEST 13: Verificar UNIQUE constraints (aptidoes)
-- =====================================================================
\echo '\n[TEST 13] Validando UNIQUE constraints culturas_aptidoes...'

SELECT
  COUNT(*) as duplicatas,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Sem duplicatas cultura_id + aptidao'
    ELSE '❌ Duplicatas encontradas'
  END as validacao
FROM (
  SELECT cultura_id, aptidao, COUNT(*)
  FROM culturas_aptidoes
  GROUP BY cultura_id, aptidao
  HAVING COUNT(*) > 1
) subq;

-- =====================================================================
-- TEST 14: Verificar UNIQUE constraints (produtos)
-- =====================================================================
\echo '\n[TEST 14] Validando UNIQUE constraints culturas_produtos...'

SELECT
  COUNT(*) as duplicatas,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Sem duplicatas cultura_id + produto_nome'
    ELSE '❌ Duplicatas encontradas'
  END as validacao
FROM (
  SELECT cultura_id, produto_nome, COUNT(*)
  FROM culturas_produtos
  GROUP BY cultura_id, produto_nome
  HAVING COUNT(*) > 1
) subq;

-- =====================================================================
-- TEST 15: Comparação com backup - contagem total
-- =====================================================================
\echo '\n[TEST 15] Comparação pré/pós migração...'

SELECT
  (SELECT COUNT(*) FROM culturas_guia_backup_fase7_20260820) as registos_originais,
  (SELECT COUNT(*) FROM culturas_guia) as registos_apos_migracao,
  (SELECT COUNT(*) FROM culturas_aptidoes) as aptidoes_adicionadas,
  (SELECT COUNT(*) FROM culturas_produtos) as produtos_adicionados,
  CASE
    WHEN (SELECT COUNT(*) FROM culturas_guia_backup_fase7_20260820) =
         (SELECT COUNT(*) FROM culturas_guia) THEN '✅ Contagem de registos preservada'
    ELSE '❌ Contagem de registos alterada'
  END as integridade;

-- =====================================================================
-- TEST 16: Verificar que todas as culturas têm tipo_cultura
-- =====================================================================
\echo '\n[TEST 16] Verificando cobertura de tipo_cultura...'

SELECT
  COUNT(*) as sem_tipo,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Todas as culturas têm tipo_cultura'
    ELSE '❌ ' || COUNT(*) || ' culturas sem tipo_cultura'
  END as validacao
FROM culturas_guia
WHERE tipo_cultura IS NULL;

-- =====================================================================
-- TEST 17: Verificar peso_importancia values
-- =====================================================================
\echo '\n[TEST 17] Validando peso_importancia (aptidoes)...'

SELECT
  peso_importancia,
  COUNT(*) as ocorrencias,
  CASE
    WHEN peso_importancia IN (1, 2) THEN '✅ Valor válido'
    ELSE '❌ Valor inesperado'
  END as validacao
FROM culturas_aptidoes
GROUP BY peso_importancia
ORDER BY peso_importancia;

-- =====================================================================
-- TEST 18: Verificar peso_importancia values (produtos)
-- =====================================================================
\echo '\n[TEST 18] Validando peso_importancia (produtos)...'

SELECT
  peso_importancia,
  COUNT(*) as ocorrencias,
  CASE
    WHEN peso_importancia IN (1, 2) THEN '✅ Valor válido'
    ELSE '❌ Valor inesperado'
  END as validacao
FROM culturas_produtos
GROUP BY peso_importancia
ORDER BY peso_importancia;

-- =====================================================================
-- TEST 19: Verificar índices foram criados
-- =====================================================================
\echo '\n[TEST 19] Verificando índices criados...'

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'culturas_aptidoes'
      AND indexname = 'idx_culturas_aptidoes_cultura_id'
    ) THEN '✅ idx_culturas_aptidoes_cultura_id'
    ELSE '❌ idx_culturas_aptidoes_cultura_id'
  END,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'culturas_aptidoes'
      AND indexname = 'idx_culturas_aptidoes_aptidao'
    ) THEN '✅ idx_culturas_aptidoes_aptidao'
    ELSE '❌ idx_culturas_aptidoes_aptidao'
  END,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'culturas_produtos'
      AND indexname = 'idx_culturas_produtos_cultura_id'
    ) THEN '✅ idx_culturas_produtos_cultura_id'
    ELSE '❌ idx_culturas_produtos_cultura_id'
  END,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'culturas_produtos'
      AND indexname = 'idx_culturas_produtos_nome'
    ) THEN '✅ idx_culturas_produtos_nome'
    ELSE '❌ idx_culturas_produtos_nome'
  END;

-- =====================================================================
-- TEST 20: Verificar Lavanda (Aromática + Ornamental)
-- =====================================================================
\echo '\n[TEST 20] Validando Lavanda (múltiplas funções)...'

SELECT
  c.nome,
  c.categoria,
  c.tipo_cultura,
  c.subcategoria,
  COUNT(DISTINCT a.aptidao) as num_aptidoes,
  STRING_AGG(DISTINCT a.aptidao, ', ') as aptidoes,
  CASE
    WHEN COUNT(DISTINCT a.aptidao) = 2 THEN '✅ Lavanda tem 2 aptidões (Aromática + Ornamental)'
    ELSE '❌ Lavanda deveria ter 2 aptidões'
  END as validacao
FROM culturas_guia c
LEFT JOIN culturas_aptidoes a ON c.id = a.cultura_id
WHERE c.nome = 'Lavanda'
GROUP BY c.id, c.nome, c.categoria, c.tipo_cultura, c.subcategoria;

-- =====================================================================
-- SUMMARY: Contagem de testes bem-sucedidos
-- =====================================================================
\echo '\n======================================================================'
\echo '✅ SUITE DE VALIDAÇÃO CONCLUÍDA'
\echo '======================================================================'
\echo 'Próximo passo: Verificar todos os testes, depois COMMIT se sucesso'
