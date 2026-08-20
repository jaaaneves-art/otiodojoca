create table "public"."refeicoes_alojamento" (
  "id"            bigint                   generated always as identity not null,
  "alojamento_id" bigint                   not null,
  "tipo_refeicao" character varying        not null,
  "preco_extra"   numeric(8,2),
  "disponivel"    boolean                  not null default true,
  "created_at"    timestamp with time zone not null default now(),
  "updated_at"    timestamp with time zone not null default now(),
  constraint "refeicoes_alojamento_alojamento_id_fkey" foreign key (alojamento_id) references public.alojamentos(id) on delete cascade,
  constraint "refeicoes_alojamento_pkey" primary key (id),
  constraint "refeicoes_alojamento_tipo_refeicao_check"
    check (((tipo_refeicao)::text = ANY ((ARRAY['pequeno_almoco'::character varying, 'almoço'::character varying, 'jantar'::character varying])::text[]))),
  constraint "unique_alojamento_refeicao" unique (alojamento_id, tipo_refeicao)
);

alter table "public"."refeicoes_alojamento"
  enable row level security;

create index idx_refeicoes_alojamento_id on public.refeicoes_alojamento using btree (alojamento_id);

create index idx_refeicoes_tipo on public.refeicoes_alojamento using btree (tipo_refeicao);

create policy "Refeições - SELECT públicas" on "public"."refeicoes_alojamento"
  for select
  to PUBLIC
  using (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."refeicoes_alojamento" to "anon", "authenticated", "postgres", "service_role";
