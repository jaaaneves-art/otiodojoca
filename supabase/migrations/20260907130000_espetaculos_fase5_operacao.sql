begin;
alter table public.event_notification_outbox
 add column status text not null default 'pending' check(status in ('pending','processing','delivered','deferred','failed')),
 add column attempts integer not null default 0 check(attempts>=0),
 add column next_attempt_at timestamptz not null default now(),
 add column last_error text check(last_error in ('transport_unavailable','delivery_failed','recipient_unavailable','lease_expired','attempts_exhausted')),
 add column updated_at timestamptz not null default now(),
 add column last_attempt_at timestamptz,
 add column lease_token uuid,
 add column lease_until timestamptz,
 add constraint event_outbox_lease_consistent check((status='processing')=(lease_token is not null and lease_until is not null));
update public.event_notification_outbox set status='delivered' where delivered_at is not null;
create index event_outbox_due on public.event_notification_outbox(next_attempt_at,created_at) where status in ('pending','deferred');
create index event_outbox_leases on public.event_notification_outbox(lease_until) where status='processing';

create function public.event_notification_claim(p_limit integer default 5,p_max_attempts integer default 5,p_lease_seconds integer default 60)
returns setof public.event_notification_outbox language plpgsql security definer set search_path = '' as $$
begin
 if p_limit not between 1 and 20 or p_max_attempts not between 1 and 20 or p_lease_seconds not between 15 and 120
 or p_limit is null or p_max_attempts is null or p_lease_seconds is null then raise exception 'Configuração inválida.'; end if;
 -- Bounded recovery uses SKIP LOCKED too. Old workers are fenced by a fresh token.
 with stale as (select id from public.event_notification_outbox where status='processing' and lease_until<=now() order by lease_until for update skip locked limit 100)
 update public.event_notification_outbox n set status=case when attempts>=p_max_attempts then 'failed' else 'deferred' end,
 lease_token=null,lease_until=null,last_error='lease_expired',next_attempt_at=now(),updated_at=now() where n.id in(select id from stale);
 with exhausted as (select id from public.event_notification_outbox where status in ('pending','deferred') and attempts>=p_max_attempts for update skip locked limit 100)
 update public.event_notification_outbox n set status='failed',last_error='attempts_exhausted',updated_at=now() where n.id in(select id from exhausted);
 return query with due as (
 select id from public.event_notification_outbox where status in ('pending','deferred') and next_attempt_at<=now() and attempts<p_max_attempts
 order by next_attempt_at,created_at,id for update skip locked limit p_limit)
 update public.event_notification_outbox n set status='processing',attempts=n.attempts+1,last_attempt_at=now(),updated_at=now(),
 lease_token=gen_random_uuid(),lease_until=now()+make_interval(secs=>p_lease_seconds) where n.id in(select id from due) returning n.*;
end $$;
create function public.event_notification_renew(p_id uuid,p_token uuid,p_seconds integer default 60) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
 if p_seconds is null or p_seconds not between 15 and 120 then raise exception 'Lease inválido.'; end if;
 update public.event_notification_outbox set lease_until=now()+make_interval(secs=>p_seconds),updated_at=now()
 where id=p_id and status='processing' and lease_token=p_token and lease_until>now();
 return found;
end $$;
create function public.event_notification_finish(p_id uuid,p_token uuid,p_outcome text,p_error text default null,p_max_attempts integer default 5) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
 if p_outcome is null or p_outcome not in ('delivered','deferred','failed') or p_max_attempts is null or p_max_attempts not between 1 and 20 then raise exception 'Resultado inválido.'; end if;
 update public.event_notification_outbox set
 status=case when p_outcome='delivered' then 'delivered' when attempts>=p_max_attempts then 'failed' else 'deferred' end,
 delivered_at=case when p_outcome='delivered' then now() else null end,
 last_error=case when p_outcome='delivered' then null when p_error in ('transport_unavailable','delivery_failed','recipient_unavailable') then p_error else 'delivery_failed' end,
 next_attempt_at=now()+make_interval(secs=>least(86400,30*power(2,least(attempts-1,12)))::integer),
 updated_at=now(),lease_token=null,lease_until=null
 where id=p_id and status='processing' and lease_token=p_token and lease_until>now();
 return found;
end $$;
revoke all on function public.event_notification_claim(integer,integer,integer),public.event_notification_renew(uuid,uuid,integer),public.event_notification_finish(uuid,uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.event_notification_claim(integer,integer,integer),public.event_notification_renew(uuid,uuid,integer),public.event_notification_finish(uuid,uuid,text,text,integer) to service_role;

-- Serialize scheduler invocations without holding an HTTP-spanning transaction.
create table public.event_operation_leases(name text primary key check(name='maintenance'),token uuid not null,expires_at timestamptz not null);
alter table public.event_operation_leases enable row level security;
revoke all on public.event_operation_leases from public,anon,authenticated;
grant all on public.event_operation_leases to service_role;
create function public.event_maintenance_claim() returns uuid language plpgsql security definer set search_path = '' as $$
declare claimed uuid;
begin
 insert into public.event_operation_leases values('maintenance',gen_random_uuid(),now()+interval '120 seconds')
 on conflict(name) do update set token=excluded.token,expires_at=excluded.expires_at where public.event_operation_leases.expires_at<=now()
 returning token into claimed;
 return claimed;
end $$;
create function public.event_maintenance_release(p_token uuid) returns void language sql security definer set search_path = '' as $$
 delete from public.event_operation_leases where name='maintenance' and token=p_token;
$$;
revoke all on function public.event_maintenance_claim(),public.event_maintenance_release(uuid) from public,anon,authenticated;
grant execute on function public.event_maintenance_claim(),public.event_maintenance_release(uuid) to service_role;
-- Backoff prevents an old failing financial row starving the entire queue.
alter table public.event_payments add column next_reconcile_at timestamptz not null default now(),add column reconcile_attempts integer not null default 0;
alter table public.event_refunds add column next_reconcile_at timestamptz not null default now(),add column reconcile_attempts integer not null default 0;
alter table public.event_payment_events add column next_reconcile_at timestamptz not null default now();
create index event_payment_reconcile_due on public.event_payments(next_reconcile_at) where status in ('creating','pending');
create index event_refund_reconcile_due on public.event_refunds(next_reconcile_at) where status in ('requested','pending');
create index event_webhook_reconcile_due on public.event_payment_events(next_reconcile_at) where status='pending';

create function public.event_operational_summary(p_event bigint) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare org bigint; result jsonb;
begin
 select entidade_organizadora_id into org from public.eventos where id=p_event;
 if auth.uid() is null or not public.is_event_org_member(org,array['owner','admin','finance']) then raise exception 'Sem permissão.'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('session_id',s.id,'starts_at',s.starts_at,'status',s.status,
 'review_orders',(select count(*) from public.event_orders o where o.session_id=s.id and (o.financial_review_required or o.status='review')),
 'pending_payments',(select count(*) from public.event_payments p join public.event_orders o on o.id=p.order_id where o.session_id=s.id and p.status in ('creating','pending')),
 'pending_refunds',(select count(*) from public.event_refunds r join public.event_payments p on p.id=r.payment_id join public.event_orders o on o.id=p.order_id where o.session_id=s.id and r.status in ('requested','pending','review')),
 'failed_notifications',(select count(*) from public.event_notification_outbox n join public.event_orders o on o.id=n.order_id where o.session_id=s.id and n.status='failed'),
 'deferred_notifications',(select count(*) from public.event_notification_outbox n join public.event_orders o on o.id=n.order_id where o.session_id=s.id and n.status='deferred')
 ) order by s.starts_at),'[]'::jsonb) into result from public.event_sessions s where s.evento_id=p_event;
 return result;
end $$;
revoke all on function public.event_operational_summary(bigint) from public,anon;
grant execute on function public.event_operational_summary(bigint) to authenticated;
commit;
