-- ============================================================
-- OTJ - COMER: DADOS MOCK PARA TESTES (RESTAURANTES + RESERVAS)
-- ============================================================
-- Mesma abordagem usada nos alojamentos: 6 restaurantes FICTÍCIOS
-- (marcados [MOCK]), cada um com a sua própria localização —
-- código postal, morada e coordenadas GPS reais, cruzados com
-- sql/codigos_postais_geo.csv — mas nome, descrição e contactos
-- claramente fictícios. No fim, criam-se reservas de teste em
-- restaurante_reservas (user_id NULL — reservas de "convidado",
-- permitido pela policy "Criar reserva com user_id").
--
-- Seguro para apagar mais tarde com:
--   DELETE FROM restaurantes WHERE nome LIKE '%[MOCK]%';
-- (restaurante_reservas não tem ON DELETE CASCADE para
-- restaurante_id — apaga primeiro as reservas se for preciso).

-- 1) Tasca do Recanto — Guimarães
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, morada, latitude, longitude)
  VALUES ('4800-032', 'Centro de Guimarães', 'Guimarães', 'Guimarães', 'Braga', 'Rua de Santa Maria, nº 20', 41.461487, -8.283333)
  RETURNING id
)
INSERT INTO restaurantes (nome, descricao, especialidade, preco_medio, rating, telefone, email, website, localizacao_id)
SELECT
  'Tasca do Recanto [MOCK]',
  'Restaurante fictício para testes, comida tradicional portuguesa no centro de Guimarães.',
  'Comida tradicional portuguesa', 14.50, 4.5,
  '+351 000 000 101', 'mock-tasca-recanto@teste.otj.local', NULL, loc.id
FROM loc;

-- 2) O Fogão de Lenha — Braga
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, morada, latitude, longitude)
  VALUES ('4700-024', 'Braga Centro', 'Braga', 'Braga', 'Braga', 'Rua do Anjo, nº 45', 41.547513, -8.427097)
  RETURNING id
)
INSERT INTO restaurantes (nome, descricao, especialidade, preco_medio, rating, telefone, email, website, localizacao_id)
SELECT
  'O Fogão de Lenha [MOCK]',
  'Restaurante fictício para testes, grelhados e churrasco em Braga.',
  'Grelhados e churrasco', 16.00, 4.3,
  '+351 000 000 102', 'mock-fogao-lenha@teste.otj.local', NULL, loc.id
FROM loc;

-- 3) Marisqueira do Ave — Fafe
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, morada, latitude, longitude)
  VALUES ('4820-030', 'Fafe', 'Fafe', 'Fafe', 'Braga', 'Avenida do Ave, nº 102', 41.514656, -8.085141)
  RETURNING id
)
INSERT INTO restaurantes (nome, descricao, especialidade, preco_medio, rating, telefone, email, website, localizacao_id)
SELECT
  'Marisqueira do Ave [MOCK]',
  'Restaurante fictício para testes, marisco e peixe fresco em Fafe.',
  'Marisco e peixe', 22.00, 4.6,
  '+351 000 000 103', 'mock-marisqueira-ave@teste.otj.local', NULL, loc.id
FROM loc;

-- 4) Petiscos & Companhia — Amares
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, morada, latitude, longitude)
  VALUES ('4720-016', 'Amares', 'Amares', 'Amares', 'Braga', 'Rua Nova, nº 8', 41.664563, -8.369769)
  RETURNING id
)
INSERT INTO restaurantes (nome, descricao, especialidade, preco_medio, rating, telefone, email, website, localizacao_id)
SELECT
  'Petiscos & Companhia [MOCK]',
  'Restaurante fictício para testes, petiscos e vinhos em Amares.',
  'Petiscos e vinhos', 12.00, 4.1,
  '+351 000 000 104', 'mock-petiscos@teste.otj.local', NULL, loc.id
FROM loc;

-- 5) Solar dos Sabores — Póvoa de Lanhoso
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, morada, latitude, longitude)
  VALUES ('4830-064', 'Póvoa de Lanhoso', 'Póvoa de Lanhoso', 'Póvoa de Lanhoso', 'Braga', 'Praça do Município, nº 3', 41.598983, -8.264470)
  RETURNING id
)
INSERT INTO restaurantes (nome, descricao, especialidade, preco_medio, rating, telefone, email, website, localizacao_id)
SELECT
  'Solar dos Sabores [MOCK]',
  'Restaurante fictício para testes, cozinha de autor em Póvoa de Lanhoso.',
  'Cozinha de autor', 28.00, 4.7,
  '+351 000 000 105', 'mock-solar-sabores@teste.otj.local', NULL, loc.id
FROM loc;

-- 6) Adega Terras de Bouro — Terras de Bouro
WITH loc AS (
  INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, morada, latitude, longitude)
  VALUES ('4840-020', 'Terras de Bouro', 'Terras de Bouro', 'Terras de Bouro', 'Braga', 'Rua do Gerês, nº 60', 41.764953, -8.239026)
  RETURNING id
)
INSERT INTO restaurantes (nome, descricao, especialidade, preco_medio, rating, telefone, email, website, localizacao_id)
SELECT
  'Adega Terras de Bouro [MOCK]',
  'Restaurante fictício para testes, cozinha regional do Minho junto ao Gerês.',
  'Cozinha regional do Minho', 18.50, 4.4,
  '+351 000 000 106', 'mock-adega-bouro@teste.otj.local', NULL, loc.id
FROM loc;

-- ------------------------------------------------------------
-- Reservas de teste (user_id NULL, permitido pela policy de
-- INSERT que aceita "auth.uid() = user_id OR user_id IS NULL")
-- ------------------------------------------------------------
INSERT INTO restaurante_reservas (restaurante_id, nome_cliente, email_cliente, telefone, data_reserva, hora_reserva, numero_pessoas, observacoes, user_id)
SELECT r.id, x.nome_cliente, x.email_cliente, x.telefone, x.data_reserva::date, x.hora_reserva::time, x.numero_pessoas, x.observacoes, NULL
FROM restaurantes r
JOIN (
  VALUES
    ('Tasca do Recanto [MOCK]', 'Cliente Mock 1', 'mock-cliente-1@teste.otj.local', '+351 000 000 201', '2026-09-05', '20:00', 4, 'Mesa junto à janela, por favor.'),
    ('Tasca do Recanto [MOCK]', 'Cliente Mock 2', 'mock-cliente-2@teste.otj.local', '+351 000 000 202', '2026-09-12', '13:30', 2, NULL)
) AS x(nome_restaurante, nome_cliente, email_cliente, telefone, data_reserva, hora_reserva, numero_pessoas, observacoes)
  ON r.nome = x.nome_restaurante;

INSERT INTO restaurante_reservas (restaurante_id, nome_cliente, email_cliente, telefone, data_reserva, hora_reserva, numero_pessoas, observacoes, user_id)
SELECT r.id, x.nome_cliente, x.email_cliente, x.telefone, x.data_reserva::date, x.hora_reserva::time, x.numero_pessoas, x.observacoes, NULL
FROM restaurantes r
JOIN (
  VALUES
    ('O Fogão de Lenha [MOCK]', 'Cliente Mock 3', 'mock-cliente-3@teste.otj.local', '+351 000 000 203', '2026-09-08', '21:00', 6, 'Aniversário, se possível bolo simbólico.')
) AS x(nome_restaurante, nome_cliente, email_cliente, telefone, data_reserva, hora_reserva, numero_pessoas, observacoes)
  ON r.nome = x.nome_restaurante;

INSERT INTO restaurante_reservas (restaurante_id, nome_cliente, email_cliente, telefone, data_reserva, hora_reserva, numero_pessoas, observacoes, user_id)
SELECT r.id, x.nome_cliente, x.email_cliente, x.telefone, x.data_reserva::date, x.hora_reserva::time, x.numero_pessoas, x.observacoes, NULL
FROM restaurantes r
JOIN (
  VALUES
    ('Marisqueira do Ave [MOCK]', 'Cliente Mock 4', 'mock-cliente-4@teste.otj.local', '+351 000 000 204', '2026-09-15', '20:30', 3, NULL)
) AS x(nome_restaurante, nome_cliente, email_cliente, telefone, data_reserva, hora_reserva, numero_pessoas, observacoes)
  ON r.nome = x.nome_restaurante;

INSERT INTO restaurante_reservas (restaurante_id, nome_cliente, email_cliente, telefone, data_reserva, hora_reserva, numero_pessoas, observacoes, user_id)
SELECT r.id, x.nome_cliente, x.email_cliente, x.telefone, x.data_reserva::date, x.hora_reserva::time, x.numero_pessoas, x.observacoes, NULL
FROM restaurantes r
JOIN (
  VALUES
    ('Petiscos & Companhia [MOCK]', 'Cliente Mock 5', 'mock-cliente-5@teste.otj.local', '+351 000 000 205', '2026-09-20', '19:00', 2, NULL),
    ('Petiscos & Companhia [MOCK]', 'Cliente Mock 6', 'mock-cliente-6@teste.otj.local', '+351 000 000 206', '2026-10-01', '21:00', 5, 'Grupo de amigos, mesa grande.')
) AS x(nome_restaurante, nome_cliente, email_cliente, telefone, data_reserva, hora_reserva, numero_pessoas, observacoes)
  ON r.nome = x.nome_restaurante;

INSERT INTO restaurante_reservas (restaurante_id, nome_cliente, email_cliente, telefone, data_reserva, hora_reserva, numero_pessoas, observacoes, user_id)
SELECT r.id, x.nome_cliente, x.email_cliente, x.telefone, x.data_reserva::date, x.hora_reserva::time, x.numero_pessoas, x.observacoes, NULL
FROM restaurantes r
JOIN (
  VALUES
    ('Adega Terras de Bouro [MOCK]', 'Cliente Mock 7', 'mock-cliente-7@teste.otj.local', '+351 000 000 207', '2026-09-25', '20:00', 8, 'Reunião de família.')
) AS x(nome_restaurante, nome_cliente, email_cliente, telefone, data_reserva, hora_reserva, numero_pessoas, observacoes)
  ON r.nome = x.nome_restaurante;

-- 'Solar dos Sabores [MOCK]' fica sem reservas de propósito,
-- para testar o estado "sem reservas" na app.
