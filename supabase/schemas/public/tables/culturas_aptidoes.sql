create table "public"."culturas_aptidoes" (
  "id"               uuid                        not null default gen_random_uuid(),
  "cultura_id"       uuid                        not null,
  "aptidao"          character varying           not null,
  "descricao"        text,
  "peso_importancia" integer                     default 1,
  "created_at"       timestamp without time zone default now(),
  constraint "culturas_aptidoes_cultura_id_aptidao_key" unique (cultura_id, aptidao),
  constraint "culturas_aptidoes_pkey" primary key (id),
  constraint "culturas_aptidoes_cultura_id_fkey" foreign key (cultura_id) references public.culturas_guia(id) on delete cascade
);

create index idx_culturas_aptidoes_aptidao on public.culturas_aptidoes using btree (aptidao);

create index idx_culturas_aptidoes_cultura_id on public.culturas_aptidoes using btree (cultura_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."culturas_aptidoes" to "anon", "authenticated", "postgres", "service_role";
