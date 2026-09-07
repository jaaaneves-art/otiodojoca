begin;

-- Financial records are immutable to API clients; mutations go through RPCs.
create table public.event_payment_accounts (
  entidade_id bigint primary key references public.entidades(id) on delete restrict,
  stripe_account_id text unique check (stripe_account_id ~ '^acct_[A-Za-z0-9]+$'),
  enabled boolean not null default false,
  charges_enabled boolean not null default false,
  currency text not null default 'EUR' check (currency = 'EUR'),
  fee_policy jsonb, -- NULL means not agreed: paid checkout fails closed.
  payment_methods text[] not null default array['card']::text[],
  updated_at timestamptz not null default now()
);

create table public.event_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  session_id bigint not null references public.event_sessions(id) on delete restrict,
  entidade_id bigint not null references public.entidades(id) on delete restrict,
  idempotency_key uuid not null,
  request_items jsonb not null,
  status text not null default 'reserved' check (status in ('reserved','payment_pending','paid','expired','cancelled','review','partially_refunded','refunded')),
  currency text not null default 'EUR' check (currency = 'EUR'),
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  total_cents bigint not null default 0 check (total_cents >= 0),
  application_fee_cents bigint check (application_fee_cents >= 0 and application_fee_cents <= total_cents),
  fee_snapshot jsonb,
  purchase_snapshot jsonb not null,
  financial_review_required boolean not null default false,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (buyer_id, idempotency_key)
);
create index event_orders_session_idx on public.event_orders(session_id);
create index event_orders_buyer_idx on public.event_orders(buyer_id, created_at desc);
create index event_orders_expiry_idx on public.event_orders(expires_at) where status in ('reserved','payment_pending');

create table public.event_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.event_orders(id) on delete restrict,
  ticket_type_id bigint not null references public.event_ticket_types(id) on delete restrict,
  name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0 and quantity <= 100),
  reserved_quantity integer not null default 0,
  committed_quantity integer not null default 0,
  check (reserved_quantity >= 0 and committed_quantity >= 0 and reserved_quantity + committed_quantity <= quantity),
  unique (order_id, ticket_type_id)
);
create index event_order_items_type_idx on public.event_order_items(ticket_type_id);

create table public.event_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.event_orders(id) on delete restrict,
  provider text not null default 'stripe' check (provider = 'stripe'),
  destination_account text not null,
  status text not null default 'creating' check (status in ('creating','pending','succeeded','cancelled','review')),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null check (currency = 'EUR'),
  application_fee_cents bigint not null check (application_fee_cents >= 0 and application_fee_cents <= amount_cents),
  payment_methods text[] not null,
  provider_intent_id text unique,
  provider_fee_cents bigint check (provider_fee_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_payment_events (
  id text primary key,
  event_type text not null,
  object_id text not null,
  status text not null default 'pending' check (status in ('pending','processed','review')),
  attempts integer not null default 0,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.event_tickets (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.event_order_items(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  status text not null default 'valid' check (status in ('valid','used','refund_pending','refunded','void')),
  token_hash text unique check (token_hash ~ '^[a-f0-9]{64}$'),
  key_version integer not null default 1 check (key_version > 0),
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles(id) on delete restrict,
  checkin_request_id uuid unique,
  created_at timestamptz not null default now(),
  unique (order_item_id, ordinal)
);

create table public.event_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.event_payments(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  idempotency_key uuid not null,
  amount_cents bigint not null check (amount_cents > 0),
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'requested' check (status in ('requested','pending','succeeded','failed','review')),
  provider_refund_id text unique,
  reverse_transfer boolean not null,
  refund_application_fee boolean not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (requested_by, idempotency_key)
);
create index event_refunds_payment_idx on public.event_refunds(payment_id);
create table public.event_refund_items (
  refund_id uuid not null references public.event_refunds(id) on delete restrict,
  ticket_id uuid not null references public.event_tickets(id) on delete restrict,
  amount_cents bigint not null check (amount_cents >= 0),
  primary key (refund_id, ticket_id)
);

-- Every stock mutation uses the same transaction lock. Conservative serialization
-- for the first release: never rely on in-process locks or a read-then-write client.
create function public.event_lock() returns void language sql volatile
set search_path = '' as $$ select pg_catalog.pg_advisory_xact_lock(731030::bigint); $$;
revoke all on function public.event_lock() from public, anon, authenticated;

create function public.event_audit(p_action text, p_details jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log(user_id, action, success, details)
  values (auth.uid(), 'espectaculos.' || p_action, true, p_details);
$$;
revoke all on function public.event_audit(text,jsonb) from public, anon, authenticated;

commit;
