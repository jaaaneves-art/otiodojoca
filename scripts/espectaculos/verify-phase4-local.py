#!/usr/bin/env python3
"""Reuse Phase 3 fixtures and checks; ONLY the hardcoded disposable local DB."""
import runpy
from pathlib import Path
# Schema-only clones omit ACLs: restore exactly the existing ticketing grants.
import re
import subprocess
root = Path(__file__).resolve().parents[2]
acl = []
for migration in sorted((root / 'supabase/migrations').glob('*espetaculos*.sql')):
    clean = re.sub(r'--[^\n]*', '', migration.read_text())
    acl.extend(statement.strip() + ';' for statement in clean.split(';') if re.match(r'^\s*(grant|revoke)\b', statement, re.I))
subprocess.run(['docker', 'exec', '-i', 'supabase_db_otiodojoca', 'psql', '-X', '-U', 'postgres', '-d', 'otj_espectaculos_fase3_test', '-q', '-v', 'ON_ERROR_STOP=1'], input='\n'.join(acl), text=True, check=True)
x = runpy.run_path(str(Path(__file__).with_name('verify-local.py')))
globals().update(x)
for role in [manager, finance, door, stranger]:
    check('outbox hidden from application users', sql('select * from public.event_notification_outbox', role, ok=False))
for role in [door, stranger]:
    check('sales summary rejects operational/unrelated role', sql(f'select public.event_sales_summary({e})', role, ok=False))
m = json.loads(sql(f'select public.event_sales_summary({e})', manager))
frows = json.loads(sql(f'select public.event_sales_summary({e})', finance))
check('manager summary excludes financial keys', bool(m) and all('gross_cents' not in row and 'net_before_provider_cents' not in row for row in m))
check('finance summary contains financial keys', bool(frows) and all('gross_cents' in row for row in frows))
check('public projection denies drafts even to manager', sql(f'select public.event_public_detail({draft}) is null', manager)=='t')
public=json.loads(sql(f'begin; set local role anon; select public.event_public_detail({e}); commit;'))
check('public projection has only permitted fields', set(public)=={'id','name','description','place','organizer','status','sessions'})
check('public availability denies inactive draft types to manager', sql(f'select count(*) from public.event_public_availability({ds})',manager)=='0')
ns,nt=session(3,0); no=reserve(ns,nt,users[6],quantity=2)
sql(f"select public.event_confirm_free('{no}')",users[6]); sql(f"select public.event_confirm_free('{no}')",users[6])
check('notification intents deduplicate ticket batch and confirmation',sql(f"select count(*) from public.event_notification_outbox where order_id='{no}'")=='3')
newticket=sql(f"select t.id from public.event_tickets t join public.event_order_items i on i.id=t.order_item_id where i.order_id='{no}' limit 1")
nh=hashlib.sha256(uuid.uuid4().bytes).hexdigest(); sql(f"select public.event_set_ticket_hash('{newticket}','{users[6]}','{nh}')")
wrong,_=session()
check('scanner reports wrong session without identity',json.loads(sql(f"select public.event_checkin_feedback({wrong},'{nh}',gen_random_uuid())",door))=={'result':'wrong_session'})
request=str(uuid.uuid4())
check('scanner accepts ticket',json.loads(sql(f"select public.event_checkin_feedback({ns},'{nh}','{request}')",door))['result']=='accepted')
check('scanner replay is idempotent',json.loads(sql(f"select public.event_checkin_feedback({ns},'{nh}','{request}')",door))['replayed'])
check('scanner rejects second entry',json.loads(sql(f"select public.event_checkin_feedback({ns},'{nh}',gen_random_uuid())",door))['result']=='already_used')
sql(f"update public.event_tickets set status='refunded' where id='{newticket}'")
check('scanner explains refund',json.loads(sql(f"select public.event_checkin_feedback({ns},'{nh}',gen_random_uuid())",door))=={'result':'refunded'})
sql(f"update public.eventos set estado='cancelado' where id={e}")
check('cancelled public event remains visible',json.loads(sql(f'begin; set local role anon; select public.event_public_detail({e}); commit;'))['status']=='cancelado')
check('cancellation queues one notification',sql(f"select count(*) from public.event_notification_outbox where order_id='{no}' and kind='cancellation'")=='1')
check('scanner refuses cancelled session clearly',json.loads(sql(f"select public.event_checkin_feedback({ns},'{nh}',gen_random_uuid())",door))=={'result':'cancelled'})
print('All Phase 4 local database checks passed.')
