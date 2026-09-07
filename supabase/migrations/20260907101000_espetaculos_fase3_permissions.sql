begin;

create policy event_sessions_org_read on public.event_sessions for select to authenticated
using (exists (select 1 from public.eventos e where e.id = evento_id and public.is_event_org_member(e.entidade_organizadora_id)));
create policy event_ticket_types_org_read on public.event_ticket_types for select to authenticated
using (exists (select 1 from public.event_sessions s join public.eventos e on e.id=s.evento_id where s.id=session_id and public.is_event_org_member(e.entidade_organizadora_id)));

create function public.event_can_read_order(p_order uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.event_orders o where o.id=p_order and
 (o.buyer_id=auth.uid() or public.is_event_org_member(o.entidade_id,array['owner','admin','finance'])));
$$;
revoke all on function public.event_can_read_order(uuid) from public, anon;
grant execute on function public.event_can_read_order(uuid) to authenticated;

alter table public.event_payment_accounts enable row level security;
alter table public.event_orders enable row level security;
alter table public.event_order_items enable row level security;
alter table public.event_payments enable row level security;
alter table public.event_payment_events enable row level security;
alter table public.event_tickets enable row level security;
alter table public.event_refunds enable row level security;
alter table public.event_refund_items enable row level security;

create policy event_accounts_read on public.event_payment_accounts for select to authenticated
using (public.is_event_org_member(entidade_id,array['owner','admin','finance']));
create policy event_orders_read on public.event_orders for select to authenticated
using (public.event_can_read_order(id));
create policy event_items_read on public.event_order_items for select to authenticated
using (public.event_can_read_order(order_id));
create policy event_payments_read on public.event_payments for select to authenticated
using (public.event_can_read_order(order_id));
create policy event_tickets_read on public.event_tickets for select to authenticated
using (exists(select 1 from public.event_order_items i where i.id=order_item_id and public.event_can_read_order(i.order_id)));
create policy event_refunds_read on public.event_refunds for select to authenticated
using (exists(select 1 from public.event_payments p where p.id=payment_id and public.event_can_read_order(p.order_id)));
create policy event_refund_items_read on public.event_refund_items for select to authenticated
using (exists(select 1 from public.event_refunds r where r.id=refund_id));

revoke all on public.event_payment_accounts, public.event_orders, public.event_order_items,
 public.event_payments, public.event_payment_events, public.event_tickets, public.event_refunds,
 public.event_refund_items from public, anon, authenticated;
grant select on public.event_payment_accounts, public.event_orders, public.event_order_items,
 public.event_payments, public.event_refunds, public.event_refund_items to authenticated;
-- Hashes are not exposed even to financial staff or the buyer.
grant select (id,order_item_id,ordinal,status,key_version,checked_in_at,created_at) on public.event_tickets to authenticated;
grant all on public.event_payment_accounts, public.event_orders, public.event_order_items,
 public.event_payments, public.event_payment_events, public.event_tickets, public.event_refunds,
 public.event_refund_items to service_role;

create function public.event_guard_members() returns trigger
language plpgsql security definer set search_path = '' as $$
declare org bigint;
begin
 perform public.event_lock();
 if tg_op='UPDATE' and (new.entidade_id<>old.entidade_id or new.user_id<>old.user_id) then
   raise exception 'A associação de um membro é imutável.';
 end if;
 org := case when tg_op='DELETE' then old.entidade_id else new.entidade_id end;
 if ((tg_op<>'INSERT' and old.role='owner') or (tg_op<>'DELETE' and new.role='owner'))
    and auth.uid() is not null and not public.is_event_org_member(org,array['owner']) then
   raise exception 'Só owner pode gerir proprietários.';
 end if;
 if tg_op<>'INSERT' and old.role='owner' and (tg_op='DELETE' or new.role<>'owner')
    and not exists(select 1 from public.event_organization_members where entidade_id=org and role='owner' and id<>old.id) then
   raise exception 'Não é permitido remover o último owner.';
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger event_members_guard before insert or update or delete on public.event_organization_members
for each row execute function public.event_guard_members();

create function public.event_guard_catalog() returns trigger
language plpgsql security definer set search_path = '' as $$
declare used bigint;
begin
 perform public.event_lock();
 if tg_table_name='event_sessions' then
   if tg_op='UPDATE' then
     if new.evento_id<>old.evento_id then raise exception 'Não é permitido mover uma sessão.'; end if;
     select coalesce(sum(i.reserved_quantity+i.committed_quantity),0) into used
       from public.event_order_items i join public.event_orders o on o.id=i.order_id where o.session_id=old.id;
     if new.capacity<used then raise exception 'Capacidade inferior ao stock comprometido.'; end if;
     if new.status in ('cancelled','finished') then new.sales_enabled:=false; end if;
     if new.sales_enabled and (new.status<>'scheduled' or new.starts_at<=now() or not exists(
       select 1 from public.eventos where id=new.evento_id and estado='publicado')) then
       raise exception 'Sessão indisponível para venda.';
     end if;
   end if;
 elsif tg_table_name='event_ticket_types' and tg_op='UPDATE' then
   if new.session_id<>old.session_id then raise exception 'Não é permitido mover um tipo de bilhete.'; end if;
   select coalesce(sum(reserved_quantity+committed_quantity),0) into used from public.event_order_items where ticket_type_id=old.id;
   if new.quantity<used then raise exception 'Quantidade inferior ao stock comprometido.'; end if;
 elsif tg_table_name='eventos' and tg_op='UPDATE' then
   if new.entidade_organizadora_id is distinct from old.entidade_organizadora_id and exists(
      select 1 from public.event_sessions where evento_id=old.id) then
      raise exception 'Não é permitido mudar a organização de um evento com sessões.';
   end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger event_sessions_stock_guard before update or delete on public.event_sessions for each row execute function public.event_guard_catalog();
create trigger event_types_stock_guard before update or delete on public.event_ticket_types for each row execute function public.event_guard_catalog();
create trigger event_parent_guard before update or delete on public.eventos for each row execute function public.event_guard_catalog();

-- Cancellation marks a financial review; never automatically refunds or frees sold stock.
create function public.event_catalog_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if tg_table_name='event_sessions' then
   if row(new.starts_at,new.ends_at,new.venue_id,new.status) is distinct from row(old.starts_at,old.ends_at,old.venue_id,old.status) then
     update public.event_orders set financial_review_required=true where session_id=new.id and status in ('payment_pending','paid','partially_refunded','review');
     perform public.event_audit('session_changed',jsonb_build_object('session_id',new.id,'previous',to_jsonb(old),'current',to_jsonb(new)));
   end if;
 elsif new.estado is distinct from old.estado then
   if new.estado='cancelado' then
     update public.event_sessions set status='cancelled',sales_enabled=false where evento_id=new.id;
   end if;
   perform public.event_audit('event_status_changed',jsonb_build_object('evento_id',new.id,'previous',old.estado,'current',new.estado));
 end if;
 return new;
end $$;
create trigger event_session_review after update on public.event_sessions for each row execute function public.event_catalog_review();
create trigger event_parent_review after update on public.eventos for each row execute function public.event_catalog_review();

revoke all on function public.event_guard_members(), public.event_guard_catalog(), public.event_catalog_review() from public,anon,authenticated;
commit;
