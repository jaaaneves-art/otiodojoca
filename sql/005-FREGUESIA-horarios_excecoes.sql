/**
 * Tabela: horarios_excecoes
 * Projeto: O Tio do Joca — Módulo Freguesia
 * Fase: B — Migrações versionadas
 * Data: 19 ago 2026
 *
 * Exceções ao horário regular (férias, feriados, eventos especiais)
 */

CREATE TABLE IF NOT EXISTS horarios_excecoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  entidade_id BIGINT NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
  
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  
  motivo TEXT NOT NULL, -- ex: "Férias de agosto" | "Feriado nacional"
  hora_abertura TIME, -- NULL = fechado todo o dia
  hora_encerramento TIME,
  
  criado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT periodo_logico CHECK (data_inicio <= data_fim)
);

-- Índices
CREATE INDEX idx_excecoes_entidade ON horarios_excecoes(entidade_id);
CREATE INDEX idx_excecoes_data ON horarios_excecoes(data_inicio, data_fim);

COMMENT ON TABLE horarios_excecoes IS 'Exceções ao horário regular (férias, feriados, encerramento temporário)';
