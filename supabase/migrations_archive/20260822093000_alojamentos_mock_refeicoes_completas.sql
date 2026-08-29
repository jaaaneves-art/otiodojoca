-- ============================================================
-- OTJ - ALOJAMENTOS MOCK: completar refeicoes_alojamento
-- ============================================================
-- Dos 7 alojamentos mock criados em 20260821180000, só a "Pousada
-- Solar de Guimarães [MOCK]" e a "Quinta do Vale Dourado [MOCK]"
-- tinham linhas em refeicoes_alojamento — por isso o dropdown de
-- "Tipo de Refeição" no formulário de reserva só mostrava
-- pequeno-almoço/almoço/jantar (com preço) nesses dois.
--
-- Esta migração acrescenta pequeno-almoço, almoço e jantar (com
-- preços fictícios, coerentes com o preco_noite de cada mock) aos
-- restantes 5 alojamentos mock, e completa o almoço em falta na
-- Quinta do Vale Dourado. Idempotente: usa ON CONFLICT DO NOTHING
-- sobre a constraint unique_alojamento_refeicao (alojamento_id,
-- tipo_refeicao), por isso é seguro correr mais do que uma vez.

-- 1) Casa Rural Recanto do Ave [MOCK]
INSERT INTO refeicoes_alojamento (alojamento_id, tipo_refeicao, preco_extra, disponivel)
SELECT a.id, t.tipo_refeicao, t.preco, true
FROM alojamentos a
JOIN (
  VALUES
    ('pequeno_almoco'::text, 6.00),
    ('almoço'::text, 12.00),
    ('jantar'::text, 14.00)
) AS t(tipo_refeicao, preco) ON true
WHERE a.nome = 'Casa Rural Recanto do Ave [MOCK]'
ON CONFLICT DO NOTHING;

-- 2) Hostel Ninho Urbano [MOCK]
INSERT INTO refeicoes_alojamento (alojamento_id, tipo_refeicao, preco_extra, disponivel)
SELECT a.id, t.tipo_refeicao, t.preco, true
FROM alojamentos a
JOIN (
  VALUES
    ('pequeno_almoco'::text, 5.00),
    ('almoço'::text, 9.00),
    ('jantar'::text, 10.00)
) AS t(tipo_refeicao, preco) ON true
WHERE a.nome = 'Hostel Ninho Urbano [MOCK]'
ON CONFLICT DO NOTHING;

-- 3) Hotel Miradouro do Minho [MOCK]
INSERT INTO refeicoes_alojamento (alojamento_id, tipo_refeicao, preco_extra, disponivel)
SELECT a.id, t.tipo_refeicao, t.preco, true
FROM alojamentos a
JOIN (
  VALUES
    ('pequeno_almoco'::text, 10.00),
    ('almoço'::text, 18.00),
    ('jantar'::text, 22.00)
) AS t(tipo_refeicao, preco) ON true
WHERE a.nome = 'Hotel Miradouro do Minho [MOCK]'
ON CONFLICT DO NOTHING;

-- 4) Apartamento Terraço da Vila [MOCK]
INSERT INTO refeicoes_alojamento (alojamento_id, tipo_refeicao, preco_extra, disponivel)
SELECT a.id, t.tipo_refeicao, t.preco, true
FROM alojamentos a
JOIN (
  VALUES
    ('pequeno_almoco'::text, 7.00),
    ('almoço'::text, 13.00),
    ('jantar'::text, 15.00)
) AS t(tipo_refeicao, preco) ON true
WHERE a.nome = 'Apartamento Terraço da Vila [MOCK]'
ON CONFLICT DO NOTHING;

-- 5) Chalé Refúgio da Serra [MOCK]
INSERT INTO refeicoes_alojamento (alojamento_id, tipo_refeicao, preco_extra, disponivel)
SELECT a.id, t.tipo_refeicao, t.preco, true
FROM alojamentos a
JOIN (
  VALUES
    ('pequeno_almoco'::text, 9.00),
    ('almoço'::text, 16.00),
    ('jantar'::text, 19.00)
) AS t(tipo_refeicao, preco) ON true
WHERE a.nome = 'Chalé Refúgio da Serra [MOCK]'
ON CONFLICT DO NOTHING;

-- 6) Quinta do Vale Dourado [MOCK] — já tinha pequeno_almoco (7.50) e
--    jantar (16.00); falta só o almoço.
INSERT INTO refeicoes_alojamento (alojamento_id, tipo_refeicao, preco_extra, disponivel)
SELECT a.id, t.tipo_refeicao, t.preco, true
FROM alojamentos a
JOIN (
  VALUES
    ('almoço'::text, 14.00)
) AS t(tipo_refeicao, preco) ON true
WHERE a.nome = 'Quinta do Vale Dourado [MOCK]'
ON CONFLICT DO NOTHING;

-- Nota: "Pousada Solar de Guimarães [MOCK]" já tinha as 3 refeições
-- completas desde a migração original — não precisa de nada aqui.
