create table "public"."plantacao_historico" (
  "id"               bigint                   generated always as identity not null,
  "plantacao_id"     bigint                   not null,
  "evento"           text                     not null,
  "valor_antigo"     text,
  "valor_novo"       text,
  "notas_utilizador" text,
  "criado_em"        timestamp with time zone default now(),
  constraint "plantacao_historico_pkey" primary key (id),
  constraint "plantacao_historico_plantacao_id_fkey" foreign key (plantacao_id) references public.plantacoes(id) on delete cascade
);

alter table "public"."plantacao_historico"
  enable row level security;

create policy "plantacao_historico_access" on "public"."plantacao_historico"
  for select
  to PUBLIC
  using ((exists ( select 1
   from public.plantacoes p
  where ((p.id = plantacao_historico.plantacao_id) AND (auth.uid() = p.utilizador_id)))));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."plantacao_historico" to "anon", "authenticated", "postgres", "service_role";
