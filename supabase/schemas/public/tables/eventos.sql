create table "public"."eventos" (
  "id"                       bigint                   generated always as identity not null,
  "nome"                     text                     not null,
  "slug"                     text                     not null,
  "descricao"                text,
  "fotografias"              text[],
  "inicio"                   timestamp with time zone not null,
  "fim"                      timestamp with time zone,
  "freguesia_id"             bigint                   not null,
  "lugar"                    text,
  "localizacao_id"           bigint,
  "entidade_organizadora_id" bigint,
  "tipo"                     text                     not null,
  "telefone"                 text,
  "email"                    text,
  "website"                  text,
  "origem"                   text,
  "estado"                   text                     not null default 'rascunho'::text,
  "criado_por"               text,
  "atualizado_por"           text,
  "created_at"               timestamp with time zone not null default now(),
  "updated_at"               timestamp with time zone not null default now(),
  constraint "datas_logicas" check (((fim IS NULL) OR (inicio < fim))),
  constraint "estado_valido" check ((estado = ANY (ARRAY['rascunho'::text, 'validado'::text, 'publicado'::text, 'cancelado'::text, 'arquivado'::text]))),
  constraint "eventos_entidade_organizadora_id_fkey" foreign key (entidade_organizadora_id) references public.entidades(id),
  constraint "eventos_pkey" primary key (id),
  constraint "eventos_slug_freguesia_id_inicio_key" unique (slug, freguesia_id, inicio),
  constraint "tipo_valido" check ((tipo = ANY (ARRAY['festa'::text, 'encontro'::text, 'workshop'::text, 'culto'::text, 'desporto'::text, 'cultural'::text, 'outro'::text]))),
  constraint "eventos_freguesia_id_fkey" foreign key (freguesia_id) references public.freguesias(id),
  constraint "eventos_localizacao_id_fkey" foreign key (localizacao_id) references public.localizacoes(id)
);

alter table "public"."eventos"
  enable row level security;

create index idx_eventos_freguesia on public.eventos using btree (freguesia_id);

create index idx_eventos_inicio on public.eventos using btree (inicio);

create index idx_eventos_organizador on public.eventos using btree (entidade_organizadora_id);

create policy "eventos_public_read" on "public"."eventos"
  for select
  to PUBLIC
  using ((estado = 'publicado'::text));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."eventos" to "anon", "authenticated", "postgres", "service_role";
