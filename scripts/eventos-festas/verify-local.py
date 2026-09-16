#!/usr/bin/env python3
"""Somente Docker local; cria e remove uma base descartável, sem comandos remotos."""
from pathlib import Path
import subprocess
import uuid

ROOT = Path(__file__).resolve().parents[2]
name = 'otj_eventos_festas_test_' + uuid.uuid4().hex[:12]
base = ['docker', 'exec', '-i', 'supabase_db_otiodojoca']

def run(args, sql=None):
    result = subprocess.run(base + args, input=sql, text=True, capture_output=True)
    if result.returncode:
        print(result.stdout, result.stderr)
        result.check_returncode()
    return result.stdout

def expand(path):
    text = path.read_text()
    return '\n'.join(expand((path.parent / line[4:]).resolve()) if line.startswith('\\ir ') else line for line in text.splitlines())

created = False
try:
    run(['createdb', '-U', 'postgres', name])
    created = True
    print(run(['psql', '-X', '-U', 'postgres', '-d', name, '-v', 'ON_ERROR_STOP=1'], expand(ROOT / 'tests/eventos-festas/schema.sql')))
finally:
    if created:
        run(['dropdb', '-U', 'postgres', name])
