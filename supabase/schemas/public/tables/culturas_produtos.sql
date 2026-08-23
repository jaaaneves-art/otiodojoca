create table "public"."culturas_produtos" (
  "id"                 uuid                        not null default gen_random_uuid(),
  "cultura_id"         uuid                        not null,
  "produto_nome"       character varying           not null,
  "produto_cientifico" character varying,
  "descricao"          text,
  "peso_importancia"   integer                     default 1,
  "parte_planta"       character varying,
  "created_at"         timestamp without time zone default now(),
  constraint "culturas_produtos_cultura_id_fkey" foreign key (cultura_id) references public.culturas_guia(id) on delete cascade,
  constraint "culturas_produtos_cultura_id_produto_nome_key" unique (cultura_id, produto_nome),
  constraint "culturas_produtos_pkey" primary key (id)
);

create index idx_culturas_produtos_cultura_id on public.culturas_produtos using btree (cultura_id);

create index idx_culturas_produtos_nome on public.culturas_produtos using btree (produto_nome);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."culturas_produtos" to "anon", "authenticated", "postgres", "service_role";
