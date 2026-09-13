"""Disposable LOCAL PostgreSQL contract test, never production.
Uses a minimal schema and explicit auth/minor helper doubles, not a full Supabase clone.
Leaves the isolated database for inspection. Every subprocess output/code is logged.
"""
import concurrent.futures
import datetime
import pathlib
import subprocess
import sys
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[2]
STAMP = datetime.datetime.now().astimezone()
DATABASE = 'otj_lup_rpc_test_' + STAMP.strftime('%Y%m%d_%H%M%S')
LOG = []


def sql(query, database=DATABASE):
    cmd = ['docker', 'exec', '-i', 'supabase_db_otiodojoca', 'psql', '-X', '-q', '-A', '-t',
           '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1']
    result = subprocess.run(cmd, input=query, cwd=ROOT, text=True, capture_output=True)
    LOG.append(f'Comando: {cmd}\nPasta: {ROOT}\nSQL stdin:\n{query}\nSTDOUT\n{result.stdout}\n'
               f'STDERR\n{result.stderr}\nCódigo de saída: {result.returncode}')
    if result.returncode:
        raise RuntimeError(result.stderr)
    return result.stdout.strip()


try:
    sql(f'CREATE DATABASE {DATABASE};', 'postgres')
    for name in ['tests/lup/rpc-fixture.sql',
                 'supabase/migrations/20260913230000_lup_rpc_idempotente.sql',
                 'tests/lup/rpc-checks.sql']:
        sql((ROOT / name).read_text())
    request = str(uuid.uuid4())
    query = f"""BEGIN; SET ROLE authenticated;
    SET request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
    SELECT * FROM lup_ad_guardar('{{"title":"Concurrent","description":"Teste","type":"procura",
    "category_id":1,"location":"Braga","contact_method":"message","details":{{}}}}', '{request}');
    COMMIT;"""
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda _: sql(query), range(8)))
    assert len({r.split('|')[0] for r in results}) == 1, results
    assert sum(r.endswith('|t') for r in results) == 1, results
    assert sql(f"SELECT count(*) FROM marketplace_ads WHERE lup_request_id='{request}';") == '1'
    print('PASS: permissions, validation, fields, ownership/module isolation, replay and 8 concurrent requests -> 1 ad.')
    print('Local database retained:', DATABASE)
except Exception as error:
    print('FAIL:', error)
    sys.exit(1)
finally:
    output = ROOT / 'outputs' / (STAMP.strftime('%Y%m%d-%H%M%S') + '-lup-sql-complete.txt')
    output.write_text(f'Data: {STAMP.isoformat()}\n' + '\n\n'.join(LOG))
    print(output)
