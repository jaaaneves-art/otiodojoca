-- ============================================================
-- OTJ - ALOJAMENTOS: DADOS MOCK PARA TESTES
-- ============================================================
-- Cria 7 alojamentos FICTÍCIOS (um por cada tipo em tipos_alojamento)
-- com localizações reais (código postal + coordenadas GPS reais,
-- cruzadas com sql/codigos_postais_geo.csv), mas nome, descrição e
-- contactos claramente marcados como dados de teste (sufixo [MOCK],
-- contactos @teste.otj.local, telefone +351 000 000 0XX).
--
-- Seguro para apagar mais tarde com:
--   DELETE FROM alojamentos WHERE nome LIKE '%[MOCK]';
-- (as localizacoes e refeicoes associadas caem em cascata/ficam
-- órfãs só se apagares manualmente também as localizacoes).

-- 1) Casa Rural — Ronfe, Guimarães
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, latitude, longitude)
  VALUES ('4815-030', 'Recanto do Ave', 'Ronfe', 'Guimarães', 'Braga', 41.390649, -8.340294)
  RETURNING id
)
INSERT INTO alojamentos (nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, num_camas, rating, telefone, email, website)
SELECT
  'Casa Rural Recanto do Ave [MOCK]',
  'Casa rural fictícia para testes, junto ao rio Ave em Ronfe.',
  'casa_rural', loc.id, 75.00, 3, 6, 4.6,
  '+351 000 000 001', 'mock-casa-rural@teste.otj.local', NULL
FROM loc;

-- 2) Pousada — centro histórico de Guimarães
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, latitude, longitude)
  VALUES ('4800-015', 'Centro Histórico', 'Guimarães', 'Guimarães', 'Braga', 41.457564, -8.279383)
  RETURNING id
)
INSERT INTO alojamentos (nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, num_camas, rating, telefone, email, website)
SELECT
  'Pousada Solar de Guimarães [MOCK]',
  'Pousada fictícia para testes, no centro histórico de Guimarães.',
  'pousada', loc.id, 120.00, 8, 16, 4.8,
  '+351 000 000 002', 'mock-pousada@teste.otj.local', NULL
FROM loc;

-- 3) Hostel — Braga
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, latitude, longitude)
  VALUES ('4700-018', 'Braga Centro', 'Braga', 'Braga', 'Braga', 41.575187, -8.450903)
  RETURNING id
)
INSERT INTO alojamentos (nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, num_camas, rating, telefone, email, website)
SELECT
  'Hostel Ninho Urbano [MOCK]',
  'Hostel fictício para testes, perto do centro de Braga.',
  'hostel', loc.id, 25.00, 6, 20, 4.2,
  '+351 000 000 003', 'mock-hostel@teste.otj.local', NULL
FROM loc;

-- 4) Hotel — Póvoa de Lanhoso
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, latitude, longitude)
  VALUES ('4830-067', 'Póvoa de Lanhoso', 'Póvoa de Lanhoso', 'Póvoa de Lanhoso', 'Braga', 41.588026, -8.262083)
  RETURNING id
)
INSERT INTO alojamentos (nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, num_camas, rating, telefone, email, website)
SELECT
  'Hotel Miradouro do Minho [MOCK]',
  'Hotel fictício para testes, com vista sobre o vale do Minho.',
  'hotel', loc.id, 95.00, 20, 40, 4.4,
  '+351 000 000 004', 'mock-hotel@teste.otj.local', NULL
FROM loc;

-- 5) Apartamento — Fafe
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, latitude, longitude)
  VALUES ('4820-010', 'Fafe Centro', 'Fafe', 'Fafe', 'Braga', 41.414462, -8.199082)
  RETURNING id
)
INSERT INTO alojamentos (nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, num_camas, rating, telefone, email, website)
SELECT
  'Apartamento Terraço da Vila [MOCK]',
  'Apartamento fictício para testes, no centro de Fafe.',
  'apartamento', loc.id, 55.00, 2, 4, 4.0,
  '+351 000 000 005', 'mock-apartamento@teste.otj.local', NULL
FROM loc;

-- 6) Chalé — Cabeceiras de Basto
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, latitude, longitude)
  VALUES ('4860-015', 'Cabeceiras de Basto', 'Cabeceiras de Basto', 'Cabeceiras de Basto', 'Braga', 41.595950, -7.961983)
  RETURNING id
)
INSERT INTO alojamentos (nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, num_camas, rating, telefone, email, website)
SELECT
  'Chalé Refúgio da Serra [MOCK]',
  'Chalé fictício para testes, na Serra da Cabreira.',
  'chalé', loc.id, 68.00, 2, 4, 4.7,
  '+351 000 000 006', 'mock-chale@teste.otj.local', NULL
FROM loc;

-- 7) Quinta — Vila Verde
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, latitude, longitude)
  VALUES ('4730-031', 'Vila Verde', 'Vila Verde', 'Vila Verde', 'Braga', 41.682237, -8.449270)
  RETURNING id
)
INSERT INTO alojamentos (nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, num_camas, rating, telefone, email, website)
SELECT
  'Quinta do Vale Dourado [MOCK]',
  'Quinta agro-turística fictícia para testes, em Vila Verde.',
  'quinta', loc.id, 89.00, 5, 10, 4.5,
  '+351 000 000 007', 'mock-quinta@teste.otj.local', NULL
FROM loc;

-- ------------------------------------------------------------
-- Refeições de teste para 2 dos alojamentos mock (para exercitar
-- o fluxo de reserva com refeições/meia-pensão/pensão completa)
-- ------------------------------------------------------------
INSERT INTO refeicoes_alojamento (alojamento_id, tipo_refeicao, preco_extra, disponivel)
SELECT a.id, t.tipo_refeicao, t.preco, true
FROM alojamentos a
JOIN (
  VALUES
    ('pequeno_almoco'::text, 8.00),
    ('almoço'::text, 15.00),
    ('jantar'::text, 17.00)
) AS t(tipo_refeicao, preco) ON true
WHERE a.nome = 'Pousada Solar de Guimarães [MOCK]'
ON CONFLICT DO NOTHING;

INSERT INTO refeicoes_alojamento (alojamento_id, tipo_refeicao, preco_extra, disponivel)
SELECT a.id, t.tipo_refeicao, t.preco, true
FROM alojamentos a
JOIN (
  VALUES
    ('pequeno_almoco'::text, 7.50),
    ('jantar'::text, 16.00)
) AS t(tipo_refeicao, preco) ON true
WHERE a.nome = 'Quinta do Vale Dourado [MOCK]'
ON CONFLICT DO NOTHING;
