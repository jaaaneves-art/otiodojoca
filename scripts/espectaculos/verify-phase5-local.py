#!/usr/bin/env python3
"""ONLY otj_espectaculos_fase3_test on local Docker. Reuse fixture setup, not old tests."""
from pathlib import Path
setup = Path(__file__).with_name('verify-local.py').read_text().split('\ns,t=session()\n')[0]
assert 'def reserve(' in setup
exec(compile(setup, 'phase3-fixture-setup', 'exec'))
s,t=session(2); order=reserve(s,t,users[6])
# Isolate due work in this explicitly disposable DB, including previous test leftovers.
sql("update public.event_notification_outbox set status='deferred',lease_token=null,lease_until=null,next_attempt_at=now()+interval '1 year' where status='processing'")
sql("update public.event_notification_outbox set next_attempt_at=now()+interval '1 year' where status in ('pending','deferred')")
def insert():
    return sql(f"insert into public.event_notification_outbox(order_id,kind,deduplication_key) values('{order}','order_confirmation',gen_random_uuid()::text) returning id")
def claim(limit=1,maximum=5):
    return json.loads(sql(f"select coalesce(jsonb_agg(x),'[]'::jsonb) from public.event_notification_claim({limit},{maximum},60) x"))
ids={insert() for _ in range(10)}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    batches=list(pool.map(lambda _:claim(5),range(2)))
claimed=[r for b in batches for r in b]
check('two workers claim disjoint batches',len(claimed)==10 and {r['id'] for r in claimed}==ids)
r=claimed[0]
check('stale token cannot acknowledge',sql(f"select public.event_notification_finish('{r['id']}',gen_random_uuid(),'delivered')")=='f')
check('owner can renew live lease',sql(f"select public.event_notification_renew('{r['id']}','{r['lease_token']}',60)")=='t')
sql(f"update public.event_notification_outbox set lease_until=now()-interval '1 second' where id='{r['id']}'")
check('expired token cannot renew',sql(f"select public.event_notification_renew('{r['id']}','{r['lease_token']}',60)")=='f')
renewed=claim()[0]
check('expired lease reclaimed with new token',renewed['id']==r['id'] and renewed['lease_token']!=r['lease_token'] and renewed['attempts']==2)
check('old worker fenced after reclaim',sql(f"select public.event_notification_finish('{r['id']}','{r['lease_token']}','delivered')")=='f')
check('new worker acknowledges',sql(f"select public.event_notification_finish('{renewed['id']}','{renewed['lease_token']}','delivered')")=='t')
check('ack replay cannot mutate delivered record',sql(f"select public.event_notification_finish('{renewed['id']}','{renewed['lease_token']}','failed')")=='f')
r=claimed[1]
sql(f"select public.event_notification_finish('{r['id']}','{r['lease_token']}','failed','SECRET_MUST_NOT_PERSIST')")
check('error sanitized to allowlisted code',sql(f"select last_error from public.event_notification_outbox where id='{r['id']}'")=='delivery_failed')
check('backoff schedules next attempt',sql(f"select next_attempt_at>now()+interval '20 seconds' from public.event_notification_outbox where id='{r['id']}'")=='t')
check('backoff not immediately claimable',not claim())
sql(f"update public.event_notification_outbox set next_attempt_at=now(),attempts=5 where id='{r['id']}'")
claim()
check('attempt cap becomes terminal failed',sql(f"select status from public.event_notification_outbox where id='{r['id']}'")=='failed')
check('deduplication key remains unique',sql(f"insert into public.event_notification_outbox(order_id,kind,deduplication_key) select order_id,kind,deduplication_key from public.event_notification_outbox where id='{r['id']}'",ok=False))
for u in [owner,admin,manager,finance,door,stranger]:
 check('outbox unreadable by browser roles',sql('select * from public.event_notification_outbox',u,ok=False))
 check('claim RPC service-role only',sql('select public.event_notification_claim()',u,ok=False))
for u in [manager,door,stranger]:
 check('operational finance summary denied',sql(f'select public.event_operational_summary({e})',u,ok=False))
for u in [owner,admin,finance]:
 data=json.loads(sql(f'select public.event_operational_summary({e})',u))
 check('authorized operational projection has aggregates only',len(data)==1 and set(data[0])=={'session_id','starts_at','status','review_orders','pending_payments','pending_refunds','failed_notifications','deferred_notifications'})
check('unauthenticated operational summary denied',sql(f'begin; set local role anon; select public.event_operational_summary({e}); commit',ok=False))
lease=sql('select public.event_maintenance_claim()')
check('maintenance second invocation cannot acquire',sql('select public.event_maintenance_claim()')=='')
sql('select public.event_maintenance_release(gen_random_uuid())')
check('wrong token cannot release maintenance',sql('select public.event_maintenance_claim()')=='')
sql(f"select public.event_maintenance_release('{lease}')")
check('maintenance released by owner token',bool(sql('select public.event_maintenance_claim()')))
sql("update public.event_operation_leases set expires_at=now()-interval '1 second'")
print('Phase 5 SQL checks passed (disposable local DB only).')
