create table "public"."tipos_alojamento" (
  "id"         bigint                   generated always as identity not null,
  "nome"       character varying        not null,
  "descricao"  text,
  "created_at" timestamp with time zone not null default now(),
  constraint "tipos_alojamento_nome_key" unique (nome),
  constraint "tipos_alojamento_pkey" primary key (id)
);

alter table "public"."tipos_alojamento"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."tipos_alojamento" to "anon", "authenticated", "postgres", "service_role";
