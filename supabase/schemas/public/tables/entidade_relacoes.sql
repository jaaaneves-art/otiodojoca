create table "public"."entidade_relacoes" (
  "id"                  bigint                   generated always as identity not null,
  "entidade_origem_id"  bigint                   not null,
  "tipo_relacao"        text                     not null,
  "entidade_destino_id" bigint                   not null,
  "descricao"           text,
  "data_inicio"         date,
  "data_fim"            date,
  "created_at"          timestamp with time zone not null default now(),
  "updated_at"          timestamp with time zone not null default now(),
  constraint "entidade_relacoes_entidade_origem_id_tipo_relacao_entidade__key" unique (entidade_origem_id, tipo_relacao, entidade_destino_id),
  constraint "entidade_relacoes_pkey" primary key (id),
  constraint "tipo_relacao_valido"
    check
    ((tipo_relacao = ANY (ARRAY['presidente_de'::text, 'vice_presidente_de'::text, 'membro_de'::text, 'parceiro_de'::text, 'organiza_evento'::text, 'colabora_com'::text,
    'filial_de'::text, 'subsecao_de'::text]))),
  constraint "entidade_relacoes_entidade_destino_id_fkey" foreign key (entidade_destino_id) references public.entidades(id) on delete cascade,
  constraint "entidade_relacoes_entidade_origem_id_fkey" foreign key (entidade_origem_id) references public.entidades(id) on delete cascade
);

alter table "public"."entidade_relacoes"
  enable row level security;

create index idx_relacoes_destino on public.entidade_relacoes using btree (entidade_destino_id);

create index idx_relacoes_origem on public.entidade_relacoes using btree (entidade_origem_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."entidade_relacoes" to "anon", "authenticated", "postgres", "service_role";
