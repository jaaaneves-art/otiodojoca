// Carrega .env.local para os testes que precisam de BD real.
// Testes unitários não dependem disto — ignoram as vars.
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  config({ path: envPath });
}
