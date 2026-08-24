-- ============================================================
-- OTJ - ALOJAMENTOS: MORADA + OPÇÕES DE REFEIÇÃO
-- ============================================================

-- 1) Adicionar campo de morada (rua/número) à tabela localizacoes.
--    Hoje só existe codigo_postal + localidade/municipio/distrito,
--    sem um campo de texto livre para a rua/número do imóvel.
ALTER TABLE localizacoes
  ADD COLUMN IF NOT EXISTS morada TEXT;

-- 2) Preencher a morada (fictícia, para teste) dos 7 alojamentos
--    [MOCK] criados na migration anterior. O codigo_postal,
--    latitude e longitude mantêm-se os reais já atribuídos.
UPDATE localizacoes SET morada = 'Rua do Ave, nº 12'
WHERE codigo_postal = '4815-030' AND nome = 'Recanto do Ave';

UPDATE localizacoes SET morada = 'Largo do Toural, nº 5'
WHERE codigo_postal = '4800-015' AND nome = 'Centro Histórico';

UPDATE localizacoes SET morada = 'Rua do Souto, nº 88'
WHERE codigo_postal = '4700-018' AND nome = 'Braga Centro';

UPDATE localizacoes SET morada = 'Avenida do Minho, nº 210'
WHERE codigo_postal = '4830-067' AND nome = 'Póvoa de Lanhoso';

UPDATE localizacoes SET morada = 'Rua Central, nº 34'
WHERE codigo_postal = '4820-010' AND nome = 'Fafe Centro';

UPDATE localizacoes SET morada = 'Caminho da Serra, nº 7'
WHERE codigo_postal = '4860-015' AND nome = 'Cabeceiras de Basto';

UPDATE localizacoes SET morada = 'Estrada da Quinta, nº 45'
WHERE codigo_postal = '4730-031' AND nome = 'Vila Verde';

-- ------------------------------------------------------------
-- 3) Corrigir o tipo_refeicao de reservas_alojamento.
--
-- Bug encontrado: o formulário de reserva (reserva-form.tsx)
-- constrói o dropdown "Tipo de Refeição" a partir das opções em
-- refeicoes_alojamento ('pequeno_almoco', 'almoço', 'jantar'), mas
-- a constraint de reservas_alojamento só aceitava
-- ('sem_refeicoes', 'pequeno_almoco', 'meia_pensao', 'pensao_completa').
-- Escolher "almoço" ou "jantar" no formulário rebentava o INSERT
-- por violar o CHECK constraint. Adicionamos as duas opções em
-- falta — 'jantar' é a que não inclui pequeno-almoço.
-- ------------------------------------------------------------
ALTER TABLE reservas_alojamento
  DROP CONSTRAINT IF EXISTS reservas_alojamento_tipo_refeicao_check;

ALTER TABLE reservas_alojamento
  ADD CONSTRAINT reservas_alojamento_tipo_refeicao_check
  CHECK (tipo_refeicao IN (
    'sem_refeicoes',
    'pequeno_almoco',
    'meia_pensao',
    'pensao_completa',
    'almoço',
    'jantar'
  ));
