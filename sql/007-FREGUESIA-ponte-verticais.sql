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
 *
 * NOTA (Fase D): INSERTs automáticos comentados.
 * Serão executados quando restaurantes/alojamentos tiverem freguesia_id.
 * Por agora, temos apenas a ponte documentada.
 */

-- ==============================================================================
-- CONTRATO DE SINCRONIZAÇÃO (Decisão 000)
-- ==============================================================================

/*
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

COMMENT ON COLUMN entidades.ref_tabela IS 'Tabela vertical: restaurantes | alojamentos (Decisão 000 implementada)';
COMMENT ON COLUMN entidades.ref_id IS 'ID do registo na tabela vertical (uuid)';
