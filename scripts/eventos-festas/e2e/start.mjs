import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
const env = { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1' };
// Limpar valores antes de o Next ler .env; testes só podem falar com loopback.
for (const file of ['.env', '.env.local', '.env.development', '.env.development.local']) {
  if (existsSync(file)) for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match) env[match[1]] = '';
  }
}
Object.assign(env, { OTJ_EVENTOS_FESTAS_E2E: '1', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:4327', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-fixture-public', SUPABASE_SERVICE_ROLE_KEY: '', NEXT_FONT_GOOGLE_MOCKED_RESPONSES: `${process.cwd()}/scripts/espectaculos/e2e/font-fixture.cjs`, NODE_OPTIONS: `--require ${process.cwd()}/scripts/espectaculos/e2e/network-guard.cjs` });
const fixture = spawn(process.execPath, ['scripts/eventos-festas/e2e/fixture.mjs'], { env, stdio: 'inherit' });
const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--port', '4326', '--hostname', '127.0.0.1'], { env, stdio: 'inherit' });
let stopping = false;
function stop() { if (stopping) return; stopping = true; next.kill('SIGTERM'); fixture.kill('SIGTERM'); }
process.on('SIGTERM', stop); process.on('SIGINT', stop);
fixture.on('exit', code => { stop(); process.exitCode = code ?? 1; });
next.on('exit', code => { stop(); process.exitCode = code ?? 1; });
