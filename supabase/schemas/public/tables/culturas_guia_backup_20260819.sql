create table "public"."culturas_guia_backup_20260819" (
  "id"                    uuid,
  "nome"                  text,
  "nome_cientifico"       text,
  "categoria"             text,
  "ciclo_dias_min"        integer,
  "ciclo_dias_max"        integer,
  "semeadura_fase_lunar"  text,
  "poda_fase_lunar"       text,
  "colheita_fase_lunar"   text,
  "meses_semeadura"       text,
  "meses_colheita"        text,
  "temp_min_germinacao"   numeric,
  "temp_otima"            numeric,
  "humidade_ideal"        text,
  "descricao"             text,
  "associacoes_beneficas" text,
  "dicas"                 text,
  "criado_em"             timestamp with time zone,
  "atualizado_em"         timestamp with time zone
);

alter table "public"."culturas_guia_backup_20260819"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."culturas_guia_backup_20260819"
  to "anon", "authenticated", "postgres", "service_role";
