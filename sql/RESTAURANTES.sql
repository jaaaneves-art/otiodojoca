-- ============================================================
-- OTJ - COMER
-- RESTAURANTES
-- ============================================================

CREATE TABLE IF NOT EXISTS restaurantes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  nome TEXT NOT NULL,
  descricao TEXT,
  especialidade TEXT,

  preco_medio NUMERIC(10,2),
  rating NUMERIC(3,2),

  telefone TEXT,
  email TEXT,
  website TEXT,

  localizacao_id BIGINT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT restaurantes_localizacao_fk
    FOREIGN KEY (localizacao_id)
    REFERENCES localizacoes(id)
    ON DELETE RESTRICT,

  CONSTRAINT restaurantes_preco_medio_check
    CHECK (preco_medio IS NULL OR preco_medio >= 0),

  CONSTRAINT restaurantes_rating_check
    CHECK (rating IS NULL OR rating BETWEEN 0 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_restaurantes_nome
  ON restaurantes (nome);

CREATE INDEX IF NOT EXISTS idx_restaurantes_localizacao_id
  ON restaurantes (localizacao_id);
