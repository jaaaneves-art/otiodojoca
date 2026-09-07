begin;
-- Public projection is identical for anonymous users and organization members.
-- Cancelled events remain addressable without granting access to organizer tables.
create function public.event_public_detail(p_event bigint) returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('id',e.id,'name',e.nome,'description',e.descricao,'place',e.lugar,
 'organizer',org.nome,'status',e.estado,'sessions',coalesce((select jsonb_agg(jsonb_build_object(
 'id',s.id,'starts_at',s.starts_at,'ends_at',s.ends_at,'status',s.status,
 'place',coalesce(v.name,e.lugar)) order by s.starts_at) from public.event_sessions s
 left join public.event_venues v on v.id=s.venue_id where s.evento_id=e.id),'[]'::jsonb))
 from public.eventos e left join public.entidades org on org.id=e.entidade_organizadora_id
 where e.id=p_event and e.estado in ('publicado','cancelado');
$$;
revoke all on function public.event_public_detail(bigint) from public;
grant execute on function public.event_public_detail(bigint) to anon,authenticated;

-- Operational totals for managers; finance fields are absent (not hidden in JSX).
create function public.event_sales_summary(p_event bigint) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare org bigint; financial boolean; result jsonb;
begin
 select entidade_organizadora_id into org from public.eventos where id=p_event;
 if auth.uid() is null or not public.is_event_org_member(org,array['owner','admin','manager','finance']) then raise exception 'Sem permissão.'; end if;
 financial := public.is_event_org_member(org,array['owner','admin','finance']);
 select coalesce(jsonb_agg(x.value order by x.starts_at),'[]'::jsonb) into result from (
 select s.starts_at,jsonb_build_object('session_id',s.id,'starts_at',s.starts_at,
 'sold',coalesce(stock.sold,0),'reserved',coalesce(stock.reserved,0),
 'available',greatest(0,least(s.capacity-coalesce(stock.sold,0)-coalesce(stock.reserved,0),coalesce(stock.available,0))))
 || case when financial then jsonb_build_object('gross_cents',coalesce(fin.gross,0),
 'refunds_cents',coalesce(fin.refunds,0),'net_before_provider_cents',coalesce(fin.gross,0)-coalesce(fin.refunds,0)-coalesce(fin.fees,0)) else '{}'::jsonb end value
 from public.event_sessions s
 left join lateral (
 select sum(tot.sold) sold,sum(tot.reserved) reserved,
 sum(case when t.active then greatest(0,t.quantity-tot.sold-tot.reserved) else 0 end) available
 from public.event_ticket_types t cross join lateral (
 select coalesce(sum(i.committed_quantity),0) sold,coalesce(sum(i.reserved_quantity),0) reserved
 from public.event_order_items i where i.ticket_type_id=t.id) tot where t.session_id=s.id
 ) stock on true
 left join lateral (
 select sum(p.amount_cents) gross,sum(r.amount) refunds,
 sum(p.application_fee_cents-coalesce(r.fee,0)) fees from public.event_payments p
 join public.event_orders o on o.id=p.order_id
 left join lateral (select sum(r.amount_cents) amount,
 sum(case when r.refund_application_fee then r.amount_cents*p.application_fee_cents/p.amount_cents else 0 end) fee
 from public.event_refunds r where r.payment_id=p.id and r.status='succeeded') r on true
 where o.session_id=s.id and p.status='succeeded'
 ) fin on financial
 where s.evento_id=p_event) x;
 return result;
end $$;
revoke all on function public.event_sales_summary(bigint) from public,anon;
grant execute on function public.event_sales_summary(bigint) to authenticated;

-- Durable notification intents, committed with the originating transaction.
-- No email addresses, QR tokens or provider credentials are stored here.
create table public.event_notification_outbox (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.event_orders(id) on delete restrict,
 kind text not null check(kind in ('order_confirmation','payment_confirmed','tickets_issued','cancellation','refund')),
 deduplication_key text not null unique,
 created_at timestamptz not null default now(),
 delivered_at timestamptz
);
alter table public.event_notification_outbox enable row level security;
revoke all on public.event_notification_outbox from public,anon,authenticated;
grant all on public.event_notification_outbox to service_role;
create function public.event_queue_notification() returns trigger
language plpgsql security definer set search_path = '' as $$
declare oid uuid; kind text; key text;
begin
 if tg_table_name='event_orders' then
  oid:=new.id;
  if tg_op='INSERT' then kind:='order_confirmation';
  elsif new.status='paid' and old.status is distinct from new.status then kind:='payment_confirmed';
  elsif new.status='cancelled' and old.status is distinct from new.status then kind:='cancellation';
  end if;
  key:=oid::text||':'||coalesce(kind,'');
 elsif tg_table_name='event_tickets' then
  select order_id into oid from public.event_order_items where id=new.order_item_id;
  kind:='tickets_issued'; key:=oid::text||':'||kind;
 elsif tg_table_name='event_refunds' then
  if new.status='succeeded' and old.status is distinct from new.status then
   select order_id into oid from public.event_payments where id=new.payment_id;
   kind:='refund'; key:=new.id::text||':'||kind;
  end if;
 elsif tg_table_name='event_sessions' then
  if new.status='cancelled' and old.status is distinct from new.status then
   insert into public.event_notification_outbox(order_id,kind,deduplication_key)
   select o.id,'cancellation',o.id::text||':cancellation' from public.event_orders o where o.session_id=new.id
   on conflict(deduplication_key) do nothing;
  end if;
 end if;
 if kind is not null then
  insert into public.event_notification_outbox(order_id,kind,deduplication_key) values(oid,kind,key)
  on conflict(deduplication_key) do nothing;
 end if;
 return new;
end $$;
create trigger event_order_notification after insert or update on public.event_orders for each row execute function public.event_queue_notification();
create trigger event_ticket_notification after insert on public.event_tickets for each row execute function public.event_queue_notification();
create trigger event_refund_notification after update on public.event_refunds for each row execute function public.event_queue_notification();
create trigger event_cancel_notification after update on public.event_sessions for each row execute function public.event_queue_notification();
revoke all on function public.event_queue_notification() from public,anon,authenticated;
-- Keep Phase 3 entry/idempotency semantics; diagnose only within the same organization.
create function public.event_checkin_feedback(p_session bigint,p_hash text,p_request uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb; ticket record; target record;
begin
 if auth.uid() is null or p_request is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'Pedido inválido.'; end if;
 perform public.event_lock();
 select s.status,e.estado,e.entidade_organizadora_id into target from public.event_sessions s join public.eventos e on e.id=s.evento_id where s.id=p_session;
 if not found or not public.is_event_org_member(target.entidade_organizadora_id,array['owner','admin','checkin']) then raise exception 'Sem permissão.'; end if;
 if target.status='cancelled' or target.estado='cancelado' then return jsonb_build_object('result','cancelled'); end if;
 result:=public.event_checkin(p_session,p_hash,p_request);
 if result->>'result'<>'invalid' then return result; end if;
 select t.status,o.session_id,o.financial_review_required,o.status order_status,s.status session_status,e.estado
 into ticket from public.event_tickets t join public.event_order_items i on i.id=t.order_item_id
 join public.event_orders o on o.id=i.order_id join public.event_sessions s on s.id=o.session_id
 join public.eventos e on e.id=s.evento_id
 where t.token_hash=p_hash and e.entidade_organizadora_id=(select ev.entidade_organizadora_id from public.event_sessions ss join public.eventos ev on ev.id=ss.evento_id where ss.id=p_session);
 if not found then return result; end if;
 if ticket.session_id<>p_session then return jsonb_build_object('result','wrong_session'); end if;
 if ticket.status='refunded' then return jsonb_build_object('result','refunded'); end if;
 if ticket.status='refund_pending' then return jsonb_build_object('result','refund_pending'); end if;
 if ticket.status='void' or ticket.order_status='cancelled' or ticket.session_status='cancelled' or ticket.estado='cancelado' then return jsonb_build_object('result','cancelled'); end if;
 if ticket.financial_review_required then return jsonb_build_object('result','review'); end if;
 return result;
end $$;
revoke all on function public.event_checkin_feedback(bigint,text,uuid) from public,anon;
grant execute on function public.event_checkin_feedback(bigint,text,uuid) to authenticated;
create function public.event_public_availability(p_session bigint)
returns table(ticket_type_id bigint,name text,price_cents integer,max_per_order integer,available bigint,sales_open boolean)
language sql stable security definer set search_path = '' as $$
 select a.* from public.event_availability(p_session) a
 join public.event_ticket_types t on t.id=a.ticket_type_id
 join public.event_sessions s on s.id=t.session_id join public.eventos e on e.id=s.evento_id
 where t.active and e.estado='publicado';
$$;
revoke all on function public.event_public_availability(bigint) from public;
grant execute on function public.event_public_availability(bigint) to anon,authenticated;
commit;
