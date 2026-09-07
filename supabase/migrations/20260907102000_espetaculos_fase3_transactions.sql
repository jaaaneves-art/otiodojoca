begin;

create function public.event_expire_reservations() returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
 perform public.event_lock();
 -- An external attempt, including an uncertain create, MUST be reconciled first.
 with expired as (
  update public.event_orders o set status='expired'
   where o.status='reserved' and o.expires_at<=now()
   and not exists(select 1 from public.event_payments p where p.order_id=o.id)
   returning id
 ) update public.event_order_items set reserved_quantity=0 where order_id in(select id from expired);
 get diagnostics n = row_count;
 return n;
end $$;

create function public.event_availability(p_session bigint)
returns table(ticket_type_id bigint, name text, price_cents integer, max_per_order integer, available bigint, sales_open boolean)
language sql stable security definer set search_path = '' as $$
 select t.id,t.name,t.price_cents,t.max_per_order,
 greatest(0,least(t.quantity-coalesce((select sum(i.reserved_quantity+i.committed_quantity) from public.event_order_items i where i.ticket_type_id=t.id),0),
 s.capacity-coalesce((select sum(i.reserved_quantity+i.committed_quantity) from public.event_order_items i join public.event_orders o on o.id=i.order_id where o.session_id=s.id),0)))::bigint,
 s.sales_enabled and s.status='scheduled' and s.starts_at>now() and e.estado='publicado' and t.active and t.currency='EUR'
 and (t.sales_start is null or t.sales_start<=now()) and (t.sales_end is null or t.sales_end>now())
 from public.event_ticket_types t join public.event_sessions s on s.id=t.session_id join public.eventos e on e.id=s.evento_id
 where s.id=p_session and ((e.estado='publicado' and t.active) or
 (auth.uid() is not null and public.is_event_org_member(e.entidade_organizadora_id))) order by t.sort_order,t.id;
$$;

create function public.event_reserve(p_session bigint,p_items jsonb,p_key uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare s public.event_sessions; e public.eventos; t public.event_ticket_types;
 o public.event_orders; item record; canonical jsonb; total bigint:=0; count_requested bigint; used bigint; oid uuid;
begin
 if auth.uid() is null then raise exception 'Autenticação necessária.'; end if;
 if p_key is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'Seleção inválida.'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) j where jsonb_typeof(j->'quantity')<>'number' or (j->>'quantity')!~'^[0-9]+$' or (j->>'ticket_type_id')!~'^[0-9]+$' or j->>'quantity' is null or j->>'ticket_type_id' is null) then raise exception 'Quantidades inválidas.'; end if;
 select jsonb_agg(jsonb_build_object('ticket_type_id',x.ticket_type_id,'quantity',x.quantity) order by x.ticket_type_id),sum(x.quantity)
 into canonical,count_requested from (select (j->>'ticket_type_id')::bigint ticket_type_id,sum((j->>'quantity')::integer)::integer quantity from jsonb_array_elements(p_items) j group by 1) x;
 if count_requested not between 1 and 100 then raise exception 'Máximo de 100 bilhetes por encomenda.'; end if;
 perform public.event_lock();
 select * into o from public.event_orders where buyer_id=auth.uid() and idempotency_key=p_key;
 if found then
   if o.session_id<>p_session or o.request_items<>canonical then raise exception 'Chave reutilizada com outra seleção.'; end if;
   return o.id;
 end if;
 perform public.event_expire_reservations();
 if (select count(*) from public.event_orders where buyer_id=auth.uid() and status in ('reserved','payment_pending'))>=3 then raise exception 'Conclui ou aguarda a expiração das encomendas pendentes.'; end if;
 select * into s from public.event_sessions where id=p_session;
 select * into e from public.eventos where id=s.evento_id;
 if s.id is null or e.estado<>'publicado' or e.entidade_organizadora_id is null or not s.sales_enabled or s.status<>'scheduled' or s.starts_at<=now() then raise exception 'Sessão indisponível.'; end if;
 select coalesce(sum(i.reserved_quantity+i.committed_quantity),0) into used from public.event_order_items i join public.event_orders eo on eo.id=i.order_id where eo.session_id=p_session;
 if used+count_requested>s.capacity then raise exception 'Lotação insuficiente.'; end if;
 insert into public.event_orders(buyer_id,session_id,entidade_id,idempotency_key,request_items,purchase_snapshot)
 values(auth.uid(),p_session,e.entidade_organizadora_id,p_key,canonical,jsonb_build_object('event_name',e.nome,'session_starts_at',s.starts_at,'session_ends_at',s.ends_at,'venue_id',s.venue_id,'place',e.lugar,'terms_version',1,'non_nominative',true)) returning id into oid;
 for item in select * from jsonb_to_recordset(canonical) as x(ticket_type_id bigint,quantity integer) loop
   select * into t from public.event_ticket_types where id=item.ticket_type_id;
   if t.id is null or t.session_id<>p_session or not t.active or t.currency<>'EUR' or (t.sales_start is not null and t.sales_start>now()) or (t.sales_end is not null and t.sales_end<=now()) or item.quantity<1 or item.quantity>coalesce(t.max_per_order,100) then raise exception 'Tipo de bilhete indisponível ou limite excedido.'; end if;
   select coalesce(sum(reserved_quantity+committed_quantity),0) into used from public.event_order_items where ticket_type_id=t.id;
   if used+item.quantity>t.quantity then raise exception 'Stock insuficiente.'; end if;
   insert into public.event_order_items(order_id,ticket_type_id,name,unit_price_cents,quantity,reserved_quantity) values(oid,t.id,t.name,t.price_cents,item.quantity,item.quantity);
   total:=total+t.price_cents::bigint*item.quantity;
 end loop;
 update public.event_orders set subtotal_cents=total,total_cents=total where id=oid;
 perform public.event_audit('reserved',jsonb_build_object('order_id',oid));
 return oid;
end $$;

create function public.event_issue_tickets(p_order uuid) returns void
language sql security definer set search_path = '' as $$
 insert into public.event_tickets(order_item_id,ordinal)
 select i.id,g from public.event_order_items i cross join lateral generate_series(1,i.quantity) g where i.order_id=p_order
 on conflict(order_item_id,ordinal) do nothing;
$$;

create function public.event_confirm_free(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare o public.event_orders;
begin
 perform public.event_lock();
 select * into o from public.event_orders where id=p_order and buyer_id=auth.uid();
 if o.id is null then raise exception 'Encomenda indisponível.'; end if;
 if o.status='paid' and o.total_cents=0 then return; end if;
 if o.status<>'reserved' or o.expires_at<=now() or o.total_cents<>0 or exists(select 1 from public.event_sessions s join public.eventos e on e.id=s.evento_id where s.id=o.session_id and (s.status<>'scheduled' or e.estado<>'publicado' or s.starts_at<=now())) then raise exception 'Encomenda não pode ser confirmada.'; end if;
 update public.event_orders set status='paid',paid_at=now() where id=o.id;
 update public.event_order_items set committed_quantity=quantity,reserved_quantity=0 where order_id=o.id;
 perform public.event_issue_tickets(o.id);
 perform public.event_audit('free_confirmed',jsonb_build_object('order_id',o.id));
end $$;

-- Service-only; the server first checks buyer ownership with the session client.
create function public.event_prepare_payment(p_order uuid,p_buyer uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare o public.event_orders; a public.event_payment_accounts; pid uuid; fee bigint;
begin
 perform public.event_lock();
 select * into o from public.event_orders where id=p_order and buyer_id=p_buyer;
 if o.id is null then raise exception 'Encomenda indisponível.'; end if;
 select id into pid from public.event_payments where order_id=o.id;
 if found then return pid; end if;
 if o.status<>'reserved' or o.expires_at<=now() or o.total_cents<50 or o.total_cents>99999999 then raise exception 'Reserva indisponível.'; end if;
 if exists(select 1 from public.event_sessions s join public.eventos e on e.id=s.evento_id where s.id=o.session_id and (s.status<>'scheduled' or s.starts_at<=now() or e.estado<>'publicado')) then raise exception 'Sessão indisponível.'; end if;
 select * into a from public.event_payment_accounts where entidade_id=o.entidade_id;
 if a.entidade_id is null or not a.enabled or not a.charges_enabled or a.stripe_account_id is null or a.fee_policy is null then raise exception 'Pagamentos ainda não configurados.'; end if;
 if a.fee_policy->>'mode' is distinct from 'organizer_absorbs' or coalesce(a.fee_policy->>'basis_points','')!~'^[0-9]+$' or coalesce(a.fee_policy->>'fixed_cents','')!~'^[0-9]+$' then raise exception 'Política de comissão por validar.'; end if;
 fee:=floor(o.total_cents*(a.fee_policy->>'basis_points')::numeric/10000)::bigint+(a.fee_policy->>'fixed_cents')::bigint;
 if fee>o.total_cents then raise exception 'Comissão inválida.'; end if;
 insert into public.event_payments(order_id,destination_account,amount_cents,currency,application_fee_cents,payment_methods)
 values(o.id,a.stripe_account_id,o.total_cents,o.currency,fee,a.payment_methods) returning id into pid;
 update public.event_orders set status='payment_pending',application_fee_cents=fee,fee_snapshot=a.fee_policy where id=o.id;
 return pid;
end $$;

create function public.event_bind_payment(p_payment uuid,p_intent text) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform public.event_lock();
 if p_intent !~ '^pi_[A-Za-z0-9]+$' then raise exception 'Identificador inválido.'; end if;
 update public.event_payments set provider_intent_id=p_intent,status=case when status='creating' then 'pending' else status end,updated_at=now()
 where id=p_payment and (provider_intent_id is null or provider_intent_id=p_intent);
 if not found then raise exception 'Pagamento não corresponde.'; end if;
end $$;

create function public.event_settle_payment(p_payment uuid,p_intent text,p_status text,p_amount bigint,p_currency text,p_destination text,p_fee bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.event_payments; o public.event_orders; deliver boolean;
begin
 perform public.event_lock();
 select * into p from public.event_payments where id=p_payment;
 if p.id is null or p.provider_intent_id is distinct from p_intent or p.amount_cents<>p_amount or p.currency<>upper(p_currency) or p.destination_account is distinct from p_destination or p.application_fee_cents is distinct from p_fee then raise exception 'Pagamento não corresponde à encomenda.'; end if;
 select * into o from public.event_orders where id=p.order_id;
 if p.status in ('succeeded','review') then return; end if;
 if p_status='succeeded' then
   deliver:=o.status='payment_pending' and not o.financial_review_required and exists(select 1 from public.event_sessions s join public.eventos e on e.id=s.evento_id where s.id=o.session_id and s.status in ('scheduled','sold_out') and s.starts_at>now() and e.estado='publicado') and not exists(select 1 from public.event_order_items where order_id=o.id and reserved_quantity<>quantity);
   update public.event_payments set status=case when deliver then 'succeeded' else 'review' end,updated_at=now() where id=p.id;
   update public.event_orders set status=case when deliver then 'paid' else 'review' end,paid_at=now(),financial_review_required=not deliver where id=o.id;
   if deliver then
     update public.event_order_items set reserved_quantity=0,committed_quantity=quantity where order_id=o.id;
     perform public.event_issue_tickets(o.id);
   end if;
   perform public.event_audit('payment_confirmed',jsonb_build_object('order_id',o.id,'review',not deliver));
 elsif p_status='canceled' and p.status<>'cancelled' then
   update public.event_payments set status='cancelled',updated_at=now() where id=p.id;
   update public.event_orders set status='expired' where id=o.id and status='payment_pending';
   update public.event_order_items set reserved_quantity=0 where order_id=o.id;
   perform public.event_audit('payment_cancelled',jsonb_build_object('order_id',o.id));
 end if;
end $$;

create function public.event_set_ticket_hash(p_ticket uuid,p_buyer uuid,p_hash text) returns void
language plpgsql security definer set search_path = '' as $$
begin
 update public.event_tickets t set token_hash=p_hash from public.event_order_items i,public.event_orders o
 where t.id=p_ticket and i.id=t.order_item_id and o.id=i.order_id and o.buyer_id=p_buyer
 and (t.token_hash is null or t.token_hash=p_hash) and t.status in ('valid','used');
 if not found then raise exception 'Bilhete indisponível.'; end if;
end $$;

create function public.event_checkin(p_session bigint,p_hash text,p_request uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare t public.event_tickets; org bigint;
begin
 if auth.uid() is null or p_request is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'Pedido inválido.'; end if;
 perform public.event_lock();
 select e.entidade_organizadora_id into org from public.event_sessions s join public.eventos e on e.id=s.evento_id where s.id=p_session and s.status in ('scheduled','sold_out') and e.estado='publicado';
 if org is null or not public.is_event_org_member(org,array['owner','admin','checkin']) then raise exception 'Sem permissão para validar esta sessão.'; end if;
 select et.* into t from public.event_tickets et join public.event_order_items i on i.id=et.order_item_id join public.event_orders o on o.id=i.order_id
 where et.token_hash=p_hash and o.session_id=p_session and o.status in ('paid','partially_refunded') and not o.financial_review_required;
 if t.id is null then return jsonb_build_object('result','invalid'); end if;
 if t.status='used' then
   if t.checkin_request_id=p_request and t.checked_in_by=auth.uid() then return jsonb_build_object('result','accepted','replayed',true); end if;
   return jsonb_build_object('result','already_used');
 end if;
 if t.status<>'valid' then return jsonb_build_object('result','invalid'); end if;
 update public.event_tickets set status='used',checked_in_at=now(),checked_in_by=auth.uid(),checkin_request_id=p_request where id=t.id;
 perform public.event_audit('checkin',jsonb_build_object('ticket_id',t.id,'session_id',p_session));
 return jsonb_build_object('result','accepted','replayed',false);
end $$;

create function public.event_request_refund(p_order uuid,p_tickets uuid[],p_reason text,p_key uuid,p_reverse boolean,p_refund_fee boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare o public.event_orders; p public.event_payments; r public.event_refunds; total bigint; n integer;
begin
 perform public.event_lock();
 select * into o from public.event_orders where id=p_order;
 if o.id is null or not public.is_event_org_member(o.entidade_id,array['owner','admin','finance']) then raise exception 'Sem permissão.'; end if;
 if p_key is null or p_reverse is null or p_refund_fee is null or char_length(trim(p_reason)) not between 1 and 500 then raise exception 'Pedido inválido.'; end if;
 select * into r from public.event_refunds where requested_by=auth.uid() and idempotency_key=p_key;
 select * into p from public.event_payments where order_id=o.id and status in ('succeeded','review');
 if p.id is null then raise exception 'Pagamento não reembolsável.'; end if;
 if r.id is not null then
   if r.payment_id<>p.id or r.reason<>trim(p_reason) or r.reverse_transfer<>p_reverse or r.refund_application_fee<>p_refund_fee or
    coalesce((select array_agg(ticket_id order by ticket_id) from public.event_refund_items where refund_id=r.id),'{}'::uuid[])<>
    coalesce((select array_agg(x order by x) from unnest(p_tickets) x),'{}'::uuid[]) then raise exception 'Chave reutilizada com outro pedido.'; end if;
   return r.id;
 end if;
 if o.status='review' and coalesce(cardinality(p_tickets),0)=0 and not exists(select 1 from public.event_tickets t join public.event_order_items i on i.id=t.order_item_id where i.order_id=o.id) then total:=p.amount_cents;
 else
   if coalesce(cardinality(p_tickets),0)=0 then raise exception 'Seleciona os bilhetes.'; end if;
   select count(*),sum(i.unit_price_cents) into n,total from public.event_tickets t join public.event_order_items i on i.id=t.order_item_id where i.order_id=o.id and t.id=any(p_tickets) and t.status='valid';
   if n<>cardinality(p_tickets) then raise exception 'Bilhetes inválidos, utilizados ou já em reembolso.'; end if;
 end if;
 if total<=0 or total+coalesce((select sum(amount_cents) from public.event_refunds where payment_id=p.id and status<>'failed'),0)>p.amount_cents then raise exception 'Montante de reembolso inválido.'; end if;
 insert into public.event_refunds(payment_id,requested_by,idempotency_key,amount_cents,reason,reverse_transfer,refund_application_fee)
 values(p.id,auth.uid(),p_key,total,trim(p_reason),p_reverse,p_refund_fee) returning * into r;
 insert into public.event_refund_items(refund_id,ticket_id,amount_cents) select r.id,t.id,i.unit_price_cents from public.event_tickets t join public.event_order_items i on i.id=t.order_item_id where t.id=any(p_tickets) and i.order_id=o.id;
 update public.event_tickets set status='refund_pending' where id=any(p_tickets);
 perform public.event_audit('refund_requested',jsonb_build_object('refund_id',r.id));
 return r.id;
end $$;

create function public.event_settle_refund(p_refund uuid,p_provider_id text,p_intent text,p_amount bigint,p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.event_refunds; p public.event_payments; refunded bigint;
begin
 perform public.event_lock();
 select * into r from public.event_refunds where id=p_refund;
 select * into p from public.event_payments where id=r.payment_id;
 if r.id is null or p.provider_intent_id is distinct from p_intent or r.amount_cents<>p_amount or (r.provider_refund_id is not null and r.provider_refund_id<>p_provider_id) then raise exception 'Reembolso não corresponde.'; end if;
 if r.status in ('succeeded','failed') then return; end if;
 if p_status not in ('succeeded','failed','canceled','pending','requires_action') then raise exception 'Estado inválido.'; end if;
 update public.event_refunds set provider_refund_id=p_provider_id,status=case when p_status in ('failed','canceled') then 'failed' when p_status='succeeded' then 'succeeded' else 'pending' end,completed_at=case when p_status='succeeded' then now() else null end where id=r.id;
 update public.event_tickets set status=case when p_status='succeeded' then 'refunded' when p_status in ('failed','canceled') then 'valid' else 'refund_pending' end
 where id in(select ticket_id from public.event_refund_items where refund_id=r.id);
 if p_status='succeeded' then
  select coalesce(sum(amount_cents),0) into refunded from public.event_refunds where payment_id=p.id and status='succeeded';
  update public.event_orders set status=case when refunded=p.amount_cents then 'refunded' else 'partially_refunded' end where id=p.order_id;
  -- Deliberately retain committed inventory; late-payment review reservations too.
  perform public.event_audit('refund_confirmed',jsonb_build_object('refund_id',r.id));
 end if;
end $$;

-- Revoke default PUBLIC execution on EVERY new RPC before selectively exposing it.
revoke all on function public.event_expire_reservations(), public.event_availability(bigint), public.event_reserve(bigint,jsonb,uuid), public.event_issue_tickets(uuid), public.event_confirm_free(uuid), public.event_prepare_payment(uuid,uuid), public.event_bind_payment(uuid,text), public.event_settle_payment(uuid,text,text,bigint,text,text,bigint), public.event_set_ticket_hash(uuid,uuid,text), public.event_checkin(bigint,text,uuid), public.event_request_refund(uuid,uuid[],text,uuid,boolean,boolean), public.event_settle_refund(uuid,text,text,bigint,text) from public,anon,authenticated;
grant execute on function public.event_availability(bigint) to anon,authenticated;
grant execute on function public.event_reserve(bigint,jsonb,uuid),public.event_confirm_free(uuid),public.event_checkin(bigint,text,uuid),public.event_request_refund(uuid,uuid[],text,uuid,boolean,boolean) to authenticated;
grant execute on function public.event_expire_reservations(),public.event_prepare_payment(uuid,uuid),public.event_bind_payment(uuid,text),public.event_settle_payment(uuid,text,text,bigint,text,text,bigint),public.event_set_ticket_hash(uuid,uuid,text),public.event_settle_refund(uuid,text,text,bigint,text) to service_role;
commit;
