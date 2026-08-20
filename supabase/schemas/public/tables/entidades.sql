create table "public"."entidades" (
  "id"               bigint                   generated always as identity not null,
  "nome"             text                     not null,
  "slug"             text                     not null,
  "descricao"        text,
  "fotografias"      text[],
  "categoria_id"     bigint                   not null,
  "freguesia_id"     bigint                   not null,
  "lugar"            text,
  "localizacao_id"   bigint,
  "telefone"         text,
  "email"            text,
  "website"          text,
  "redes_sociais"    jsonb,
  "ref_tabela"       character varying(50),
  "ref_id"           uuid,
  "origem"           text,
  "fonte_url"        text,
  "data_verificacao" date,
  "estado"           text                     not null default 'rascunho'::text,
  "criado_por"       text,
  "atualizado_por"   text,
  "created_at"       timestamp with time zone not null default now(),
  "updated_at"       timestamp with time zone not null default now(),
  constraint "entidades_categoria_id_fkey" foreign key (categoria_id) references public.categorias_entidade(id),
  constraint "entidades_pkey" primary key (id),
  constraint "entidades_ref_tabela_ref_id_key" unique (ref_tabela, ref_id),
  constraint "entidades_slug_key" unique (slug),
  constraint "estado_valido" check ((estado = ANY (ARRAY['rascunho'::text, 'pendente'::text, 'validado'::text, 'publicado'::text, 'desactualizado'::text, 'arquivado'::text]))),
  constraint "entidades_freguesia_id_fkey" foreign key (freguesia_id) references public.freguesias(id),
  constraint "entidades_localizacao_id_fkey" foreign key (localizacao_id) references public.localizacoes(id)
);

alter table "public"."entidades"
  enable row level security;

create index idx_entidades_categoria on public.entidades using btree (categoria_id);

create index idx_entidades_estado on public.entidades using btree (estado);

create index idx_entidades_freguesia on public.entidades using btree (freguesia_id);

create index idx_entidades_localizacao on public.entidades using btree (localizacao_id);

create index idx_entidades_ref on public.entidades using btree (ref_tabela, ref_id);

create index idx_entidades_slug on public.entidades using btree (slug);

create policy "entidades_public_read" on "public"."entidades"
  for select
  to PUBLIC
  using ((estado = 'publicado'::text));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."entidades" to "anon", "authenticated", "postgres", "service_role";
