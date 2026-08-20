create table "public"."freguesias" (
  "id"               bigint                   not null default nextval('public.freguesias_id_seq'::regclass),
  "cod_ine"          character varying(10)    not null,
  "nif"              character varying(20),
  "nome"             character varying(255)   not null,
  "municipio"        character varying(100)   not null,
  "localidade"       character varying(100),
  "morada"           text,
  "codigo_postal"    character varying(20),
  "descricao_postal" character varying(100),
  "email"            character varying(255),
  "telefone"         character varying(50),
  "presidente"       character varying(255),
  "created_at"       timestamp with time zone default current_timestamp,
  "updated_at"       timestamp with time zone default current_timestamp,
  "active"           boolean                  default true,
  constraint "freguesias_cod_ine_key" unique (cod_ine),
  constraint "freguesias_pkey" primary key (id)
);

alter table "public"."freguesias"
  enable row level security;

create index idx_freguesias_cod_ine on public.freguesias using btree (cod_ine);

create index idx_freguesias_email on public.freguesias using btree (email);

create index idx_freguesias_municipio on public.freguesias using btree (municipio);

create index idx_freguesias_nome on public.freguesias using btree (nome);

create policy "Leitura publica de freguesias" on "public"."freguesias"
  for select
  to PUBLIC
  using (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."freguesias" to "anon", "authenticated", "postgres", "service_role";

comment on column "public"."freguesias"."cod_ine" is 'Código INE (Instituto Nacional de Estatística) da freguesia';

comment on column "public"."freguesias"."email" is 'Email de contacto da junta de freguesia';

comment on column "public"."freguesias"."nif" is 'NIF (Número de Identificação Fiscal) da junta de freguesia';

comment on column "public"."freguesias"."presidente" is 'Nome do presidente da junta de freguesia';

comment on column "public"."freguesias"."telefone" is 'Telefone de contacto da junta de freguesia';

comment on table "public"."freguesias" is 'Tabela contendo informações de todas as freguesias de Portugal';
