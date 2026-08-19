/**
 * Ficheiro: 009-FREGUESIA-PILOTO-AROSA.sql
 * Projeto: O Tio do Joca — Módulo Freguesia
 * Fase: C — População Piloto
 * Data: 19 ago 2026
 *
 * Seed de ~32 entidades para a freguesia de Arosa (Guimarães, Braga)
 * Propósito: Validar MVP (6 critérios) com dados realistas
 * Nota: Faz parte da União das Freguesias de Arosa e Castelões
 */

-- ==============================================================================
-- PREPARAÇÃO: Certificar que Arosa existe
-- ==============================================================================

INSERT INTO freguesias (nome, slug, municipio_id, codigo_dicofre, email_junta)
  SELECT 
    'Arosa',
    'arosa',
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
  'Junta de Freguesia de Arosa',
  'junta-arosa',
  'Órgão administrativo local. Responsável por assuntos locais e serviços à comunidade.',
  (SELECT id FROM categorias_entidade WHERE slug = 'administracao'),
  (SELECT id FROM freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'fregarosaecasteloes@gmail.com',
  'http://www.cm-guimaraes.pt',
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'GNR — Guarda Nacional Republicana',
  'gnr-arosa',
  'Posto da Guarda Nacional Republicana. Segurança e policiamento.',
  (SELECT id FROM categorias_entidade WHERE slug = 'administracao'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '253 XXXXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Bombeiros Voluntários de Arosa',
  'bombeiros-arosa',
  'Corpo de Bombeiros Voluntários. Proteção civil e emergência.',
  (SELECT id FROM categorias_entidade WHERE slug = 'administracao'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
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
  'Igreja Paroquial de Arosa',
  'igreja-paroquial-arosa',
  'Igreja Paroquial. Culto e celebrações religiosas.',
  (SELECT id FROM categorias_entidade WHERE slug = 'parquia'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'paroquia@arosa.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Assembleia Paroquial',
  'assembleia-paroquial-arosa',
  'Órgão deliberativo paroquial.',
  (SELECT id FROM categorias_entidade WHERE slug = 'parquia'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
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
  'Associação Comunitária de Arosa',
  'assoc-comunitaria-arosa',
  'Associação para desenvolvimento social e comunitário.',
  (SELECT id FROM categorias_entidade WHERE slug = 'associacoes'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'assoc@arosa.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Escuteiros de Arosa',
  'escuteiros-arosa',
  'Grupo de Escuteiros. Educação e formação juvenil.',
  (SELECT id FROM categorias_entidade WHERE slug = 'associacoes'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Associação de Pais — EB1 Arosa',
  'apais-eb1-arosa',
  'Associação de Pais e Encarregados de Educação.',
  (SELECT id FROM categorias_entidade WHERE slug = 'associacoes'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  NULL,
  'apais.eb1@email.com',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Comissão de Festas de Arosa',
  'comissao-festas-arosa',
  'Comissão organizadora da Festa Anual da Freguesia.',
  (SELECT id FROM categorias_entidade WHERE slug = 'associacoes'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'festas@arosa.pt',
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
  'Rancho Folclórico de Arosa',
  'rancho-arosa',
  'Grupo de folclore e tradições locais. Dança e música tradicional portuguesa.',
  (SELECT id FROM categorias_entidade WHERE slug = 'cultura'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'rancho@arosa.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Banda Filarmónica de Arosa',
  'banda-arosa',
  'Banda de música. Música clássica e tradicional.',
  (SELECT id FROM categorias_entidade WHERE slug = 'cultura'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Biblioteca Municipal — Sala de Arosa',
  'biblioteca-arosa',
  'Espaço de leitura, acervo bibliográfico e atividades culturais.',
  (SELECT id FROM categorias_entidade WHERE slug = 'cultura'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
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
  'Clube Desportivo de Arosa',
  'clube-desportivo-arosa',
  'Clube de futebol e atividades desportivas diversas.',
  (SELECT id FROM categorias_entidade WHERE slug = 'desporto'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'cdarosa@email.com',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Ginásio Municipal de Arosa',
  'ginasio-municipal-arosa',
  'Espaço de fitness, musculação e exercício físico.',
  (SELECT id FROM categorias_entidade WHERE slug = 'desporto'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Campo Desportivo Municipal',
  'campo-desportivo-arosa',
  'Equipamento desportivo com campos de futebol e atividades.',
  (SELECT id FROM categorias_entidade WHERE slug = 'desporto'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
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
  'Escola Básica de Arosa',
  'eb-arosa',
  'Escola de Ensino Básico (1º ao 6º ano).',
  (SELECT id FROM categorias_entidade WHERE slug = 'educacao'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'eb.arosa@escolaspt.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Jardim de Infância Municipal',
  'jardi-infancia-arosa',
  'Educação Pré-Escolar. Crianças dos 3 aos 6 anos.',
  (SELECT id FROM categorias_entidade WHERE slug = 'educacao'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Centro de Apoio ao Estudante',
  'centro-apoio-estudante-arosa',
  'Apoio educativo, psicológico e acompanhamento escolar.',
  (SELECT id FROM categorias_entidade WHERE slug = 'educacao'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
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
  'padaria-tradicional-arosa',
  'Pão, broa e produtos de confeitaria. Receita tradicional.',
  (SELECT id FROM categorias_entidade WHERE slug = 'comercio'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Mercearia Local',
  'mercearia-arosa',
  'Comercio tradicional de secos, frescos e alimentação geral.',
  (SELECT id FROM categorias_entidade WHERE slug = 'comercio'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Talho',
  'talho-arosa',
  'Venda de carnes frescas. Produtos de qualidade.',
  (SELECT id FROM categorias_entidade WHERE slug = 'comercio'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Loja de Roupa e Acessórios',
  'loja-roupa-arosa',
  'Vestuário, calçado e acessórios para toda a família.',
  (SELECT id FROM categorias_entidade WHERE slug = 'comercio'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
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
  'Eletricista Manuel Pereira',
  'eletricista-manuel-arosa',
  'Reparação, manutenção e instalações elétricas residenciais e comerciais.',
  (SELECT id FROM categorias_entidade WHERE slug = 'servicos'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Cabeleireiro "Beleza"',
  'cabeleireiro-beleza-arosa',
  'Corte, coloração e tratamento de cabelo. Serviços de estética.',
  (SELECT id FROM categorias_entidade WHERE slug = 'servicos'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Consultório Jurídico Ferreira',
  'consultorio-juridico-arosa',
  'Consultoria jurídica, direito civil e comercial.',
  (SELECT id FROM categorias_entidade WHERE slug = 'servicos'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'juridico@email.com',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Oficina Automóvel "Reparos"',
  'oficina-automovel-arosa',
  'Reparação, manutenção e inspeção de veículos.',
  (SELECT id FROM categorias_entidade WHERE slug = 'servicos'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
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
  'Centro de Saúde de Arosa',
  'centro-saude-arosa',
  'Cuidados primários de saúde. Medicina geral e pediatria.',
  (SELECT id FROM categorias_entidade WHERE slug = 'saude'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'centro.saude@arosa.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'IPSS — Assistência à Terceira Idade',
  'ipss-terceira-idade-arosa',
  'Instituição Privada de Solidariedade Social. Apoio a idosos e dependentes.',
  (SELECT id FROM categorias_entidade WHERE slug = 'saude'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  NULL,
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Consultório Dentário',
  'consultorio-dentario-arosa',
  'Odontologia, higiene e tratamento dentário.',
  (SELECT id FROM categorias_entidade WHERE slug = 'saude'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
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
  'Farmácia Central de Arosa',
  'farmacia-central-arosa',
  'Farmácia com serviço de 24h. Medicamentos e produtos de saúde.',
  (SELECT id FROM categorias_entidade WHERE slug = 'farmacia'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'farmacia@arosa.pt',
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
  'Restaurante "Casa da Avó"',
  'restaurante-casa-avo-arosa',
  'Comida tradicional portuguesa. Pratos típicos e receitas locais.',
  (SELECT id FROM categorias_entidade WHERE slug = 'turismo'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'casaavo@arosa.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
),
(
  'Casa de Hóspedes "Vale Verde"',
  'casa-hospedes-vale-verde-arosa',
  'Alojamento rural e familiar. Ambiente tranquilo e acolhedor.',
  (SELECT id FROM categorias_entidade WHERE slug = 'turismo'),
  (SELECT id FROM Freguesias WHERE slug = 'arosa'),
  '+351 253 XXX XXX',
  'valeverde@arosa.pt',
  NULL,
  'seed piloto',
  'publicado',
  'sistema'
);

-- ==============================================================================
-- TOTAL: 32 entidades para Arosa — Fase C MVP
-- ==============================================================================

COMMENT ON TABLE entidades IS 'Organizações, instituições, associações e negócios locais';

