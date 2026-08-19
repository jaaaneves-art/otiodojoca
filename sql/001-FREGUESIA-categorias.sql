/**
 * Tabela: categorias_entidade
 * Projeto: O Tio do Joca — Módulo Freguesia
 * Fase: B — Migrações versionadas
 * Data: 19 ago 2026
 * 
 * Categorias de entidades (associações, instituições, comércios, etc.)
 * Nota: Catálogo base; novas categorias podem ser adicionadas conforme necessidade
 */

CREATE TABLE IF NOT EXISTS categorias_entidade (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT, -- ex: "users", "church", "shop" (para frontend)
  cor_tema TEXT, -- ex: "#FF6B6B" (tema visual)
  ordem_apresentacao INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_categorias_slug ON categorias_entidade(slug);

-- Seed inicial (categorias base)
INSERT INTO categorias_entidade (nome, slug, descricao, icone, cor_tema, ordem_apresentacao) VALUES
  ('Administração', 'administracao', 'Junta de Freguesia, Câmara Municipal, etc.', 'building', '#4A90E2', 1),
  ('Paróquia', 'paroquia', 'Igreja Paroquial, Capelas', 'church', '#E24A4A', 2),
  ('Associações Culturais', 'assoc-cultural', 'Grupos folclóricos, Ranchos, Centros culturais', 'palette', '#F5A623', 3),
  ('Associações Desportivas', 'assoc-desportiva', 'Clubes, Equipas, Grupos desportivos', 'activity', '#7ED321', 4),
  ('Educação', 'educacao', 'Escolas, Pré-escolas, Centros de formação', 'book', '#BD10E0', 5),
  ('Saúde', 'saude', 'Farmácias, Centros de Saúde, Clínicas', 'heart', '#E74C3C', 6),
  ('Comércios e Serviços', 'comercio-servicos', 'Lojas, Restaurantes, Serviços diversos', 'shopping-bag', '#2ECC71', 7),
  ('Turismo', 'turismo', 'Alojamento, Aluguel de equipamento, Guias', 'map-pin', '#1ABC9C', 8),
  ('Instituições Sociais', 'ipss', 'IPSS, Lares, Centros de convívio', 'hand-heart', '#95A5A6', 9),
  ('Comunicação', 'comunicacao', 'Jornais locais, Rádios, Websites', 'megaphone', '#34495E', 10)
ON CONFLICT DO NOTHING;

-- Comentário da tabela
COMMENT ON TABLE categorias_entidade IS 'Taxonomia de categorias para entidades (associações, instituições, negócios) numa freguesia';
COMMENT ON COLUMN categorias_entidade.slug IS 'Identificador único em formato URL-friendly';
COMMENT ON COLUMN categorias_entidade.icone IS 'Ícone ou emoji para representação visual (frontend)';
