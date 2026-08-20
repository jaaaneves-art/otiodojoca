create table "public"."localizacoes" (
  "id"            bigint                   generated always as identity not null,
  "codigo_postal" character varying(8)     not null,
  "nome"          text                     not null,
  "localidade"    text                     not null,
  "municipio"     text,
  "distrito"      text,
  "latitude"      double precision,
  "longitude"     double precision,
  "created_at"    timestamp with time zone not null default now(),
  "updated_at"    timestamp with time zone not null default now(),
  constraint "localizacoes_codigo_postal_check" check (((codigo_postal)::text ~ '^[0-9]{4}-[0-9]{3}$'::text)),
  constraint "localizacoes_latitude_check" check (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::double precision) AND (latitude <= (90)::double precision)))),
  constraint "localizacoes_longitude_check" check (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::double precision) AND (longitude <= (180)::double precision)))),
  constraint "localizacoes_pkey" primary key (id)
);

alter table "public"."localizacoes"
  enable row level security;

create index idx_localizacoes_codigo_postal on public.localizacoes using btree (codigo_postal);

create index idx_localizacoes_geo on public.localizacoes using btree (latitude, longitude);

create index idx_localizacoes_localidade on public.localizacoes using btree (localidade);

create index idx_localizacoes_municipio on public.localizacoes using btree (municipio);

create index idx_localizacoes_nome on public.localizacoes using btree (nome);

create policy "Leitura publica de localizacoes" on "public"."localizacoes"
  for select
  to "anon", "authenticated"
  using (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."localizacoes" to "anon", "authenticated", "postgres", "service_role";
