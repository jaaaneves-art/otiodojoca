-- =====================================================================
-- OTJ — AUDITORIA CULTURAS_GUIA
-- FASE 4: MIGRAÇÃO SQL — SCRIPT DE TRANSFORMAÇÃO
-- =====================================================================
-- Data: 20 de agosto de 2026
-- Status: PRONTO PARA EXECUÇÃO
-- Registos afectados: 27 de 76 (35%)
-- =====================================================================

-- ⚠️ AVISOS CRÍTICOS:
-- 1. Executar em ambiente de STAGING primeiro
-- 2. Fazer BACKUP da tabela ANTES de qualquer mudança
-- 3. Lê este script TODO antes de executar
-- 4. Usar ROLLBACK se algo correr mal
-- 5. Validar cada passo após execução

-- =====================================================================
-- FASE 4.1: BACKUP LÓGICO
-- =====================================================================

\echo '🔄 [FASE 4.1] Criando backup lógico da tabela original...'

CREATE TABLE culturas_guia_backup_20260820 AS
SELECT * FROM culturas_guia;

\echo '✅ Backup criado: culturas_guia_backup_20260820'

-- Verificar backup
SELECT COUNT(*) as registos_backup FROM culturas_guia_backup_20260820;

-- =====================================================================
-- FASE 4.2: VALIDAÇÃO PRÉ-MIGRAÇÃO
-- =====================================================================

\echo '\n🔍 [FASE 4.2] Validações pré-migração...'

-- Contar registos antes
SELECT COUNT(*) as total_antes FROM culturas_guia;

-- Listar categorias actuais
SELECT categoria, COUNT(*) as quantidade
FROM culturas_guia
GROUP BY categoria
ORDER BY categoria;

-- Contar registos problemáticos
SELECT
    SUM(CASE WHEN categoria ILIKE '%/%' THEN 1 ELSE 0 END) as categorias_hibridas,
    SUM(CASE WHEN nome ILIKE 'maçã%' OR nome ILIKE 'pera%' OR nome ILIKE 'castanha%' OR
             nome ILIKE 'cereja%' OR nome ILIKE 'amêndoa%' OR nome ILIKE 'noz%'
             OR nome ILIKE 'bolota%' THEN 1 ELSE 0 END) as confusoes_produto_planta,
    SUM(CASE WHEN categoria != UPPER(LEFT(categoria,1)) || LOWER(RIGHT(categoria,-1))
             THEN 1 ELSE 0 END) as capitalizacao_incorreta
FROM culturas_guia;

-- =====================================================================
-- FASE 4.3: INÍCIO DA TRANSAÇÃO
-- =====================================================================

\echo '\n⏳ [FASE 4.3] Iniciando transação...'
BEGIN;

-- =====================================================================
-- FASE 4.4: NORMALIZAÇÃO DE CAPITALIZAÇÃO
-- =====================================================================

\echo '\n✏️  [FASE 4.4] Normalizando capitalização de categorias...'

-- hortaliça → Hortaliça (21 registos)
UPDATE culturas_guia SET categoria = 'Hortaliça' WHERE categoria = 'hortaliça';
\echo 'hortaliça → Hortaliça'

-- fruteira → Fruteira (14 registos)
UPDATE culturas_guia SET categoria = 'Fruteira' WHERE categoria = 'fruteira';
\echo 'fruteira → Fruteira'

-- aromática → Aromática (7 registos)
UPDATE culturas_guia SET categoria = 'Aromática' WHERE categoria = 'aromática';
\echo 'aromática → Aromática'

-- legume → Legume (4 registos)
UPDATE culturas_guia SET categoria = 'Legume' WHERE categoria = 'legume';
\echo 'legume → Legume'

-- cereal → Cereal (5 registos)
UPDATE culturas_guia SET categoria = 'Cereal' WHERE categoria = 'cereal';
\echo 'cereal → Cereal'

-- tubérculo → Tubérculo (1 registo)
UPDATE culturas_guia SET categoria = 'Tubérculo' WHERE categoria = 'tubérculo';
\echo 'tubérculo → Tubérculo'

\echo '✅ Capitalização normalizada'

-- =====================================================================
-- FASE 4.5: DESCOMPOSIÇÃO DE CATEGORIAS HÍBRIDAS
-- =====================================================================

\echo '\n🔀 [FASE 4.5] Descompondo categorias híbridas...'

-- Hortaliça/Perene → Hortaliça (2 registos: Rubabarbo, Espargos)
-- Nota: tipo_cultura será adicionado em migração futura (não existe coluna ainda)
UPDATE culturas_guia
SET categoria = 'Hortaliça'
WHERE categoria = 'Hortaliça/Perene';
\echo 'Hortaliça/Perene → Hortaliça (2 registos)'

-- Fruteira/Florestal → Fruteira (1 registo: Nogueira - produto principal)
UPDATE culturas_guia
SET categoria = 'Fruteira'
WHERE categoria = 'Fruteira/Florestal';
\echo 'Fruteira/Florestal → Fruteira (1 registo)'

-- Aromática/Medicinal → Aromática (1 registo: Cidreira)
UPDATE culturas_guia
SET categoria = 'Aromática'
WHERE categoria = 'Aromática/Medicinal';
\echo 'Aromática/Medicinal → Aromática (1 registo)'

-- Flor/Aromática → Aromática (1 registo: Lavanda)
UPDATE culturas_guia
SET categoria = 'Aromática'
WHERE categoria = 'Flor/Aromática';
\echo 'Flor/Aromática → Aromática (1 registo)'

-- Flor/Ornamental → Ornamental (1 registo: Roseira)
UPDATE culturas_guia
SET categoria = 'Ornamental'
WHERE categoria = 'Flor/Ornamental';
\echo 'Flor/Ornamental → Ornamental (1 registo)'

\echo '✅ Categorias híbridas descompostas'

-- =====================================================================
-- FASE 4.6: RECATEGORIZAÇÃO
-- =====================================================================

\echo '\n🏷️  [FASE 4.6] Recategorizando entradas incorrectas...'

-- Curcubitácea → Hortaliça (1 registo: Chila)
-- Nota: Curcubitácea é uma família botânica, não uma categoria OTJ
UPDATE culturas_guia
SET categoria = 'Hortaliça'
WHERE categoria = 'Curcubitácea';
\echo 'Curcubitácea → Hortaliça (1 registo)'

\echo '✅ Recategorização completa'

-- =====================================================================
-- FASE 4.7: CORREÇÃO DE NOMES (ERROS DE DIGITAÇÃO)
-- =====================================================================

\echo '\n✏️  [FASE 4.7] Corrigindo erros de digitação e nomes comuns...'

-- Chila → Chuchu
UPDATE culturas_guia
SET nome = 'Chuchu'
WHERE nome = 'Chila' AND nome_cientifico = 'Sechium edule';
\echo 'Chila → Chuchu'

-- Bróculos → Brócolo
UPDATE culturas_guia
SET nome = 'Brócolo'
WHERE nome = 'Bróculos' AND nome_cientifico LIKE 'Brassica oleracea%';
\echo 'Bróculos → Brócolo'

-- Rubabarbo → Ruibarbo
UPDATE culturas_guia
SET nome = 'Ruibarbo'
WHERE nome = 'Rubabarbo' AND nome_cientifico = 'Rheum rhabarbarum';
\echo 'Rubabarbo → Ruibarbo'

-- Salva → Sálvia
UPDATE culturas_guia
SET nome = 'Sálvia'
WHERE nome = 'Salva' AND nome_cientifico = 'Salvia officinalis';
\echo 'Salva → Sálvia'

-- Corgete → Courgette
UPDATE culturas_guia
SET nome = 'Courgette'
WHERE nome = 'Corgete' AND nome_cientifico LIKE 'Cucurbita pepo%';
\echo 'Corgete → Courgette'

\echo '✅ Erros de digitação corrigidos'

-- =====================================================================
-- FASE 4.8: RESOLUÇÃO DE CONFUSÕES PLANTA/PRODUTO
-- =====================================================================

\echo '\n🌳 [FASE 4.8] Resolvendo confusões planta/produto...'

-- CRITÉRIO DE DECISÃO:
-- Se a planta já existe com o nome correcto, eliminar a entrada de produto
-- Se a planta não existe, renomear a entrada de produto
-- Se existe duplicado potencial, consolidar

-- 1. Maçã vs Macieira
-- Situação: Existe "Maçã" (fruteira) e precisa verificar se existe "Macieira"
-- Decisão: Renomear "Maçã" → "Macieira" (produto → planta)
UPDATE culturas_guia
SET nome = 'Macieira'
WHERE nome = 'Maçã' AND nome_cientifico = 'Malus domestica';
\echo 'Maçã → Macieira'

-- 2. Pera vs Pereira
-- Situação: Apenas "Pera" existe
-- Decisão: Renomear "Pera" → "Pereira"
UPDATE culturas_guia
SET nome = 'Pereira'
WHERE nome = 'Pera' AND nome_cientifico = 'Pyrus communis';
\echo 'Pera → Pereira'

-- 3. Cereja vs Cerejeira
-- Situação: Apenas "Cereja" existe
-- Decisão: Renomear "Cereja" → "Cerejeira"
UPDATE culturas_guia
SET nome = 'Cerejeira'
WHERE nome = 'Cereja' AND nome_cientifico = 'Prunus avium';
\echo 'Cereja → Cerejeira'

-- 4. Amêndoa vs Amendoeira
-- Situação: Existe "Amêndoa" (produto) e "Amendoeira" (planta correcto)
-- Decisão: REMOVER "Amêndoa" (é duplicado, planta correcta já existe)
-- (Será feito em FASE 4.9)
\echo 'Amêndoa: será removida em FASE 4.9 (duplicado de Amendoeira)'

-- 5. Noz vs Nogueira
-- Situação: Existe "Noz" (produto) e "Nogueira" (planta - mas com categoria híbrida)
-- Decisão: REMOVER "Noz" (é duplicado, planta correcta já existe como "Nogueira")
-- (Será feito em FASE 4.9)
\echo 'Noz: será removida em FASE 4.9 (duplicado de Nogueira)'

-- 6. Castanha vs Castanheiro
-- Situação: Existe "Castanha" (produto, Fruteira) e "Castanheiro" (Árvore Florestal)
-- Decisão: REMOVER "Castanha" (é duplicado, planta correcta já existe)
-- (Será feito em FASE 4.9)
\echo 'Castanha: será removida em FASE 4.9 (duplicado de Castanheiro)'

\echo '✅ Confusões planta/produto resolvidas (parcial)'

-- =====================================================================
-- FASE 4.9: REMOÇÃO DE ENTRADAS INVÁLIDAS
-- =====================================================================

\echo '\n🗑️  [FASE 4.9] Removendo entradas inválidas e duplicadas...'

-- AVISOS:
-- ⚠️ ANTES DE EXECUTAR, VERIFICAR OS IDs EXACTOS:
-- 1. ID de "Bolota" (Fruto Florestal)
-- 2. ID de "Amêndoa" (se for duplicado de Amendoeira)
-- 3. ID de "Noz" (se for duplicado de Nogueira)
-- 4. ID de "Castanha" (se for duplicado de Castanheiro)

-- 4.9.1 REMOVER BOLOTA (fruto sem planta associada)
-- Bolota é um fruto (não uma cultura). Azinheira e Sobreiro já existem.
-- Relação produto-planta será criada futura.

\echo 'Verificando Bolota...'
SELECT id, nome, categoria, nome_cientifico
FROM culturas_guia
WHERE nome = 'Bolota' AND categoria = 'Fruto Florestal';

-- REMOVER BOLOTA (quando confirmado ID)
-- DELETE FROM culturas_guia
-- WHERE nome = 'Bolota' AND categoria = 'Fruto Florestal';
-- \echo 'Bolota removida'

\echo '⏸️  Aguardando confirmação de IDs para remover duplicados'
\echo 'Execute manualmente depois de confirmar:'
\echo '  DELETE FROM culturas_guia WHERE nome = "Bolota" AND id = "ID_EXACTO"'
\echo '  DELETE FROM culturas_guia WHERE nome = "Amêndoa" AND id = "ID_EXACTO"'
\echo '  DELETE FROM culturas_guia WHERE nome = "Noz" AND id = "ID_EXACTO"'
\echo '  DELETE FROM culturas_guia WHERE nome = "Castanha" AND id = "ID_EXACTO"'

\echo '✅ Remoções prontas (confirmar IDs manualmente)'

-- =====================================================================
-- FASE 4.10: VALIDAÇÃO PÓS-MIGRAÇÃO
-- =====================================================================

\echo '\n🔍 [FASE 4.10] Validações pós-migração...'

-- Verificar categorias after
\echo 'Categorias após migração:'
SELECT categoria, COUNT(*) as quantidade
FROM culturas_guia
GROUP BY categoria
ORDER BY categoria;

-- Verificar se ainda há categorias híbridas
\echo 'Verificar categorias híbridas restantes:'
SELECT COUNT(*) as hibridas_restantes
FROM culturas_guia
WHERE categoria ILIKE '%/%';

-- Verificar se ainda há categorias com problemas de capitalização
\echo 'Verificar capitalização:'
SELECT COUNT(*) as problemas_capitalizacao
FROM culturas_guia
WHERE categoria ~ '^[a-z]|/[a-z]';

-- Verificar total de registos
SELECT COUNT(*) as total_apos FROM culturas_guia;

-- Listar nomes que ainda podem ser produtos
\echo 'Verificar confusões planta/produto restantes:'
SELECT nome, categoria, nome_cientifico
FROM culturas_guia
WHERE nome ILIKE 'maçã%' OR nome ILIKE 'pera%' OR nome ILIKE 'cereja%'
   OR nome ILIKE 'castanha%' OR nome ILIKE 'amêndoa%' OR nome ILIKE 'noz%'
   OR nome ILIKE 'bolota%';

\echo '✅ Validações completas'

-- =====================================================================
-- FASE 4.11: CONFIRMAÇÃO
-- =====================================================================

\echo '\n📋 [FASE 4.11] Resumo das mudanças...'

-- Comparar antes/depois usando backup
SELECT
    (SELECT COUNT(*) FROM culturas_guia_backup_20260820) as registos_originais,
    (SELECT COUNT(*) FROM culturas_guia) as registos_actuais,
    (SELECT COUNT(DISTINCT categoria) FROM culturas_guia_backup_20260820) as categorias_originais,
    (SELECT COUNT(DISTINCT categoria) FROM culturas_guia) as categorias_actuais;

-- =====================================================================
-- ⚠️ DECISÃO FINAL: COMMIT ou ROLLBACK
-- =====================================================================

-- SE TUDO OK: COMMIT
\echo '\n✅ SE TUDO OK, EXECUTE: COMMIT;'
-- COMMIT;

-- SE PROBLEMA: ROLLBACK
\echo '❌ SE HOUVER PROBLEMA, EXECUTE: ROLLBACK;'
-- ROLLBACK;

-- SE TUDO OK, COMENTAR ROLLBACK E DESCOMENTAR COMMIT ACIMA

-- =====================================================================
-- FASE 4.12: LIMPEZA (APÓS COMMIT)
-- =====================================================================

-- ✅ APÓS CONFIRMAR QUE TUDO FUNCIONOU:
-- Manter culturas_guia_backup_20260820 por 7 dias
-- Depois: DROP TABLE culturas_guia_backup_20260820;

\echo '\n✅ FIM DO SCRIPT DE MIGRAÇÃO'
\echo 'Próximo passo: Verificar dados, executar COMMIT, executar testes'
