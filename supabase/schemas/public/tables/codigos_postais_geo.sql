create table "public"."codigos_postais_geo" (
  "codigo_postal" character varying(8) not null,
  "latitude"      double precision     not null,
  "longitude"     double precision     not null,
  constraint "codigos_postais_geo_codigo_postal_check" check (((codigo_postal)::text ~ '^[0-9]{4}-[0-9]{3}$'::text)),
  constraint "codigos_postais_geo_latitude_check" check (((latitude >= ('-90'::integer)::double precision) AND (latitude <= (90)::double precision))),
  constraint "codigos_postais_geo_longitude_check" check (((longitude >= ('-180'::integer)::double precision) AND (longitude <= (180)::double precision))),
  constraint "codigos_postais_geo_pkey" primary key (codigo_postal)
);

alter table "public"."codigos_postais_geo"
  enable row level security;

create policy "Leitura publica de codigos_postais_geo" on "public"."codigos_postais_geo"
  for select
  to PUBLIC
  using (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."codigos_postais_geo" to "anon", "authenticated", "postgres", "service_role";
