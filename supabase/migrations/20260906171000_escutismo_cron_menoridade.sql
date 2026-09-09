-- Recalcula e_menor diariamente às 03h.
--
-- Sem isto, quem faz 18 anos continua marcado como menor: o trigger do
-- schema v1 dispara em UPDATE OF data_nascimento, e a data de nascimento
-- nunca muda.
--
-- Requer a extensão pg_cron ativa.

SELECT cron.schedule(
  'escutismo-menoridade',
  '0 3 * * *',
  'SELECT escutismo_atualiza_menoridade()'
);
