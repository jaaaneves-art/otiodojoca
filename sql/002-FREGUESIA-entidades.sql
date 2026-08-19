/**
 * Tabela: entidades
 * Projeto: O Tio do Joca — Módulo Freguesia
 * Fase: B — Migrações versionadas
 * Data: 19 ago 2026
 *
 * Entidades = organizações, instituições, grupos, comerciantes
 * Princípio: Uma única entidade por organização. Sem duplicatas.
 * Ponte: ref_tabela + ref_id permitem ligação com verticais existentes (COMER, ALOJAMENTO, etc.)
 */

CREATE TABLE IF NOT EXISTS entidades (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  -- Identificação
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  fotografias TEXT[], -- array de URLs
  
  -- Classificação
  categoria_id BIGINT NOT NULL REFERENCES categorias_entidade(id),
  
  -- Localização
  freguesia_id BIGINT NOT NULL REFERENCES freguesias(id),
  lugar TEXT, -- nome informal da localidade (ex: "Aldeia de Cima")
  localizacao_id BIGINT REFERENCES localizacoes(id),
  
  -- Contactos públicos
  telefone TEXT,
  email TEXT,
  website TEXT,
  redes_sociais JSONB, -- ex: {"facebook": "...", "instagram": "..."}
  
  -- Ponte com verticais (Decisão 000)
  ref_tabela VARCHAR(50), -- ex: 'restaurantes' | 'alojamentos'
  ref_id UUID, -- id na tabela vertical
  UNIQUE (ref_tabela, ref_id),
  
  -- Qualidade de dados
  origem TEXT, -- ex: "seed manual" | "import INE" | "utilizador"
  fonte_url TEXT, -- link para fonte de dados
  data_verificacao DATE, -- quando foi validada pela última vez
  estado TEXT NOT NULL DEFAULT 'rascunho', -- rascunho | pendente | validado | publicado | desactualizado | arquivado
  
  -- Auditoria
  criado_por TEXT, -- user_id ou "sistema"
  atualizado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT estado_valido CHECK (estado IN ('rascunho', 'pendente', 'validado', 'publicado', 'desactualizado', 'arquivado'))
);

-- Índices
CREATE INDEX idx_entidades_freguesia ON entidades(freguesia_id);
CREATE INDEX idx_entidades_categoria ON entidades(categoria_id);
CREATE INDEX idx_entidades_slug ON entidades(slug);
CREATE INDEX idx_entidades_localizacao ON entidades(localizacao_id);
CREATE INDEX idx_entidades_ref ON entidades(ref_tabela, ref_id);
CREATE INDEX idx_entidades_estado ON entidades(estado);

-- RLS (Row Level Security)
ALTER TABLE entidades ENABLE ROW LEVEL SECURITY;

-- Policy: leitura pública (estado = 'publicado')
CREATE POLICY "entidades_public_read" ON entidades
  FOR SELECT USING (estado = 'publicado');

-- Policy: utilizadores autenticados podem ver rascunhos suas (pós-MVP)
-- Policy: admins podem editar qualquer entidade (pós-MVP)

COMMENT ON TABLE entidades IS 'Organizações e instituições numa freguesia';
COMMENT ON COLUMN entidades.ref_tabela IS 'Referência à tabela vertical (COMER, ALOJAMENTO, etc.)';
COMMENT ON COLUMN entidades.ref_id IS 'ID da entidade na tabela vertical';
COMMENT ON COLUMN entidades.estado IS 'Ciclo de vida: rascunho → validado → publicado → arquivado';
