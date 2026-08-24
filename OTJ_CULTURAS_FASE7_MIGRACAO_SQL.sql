-- =====================================================================
-- OTJ — AUDITORIA CULTURAS_GUIA
-- FASE 7: EXTENSÃO — SQL MIGRATION SCRIPT
-- =====================================================================
-- Data: 20 de Agosto de 2026
-- Status: PRONTO PARA EXECUÇÃO
-- Objectivo: Adicionar tipo_cultura, subcategoria, tabelas N:N
-- =====================================================================

-- ⚠️ AVISOS CRÍTICOS:
-- 1. Executar em ambiente de STAGING primeiro
-- 2. Fazer BACKUP da base de dados ANTES
-- 3. Lê este script TODO antes de executar
-- 4. Usar ROLLBACK se algo correr mal
-- 5. Validar cada passo após execução

-- =====================================================================
-- FASE 7.1: BACKUP LÓGICO
-- =====================================================================

\echo '🔄 [FASE 7.1] Criando backup lógico...'

CREATE TABLE culturas_guia_backup_fase7_20260820 AS
SELECT * FROM culturas_guia;

\echo '✅ Backup criado: culturas_guia_backup_fase7_20260820'

SELECT COUNT(*) as registos_backup FROM culturas_guia_backup_fase7_20260820;

-- =====================================================================
-- FASE 7.2: VALIDAÇÃO PRÉ-MIGRAÇÃO
-- =====================================================================

\echo '\n🔍 [FASE 7.2] Validações pré-migração...'

-- Contar registos antes
SELECT COUNT(*) as total_antes FROM culturas_guia;

-- Verificar que não há NULL em campos críticos
SELECT COUNT(*) as nomes_nulos FROM culturas_guia WHERE nome IS NULL;
SELECT COUNT(*) as categorias_nulas FROM culturas_guia WHERE categoria IS NULL;
SELECT COUNT(*) as cientificos_nulos FROM culturas_guia WHERE nome_cientifico IS NULL;

\echo '✅ Validações pré-migração completas'

-- =====================================================================
-- FASE 7.3: INÍCIO DA TRANSAÇÃO
-- =====================================================================

\echo '\n⏳ [FASE 7.3] Iniciando transação...'
BEGIN;

-- =====================================================================
-- FASE 7.4: ADICIONAR COLUNAS A culturas_guia
-- =====================================================================

\echo '\n➕ [FASE 7.4] Adicionando colunas a culturas_guia...'

ALTER TABLE culturas_guia ADD COLUMN tipo_cultura VARCHAR;
\echo 'Adicionada coluna: tipo_cultura'

ALTER TABLE culturas_guia ADD COLUMN subcategoria VARCHAR;
\echo 'Adicionada coluna: subcategoria'

ALTER TABLE culturas_guia ADD COLUMN descricao_estendida TEXT;
\echo 'Adicionada coluna: descricao_estendida'

ALTER TABLE culturas_guia ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
\echo 'Adicionada coluna: updated_at'

\echo '✅ Colunas adicionadas'

-- =====================================================================
-- FASE 7.5: POPULAR tipo_cultura (POR CATEGORIA)
-- =====================================================================

\echo '\n📝 [FASE 7.5] Populando tipo_cultura...'

-- Hortaliças (maioria Anual)
UPDATE culturas_guia
SET tipo_cultura = 'Anual'
WHERE categoria = 'Hortaliça'
AND nome NOT IN ('Ruibarbo', 'Espargos'); -- Exceções perenes
\echo 'Hortaliças (Anual) atribuídas'

-- Hortaliças Perenes
UPDATE culturas_guia
SET tipo_cultura = 'Perene'
WHERE nome IN ('Ruibarbo', 'Espargos');
\echo 'Hortaliças (Perene) atribuídas'

-- Aromáticas (maioria Perene)
UPDATE culturas_guia
SET tipo_cultura = 'Perene'
WHERE categoria = 'Aromática';
\echo 'Aromáticas (Perene) atribuídas'

-- Fruteiras (Arbóreas)
UPDATE culturas_guia
SET tipo_cultura = 'Arbórea'
WHERE categoria = 'Fruteira';
\echo 'Fruteiras (Arbórea) atribuídas'

-- Árvores Florestais (Arbóreas)
UPDATE culturas_guia
SET tipo_cultura = 'Arbórea'
WHERE categoria = 'Árvore Florestal';
\echo 'Árvores Florestais (Arbórea) atribuídas'

-- Cereais (Anual)
UPDATE culturas_guia
SET tipo_cultura = 'Anual'
WHERE categoria = 'Cereal';
\echo 'Cereais (Anual) atribuídas'

-- Legumes (Anual)
UPDATE culturas_guia
SET tipo_cultura = 'Anual'
WHERE categoria = 'Legume';
\echo 'Legumes (Anual) atribuídas'

-- Ornamentais (Arbustiva)
UPDATE culturas_guia
SET tipo_cultura = 'Arbustiva'
WHERE categoria = 'Ornamental';
\echo 'Ornamentais (Arbustiva) atribuídas'

-- Tubérculos (Anual)
UPDATE culturas_guia
SET tipo_cultura = 'Anual'
WHERE categoria = 'Tubérculo';
\echo 'Tubérculos (Anual) atribuídas'

\echo '✅ tipo_cultura populado'

-- =====================================================================
-- FASE 7.6: POPULAR subcategoria (REFINAMENTO)
-- =====================================================================

\echo '\n📝 [FASE 7.6] Populando subcategoria...'

-- Aromáticas medicinais
UPDATE culturas_guia
SET subcategoria = 'Medicinal'
WHERE categoria = 'Aromática' AND nome IN (
  'Cidreira', 'Sálvia', 'Gengibre', 'Malva', 'Camomila'
);
\echo 'Aromáticas Medicinais marcadas'

-- Ornamentais
UPDATE culturas_guia
SET subcategoria = 'Decorativa'
WHERE categoria = 'Ornamental';
\echo 'Ornamentais Decorativas marcadas'

\echo '✅ subcategoria populado'

-- =====================================================================
-- FASE 7.7: CRIAR TABELA culturas_aptidoes (N:N)
-- =====================================================================

\echo '\n🆕 [FASE 7.7] Criando tabela culturas_aptidoes...'

CREATE TABLE culturas_aptidoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cultura_id UUID NOT NULL REFERENCES culturas_guia(id) ON DELETE CASCADE,
  aptidao VARCHAR NOT NULL,
  descricao TEXT,
  peso_importancia INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(cultura_id, aptidao)
);

CREATE INDEX idx_culturas_aptidoes_cultura_id ON culturas_aptidoes(cultura_id);
CREATE INDEX idx_culturas_aptidoes_aptidao ON culturas_aptidoes(aptidao);

\echo '✅ Tabela culturas_aptidoes criada'

-- =====================================================================
-- FASE 7.8: POPULAR culturas_aptidoes
-- =====================================================================

\echo '\n📝 [FASE 7.8] Populando culturas_aptidoes...'

-- NOGUEIRA: Fruteira + Florestal
INSERT INTO culturas_aptidoes (cultura_id, aptidao, peso_importancia, descricao)
SELECT id, 'Fruteira', 1, 'Produção de noz' FROM culturas_guia WHERE nome = 'Nogueira'
UNION ALL
SELECT id, 'Florestal', 2, 'Valor de madeira' FROM culturas_guia WHERE nome = 'Nogueira';

-- AZINHEIRA: Florestal + Cortiça
INSERT INTO culturas_aptidoes (cultura_id, aptidao, peso_importancia, descricao)
SELECT id, 'Árvore Florestal', 1, 'Madeira e conservação' FROM culturas_guia WHERE nome = 'Azinheira'
UNION ALL
SELECT id, 'Cortiça', 1, 'Produção de cortiça' FROM culturas_guia WHERE nome = 'Azinheira';

-- SOBREIRO: Florestal + Cortiça
INSERT INTO culturas_aptidoes (cultura_id, aptidao, peso_importancia, descricao)
SELECT id, 'Árvore Florestal', 1, 'Madeira' FROM culturas_guia WHERE nome = 'Sobreiro'
UNION ALL
SELECT id, 'Cortiça', 1, 'Produção de cortiça' FROM culturas_guia WHERE nome = 'Sobreiro';

-- LAVANDA: Aromática + Ornamental
INSERT INTO culturas_aptidoes (cultura_id, aptidao, peso_importancia, descricao)
SELECT id, 'Aromática', 1, 'Óleo essencial e tempero' FROM culturas_guia WHERE nome = 'Lavanda'
UNION ALL
SELECT id, 'Ornamental', 2, 'Decoração' FROM culturas_guia WHERE nome = 'Lavanda';

-- MORANGO: Fruteira + Ornamental
INSERT INTO culturas_aptidoes (cultura_id, aptidao, peso_importancia, descricao)
SELECT id, 'Fruteira', 1, 'Fruto comestível' FROM culturas_guia WHERE nome = 'Morango'
UNION ALL
SELECT id, 'Ornamental', 2, 'Plantas decorativas' FROM culturas_guia WHERE nome = 'Morango';

-- FEIJÃO: Legume + Fixadora de N
INSERT INTO culturas_aptidoes (cultura_id, aptidao, peso_importancia, descricao)
SELECT id, 'Legume', 1, 'Produção de grão' FROM culturas_guia WHERE nome IN ('Feijão', 'Grão-de-bico')
UNION ALL
SELECT id, 'Fixadora N', 2, 'Enriquecimento do solo' FROM culturas_guia WHERE nome IN ('Feijão', 'Grão-de-bico');

\echo '✅ culturas_aptidoes populado'

-- =====================================================================
-- FASE 7.9: CRIAR TABELA culturas_produtos (N:N)
-- =====================================================================

\echo '\n🆕 [FASE 7.9] Criando tabela culturas_produtos...'

CREATE TABLE culturas_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cultura_id UUID NOT NULL REFERENCES culturas_guia(id) ON DELETE CASCADE,
  produto_nome VARCHAR NOT NULL,
  produto_cientifico VARCHAR,
  descricao TEXT,
  peso_importancia INT DEFAULT 1,
  parte_planta VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(cultura_id, produto_nome)
);

CREATE INDEX idx_culturas_produtos_cultura_id ON culturas_produtos(cultura_id);
CREATE INDEX idx_culturas_produtos_nome ON culturas_produtos(produto_nome);

\echo '✅ Tabela culturas_produtos criada'

-- =====================================================================
-- FASE 7.10: POPULAR culturas_produtos
-- =====================================================================

\echo '\n📝 [FASE 7.10] Populando culturas_produtos...'

-- MACIEIRA → Maçã
INSERT INTO culturas_produtos (cultura_id, produto_nome, descricao, peso_importancia, parte_planta)
SELECT id, 'Maçã', 'Fruto comestível principal', 1, 'Fruto'
FROM culturas_guia WHERE nome = 'Macieira';

-- PEREIRA → Pera
INSERT INTO culturas_produtos (cultura_id, produto_nome, descricao, peso_importancia, parte_planta)
SELECT id, 'Pera', 'Fruto comestível principal', 1, 'Fruto'
FROM culturas_guia WHERE nome = 'Pereira';

-- CEREJEIRA → Cereja
INSERT INTO culturas_produtos (cultura_id, produto_nome, descricao, peso_importancia, parte_planta)
SELECT id, 'Cereja', 'Fruto comestível principal', 1, 'Fruto'
FROM culturas_guia WHERE nome = 'Cerejeira';

-- NOGUEIRA → Noz + Madeira
INSERT INTO culturas_produtos (cultura_id, produto_nome, descricao, peso_importancia, parte_planta)
SELECT id, 'Noz', 'Sementes comestíveis', 1, 'Fruto/Sementes' FROM culturas_guia WHERE nome = 'Nogueira'
UNION ALL
SELECT id, 'Madeira', 'Madeira de qualidade', 2, 'Tronco' FROM culturas_guia WHERE nome = 'Nogueira';

-- AZINHEIRA → Bolota
INSERT INTO culturas_produtos (cultura_id, produto_nome, descricao, peso_importancia, parte_planta)
SELECT id, 'Bolota', 'Fruto (alimentação animal)', 1, 'Fruto'
FROM culturas_guia WHERE nome = 'Azinheira';

-- SOBREIRO → Cortiça + Madeira
INSERT INTO culturas_produtos (cultura_id, produto_nome, descricao, peso_importancia, parte_planta)
SELECT id, 'Cortiça', 'Casca para isolamento', 1, 'Casca' FROM culturas_guia WHERE nome = 'Sobreiro'
UNION ALL
SELECT id, 'Madeira', 'Madeira', 2, 'Tronco' FROM culturas_guia WHERE nome = 'Sobreiro';

-- CIDREIRA → Chá + Óleo
INSERT INTO culturas_produtos (cultura_id, produto_nome, descricao, peso_importancia, parte_planta)
SELECT id, 'Chá', 'Infusão de folhas', 1, 'Folhas' FROM culturas_guia WHERE nome = 'Cidreira'
UNION ALL
SELECT id, 'Óleo essencial', 'Óleo aromático', 2, 'Folhas' FROM culturas_guia WHERE nome = 'Cidreira';

-- LAVANDA → Óleo + Flor Seca
INSERT INTO culturas_produtos (cultura_id, produto_nome, descricao, peso_importancia, parte_planta)
SELECT id, 'Óleo essencial', 'Óleo aromático', 1, 'Flores' FROM culturas_guia WHERE nome = 'Lavanda'
UNION ALL
SELECT id, 'Flor seca', 'Para decoração', 2, 'Flores' FROM culturas_guia WHERE nome = 'Lavanda';

\echo '✅ culturas_produtos populado'

-- =====================================================================
-- FASE 7.11: VALIDAÇÃO PÓS-MIGRAÇÃO
-- =====================================================================

\echo '\n🔍 [FASE 7.11] Validações pós-migração...'

-- Verificar que todas as colunas foram adicionadas
\echo 'Verificando novas colunas...'
SELECT COUNT(*) as total_com_tipo FROM culturas_guia WHERE tipo_cultura IS NOT NULL;

-- Verificar tabelas criadas
\echo 'Verificando tabelas criadas...'
SELECT COUNT(*) as aptidoes_total FROM culturas_aptidoes;
SELECT COUNT(*) as produtos_total FROM culturas_produtos;

-- Verificar integridade referencial
\echo 'Verificando integridade referencial (aptidoes)...'
SELECT COUNT(*) as aptidoes_orfaos FROM culturas_aptidoes ca
WHERE NOT EXISTS (SELECT 1 FROM culturas_guia cg WHERE cg.id = ca.cultura_id);

\echo 'Verificando integridade referencial (produtos)...'
SELECT COUNT(*) as produtos_orfaos FROM culturas_produtos cp
WHERE NOT EXISTS (SELECT 1 FROM culturas_guia cg WHERE cg.id = cp.cultura_id);

-- Verificar distribuição de tipo_cultura
\echo 'Distribuição de tipo_cultura:'
SELECT tipo_cultura, COUNT(*) as quantidade FROM culturas_guia GROUP BY tipo_cultura ORDER BY tipo_cultura;

-- Verificar culturas com múltiplas aptidões
\echo 'Culturas com múltiplas aptidões:'
SELECT c.nome, COUNT(a.id) as num_aptidoes FROM culturas_guia c
LEFT JOIN culturas_aptidoes a ON c.id = a.cultura_id
WHERE c.categoria IN ('Fruteira', 'Aromática', 'Árvore Florestal')
GROUP BY c.id, c.nome
HAVING COUNT(a.id) > 1
ORDER BY num_aptidoes DESC;

-- Verificar culturas com múltiplos produtos
\echo 'Culturas com múltiplos produtos:'
SELECT c.nome, COUNT(p.id) as num_produtos FROM culturas_guia c
LEFT JOIN culturas_produtos p ON c.id = p.cultura_id
GROUP BY c.id, c.nome
HAVING COUNT(p.id) > 1
ORDER BY num_produtos DESC;

\echo '✅ Validações completas'

-- =====================================================================
-- FASE 7.12: COMPARAÇÃO PRÉ/PÓS
-- =====================================================================

\echo '\n📊 [FASE 7.12] Comparação pré/pós migração...'

SELECT
    (SELECT COUNT(*) FROM culturas_guia_backup_fase7_20260820) as registos_originais,
    (SELECT COUNT(*) FROM culturas_guia) as registos_apos,
    (SELECT COUNT(*) FROM culturas_aptidoes) as aptidoes_adicionadas,
    (SELECT COUNT(*) FROM culturas_produtos) as produtos_adicionados,
    (SELECT COUNT(DISTINCT cultura_id) FROM culturas_aptidoes) as culturas_com_aptidoes,
    (SELECT COUNT(DISTINCT cultura_id) FROM culturas_produtos) as culturas_com_produtos;

-- =====================================================================
-- ⚠️ DECISÃO FINAL: COMMIT ou ROLLBACK
-- =====================================================================

-- SE TUDO OK: COMMIT
\echo '\n✅ SE TUDO OK, EXECUTE: COMMIT;'
-- COMMIT;

-- SE PROBLEMA: ROLLBACK
\echo '❌ SE HOUVER PROBLEMA, EXECUTE: ROLLBACK;'
-- ROLLBACK;

-- =====================================================================
-- FASE 7.13: LIMPEZA (APÓS COMMIT)
-- =====================================================================

-- ✅ APÓS CONFIRMAR QUE TUDO FUNCIONOU:
-- Manter culturas_guia_backup_fase7_20260820 por 7 dias
-- Depois: DROP TABLE culturas_guia_backup_fase7_20260820;

\echo '\n✅ FIM DO SCRIPT DE MIGRAÇÃO FASE 7'
\echo 'Próximo passo: Verificar dados, executar COMMIT, executar testes'
