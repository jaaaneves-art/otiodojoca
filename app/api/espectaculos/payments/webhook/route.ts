import { createAdminClient } from '@/lib/supabase/admin';
import { stripeClient, stripeConfigured } from '@/lib/espectaculos/payments';
import { processProviderEvent } from '@/lib/espectaculos/reconciliation';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const secret = process.env.ESPECTACULOS_STRIPE_WEBHOOK_SECRET;
  if (!stripeConfigured() || !secret) return new Response('Indisponível', { status: 503 });
  if (Number(request.headers.get('content-length') ?? 0) > 262144) return new Response('Pedido demasiado grande', { status: 413 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 262144) return new Response('Pedido demasiado grande', { status: 413 });
  let event;
  try { event = stripeClient().webhooks.constructEvent(raw, request.headers.get('stripe-signature') ?? '', secret); }
  catch { return new Response('Assinatura inválida', { status: 400 }); }
  // Destination charges emit platform events. Never accept connected-account or live events here.
  if (event.livemode || event.account) return new Response('Âmbito inválido', { status: 400 });
  if (!['payment_intent.', 'refund.', 'charge.dispute.'].some(prefix => event.type.startsWith(prefix))) return new Response(null, { status: 204 });
  const db = createAdminClient();
  if (!('id' in event.data.object) || typeof event.data.object.id !== 'string') return new Response('Objeto inválido', { status: 400 });
  const objectId = event.data.object.id;
  const { error } = await db.from('event_payment_events').upsert({ id: event.id, event_type: event.type, object_id: objectId }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) return new Response('Receção indisponível', { status: 503 });
  const { data: receipt, error: receiptError } = await db.from('event_payment_events').select('status').eq('id', event.id).single();
  if (receiptError) return new Response('Receção indisponível', { status: 503 });
  if (receipt.status === 'processed') return new Response(null, { status: 204 });
  try { await processProviderEvent(event.id, event.type, objectId); return new Response(null, { status: 204 }); }
  catch { return new Response('Processamento pendente', { status: 503 }); }
}
