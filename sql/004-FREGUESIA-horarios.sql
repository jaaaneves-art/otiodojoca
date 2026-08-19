/**
 * Tabela: horarios
 * Projeto: O Tio do Joca — Módulo Freguesia
 * Fase: B — Migrações versionadas
 * Data: 19 ago 2026
 *
 * Horário semanal regular de funcionamento (segunda a domingo)
 * Ex: Junta aberta seg-sex 9-17h, fechada sábado e domingo
 */

CREATE TABLE IF NOT EXISTS horarios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  entidade_id BIGINT NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
  
  -- Dia da semana (0 = domingo, 1 = segunda, ..., 6 = sábado)
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  
  -- Horários (NULL = fechado)
  hora_abertura TIME,
  hora_encerramento TIME,
  
  observacoes TEXT, -- ex: "Fechado à hora de almoço 12:30-14:00"
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (entidade_id, dia_semana),
  CONSTRAINT horas_logicas CHECK (
    (hora_abertura IS NULL AND hora_encerramento IS NULL) OR
    (hora_abertura IS NOT NULL AND hora_encerramento IS NOT NULL AND hora_abertura < hora_encerramento)
  )
);

-- Índices
CREATE INDEX idx_horarios_entidade ON horarios(entidade_id);

COMMENT ON TABLE horarios IS 'Horário semanal regular de funcionamento';
COMMENT ON COLUMN horarios.dia_semana IS '0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab';
COMMENT ON COLUMN horarios.hora_abertura IS 'NULL = fechado nesse dia';
