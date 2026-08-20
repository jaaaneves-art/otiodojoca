create table "public"."categorias_entidade" (
  "id"                 bigint                   generated always as identity not null,
  "nome"               text                     not null,
  "slug"               text                     not null,
  "descricao"          text,
  "icone"              text,
  "cor_tema"           text,
  "ordem_apresentacao" integer                  default 0,
  "created_at"         timestamp with time zone not null default now(),
  "updated_at"         timestamp with time zone not null default now(),
  constraint "categorias_entidade_nome_key" unique (nome),
  constraint "categorias_entidade_pkey" primary key (id),
  constraint "categorias_entidade_slug_key" unique (slug)
);

alter table "public"."categorias_entidade"
  enable row level security;

create index idx_categorias_slug on public.categorias_entidade using btree (slug);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."categorias_entidade" to "anon", "authenticated", "postgres", "service_role";
