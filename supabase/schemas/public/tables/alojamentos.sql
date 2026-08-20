create table "public"."alojamentos" (
  "id"             bigint                   generated always as identity not null,
  "nome"           text                     not null,
  "descricao"      text,
  "tipo"           character varying        not null,
  "localizacao_id" bigint                   not null,
  "preco_noite"    numeric(10,2)            not null,
  "num_quartos"    integer                  not null,
  "num_camas"      integer,
  "rating"         numeric(3,2),
  "telefone"       character varying,
  "email"          character varying,
  "website"        character varying,
  "created_at"     timestamp with time zone not null default now(),
  "updated_at"     timestamp with time zone not null default now(),
  constraint "alojamentos_num_quartos_check" check ((num_quartos > 0)),
  constraint "alojamentos_pkey" primary key (id),
  constraint "alojamentos_rating_check" check (((rating >= (0)::numeric) AND (rating <= (5)::numeric))),
  constraint "alojamentos_localizacao_id_fkey" foreign key (localizacao_id) references public.localizacoes(id) on delete restrict,
  constraint "alojamentos_tipo_fkey" foreign key (tipo) references public.tipos_alojamento(nome)
);

alter table "public"."alojamentos"
  enable row level security;

create index idx_alojamentos_localizacao_id on public.alojamentos using btree (localizacao_id);

create index idx_alojamentos_nome on public.alojamentos using btree (nome);

create index idx_alojamentos_preco_noite on public.alojamentos using btree (preco_noite);

create index idx_alojamentos_tipo on public.alojamentos using btree (tipo);

create policy "Alojamentos - SELECT públicos" on "public"."alojamentos"
  for select
  to PUBLIC
  using (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."alojamentos" to "anon", "authenticated", "postgres", "service_role";
