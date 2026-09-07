import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
// Blank every .env key before Next can load it. Values are neither read into env nor printed.
const env = { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1' };
for (const file of ['.env','.env.local','.env.development','.env.development.local']) {
 if (existsSync(file)) for (const line of readFileSync(file,'utf8').split('\n')) { const match=line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/); if(match) env[match[1]]=''; }
}
Object.assign(env, { NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:4319', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'local-fixture-public', SUPABASE_SERVICE_ROLE_KEY:'local-fixture-service', ESPECTACULOS_STRIPE_ENABLED:'false', ESPECTACULOS_STRIPE_MODE:'test', ESPECTACULOS_QR_KEY_V1:randomBytes(32).toString('hex'), NEXT_FONT_GOOGLE_MOCKED_RESPONSES:`${process.cwd()}/scripts/espectaculos/e2e/font-fixture.cjs`, NODE_OPTIONS:`--require ${process.cwd()}/scripts/espectaculos/e2e/network-guard.cjs` });
const fixture = spawn(process.execPath,['scripts/espectaculos/e2e/fixture-server.mjs'],{env,stdio:'inherit'});
const next = spawn(process.execPath,['scripts/espectaculos/e2e/next-server.mjs'],{env,stdio:'inherit'});
let stopping=false;
function stop() { if(stopping)return; stopping=true; next.kill('SIGTERM'); fixture.kill('SIGTERM'); }
process.on('SIGTERM',stop);process.on('SIGINT',stop);
fixture.on('exit',code=>{stop();process.exitCode=code??1;});next.on('exit',code=>{stop();process.exitCode=code??1;});
