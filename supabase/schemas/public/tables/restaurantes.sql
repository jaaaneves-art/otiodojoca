create table "public"."restaurantes" (
  "id"             bigint                   generated always as identity not null,
  "nome"           text                     not null,
  "descricao"      text,
  "especialidade"  text,
  "preco_medio"    numeric(10,2),
  "rating"         numeric(3,2),
  "telefone"       text,
  "email"          text,
  "website"        text,
  "localizacao_id" bigint                   not null,
  "created_at"     timestamp with time zone not null default now(),
  "updated_at"     timestamp with time zone not null default now(),
  constraint "restaurantes_localizacao_fk" foreign key (localizacao_id) references public.localizacoes(id) on delete restrict,
  constraint "restaurantes_pkey" primary key (id),
  constraint "restaurantes_preco_medio_check" check (((preco_medio IS NULL) OR (preco_medio >= (0)::numeric))),
  constraint "restaurantes_rating_check" check (((rating IS NULL) OR ((rating >= (0)::numeric) AND (rating <= (5)::numeric))))
);

alter table "public"."restaurantes"
  enable row level security;

create index idx_restaurantes_localizacao_id on public.restaurantes using btree (localizacao_id);

create index idx_restaurantes_nome on public.restaurantes using btree (nome);

create policy "Leitura publica de restaurantes" on "public"."restaurantes"
  for select
  to "anon", "authenticated"
  using (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."restaurantes" to "anon", "authenticated", "postgres", "service_role";
