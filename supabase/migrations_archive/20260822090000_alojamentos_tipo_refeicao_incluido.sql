-- Alarga o CHECK de reservas_alojamento.tipo_refeicao para aceitar 'incluido'
-- (opção "refeição incluída, sem custo extra" agora oferecida no formulário
-- de reserva independentemente de o alojamento ter linhas em
-- refeicoes_alojamento).
--
-- Repomos a constraint do zero com TODOS os valores válidos (incluindo
-- 'almoço'/'jantar', já introduzidos numa migração anterior) para o caso de
-- essa migração anterior não ter chegado a ser aplicada neste ambiente —
-- este script é idempotente e seguro de correr mais do que uma vez.

alter table "public"."reservas_alojamento"
  drop constraint if exists "reservas_alojamento_tipo_refeicao_check";

alter table "public"."reservas_alojamento"
  add constraint "reservas_alojamento_tipo_refeicao_check"
  check (
    (tipo_refeicao)::text = ANY (
      (ARRAY[
        'sem_refeicoes'::character varying,
        'incluido'::character varying,
        'pequeno_almoco'::character varying,
        'meia_pensao'::character varying,
        'pensao_completa'::character varying,
        'almoço'::character varying,
        'jantar'::character varying
      ])::text[]
    )
  );
