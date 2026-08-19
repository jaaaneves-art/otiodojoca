/**
 * Ficheiro: 007-FREGUESIA-ponte-verticais.sql
 * Projeto: O Tio do Joca — Módulo Freguesia
 * Fase: B — Migrações versionadas
 * Data: 19 ago 2026
 *
 * Implementação da DECISÃO 000 — Ponte com verticais
 * 
 * Objetivo: Sincronizar entidades de COMER e ALOJAMENTO com `entidades`
 * Padrão: restaurantes/alojamentos mantêm-se fonte de verdade;
 *         `entidades` guarda espelho leve (ref_tabela, ref_id)
 */

-- ==============================================================================
-- PASSO 1: Criar espelhos para restaurantes existentes
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id, localizacao_id,
  telefone, email, website,
  ref_tabela, ref_id,
  origem, estado, criado_por
)
SELECT
  r.nome,
  LOWER(REPLACE(REPLACE(r.nome, ' ', '-'), 'ç', 'c')) || '-' || r.id::TEXT,
  r.descricao,
  (SELECT id FROM categorias_entidade WHERE slug = 'comercio-servicos'),
  r.freguesia_id,
  r.localizacao_id,
  r.telefone,
  r.email,
  r.website,
  'restaurantes'::VARCHAR(50),
  r.id,
  'seed ponte verticais',
  'publicado',
  'sistema'
FROM restaurantes r
WHERE NOT EXISTS (
  SELECT 1 FROM entidades e
  WHERE e.ref_tabela = 'restaurantes' AND e.ref_id = r.id
)
ON CONFLICT (ref_tabela, ref_id) DO NOTHING;

-- ==============================================================================
-- PASSO 2: Criar espelhos para alojamentos existentes
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id, localizacao_id,
  telefone, email, website,
  ref_tabela, ref_id,
  origem, estado, criado_por
)
SELECT
  a.nome,
  LOWER(REPLACE(REPLACE(a.nome, ' ', '-'), 'ç', 'c')) || '-' || a.id::TEXT,
  a.descricao,
  (SELECT id FROM categorias_entidade WHERE slug = 'turismo'),
  a.freguesia_id,
  a.localizacao_id,
  a.telefone,
  a.email,
  a.website,
  'alojamentos'::VARCHAR(50),
  a.id,
  'seed ponte verticais',
  'publicado',
  'sistema'
FROM alojamentos a
WHERE NOT EXISTS (
  SELECT 1 FROM entidades e
  WHERE e.ref_tabela = 'alojamentos' AND e.ref_id = a.id
)
ON CONFLICT (ref_tabela, ref_id) DO NOTHING;

-- ==============================================================================
-- PASSO 3: Adicionar categorias aos restaurantes (como entidades_restaurante)
-- ==============================================================================
-- (Pós-MVP: tabela entidade_categorias_secundarias)

-- ==============================================================================
-- PASSO 4: Documentação do contrato de sincronização
-- ==============================================================================

/*
 * CONTRATO DE SINCRONIZAÇÃO (Decisão 000)
 * 
 * Quando um restaurante/alojamento é CRIADO via COMER/ALOJAMENTO:
 *   1. Server action cria registo em restaurantes/alojamentos
 *   2. Mesmo server action cria espelho em entidades (ref_tabela, ref_id)
 *   3. Sem sincronização bidireccional (um só ponto de escrita)
 * 
 * Quando ACTUALIZADO via COMER/ALOJAMENTO:
 *   1. Update em restaurantes/alojamentos
 *   2. Trigger OU server action atualiza espelho em entidades
 *      (nome, descricao, telefone, email, website, localizacao_id)
 *   3. Campos de entidades gerados automaticamente:
 *      - slug (derivado de nome)
 *      - updated_at (NOW())
 * 
 * Quando ARQUIVADO/DELETADO em COMER/ALOJAMENTO:
 *   1. Estado em restaurantes/alojamentos muda para 'inativo' ou DELETE
 *   2. Espelho em entidades muda para 'arquivado'
 *   3. NÃO deletar de entidades (manter auditoria)
 * 
 * Responsabilidade: Server actions do COMER e ALOJAMENTO
 * Review: Código em lib/comer/actions.ts e lib/alojamento/actions.ts
 */

-- ==============================================================================
-- PASSO 5: Verificação (executar após migração)
-- ==============================================================================

-- Validar que todos os restaurantes/alojamentos têm espelho
/*
SELECT 'restaurantes sem espelho' AS check_type, COUNT(*) as problema
FROM restaurantes r
WHERE NOT EXISTS (
  SELECT 1 FROM entidades e
  WHERE e.ref_tabela = 'restaurantes' AND e.ref_id = r.id
);

SELECT 'alojamentos sem espelho' AS check_type, COUNT(*) as problema
FROM alojamentos a
WHERE NOT EXISTS (
  SELECT 1 FROM entidades e
  WHERE e.ref_tabela = 'alojamentos' AND e.ref_id = a.id
);
*/

COMMENT ON COLUMN entidades.ref_tabela IS 'Tabela vertical: restaurantes | alojamentos (Decisão 000 implementada)';
COMMENT ON COLUMN entidades.ref_id IS 'ID do registo na tabela vertical (uuid)';
