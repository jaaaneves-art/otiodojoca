-- Diáspora v1: diretório público, ligações territoriais e familiares consentidas.
create type public.diaspora_profile_kind as enum ('associacao', 'empresa', 'empresario');
create type public.diaspora_link_status as enum ('pendente', 'aceite', 'recusada', 'bloqueada');

create table public.diaspora_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind public.diaspora_profile_kind not null,
  name text not null check (char_length(name) between 2 and 140),
  description text not null default '' check (char_length(description) <= 1200),
  country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  city text not null check (char_length(city) between 1 and 120),
  freguesia_id bigint references public.freguesias(id) on delete set null,
  municipio_id bigint references public.municipios(id) on delete set null,
  website_url text,
  contact_email text,
  logo_url text,
  is_public boolean not null default true,
  is_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diaspora_verified_consistent check (not is_verified or (verified_at is not null and verified_by is not null))
);

create table public.diaspora_family_links (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  relationship_label text check (char_length(relationship_label) <= 60),
  status public.diaspora_link_status not null default 'pendente',
  show_publicly boolean not null default false,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint diaspora_family_distinct check (requester_id <> recipient_id),
  constraint diaspora_family_unique unique (requester_id, recipient_id)
);

create index diaspora_profiles_location_idx on public.diaspora_profiles(country_code, city);
create index diaspora_profiles_freguesia_idx on public.diaspora_profiles(freguesia_id) where freguesia_id is not null;
create index diaspora_profiles_municipio_idx on public.diaspora_profiles(municipio_id) where municipio_id is not null;
create index diaspora_family_recipient_idx on public.diaspora_family_links(recipient_id, status);

alter table public.diaspora_profiles enable row level security;
alter table public.diaspora_family_links enable row level security;

-- CORRIGIDO (2026-09-12): a versão original verificava "p.is_admin", uma coluna
-- que existe em profiles mas está morta neste projeto — nenhuma policy ou
-- função do schema base a usa. O admin real é decidido por "profiles.role =
-- 'admin'" (public.user_role), como em todas as outras policies de
-- administração do OTJ. Com "is_admin" a app nunca teria ninguém capaz de
-- verificar um perfil de Diáspora.
create or replace function public.diaspora_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.role = 'admin'::public.user_role
       from public.profiles p
      where p.id = auth.uid() and p.deleted_at is null),
    false
  );
$$;
revoke all on function public.diaspora_is_admin() from public;
grant execute on function public.diaspora_is_admin() to anon, authenticated;

create or replace function public.diaspora_protect_verification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.diaspora_is_admin() and
     (new.is_verified, new.verified_at, new.verified_by) is distinct from
     (old.is_verified, old.verified_at, old.verified_by) then
    raise exception 'A verificação só pode ser alterada pela administração';
  end if;
  new.updated_at := now();
  return new;
end; $$;
revoke all on function public.diaspora_protect_verification() from public;
create trigger diaspora_profiles_guard before update on public.diaspora_profiles
for each row execute function public.diaspora_protect_verification();

create policy diaspora_profiles_public_read on public.diaspora_profiles for select
  using (is_public or owner_id = auth.uid() or public.diaspora_is_admin());
create policy diaspora_profiles_owner_insert on public.diaspora_profiles for insert
  with check (owner_id = auth.uid() and not is_verified and verified_by is null and verified_at is null);
create policy diaspora_profiles_owner_update on public.diaspora_profiles for update
  using (owner_id = auth.uid() or public.diaspora_is_admin())
  with check (owner_id = auth.uid() or public.diaspora_is_admin());
create policy diaspora_profiles_owner_delete on public.diaspora_profiles for delete
  using (owner_id = auth.uid() or public.diaspora_is_admin());

create policy diaspora_family_participants_read on public.diaspora_family_links for select
  using (requester_id = auth.uid() or recipient_id = auth.uid());
create policy diaspora_family_request on public.diaspora_family_links for insert
  with check (requester_id = auth.uid() and status = 'pendente' and not show_publicly);
create policy diaspora_family_participants_delete on public.diaspora_family_links for delete
  using (requester_id = auth.uid() or recipient_id = auth.uid());

-- Respostas passam por RPC para impedir que o requerente aceite o próprio pedido.
create or replace function public.diaspora_respond_family_link(p_link_id uuid, p_accept boolean, p_show_publicly boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.diaspora_family_links
  set status = case when p_accept then 'aceite'::public.diaspora_link_status else 'recusada'::public.diaspora_link_status end,
      show_publicly = p_accept and p_show_publicly,
      responded_at = now()
  where id = p_link_id and recipient_id = auth.uid() and status = 'pendente';
  if not found then raise exception 'Pedido não encontrado ou sem autorização'; end if;
end; $$;
revoke all on function public.diaspora_respond_family_link(uuid, boolean, boolean) from public;
grant execute on function public.diaspora_respond_family_link(uuid, boolean, boolean) to authenticated;

grant select on public.diaspora_profiles to anon, authenticated;
grant insert, update, delete on public.diaspora_profiles to authenticated;
grant select, insert, delete on public.diaspora_family_links to authenticated;
