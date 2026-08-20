create table "public"."municipios" (
  "id"              bigint                   not null default nextval('public.municipios_id_seq'::regclass),
  "codigo_dico"     text,
  "nome"            text                     not null,
  "distrito_regiao" text                     not null,
  "ilha"            text,
  "email_camara"    text,
  "latitude"        numeric,
  "longitude"       numeric,
  "created_at"      timestamp with time zone default now(),
  constraint "municipios_codigo_dico_key" unique (codigo_dico),
  constraint "municipios_pkey" primary key (id)
);

alter table "public"."municipios"
  enable row level security;

create policy "Municipios visiveis a todos" on "public"."municipios"
  for select
  to PUBLIC
  using (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."municipios" to "anon", "authenticated", "postgres", "service_role";
