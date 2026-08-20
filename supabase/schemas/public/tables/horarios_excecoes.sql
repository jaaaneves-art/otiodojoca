create table "public"."horarios_excecoes" (
  "id"                bigint                   generated always as identity not null,
  "entidade_id"       bigint                   not null,
  "data_inicio"       date                     not null,
  "data_fim"          date                     not null,
  "motivo"            text                     not null,
  "hora_abertura"     time without time zone,
  "hora_encerramento" time without time zone,
  "criado_por"        text,
  "created_at"        timestamp with time zone not null default now(),
  "updated_at"        timestamp with time zone not null default now(),
  constraint "horarios_excecoes_entidade_id_fkey" foreign key (entidade_id) references public.entidades(id) on delete cascade,
  constraint "horarios_excecoes_pkey" primary key (id),
  constraint "periodo_logico" check ((data_inicio <= data_fim))
);

alter table "public"."horarios_excecoes"
  enable row level security;

create index idx_excecoes_entidade on public.horarios_excecoes using btree (entidade_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."horarios_excecoes" to "anon", "authenticated", "postgres", "service_role";
