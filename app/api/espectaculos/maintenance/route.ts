import { timingSafeEqual } from 'node:crypto';
import { maintainTicketing } from '@/lib/espectaculos/reconciliation';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  const secret = process.env.ESPECTACULOS_MAINTENANCE_SECRET;
  const supplied = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret ?? ''}`);
  if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return new Response('Não autorizado', { status: 401 });
  try { return Response.json(await maintainTicketing(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return new Response('Manutenção pendente', { status: 503 }); }
}
