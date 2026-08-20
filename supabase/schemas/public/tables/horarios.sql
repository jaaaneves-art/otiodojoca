create table "public"."horarios" (
  "id"                bigint                   generated always as identity not null,
  "entidade_id"       bigint                   not null,
  "dia_semana"        integer                  not null,
  "hora_abertura"     time without time zone,
  "hora_encerramento" time without time zone,
  "observacoes"       text,
  "created_at"        timestamp with time zone not null default now(),
  "updated_at"        timestamp with time zone not null default now(),
  constraint "horarios_dia_semana_check" check (((dia_semana >= 0) AND (dia_semana <= 6))),
  constraint "horarios_entidade_id_dia_semana_key" unique (entidade_id, dia_semana),
  constraint "horarios_entidade_id_fkey" foreign key (entidade_id) references public.entidades(id) on delete cascade,
  constraint "horarios_pkey" primary key (id),
  constraint "horas_logicas" check ((((hora_abertura IS NULL) AND (hora_encerramento IS NULL)) OR ((hora_abertura IS NOT NULL) AND (hora_encerramento IS
    NOT NULL) AND (hora_abertura < hora_encerramento))))
);

alter table "public"."horarios"
  enable row level security;

create index idx_horarios_entidade on public.horarios using btree (entidade_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."horarios" to "anon", "authenticated", "postgres", "service_role";
