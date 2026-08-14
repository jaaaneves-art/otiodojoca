-- ============================================================
-- OTJ - LOCALIZACOES CENTRAIS
-- ============================================================

CREATE TABLE IF NOT EXISTS localizacoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  codigo_postal VARCHAR(8) NOT NULL,

  nome TEXT NOT NULL,
  localidade TEXT NOT NULL,

  municipio TEXT,
  distrito TEXT,

  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT localizacoes_codigo_postal_check
    CHECK (codigo_postal ~ '^[0-9]{4}-[0-9]{3}$'),

  CONSTRAINT localizacoes_latitude_check
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

  CONSTRAINT localizacoes_longitude_check
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE INDEX IF NOT EXISTS idx_localizacoes_codigo_postal
  ON localizacoes (codigo_postal);

CREATE INDEX IF NOT EXISTS idx_localizacoes_nome
  ON localizacoes (nome);

CREATE INDEX IF NOT EXISTS idx_localizacoes_localidade
  ON localizacoes (localidade);

CREATE INDEX IF NOT EXISTS idx_localizacoes_municipio
  ON localizacoes (municipio);

CREATE INDEX IF NOT EXISTS idx_localizacoes_geo
  ON localizacoes (latitude, longitude);
