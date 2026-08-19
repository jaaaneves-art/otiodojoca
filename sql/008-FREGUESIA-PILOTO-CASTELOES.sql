/**
 * Ficheiro: 008-FREGUESIA-PILOTO-CASTELOES.sql
 * Projeto: O Tio do Joca — Módulo Freguesia
 * Fase: C — População Piloto
 * Data: 19 ago 2026
 *
 * Seed de ~32 entidades para a freguesia de Castelões (Guimarães, Braga)
 * Propósito: Validar MVP (6 critérios) com dados realistas
 */

-- ==============================================================================
-- PREPARAÇÃO: Certificar que Guimarães existe
-- ==============================================================================

INSERT INTO municipios (nome, slug, distrito_id)
  SELECT 'Guimarães', 'guimaraes', (SELECT id FROM distritos WHERE nome = 'Braga')
  ON CONFLICT (slug) DO NOTHING;

-- Certificar que Castelões existe
INSERT INTO freguesias (nome, slug, municipio_id, codigo_dicofre, email_junta)
  SELECT 
    'Castelões',
    'casteloes',
    (SELECT id FROM municipios WHERE slug = 'guimaraes'),
    '030877',
    'fregarosaecasteloes@gmail.com'
  ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- ADMINISTRAÇÃO (3 entidades)
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id,
  telefone, email, website, origem, estado, criado_por
)
VALUES
(
  'Junta de Freguesia de Castelões',
  'junta-casteloes',
  'Órgão administrativo local. Responsável por assuntos locais e serviços à comunidade.',
  (SELECT id FROM categorias_entidade WHERE slug = 'administracao'),
  (SELECT id FROM freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'fregarosaecasteloes@gmail.com',
  'http://www.cm-guimaraes.pt',
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'GNR — Guarda Nacional Republicana',
  'gnr-casteloes',
  'Posto da Guarda Nacional Republicana. Segurança e policiamento.',
  (SELECT id FROM categorias_entidade WHERE slug = 'administracao'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '253 XXXXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Bombeiros Voluntários de Castelões',
  'bombeiros-casteloes',
  'Corpo de Bombeiros Voluntários. Proteção civil e emergência.',
  (SELECT id FROM categorias_entidade WHERE slug = 'administracao'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '253 XXXXXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- PARÓQUIA (2 entidades)
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id,
  telefone, email, website, origem, estado, criado_por
)
VALUES
(
  'Igreja Paroquial de Castelões',
  'igreja-paroquial-casteloes',
  'Igreja Paroquial. Culto e celebrações religiosas.',
  (SELECT id FROM categorias_entidade WHERE slug = 'parquia'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'paroquia@casteloes.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Assembleia Paroquial',
  'assembleia-paroquial-casteloes',
  'Órgão deliberativo paroquial.',
  (SELECT id FROM categorias_entidade WHERE slug = 'parquia'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  NULL,
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- ASSOCIAÇÕES (4 entidades)
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id,
  telefone, email, website, origem, estado, criado_por
)
VALUES
(
  'Associação Comunitária de Castelões',
  'assoc-comunitaria-casteloes',
  'Associação para desenvolvimento social e comunitário.',
  (SELECT id FROM categorias_entidade WHERE slug = 'associacoes'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'assoc@casteloes.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Escuteiros de Castelões',
  'escuteiros-casteloes',
  'Grupo de Escuteiros. Educação e formação juvenil.',
  (SELECT id FROM categorias_entidade WHERE slug = 'associacoes'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Associação de Pais — EB1 Castelões',
  'apais-eb1-casteloes',
  'Associação de Pais e Encarregados de Educação.',
  (SELECT id FROM categorias_entidade WHERE slug = 'associacoes'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  NULL,
  'apais.eb1@email.com',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Comissão de Festas de Castelões',
  'comissao-festas-casteloes',
  'Comissão organizadora da Festa Anual da Freguesia.',
  (SELECT id FROM categorias_entidade WHERE slug = 'associacoes'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'festas@casteloes.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- CULTURA (3 entidades)
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id,
  telefone, email, website, origem, estado, criado_por
)
VALUES
(
  'Rancho Folclórico de Castelões',
  'rancho-casteloes',
  'Grupo de folclore e tradições locais. Dança e música tradicional portuguesa.',
  (SELECT id FROM categorias_entidade WHERE slug = 'cultura'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'rancho@casteloes.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Banda Filarmónica de Castelões',
  'banda-casteloes',
  'Banda de música. Música clássica e tradicional.',
  (SELECT id FROM categorias_entidade WHERE slug = 'cultura'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Biblioteca Municipal — Sala de Castelões',
  'biblioteca-casteloes',
  'Espaço de leitura, acervo bibliográfico e atividades culturais.',
  (SELECT id FROM categorias_entidade WHERE slug = 'cultura'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- DESPORTO (3 entidades)
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id,
  telefone, email, website, origem, estado, criado_por
)
VALUES
(
  'Clube Desportivo de Castelões',
  'clube-desportivo-casteloes',
  'Clube de futebol e atividades desportivas diversas.',
  (SELECT id FROM categorias_entidade WHERE slug = 'desporto'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'cdcasteloes@email.com',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Ginásio Municipal de Castelões',
  'ginasio-municipal-casteloes',
  'Espaço de fitness, musculação e exercício físico.',
  (SELECT id FROM categorias_entidade WHERE slug = 'desporto'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Campo Desportivo Municipal',
  'campo-desportivo-casteloes',
  'Equipamento desportivo com campos de futebol e atividades.',
  (SELECT id FROM categorias_entidade WHERE slug = 'desporto'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  NULL,
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- EDUCAÇÃO (3 entidades)
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id,
  telefone, email, website, origem, estado, criado_por
)
VALUES
(
  'Escola Básica de Castelões',
  'eb-casteloes',
  'Escola de Ensino Básico (1º ao 6º ano).',
  (SELECT id FROM categorias_entidade WHERE slug = 'educacao'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'eb.casteloes@escolaspt.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Jardim de Infância Municipal',
  'jardi-infancia-casteloes',
  'Educação Pré-Escolar. Crianças dos 3 aos 6 anos.',
  (SELECT id FROM categorias_entidade WHERE slug = 'educacao'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Centro de Apoio ao Estudante',
  'centro-apoio-estudante-casteloes',
  'Apoio educativo, psicológico e acompanhamento escolar.',
  (SELECT id FROM categorias_entidade WHERE slug = 'educacao'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- COMÉRCIO (4 entidades)
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id,
  telefone, email, website, origem, estado, criado_por
)
VALUES
(
  'Padaria Tradicional',
  'padaria-tradicional-casteloes',
  'Pão, broa e produtos de confeitaria. Receita tradicional.',
  (SELECT id FROM categorias_entidade WHERE slug = 'comercio'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Mercearia Local',
  'mercearia-casteloes',
  'Comercio tradicional de secos, frescos e alimentação geral.',
  (SELECT id FROM categorias_entidade WHERE slug = 'comercio'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Talho',
  'talho-casteloes',
  'Venda de carnes frescas. Produtos de qualidade.',
  (SELECT id FROM categorias_entidade WHERE slug = 'comercio'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Loja de Roupa e Acessórios',
  'loja-roupa-casteloes',
  'Vestuário, calçado e acessórios para toda a família.',
  (SELECT id FROM categorias_entidade WHERE slug = 'comercio'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- SERVIÇOS (4 entidades)
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id,
  telefone, email, website, origem, estado, criado_por
)
VALUES
(
  'Eletricista Paulo da Silva',
  'eletricista-paulo-casteloes',
  'Reparação, manutenção e instalações elétricas residenciais e comerciais.',
  (SELECT id FROM categorias_entidade WHERE slug = 'servicos'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Cabeleireiro "Moderna"',
  'cabeleireiro-moderna-casteloes',
  'Corte, coloração e tratamento de cabelo. Serviços de estética.',
  (SELECT id FROM categorias_entidade WHERE slug = 'servicos'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Consultório Jurídico Costa',
  'consultorio-juridico-casteloes',
  'Consultoria jurídica, direito civil e comercial.',
  (SELECT id FROM categorias_entidade WHERE slug = 'servicos'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'juridico@email.com',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Oficina Automóvel "O Meu Carro"',
  'oficina-automovel-casteloes',
  'Reparação, manutenção e inspeção de veículos.',
  (SELECT id FROM categorias_entidade WHERE slug = 'servicos'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- SAÚDE E APOIO SOCIAL (3 entidades)
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id,
  telefone, email, website, origem, estado, criado_por
)
VALUES
(
  'Centro de Saúde de Castelões',
  'centro-saude-casteloes',
  'Cuidados primários de saúde. Medicina geral e pediatria.',
  (SELECT id FROM categorias_entidade WHERE slug = 'saude'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'centro.saude@casteloes.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'IPSS — Assistência à Terceira Idade',
  'ipss-terceira-idade-casteloes',
  'Instituição Privada de Solidariedade Social. Apoio a idosos e dependentes.',
  (SELECT id FROM categorias_entidade WHERE slug = 'saude'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Consultório Dentário',
  'consultorio-dentario-casteloes',
  'Odontologia, higiene e tratamento dentário.',
  (SELECT id FROM categorias_entidade WHERE slug = 'saude'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- FARMÁCIA (1 entidade)
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id,
  telefone, email, website, origem, estado, criado_por
)
VALUES
(
  'Farmácia Central de Castelões',
  'farmacia-central-casteloes',
  'Farmácia com serviço de 24h. Medicamentos e produtos de saúde.',
  (SELECT id FROM categorias_entidade WHERE slug = 'farmacia'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'farmacia@casteloes.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- TURISMO (2 entidades)
-- ==============================================================================

INSERT INTO entidades (
  nome, slug, descricao, categoria_id, freguesia_id,
  telefone, email, website, origem, estado, criado_por
)
VALUES
(
  'Restaurante "O Transmontano"',
  'restaurante-transmontano-casteloes',
  'Comida tradicional portuguesa. Pratos típicos e receitas locais.',
  (SELECT id FROM categorias_entidade WHERE slug = 'turismo'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'transmontano@casteloes.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Casa de Hóspedes "Montanha"',
  'casa-hospedes-montanha-casteloes',
  'Alojamento rural e familiar. Ambiente tranquilo e acolhedor.',
  (SELECT id FROM categorias_entidade WHERE slug = 'turismo'),
  (SELECT id FROM Freguesias WHERE slug = 'casteloes'),
  '+351 253 XXX XXX',
  'montanha@casteloes.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- TOTAL: 32 entidades para Castelões — Fase C MVP
-- ==============================================================================

COMMENT ON TABLE entidades IS 'Organizações, instituições, associações e negócios locais';

