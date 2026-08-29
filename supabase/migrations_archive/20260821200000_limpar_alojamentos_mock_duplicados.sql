-- ============================================================
-- OTJ - ALOJAMENTOS: LIMPAR DUPLICADOS DOS MOCKS
-- ============================================================
-- A migration 20260821180000_mock_alojamentos_teste.sql correu
-- duas vezes (os INSERTs não tinham proteção contra reexecução),
-- resultando em 14 alojamentos em vez de 7. Isto remove os
-- duplicados, mantendo sempre o registo de menor id por nome.

-- 1) Apagar alojamentos [MOCK] duplicados (refeicoes_alojamento
--    cai em cascata automaticamente, por causa do ON DELETE CASCADE).
DELETE FROM alojamentos a
USING alojamentos b
WHERE a.nome = b.nome
  AND a.nome LIKE '%[MOCK]%'
  AND a.id > b.id;

-- 2) Apagar as localizacoes que ficaram órfãs (sem nenhum
--    alojamento nem restaurante a apontar para elas), só as 7
--    criadas para este teste.
DELETE FROM localizacoes l
WHERE l.nome IN (
  'Recanto do Ave',
  'Centro Histórico',
  'Braga Centro',
  'Póvoa de Lanhoso',
  'Fafe Centro',
  'Cabeceiras de Basto',
  'Vila Verde'
)
AND NOT EXISTS (SELECT 1 FROM alojamentos al WHERE al.localizacao_id = l.id)
AND NOT EXISTS (SELECT 1 FROM restaurantes r WHERE r.localizacao_id = l.id);
