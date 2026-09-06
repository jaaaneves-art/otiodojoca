-- StandGo / O Tio do Joca
-- Catálogo automóvel global normalizado
-- 2026-09-06
--
-- Objetivos:
-- 1) marcas/modelos deixam de depender de listas TypeScript;
-- 2) autocomplete passa a usar PostgreSQL/Supabase;
-- 3) anúncios de viaturas ganham IDs estáveis de catálogo;
-- 4) manter details.marca/details.modelo durante esta fase para não partir
--    páginas de apresentação que ainda leem JSONB;
-- 5) apagar apenas anúncios mock do módulo "viaturas".

create extension if not exists pg_trgm;
create extension if not exists unaccent;

create table if not exists public.vehicle_makes (
  id bigint generated always as identity primary key,
  external_key text,
  name text not null,
  normalized_name text not null,
  aliases text[] not null default '{}',
  countries text[] not null default '{}',
  regions text[] not null default '{}',
  sources text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists vehicle_makes_normalized_uq
  on public.vehicle_makes (normalized_name);

create table if not exists public.vehicle_models (
  id bigint generated always as identity primary key,
  make_id bigint not null references public.vehicle_makes(id) on delete cascade,
  external_key text,
  name text not null,
  normalized_name text not null,
  aliases text[] not null default '{}',
  year_start smallint,
  year_end smallint,
  body_types text[] not null default '{}',
  countries text[] not null default '{}',
  regions text[] not null default '{}',
  popularity_decile smallint,
  sources text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (make_id, normalized_name)
);

create table if not exists public.vehicle_generations (
  id bigint generated always as identity primary key,
  model_id bigint not null references public.vehicle_models(id) on delete cascade,
  external_key text,
  name text not null,
  normalized_name text not null,
  year_start smallint,
  year_end smallint,
  body_type text,
  sources text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_id, normalized_name, year_start)
);

create table if not exists public.vehicle_variants (
  id bigint generated always as identity primary key,
  generation_id bigint not null references public.vehicle_generations(id) on delete cascade,
  external_key text,
  name text not null,
  normalized_name text not null,
  fuel_type text,
  displacement_cc integer,
  power_hp integer,
  power_kw integer,
  cylinders smallint,
  transmission text,
  drivetrain text,
  sources text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists vehicle_makes_name_trgm
  on public.vehicle_makes using gin (normalized_name gin_trgm_ops);

create index if not exists vehicle_models_name_trgm
  on public.vehicle_models using gin (normalized_name gin_trgm_ops);

create index if not exists vehicle_models_make_idx
  on public.vehicle_models(make_id);

create index if not exists vehicle_models_year_idx
  on public.vehicle_models(year_start, year_end);

create index if not exists vehicle_generations_model_idx
  on public.vehicle_generations(model_id);

-- IDs de catálogo no anúncio. Mantemos o JSONB por compatibilidade visual.
alter table public.marketplace_ads
  add column if not exists vehicle_make_id bigint references public.vehicle_makes(id),
  add column if not exists vehicle_model_id bigint references public.vehicle_models(id),
  add column if not exists vehicle_generation_id bigint references public.vehicle_generations(id),
  add column if not exists vehicle_variant_id bigint references public.vehicle_variants(id);

create index if not exists marketplace_ads_vehicle_make_idx
  on public.marketplace_ads(vehicle_make_id)
  where module = 'viaturas';

create index if not exists marketplace_ads_vehicle_model_idx
  on public.marketplace_ads(vehicle_model_id)
  where module = 'viaturas';

-- Todos os anúncios atuais de viaturas são mock segundo a equipa.
-- Isto deixa o resto do marketplace intacto.
delete from public.marketplace_ads where module = 'viaturas';

-- Catálogo é leitura pública; escrita só por service role / migrations.
alter table public.vehicle_makes enable row level security;
alter table public.vehicle_models enable row level security;
alter table public.vehicle_generations enable row level security;
alter table public.vehicle_variants enable row level security;

drop policy if exists "vehicle_makes_public_read" on public.vehicle_makes;
create policy "vehicle_makes_public_read"
  on public.vehicle_makes for select
  using (true);

drop policy if exists "vehicle_models_public_read" on public.vehicle_models;
create policy "vehicle_models_public_read"
  on public.vehicle_models for select
  using (true);

drop policy if exists "vehicle_generations_public_read" on public.vehicle_generations;
create policy "vehicle_generations_public_read"
  on public.vehicle_generations for select
  using (true);

drop policy if exists "vehicle_variants_public_read" on public.vehicle_variants;
create policy "vehicle_variants_public_read"
  on public.vehicle_variants for select
  using (true);

-- Normalização central. immutable é necessária para uso previsível em pesquisa.
create or replace function public.normalize_vehicle_text(value text)
returns text
language sql
immutable
parallel safe
as $$
  select trim(
    regexp_replace(
      lower(unaccent(coalesce(value, ''))),
      '[^a-z0-9]+',
      ' ',
      'g'
    )
  );
$$;

-- Autocomplete de marcas. Prefixos são fortemente favorecidos,
-- depois substring/trigram/aliases.
create or replace function public.search_vehicle_makes(
  q text default '',
  result_limit integer default 20
)
returns table (
  id bigint,
  name text,
  aliases text[],
  score real
)
language sql
stable
as $$
  with p as (
    select public.normalize_vehicle_text(q) as nq
  )
  select
    m.id,
    m.name,
    m.aliases,
    (
      case
        when p.nq = '' then 10
        when m.normalized_name = p.nq then 1000
        when m.normalized_name like p.nq || '%' then 800
        when m.normalized_name like '%' || p.nq || '%' then 500
        else greatest(similarity(m.normalized_name, p.nq) * 400, 0)
      end
      +
      case when exists (
        select 1
        from unnest(m.aliases) a
        where public.normalize_vehicle_text(a) = p.nq
           or public.normalize_vehicle_text(a) like p.nq || '%'
      ) then 250 else 0 end
    )::real as score
  from public.vehicle_makes m
  cross join p
  where
    p.nq = ''
    or m.normalized_name % p.nq
    or m.normalized_name like '%' || p.nq || '%'
    or exists (
      select 1
      from unnest(m.aliases) a
      where public.normalize_vehicle_text(a) like '%' || p.nq || '%'
    )
  order by score desc, m.name
  limit greatest(1, least(result_limit, 100));
$$;

create or replace function public.search_vehicle_models(
  make_id_arg bigint,
  q text default '',
  result_limit integer default 30
)
returns table (
  id bigint,
  make_id bigint,
  name text,
  aliases text[],
  year_start smallint,
  year_end smallint,
  score real
)
language sql
stable
as $$
  with p as (
    select public.normalize_vehicle_text(q) as nq
  )
  select
    m.id,
    m.make_id,
    m.name,
    m.aliases,
    m.year_start,
    m.year_end,
    (
      case
        when p.nq = '' then coalesce(110 - m.popularity_decile * 5, 50)
        when m.normalized_name = p.nq then 1000
        when m.normalized_name like p.nq || '%' then 800
        when m.normalized_name like '%' || p.nq || '%' then 500
        else greatest(similarity(m.normalized_name, p.nq) * 400, 0)
      end
      +
      case when exists (
        select 1
        from unnest(m.aliases) a
        where public.normalize_vehicle_text(a) = p.nq
           or public.normalize_vehicle_text(a) like p.nq || '%'
      ) then 250 else 0 end
    )::real as score
  from public.vehicle_models m
  cross join p
  where m.make_id = make_id_arg
    and (
      p.nq = ''
      or m.normalized_name % p.nq
      or m.normalized_name like '%' || p.nq || '%'
      or exists (
        select 1
        from unnest(m.aliases) a
        where public.normalize_vehicle_text(a) like '%' || p.nq || '%'
      )
    )
  order by score desc, m.name
  limit greatest(1, least(result_limit, 100));
$$;

grant execute on function public.search_vehicle_makes(text, integer) to anon, authenticated;
grant execute on function public.search_vehicle_models(bigint, text, integer) to anon, authenticated;

-- Enquanto as páginas antigas continuam a ler details.marca/modelo,
-- este trigger resolve automaticamente IDs quando possível.
create or replace function public.resolve_vehicle_catalog_ids()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  make_text text;
  model_text text;
  resolved_make_id bigint;
  resolved_model_id bigint;
begin
  if new.module <> 'viaturas' then
    return new;
  end if;

  make_text := coalesce(new.details->>'marca', '');
  model_text := coalesce(new.details->>'modelo', '');

  if new.vehicle_make_id is null and make_text <> '' then
    select id into resolved_make_id
    from public.vehicle_makes
    where normalized_name = public.normalize_vehicle_text(make_text)
       or exists (
         select 1 from unnest(aliases) a
         where public.normalize_vehicle_text(a) = public.normalize_vehicle_text(make_text)
       )
    order by
      case when normalized_name = public.normalize_vehicle_text(make_text) then 0 else 1 end,
      id
    limit 1;

    new.vehicle_make_id := resolved_make_id;
  else
    resolved_make_id := new.vehicle_make_id;
  end if;

  if new.vehicle_model_id is null
     and resolved_make_id is not null
     and model_text <> '' then
    select id into resolved_model_id
    from public.vehicle_models
    where make_id = resolved_make_id
      and (
        normalized_name = public.normalize_vehicle_text(model_text)
        or exists (
          select 1 from unnest(aliases) a
          where public.normalize_vehicle_text(a) = public.normalize_vehicle_text(model_text)
        )
      )
    order by
      case when normalized_name = public.normalize_vehicle_text(model_text) then 0 else 1 end,
      id
    limit 1;

    new.vehicle_model_id := resolved_model_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_marketplace_ads_vehicle_catalog on public.marketplace_ads;
create trigger trg_marketplace_ads_vehicle_catalog
before insert or update of details, vehicle_make_id, vehicle_model_id
on public.marketplace_ads
for each row
execute function public.resolve_vehicle_catalog_ids();
