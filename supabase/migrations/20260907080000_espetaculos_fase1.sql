begin;

create table if not exists public.event_organization_members (
  id bigint generated always as identity primary key,
  entidade_id bigint not null references public.entidades(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'manager',
  created_at timestamptz not null default now(),
  constraint event_organization_members_role_check
    check (role in ('owner','admin','manager','checkin','finance')),
  constraint event_organization_members_unique unique (entidade_id, user_id)
);

create index if not exists idx_event_org_members_entidade on public.event_organization_members(entidade_id);
create index if not exists idx_event_org_members_user on public.event_organization_members(user_id);

create table if not exists public.event_venues (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null,
  description text,
  freguesia_id bigint not null references public.freguesias(id),
  address text,
  postal_code text,
  locality text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  capacity integer,
  accessibility_info text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_venues_capacity_check check (capacity is null or capacity > 0),
  constraint event_venues_latitude_check check (latitude is null or latitude between -90 and 90),
  constraint event_venues_longitude_check check (longitude is null or longitude between -180 and 180),
  constraint event_venues_slug_freguesia_unique unique (slug, freguesia_id)
);

create index if not exists idx_event_venues_freguesia on public.event_venues(freguesia_id);
create index if not exists idx_event_venues_slug on public.event_venues(slug);

create table if not exists public.event_sessions (
  id bigint generated always as identity primary key,
  evento_id bigint not null references public.eventos(id) on delete cascade,
  venue_id bigint references public.event_venues(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer not null,
  status text not null default 'scheduled',
  sales_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_sessions_dates_check check (ends_at is null or starts_at < ends_at),
  constraint event_sessions_capacity_check check (capacity > 0),
  constraint event_sessions_status_check check (status in ('scheduled','sold_out','cancelled','finished'))
);

create index if not exists idx_event_sessions_evento on public.event_sessions(evento_id);
create index if not exists idx_event_sessions_starts_at on public.event_sessions(starts_at);
create index if not exists idx_event_sessions_status on public.event_sessions(status);

create table if not exists public.event_ticket_types (
  id bigint generated always as identity primary key,
  session_id bigint not null references public.event_sessions(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null default 0,
  currency text not null default 'EUR',
  quantity integer not null,
  max_per_order integer,
  sales_start timestamptz,
  sales_end timestamptz,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_ticket_types_price_check check (price_cents >= 0),
  constraint event_ticket_types_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint event_ticket_types_quantity_check check (quantity > 0),
  constraint event_ticket_types_max_per_order_check check (max_per_order is null or max_per_order > 0),
  constraint event_ticket_types_sales_dates_check check (sales_end is null or sales_start is null or sales_start < sales_end),
  constraint event_ticket_types_name_session_unique unique (session_id, name)
);

create index if not exists idx_event_ticket_types_session on public.event_ticket_types(session_id);
create index if not exists idx_event_ticket_types_active on public.event_ticket_types(active);

drop trigger if exists event_venues_updated_at on public.event_venues;
create trigger event_venues_updated_at before update on public.event_venues
for each row execute function public.handle_updated_at();

drop trigger if exists event_sessions_updated_at on public.event_sessions;
create trigger event_sessions_updated_at before update on public.event_sessions
for each row execute function public.handle_updated_at();

drop trigger if exists event_ticket_types_updated_at on public.event_ticket_types;
create trigger event_ticket_types_updated_at before update on public.event_ticket_types
for each row execute function public.handle_updated_at();

alter table public.event_organization_members enable row level security;
alter table public.event_venues enable row level security;
alter table public.event_sessions enable row level security;
alter table public.event_ticket_types enable row level security;

drop policy if exists "event_org_members_select" on public.event_organization_members;
create policy "event_org_members_select" on public.event_organization_members
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.event_organization_members m
    where m.entidade_id = event_organization_members.entidade_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
);

drop policy if exists "event_org_members_insert" on public.event_organization_members;
create policy "event_org_members_insert" on public.event_organization_members
for insert to authenticated
with check (
  exists (
    select 1 from public.event_organization_members m
    where m.entidade_id = event_organization_members.entidade_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
);

drop policy if exists "event_org_members_update" on public.event_organization_members;
create policy "event_org_members_update" on public.event_organization_members
for update to authenticated
using (
  exists (
    select 1 from public.event_organization_members m
    where m.entidade_id = event_organization_members.entidade_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.event_organization_members m
    where m.entidade_id = event_organization_members.entidade_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
);

drop policy if exists "event_org_members_delete" on public.event_organization_members;
create policy "event_org_members_delete" on public.event_organization_members
for delete to authenticated
using (
  exists (
    select 1 from public.event_organization_members m
    where m.entidade_id = event_organization_members.entidade_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
);

drop policy if exists "event_venues_public_read" on public.event_venues;
create policy "event_venues_public_read" on public.event_venues
for select to public using (true);

drop policy if exists "event_venues_insert_own" on public.event_venues;
create policy "event_venues_insert_own" on public.event_venues
for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "event_venues_update_own" on public.event_venues;
create policy "event_venues_update_own" on public.event_venues
for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "event_venues_delete_own" on public.event_venues;
create policy "event_venues_delete_own" on public.event_venues
for delete to authenticated using (created_by = auth.uid());

drop policy if exists "event_sessions_public_read" on public.event_sessions;
create policy "event_sessions_public_read" on public.event_sessions
for select to public
using (
  exists (
    select 1 from public.eventos e
    where e.id = event_sessions.evento_id and e.estado = 'publicado'
  )
);

drop policy if exists "event_sessions_manage_insert" on public.event_sessions;
create policy "event_sessions_manage_insert" on public.event_sessions
for insert to authenticated
with check (
  exists (
    select 1
    from public.eventos e
    join public.event_organization_members m on m.entidade_id = e.entidade_organizadora_id
    where e.id = event_sessions.evento_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists "event_sessions_manage_update" on public.event_sessions;
create policy "event_sessions_manage_update" on public.event_sessions
for update to authenticated
using (
  exists (
    select 1
    from public.eventos e
    join public.event_organization_members m on m.entidade_id = e.entidade_organizadora_id
    where e.id = event_sessions.evento_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','manager')
  )
)
with check (
  exists (
    select 1
    from public.eventos e
    join public.event_organization_members m on m.entidade_id = e.entidade_organizadora_id
    where e.id = event_sessions.evento_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists "event_sessions_manage_delete" on public.event_sessions;
create policy "event_sessions_manage_delete" on public.event_sessions
for delete to authenticated
using (
  exists (
    select 1
    from public.eventos e
    join public.event_organization_members m on m.entidade_id = e.entidade_organizadora_id
    where e.id = event_sessions.evento_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
);

drop policy if exists "event_ticket_types_public_read" on public.event_ticket_types;
create policy "event_ticket_types_public_read" on public.event_ticket_types
for select to public
using (
  active = true
  and exists (
    select 1
    from public.event_sessions s
    join public.eventos e on e.id = s.evento_id
    where s.id = event_ticket_types.session_id and e.estado = 'publicado'
  )
);

drop policy if exists "event_ticket_types_manage_insert" on public.event_ticket_types;
create policy "event_ticket_types_manage_insert" on public.event_ticket_types
for insert to authenticated
with check (
  exists (
    select 1
    from public.event_sessions s
    join public.eventos e on e.id = s.evento_id
    join public.event_organization_members m on m.entidade_id = e.entidade_organizadora_id
    where s.id = event_ticket_types.session_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists "event_ticket_types_manage_update" on public.event_ticket_types;
create policy "event_ticket_types_manage_update" on public.event_ticket_types
for update to authenticated
using (
  exists (
    select 1
    from public.event_sessions s
    join public.eventos e on e.id = s.evento_id
    join public.event_organization_members m on m.entidade_id = e.entidade_organizadora_id
    where s.id = event_ticket_types.session_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','manager')
  )
)
with check (
  exists (
    select 1
    from public.event_sessions s
    join public.eventos e on e.id = s.evento_id
    join public.event_organization_members m on m.entidade_id = e.entidade_organizadora_id
    where s.id = event_ticket_types.session_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists "event_ticket_types_manage_delete" on public.event_ticket_types;
create policy "event_ticket_types_manage_delete" on public.event_ticket_types
for delete to authenticated
using (
  exists (
    select 1
    from public.event_sessions s
    join public.eventos e on e.id = s.evento_id
    join public.event_organization_members m on m.entidade_id = e.entidade_organizadora_id
    where s.id = event_ticket_types.session_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
);

grant select on public.event_venues to anon, authenticated;
grant select on public.event_sessions to anon, authenticated;
grant select on public.event_ticket_types to anon, authenticated;
grant select, insert, update, delete on public.event_organization_members to authenticated;
grant insert, update, delete on public.event_venues to authenticated;
grant insert, update, delete on public.event_sessions to authenticated;
grant insert, update, delete on public.event_ticket_types to authenticated;
grant all on public.event_organization_members, public.event_venues, public.event_sessions, public.event_ticket_types to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

commit;
