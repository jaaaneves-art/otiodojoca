/**
 * Tabela: entidade_relacoes
 * Projeto: O Tio do Joca — Módulo Freguesia
 * Fase: B — Migrações versionadas
 * Data: 19 ago 2026
 *
 * Relacionamentos explícitos entre entidades
 * Ex: Presidente-de, Membro-de, Parceiro-de, Organiza-evento
 */

CREATE TABLE IF NOT EXISTS entidade_relacoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  entidade_origem_id BIGINT NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
  tipo_relacao TEXT NOT NULL,
  entidade_destino_id BIGINT NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
  
  descricao TEXT, -- contexto opcional (ex: "Presidente desde 2022")
  data_inicio DATE,
  data_fim DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (entidade_origem_id, tipo_relacao, entidade_destino_id),
  CONSTRAINT tipo_relacao_valido CHECK (tipo_relacao IN (
    'presidente_de',
    'vice_presidente_de',
    'membro_de',
    'parceiro_de',
    'organiza_evento',
    'colabora_com',
    'filial_de',
    'subsecao_de'
  ))
);

-- Índices
CREATE INDEX idx_relacoes_origem ON entidade_relacoes(entidade_origem_id);
CREATE INDEX idx_relacoes_destino ON entidade_relacoes(entidade_destino_id);
CREATE INDEX idx_relacoes_tipo ON entidade_relacoes(tipo_relacao);

-- RLS (leitura pública se ambas as entidades forem publicadas; pós-MVP)

COMMENT ON TABLE entidade_relacoes IS 'Relacionamentos entre entidades (presidente-de, membro-de, parceiro-de, etc.)';
COMMENT ON COLUMN entidade_relacoes.tipo_relacao IS 'Tipo de relação (ENUM de 8 tipos)';
