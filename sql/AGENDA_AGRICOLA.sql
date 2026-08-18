-- ============================================================
-- OTJ - CAMADA 2: AGENDA AGRICOLA (Calendario Agricola Pessoal)
-- ============================================================
-- Ver docs/camada-2/ para a especificacao funcional e a fonte dos
-- dados de culturas (Volume_IV). Correr este ficheiro primeiro; o
-- seed de culturas_guia vai em sql/culturas_guia_seed.sql (Fase B,
-- separado para poder ser corrido/atualizado independentemente).

-- ============================================================
-- 1. culturas_guia (referencia publica, catalogo)
-- ============================================================

CREATE TABLE IF NOT EXISTS culturas_guia (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  nome TEXT NOT NULL,
  nome_cientifico TEXT,
  categoria TEXT NOT NULL,           -- 'Hortaliça' | 'Legume' | 'Cereal' | 'Fruteira' | 'Aromática' | 'Apicultura'
  perene BOOLEAN NOT NULL DEFAULT false,

  ciclo_dias_min INTEGER,
  ciclo_dias_max INTEGER,

  -- fase lunar: 'crescente' | 'minguante' | 'qualquer' (ver docs/camada-2/
  -- para a decisao de manter as categorias de lib/calendario/tradicao.ts
  -- em vez do "qualquer" generico do Volume_IV)
  semeadura_fase_lunar TEXT,
  poda_fase_lunar TEXT,
  colheita_fase_lunar TEXT,

  meses_semeadura TEXT,
  meses_colheita TEXT,
  meses_poda TEXT,

  temp_min_germinacao DOUBLE PRECISION,
  temp_otima DOUBLE PRECISION,
  humidade_ideal TEXT,

  descricao TEXT,
  dicas TEXT,
  associacoes_beneficas TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT culturas_guia_nome_unique UNIQUE (nome),

  CONSTRAINT culturas_guia_ciclo_check CHECK (
    (ciclo_dias_min IS NULL AND ciclo_dias_max IS NULL) OR
    (ciclo_dias_min IS NOT NULL AND ciclo_dias_max IS NOT NULL AND ciclo_dias_min <= ciclo_dias_max)
  ),

  CONSTRAINT culturas_guia_semeadura_fase_check CHECK (
    semeadura_fase_lunar IS NULL OR semeadura_fase_lunar IN ('crescente', 'minguante', 'qualquer')
  ),
  CONSTRAINT culturas_guia_poda_fase_check CHECK (
    poda_fase_lunar IS NULL OR poda_fase_lunar IN ('crescente', 'minguante', 'qualquer')
  ),
  CONSTRAINT culturas_guia_colheita_fase_check CHECK (
    colheita_fase_lunar IS NULL OR colheita_fase_lunar IN ('crescente', 'minguante', 'qualquer')
  )
);

CREATE INDEX IF NOT EXISTS idx_culturas_guia_categoria ON culturas_guia (categoria);

ALTER TABLE culturas_guia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura publica de culturas_guia"
  ON culturas_guia FOR SELECT
  TO public
  USING (true);

-- ============================================================
-- 2. plantacoes (dados privados do utilizador)
-- ============================================================

CREATE TABLE IF NOT EXISTS plantacoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  utilizador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cultura_id BIGINT NOT NULL REFERENCES culturas_guia(id),

  local_nome TEXT,                   -- texto livre no MVP (ex: "Horta 2, Talhão A")

  data_plantacao DATE NOT NULL,
  data_colheita_prevista DATE,
  data_colheita_real DATE,

  estado TEXT NOT NULL DEFAULT 'plantada',

  -- snapshot do contexto no momento da plantacao (historico, nao recalculado depois)
  fase_lunar_plantacao TEXT,
  temperatura_media_plantacao DOUBLE PRECISION,
  humidade_media_plantacao DOUBLE PRECISION,

  notas TEXT,
  fotografias JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT plantacoes_estado_check CHECK (
    estado IN ('plantada', 'germinada', 'em_crescimento', 'florada', 'colhida', 'cancelada')
  ),
  CONSTRAINT plantacoes_datas_check CHECK (
    data_colheita_real IS NULL OR data_colheita_real >= data_plantacao
  )
);

CREATE INDEX IF NOT EXISTS idx_plantacoes_utilizador_id ON plantacoes (utilizador_id);
CREATE INDEX IF NOT EXISTS idx_plantacoes_cultura_id ON plantacoes (cultura_id);
CREATE INDEX IF NOT EXISTS idx_plantacoes_data_plantacao ON plantacoes (data_plantacao);
CREATE INDEX IF NOT EXISTS idx_plantacoes_estado ON plantacoes (estado);

ALTER TABLE plantacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador ve as suas plantacoes"
  ON plantacoes FOR SELECT
  USING (auth.uid() = utilizador_id);

CREATE POLICY "Utilizador cria as suas plantacoes"
  ON plantacoes FOR INSERT
  WITH CHECK (auth.uid() = utilizador_id);

CREATE POLICY "Utilizador edita as suas plantacoes"
  ON plantacoes FOR UPDATE
  USING (auth.uid() = utilizador_id);

CREATE POLICY "Utilizador apaga as suas plantacoes"
  ON plantacoes FOR DELETE
  USING (auth.uid() = utilizador_id);

-- ============================================================
-- 3. plantacao_historico (log de alteracoes)
-- ============================================================

CREATE TABLE IF NOT EXISTS plantacao_historico (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plantacao_id BIGINT NOT NULL REFERENCES plantacoes(id) ON DELETE CASCADE,

  evento TEXT NOT NULL,
  valor_antigo TEXT,
  valor_novo TEXT,
  notas_utilizador TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT plantacao_historico_evento_check CHECK (
    evento IN ('estado_alterado', 'nota_adicionada', 'foto_adicionada', 'colhida')
  )
);

CREATE INDEX IF NOT EXISTS idx_plantacao_historico_plantacao_id
  ON plantacao_historico (plantacao_id, created_at);

ALTER TABLE plantacao_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador ve o historico das suas plantacoes"
  ON plantacao_historico FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plantacoes
      WHERE plantacoes.id = plantacao_historico.plantacao_id
        AND plantacoes.utilizador_id = auth.uid()
    )
  );

CREATE POLICY "Utilizador regista historico das suas plantacoes"
  ON plantacao_historico FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plantacoes
      WHERE plantacoes.id = plantacao_historico.plantacao_id
        AND plantacoes.utilizador_id = auth.uid()
    )
  );
