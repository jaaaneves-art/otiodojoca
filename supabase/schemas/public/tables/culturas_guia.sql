create table "public"."culturas_guia" (
  "id"                    uuid                        not null default gen_random_uuid(),
  "nome"                  text                        not null,
  "nome_cientifico"       text,
  "categoria"             text                        not null,
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
  "criado_em"             timestamp with time zone    default now(),
  "atualizado_em"         timestamp with time zone    default now(),
  "tipo_cultura"          character varying,
  "subcategoria"          character varying,
  "descricao_estendida"   text,
  "updated_at"            timestamp without time zone default now(),
  constraint "culturas_guia_nome_key" unique (nome),
  constraint "culturas_guia_pkey" primary key (id)
);

alter table "public"."culturas_guia"
  enable row level security;

create policy "culturas_guia_read_public" on "public"."culturas_guia"
  for select
  to PUBLIC
  using (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."culturas_guia" to "anon", "authenticated", "postgres", "service_role";
