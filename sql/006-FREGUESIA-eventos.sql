/**
 * Tabela: eventos
 * Projeto: O Tio do Joca — Módulo Freguesia
 * Fase: B — Migrações versionadas
 * Data: 19 ago 2026
 *
 * Sistema de eventos unificado para Freguesia e Agenda Agrícola
 * Princípio: evento != organizador (uma comissão pode organizar múltiplos eventos)
 */

CREATE TABLE IF NOT EXISTS eventos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  -- Identificação
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  descricao TEXT,
  fotografias TEXT[], -- array de URLs
  
  -- Localização temporal
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ,
  freguesia_id BIGINT NOT NULL REFERENCES freguesias(id),
  lugar TEXT, -- nome informal
  localizacao_id BIGINT REFERENCES localizacoes(id),
  
  -- Organizador
  entidade_organizadora_id BIGINT REFERENCES entidades(id),
  
  -- Tipo de evento
  tipo TEXT NOT NULL, -- 'festa' | 'encontro' | 'workshop' | 'culto' | 'desporto' | 'cultural' | 'outro'
  
  -- Contato público
  telefone TEXT,
  email TEXT,
  website TEXT,
  
  -- Qualidade
  origem TEXT, -- 'seed manual' | 'import INE' | 'utilizador'
  estado TEXT NOT NULL DEFAULT 'rascunho', -- rascunho | validado | publicado | cancelado | arquivado
  
  -- Auditoria
  criado_por TEXT,
  atualizado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT tipo_valido CHECK (tipo IN ('festa', 'encontro', 'workshop', 'culto', 'desporto', 'cultural', 'outro')),
  CONSTRAINT estado_valido CHECK (estado IN ('rascunho', 'validado', 'publicado', 'cancelado', 'arquivado')),
  CONSTRAINT datas_logicas CHECK (fim IS NULL OR inicio < fim),
  UNIQUE (slug, freguesia_id, inicio)
);

-- Índices
CREATE INDEX idx_eventos_freguesia ON eventos(freguesia_id);
CREATE INDEX idx_eventos_organizador ON eventos(entidade_organizadora_id);
CREATE INDEX idx_eventos_inicio ON eventos(inicio);
CREATE INDEX idx_eventos_estado ON eventos(estado);
CREATE INDEX idx_eventos_tipo ON eventos(tipo);

-- RLS (leitura pública se estado = 'publicado')
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos_public_read" ON eventos
  FOR SELECT USING (estado = 'publicado');

COMMENT ON TABLE eventos IS 'Eventos e acontecimentos numa freguesia (festas, encontros, workshops, etc.)';
COMMENT ON COLUMN eventos.tipo IS 'Tipologia: festa, encontro, workshop, culto, desporto, cultural, outro';
COMMENT ON COLUMN eventos.estado IS 'Ciclo de vida: rascunho → validado → publicado → cancelado/arquivado';
