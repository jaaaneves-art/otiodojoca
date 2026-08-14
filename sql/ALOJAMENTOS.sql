-- sql/ALOJAMENTOS.sql

-- ========================================
-- TABELA: tipos_alojamento
-- ========================================
CREATE TABLE tipos_alojamento (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir tipos padrão
INSERT INTO tipos_alojamento (nome, descricao) VALUES
  ('hotel', 'Hotel tradicional com serviços completos'),
  ('pousada', 'Pousada com atmosfera acolhedora'),
  ('casa_rural', 'Casa rural para turismo de natureza'),
  ('hostel', 'Hostel com quartos compartilhados'),
  ('apartamento', 'Apartamento com cozinha'),
  ('chalé', 'Chalé para férias familiares'),
  ('quinta', 'Quinta agro-turística com animais');

-- ========================================
-- TABELA: alojamentos
-- ========================================
CREATE TABLE alojamentos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo VARCHAR NOT NULL REFERENCES tipos_alojamento(nome),
  localizacao_id BIGINT NOT NULL REFERENCES localizacoes(id) ON DELETE RESTRICT,
  preco_noite NUMERIC(10, 2) NOT NULL,
  num_quartos INTEGER NOT NULL CHECK (num_quartos > 0),
  num_camas INTEGER,
  rating NUMERIC(3, 2) CHECK (rating >= 0 AND rating <= 5),
  telefone VARCHAR,
  email VARCHAR,
  website VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para alojamentos
CREATE INDEX idx_alojamentos_localizacao_id ON alojamentos (localizacao_id);
CREATE INDEX idx_alojamentos_tipo ON alojamentos (tipo);
CREATE INDEX idx_alojamentos_nome ON alojamentos (nome);
CREATE INDEX idx_alojamentos_preco_noite ON alojamentos (preco_noite);

-- ========================================
-- TABELA: refeicoes_alojamento
-- ========================================
-- Associa refeições disponíveis a cada alojamento
CREATE TABLE refeicoes_alojamento (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alojamento_id BIGINT NOT NULL REFERENCES alojamentos(id) ON DELETE CASCADE,
  tipo_refeicao VARCHAR NOT NULL CHECK (tipo_refeicao IN ('pequeno_almoco', 'almoço', 'jantar')),
  preco_extra NUMERIC(8, 2),
  disponivel BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_alojamento_refeicao UNIQUE (alojamento_id, tipo_refeicao)
);

-- Índices
CREATE INDEX idx_refeicoes_alojamento_id ON refeicoes_alojamento (alojamento_id);
CREATE INDEX idx_refeicoes_tipo ON refeicoes_alojamento (tipo_refeicao);

-- ========================================
-- TABELA: reservas_alojamento
-- ========================================
CREATE TABLE reservas_alojamento (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alojamento_id BIGINT NOT NULL REFERENCES alojamentos(id) ON DELETE RESTRICT,
  nome_hospede TEXT NOT NULL,
  email_hospede VARCHAR NOT NULL,
  telefone_hospede VARCHAR,
  data_entrada DATE NOT NULL,
  data_saida DATE NOT NULL,
  num_pessoas INTEGER NOT NULL CHECK (num_pessoas > 0),
  num_quartos INTEGER NOT NULL CHECK (num_quartos > 0),
  tipo_refeicao VARCHAR NOT NULL CHECK (tipo_refeicao IN ('sem_refeicoes', 'pequeno_almoco', 'meia_pensao', 'pensao_completa')),
  preco_total NUMERIC(10, 2) NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'concluido', 'cancelada')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_datas CHECK (data_saida > data_entrada)
);

-- Índices
CREATE INDEX idx_reservas_alojamento_id ON reservas_alojamento (alojamento_id);
CREATE INDEX idx_reservas_data_entrada ON reservas_alojamento (data_entrada);
CREATE INDEX idx_reservas_email ON reservas_alojamento (email_hospede);
CREATE INDEX idx_reservas_status ON reservas_alojamento (status);

-- ========================================
-- RLS POLICIES
-- ========================================

-- Alojamentos: Todos podem ver
ALTER TABLE alojamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alojamentos - SELECT públicos"
  ON alojamentos
  FOR SELECT
  USING (true);

-- Refeições: Todos podem ver
ALTER TABLE refeicoes_alojamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Refeições - SELECT públicas"
  ON refeicoes_alojamento
  FOR SELECT
  USING (true);

-- Reservas: Controlo de acesso
ALTER TABLE reservas_alojamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservas - SELECT públicas"
  ON reservas_alojamento
  FOR SELECT
  USING (true);

CREATE POLICY "Reservas - INSERT para todos"
  ON reservas_alojamento
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Reservas - UPDATE próprias"
  ON reservas_alojamento
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ========================================
-- DADOS DE TESTE
-- ========================================

-- Inserir um alojamento de teste
-- (Pressupõe que existe localizacao_id = 1 de COMER)
INSERT INTO alojamentos (nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, num_camas, rating, telefone, email, website)
VALUES (
  'Casa Rural Ronfe',
  'Acolhedora casa rural na Serra da Cabreira, ideal para famílias que procuram contacto com a natureza.',
  'casa_rural',
  1,
  89.50,
  4,
  8,
  4.5,
  '+351 253 123 456',
  'info@casaruraIronfe.pt',
  'www.casaruraIronfe.pt'
) ON CONFLICT DO NOTHING;

-- Inserir refeições disponíveis para o alojamento de teste
INSERT INTO refeicoes_alojamento (alojamento_id, tipo_refeicao, preco_extra, disponivel)
SELECT 1, tipo_refeicao, preco, true
FROM (
  VALUES 
    ('pequeno_almoco'::text, 10.00),
    ('almoço'::text, 18.00),
    ('jantar'::text, 20.00)
) AS t(tipo_refeicao, preco)
ON CONFLICT DO NOTHING;
