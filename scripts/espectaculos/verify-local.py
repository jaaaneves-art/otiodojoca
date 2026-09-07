#!/usr/bin/env python3
"""Destructive fixtures ONLY in the explicitly named disposable local Supabase DB.
No environment URLs, remote clients, app seeds or real accounts are used.
Run after loading the local schema and the Fase 3 migrations. Re-runnable.
"""
import concurrent.futures
import hashlib
import json
import subprocess
import uuid

DB = 'otj_espectaculos_fase3_test'
BASE = ['docker', 'exec', '-i', 'supabase_db_otiodojoca', 'psql', '-X', '-U', 'postgres', '-d', DB, '-Atq', '-v', 'ON_ERROR_STOP=1']
def sql(query, user=None, role='authenticated', ok=True):
    if user:
        query = f"begin; set local role {role}; set local request.jwt.claim.sub='{user}'; " + query + '; commit;'
    p = subprocess.run(BASE, input=query, text=True, capture_output=True)
    if ok and p.returncode:
        raise RuntimeError(p.stderr)
    return p.stdout.strip() if ok else p.returncode != 0

def check(name, value):
    assert value, name
    print('PASS', name, flush=True)

assert sql('select current_database()') == DB
# All rows below belong to this disposable database. Never run against app DB.
sql("""
 grant usage on schema public,auth to anon,authenticated,service_role;
 grant select on public.eventos,public.entidades,public.event_sessions,public.event_ticket_types,public.event_organization_members to authenticated;
 grant insert,update,delete on public.event_sessions,public.event_ticket_types,public.event_organization_members to authenticated;
 grant usage,select on all sequences in schema public to authenticated;
 create extension if not exists unaccent with schema public;
""")
users = [str(uuid.uuid4()) for _ in range(12)]
for u in users:
    sql(f"insert into auth.users(id,email,raw_user_meta_data) values('{u}','{u}@example.invalid','{{}}'); insert into public.profiles(id,username) values('{u}','test_{u}') on conflict(id) do nothing;")
owner, admin, manager, finance, door, stranger = users[:6]
f = sql("insert into public.freguesias(cod_ine,nome,municipio) values(substr(md5(random()::text),1,10),'Teste descartável','Teste') returning id")
c = sql("insert into public.categorias_entidade(nome,slug) values(gen_random_uuid()::text,gen_random_uuid()::text) returning id")
org = sql(f"insert into public.entidades(nome,slug,categoria_id,freguesia_id,estado) values('Teste',gen_random_uuid()::text,{c},{f},'publicado') returning id")
for u,r in [(owner,'owner'),(admin,'admin'),(manager,'manager'),(finance,'finance'),(door,'checkin')]:
    sql(f"insert into public.event_organization_members(entidade_id,user_id,role) values({org},'{u}','{r}')")
e = sql(f"insert into public.eventos(nome,slug,inicio,freguesia_id,entidade_organizadora_id,tipo,estado) values('Teste',gen_random_uuid()::text,now()+interval '2 days',{f},{org},'cultural','publicado') returning id")
def session(capacity=1, price=0):
    s = sql(f"insert into public.event_sessions(evento_id,starts_at,capacity,sales_enabled) values({e},now()+interval '2 days',{capacity},true) returning id")
    t = sql(f"insert into public.event_ticket_types(session_id,name,quantity,price_cents,max_per_order) values({s},'Geral',{capacity},{price},2) returning id")
    return s,t

def reserve(s,t,u,key=None,quantity=1):
    key=key or str(uuid.uuid4())
    return sql(f"select public.event_reserve({s},'[{{\"ticket_type_id\":{t},\"quantity\":{quantity}}}]','{key}')",u)

s,t=session()
def attempt(u):
    try: return reserve(s,t,u)
    except RuntimeError: return None
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    winners=list(filter(None,pool.map(attempt,users[6:])))
check('6 concurrent buyers: exactly one last-seat reservation',len(winners)==1)
o=winners[0]
buyer=sql(f"select buyer_id from public.event_orders where id='{o}'")
key=sql(f"select idempotency_key from public.event_orders where id='{o}'")
check('reservation replay returns same order',reserve(s,t,buyer,key)==o)
check('idempotency rejects changed quantities',sql(f"select public.event_reserve({s},'[{{\"ticket_type_id\":{t},\"quantity\":2}}]','{key}')",buyer,ok=False))
check('buyer cannot see another buyer order',sql(f"select count(*) from public.event_orders where id='{o}'",stranger)=='0')
check('manager cannot read finances',sql(f"select count(*) from public.event_orders where id='{o}'",manager)=='0')
check('checkin cannot read buyer orders',sql(f"select count(*) from public.event_orders where id='{o}'",door)=='0')
check('finance can read organization order',sql(f"select count(*) from public.event_orders where id='{o}'",finance)=='1')
check('buyer cannot forge payment confirmation',sql(f"select public.event_settle_payment(gen_random_uuid(),'pi_test','succeeded',1,'EUR','acct_test',0)",buyer,ok=False))
check('buyer cannot write orders directly',sql(f"update public.event_orders set status='paid' where id='{o}'",buyer,ok=False))
check('cannot reduce capacity below reservation',sql(f"update public.event_ticket_types set quantity=0 where id={t}",manager,ok=False))
sql(f"select public.event_confirm_free('{o}')",buyer)
sql(f"select public.event_confirm_free('{o}')",buyer)
check('free confirmation emits once',sql(f"select count(*) from public.event_tickets t join public.event_order_items i on i.id=t.order_item_id where i.order_id='{o}'")=='1')
ticket=sql(f"select t.id from public.event_tickets t join public.event_order_items i on i.id=t.order_item_id where i.order_id='{o}'")
h=hashlib.sha256(uuid.uuid4().bytes+uuid.uuid4().bytes).hexdigest()
sql(f"select public.event_set_ticket_hash('{ticket}','{buyer}','{h}')")
check('buyer cannot read token hash',sql('select token_hash from public.event_tickets',buyer,ok=False))
check('stranger cannot check in',sql(f"select public.event_checkin({s},'{h}',gen_random_uuid())",stranger,ok=False))
requests=[str(uuid.uuid4()) for _ in range(6)]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results=list(pool.map(lambda k: json.loads(sql(f"select public.event_checkin({s},'{h}','{k}')",door)),requests))
check('simultaneous QR scans accept once',sum(r['result']=='accepted' for r in results)==1)
accepted=requests[next(i for i,r in enumerate(results) if r['result']=='accepted')]
check('same checkin request is idempotent',json.loads(sql(f"select public.event_checkin({s},'{h}','{accepted}')",door))['replayed'])

s2,t2=session(3)
o2=reserve(s2,t2,buyer)
sql(f"update public.event_orders set expires_at=now()-interval '1 minute' where id='{o2}'; select public.event_expire_reservations();")
check('unpaid reservation expires',sql(f"select status from public.event_orders where id='{o2}'")=='expired')
check('expiration releases stock',sql(f"select reserved_quantity from public.event_order_items where order_id='{o2}'")=='0')
check('max_per_order enforced',sql(f"select public.event_reserve({s2},'[{{\"ticket_type_id\":{t2},\"quantity\":3}}]',gen_random_uuid())",buyer,ok=False))
check('admin cannot become owner',sql(f"update public.event_organization_members set role='owner' where entidade_id={org} and user_id='{admin}'",admin,ok=False))
check('last owner cannot be deleted',sql(f"delete from public.event_organization_members where entidade_id={org} and user_id='{owner}'",owner,ok=False))

# Two ticket types still share one session capacity.
s3,t3=session()
t4=sql(f"insert into public.event_ticket_types(session_id,name,quantity) values({s3},'Outro',1) returning id")
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    def cross(pair):
        try: return reserve(s3,pair[0],pair[1])
        except RuntimeError: return None
    cross_results=list(pool.map(cross,[(t3,users[7]),(t4,users[8])]))
check('different types share session capacity',sum(bool(x) for x in cross_results)==1)
# Financial transitions are exercised in the actual PostgreSQL engine. These are
# disposable SQL fixtures, not simulated Stripe requests or app mock data.
sql(f"insert into public.event_payment_accounts(entidade_id,stripe_account_id,enabled,charges_enabled,fee_policy) values({org},'acct_'||replace(gen_random_uuid()::text,'-',''),true,true,'{{\"mode\":\"organizer_absorbs\",\"basis_points\":0,\"fixed_cents\":0}}')")
s4,t5=session(4,1000)
o4=reserve(s4,t5,buyer,quantity=2)
pay=sql(f"select public.event_prepare_payment('{o4}','{buyer}')")
check('payment preparation replay is idempotent',sql(f"select public.event_prepare_payment('{o4}','{buyer}')")==pay)
dest=sql(f"select destination_account from public.event_payments where id='{pay}'")
intent='pi_'+uuid.uuid4().hex
sql(f"select public.event_bind_payment('{pay}','{intent}')")
check('wrong amount rejected',sql(f"select public.event_settle_payment('{pay}','{intent}','succeeded',1,'EUR','{dest}',0)",ok=False))
check('wrong destination rejected',sql(f"select public.event_settle_payment('{pay}','{intent}','succeeded',2000,'EUR','acct_other',0)",ok=False))
sql(f"update public.event_orders set expires_at=now()-interval '1 minute' where id='{o4}'; select public.event_expire_reservations()")
check('payment pending stock retained after deadline',sql(f"select reserved_quantity from public.event_order_items where order_id='{o4}'")=='2')
settle=f"select public.event_settle_payment('{pay}','{intent}','succeeded',2000,'EUR','{dest}',0)"
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: list(pool.map(lambda _:sql(settle),range(4)))
check('concurrent confirmations emit exactly purchased tickets',sql(f"select count(*) from public.event_tickets t join public.event_order_items i on i.id=t.order_item_id where i.order_id='{o4}'")=='2')
check('paid stock is consumed atomically',sql(f"select reserved_quantity||':'||committed_quantity from public.event_order_items where order_id='{o4}'")=='0:2')
paid_tickets=sql(f"select t.id from public.event_tickets t join public.event_order_items i on i.id=t.order_item_id where i.order_id='{o4}' order by t.ordinal").splitlines()
rkey=str(uuid.uuid4())
req=f"select public.event_request_refund('{o4}',array['{paid_tickets[0]}'::uuid],'Teste descartável','{rkey}',true,false)"
check('manager cannot request refund',sql(req,manager,ok=False))
rid=sql(req,finance)
check('refund request is idempotent',sql(req,finance)==rid)
check('pending refund blocks checkin',sql(f"select status from public.event_tickets where id='{paid_tickets[0]}'")=='refund_pending')
check('duplicate ticket refund rejected',sql(f"select public.event_request_refund('{o4}',array['{paid_tickets[0]}'::uuid],'Teste',gen_random_uuid(),true,false)",finance,ok=False))
provider_refund='re_'+uuid.uuid4().hex
sql(f"select public.event_settle_refund('{rid}','{provider_refund}','{intent}',1000,'pending')")
check('provider pending is not completed',sql(f"select status from public.event_refunds where id='{rid}'")=='pending')
sql(f"select public.event_settle_refund('{rid}','{provider_refund}','{intent}',1000,'succeeded')")
sql(f"select public.event_settle_refund('{rid}','{provider_refund}','{intent}',1000,'pending')")
check('completed refund cannot regress',sql(f"select status from public.event_refunds where id='{rid}'")=='succeeded')
check('partial refund keeps inventory committed',sql(f"select committed_quantity from public.event_order_items where order_id='{o4}'")=='2')
check('partial refund updates order',sql(f"select status from public.event_orders where id='{o4}'")=='partially_refunded')
check('purchase price snapshot preserved',sql(f"update public.event_ticket_types set price_cents=2000 where id={t5}; select unit_price_cents from public.event_order_items where order_id='{o4}'")=='1000')
# Pending cancellation releases only after the provider confirms canceled.
s5,t6=session(1,1000); o5=reserve(s5,t6,users[9]); p5=sql(f"select public.event_prepare_payment('{o5}','{users[9]}')"); pi5='pi_'+uuid.uuid4().hex
sql(f"select public.event_bind_payment('{p5}','{pi5}'); select public.event_settle_payment('{p5}','{pi5}','canceled',1000,'EUR','{dest}',0)")
check('confirmed cancellation releases reservation',sql(f"select reserved_quantity from public.event_order_items where order_id='{o5}'")=='0')
# A contradictory late success never oversells a released reservation.
sql(f"select public.event_settle_payment('{p5}','{pi5}','succeeded',1000,'EUR','{dest}',0)")
check('late success after release requires review',sql(f"select status from public.event_orders where id='{o5}'")=='review')
check('late success does not emit tickets',sql(f"select count(*) from public.event_tickets t join public.event_order_items i on i.id=t.order_item_id where i.order_id='{o5}'")=='0')
sql(f"update public.event_sessions set status='cancelled' where id={s4}")
check('session cancellation flags financial review',sql(f"select financial_review_required from public.event_orders where id='{o4}'")=='t')
check('session cancellation does not create refunds',sql(f"select count(*) from public.event_refunds where payment_id='{pay}'")=='1')
# Read policies must cover drafts and inactive types for internal catalog roles.
draft=sql(f"insert into public.eventos(nome,slug,inicio,freguesia_id,entidade_organizadora_id,tipo,estado) values('Rascunho',gen_random_uuid()::text,now()+interval '2 days',{f},{org},'cultural','rascunho') returning id")
ds=sql(f"insert into public.event_sessions(evento_id,starts_at,capacity) values({draft},now()+interval '2 days',2) returning id")
dt=sql(f"insert into public.event_ticket_types(session_id,name,quantity,active) values({ds},'Inativo',2,false) returning id")
check('manager reads draft sessions',sql(f"select count(*) from public.event_sessions where id={ds}",manager)=='1')
check('manager reads inactive ticket types',sql(f"select count(*) from public.event_ticket_types where id={dt}",manager)=='1')
check('unrelated user cannot read drafts',sql(f"select count(*) from public.event_sessions where id={ds}",stranger)=='0')
other=sql(f"insert into public.entidades(nome,slug,categoria_id,freguesia_id,estado) values('Outra',gen_random_uuid()::text,{c},{f},'publicado') returning id")
sql(f"insert into public.event_organization_members(entidade_id,user_id,role) values({other},'{stranger}','finance')")
check('finance of another organization cannot read orders',sql(f"select count(*) from public.event_orders where id='{o4}'",stranger)=='0')
check('finance of another organization cannot refund',sql(req,stranger,ok=False))
check('finance cannot call checkin',sql(f"select public.event_checkin({s},'{h}',gen_random_uuid())",finance,ok=False))
check('anon cannot reserve',sql(f"begin; set local role anon; select public.event_reserve({s},'[]',gen_random_uuid()); commit",ok=False))
check('catalog deletion cannot erase commercial history',sql(f"delete from public.event_sessions where id={s}",owner,ok=False))
# Last-owner protection is serialized, even when both owners remove themselves.
sql(f"insert into public.event_organization_members(entidade_id,user_id,role) values({org},'{users[10]}','owner')",owner)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    removed=list(pool.map(lambda u:sql(f"delete from public.event_organization_members where entidade_id={org} and user_id='{u}'",u,ok=False),[owner,users[10]]))
check('concurrent owner removals preserve one owner',sum(removed)==1 and sql(f"select count(*) from public.event_organization_members where entidade_id={org} and role='owner'")=='1')
# Unsupported low paid amounts fail before creating uncertain external attempts.
small_s,small_t=session(1,1); small_o=reserve(small_s,small_t,users[6])
check('unsupported Stripe amount rejected before payment attempt',sql(f"select public.event_prepare_payment('{small_o}','{users[6]}')",ok=False) and sql(f"select count(*) from public.event_payments where order_id='{small_o}'")=='0')
# The only successful result in a refund-vs-checkin race determines ticket state.
rs,rt=session(1,1000); ro=reserve(rs,rt,users[11]); rp=sql(f"select public.event_prepare_payment('{ro}','{users[11]}')"); ri='pi_'+uuid.uuid4().hex
sql(f"select public.event_bind_payment('{rp}','{ri}'); select public.event_settle_payment('{rp}','{ri}','succeeded',1000,'EUR','{dest}',0)")
rti=sql(f"select t.id from public.event_tickets t join public.event_order_items i on i.id=t.order_item_id where i.order_id='{ro}'")
rh=hashlib.sha256(uuid.uuid4().bytes).hexdigest(); sql(f"select public.event_set_ticket_hash('{rti}','{users[11]}','{rh}')")
def race_refund():
    try: return ('refund',sql(f"select public.event_request_refund('{ro}',array['{rti}'::uuid],'Teste concorrente',gen_random_uuid(),true,false)",finance))
    except RuntimeError: return ('refund',None)
def race_checkin(): return ('checkin',json.loads(sql(f"select public.event_checkin({rs},'{rh}',gen_random_uuid())",door))['result'])
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    a=pool.submit(race_refund); b=pool.submit(race_checkin); outcomes=dict([a.result(),b.result()])
check('refund and checkin cannot both succeed', bool(outcomes['refund']) != (outcomes['checkin']=='accepted'))
print('All local database checks passed. Fixtures exist ONLY in disposable DB; drop DB after review.')
