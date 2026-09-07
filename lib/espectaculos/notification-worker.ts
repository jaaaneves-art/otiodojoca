import 'server-only';
import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { deferredNotifications, type NotificationTransport, type NotificationKind } from './notifications';
import { notificationTemplate } from './notification-templates';
import { logOperation } from './operation-log';
export type OutboxClaim = { id: string; order_id: string; kind: NotificationKind; deduplication_key: string; lease_token: string; attempts: number };
export interface OutboxStore {
 claim(maxAttempts: number): Promise<OutboxClaim | null>;
 renew(item: OutboxClaim): Promise<boolean>;
 recipient(orderId: string): Promise<{ userId: string; email: string; eventName: string } | null>;
 finish(item: OutboxClaim, outcome: 'delivered' | 'deferred' | 'failed', error: string | null, maxAttempts: number): Promise<boolean>;
}
export function notificationStore(): OutboxStore {
 const db = createAdminClient();
 return {
  async claim(maxAttempts) { const { data, error } = await db.rpc('event_notification_claim', { p_limit: 1, p_max_attempts: maxAttempts, p_lease_seconds: 60 }); if (error) throw new Error('claim_failed'); return data?.[0] ?? null; },
  async renew(item) { const { data, error } = await db.rpc('event_notification_renew', { p_id: item.id, p_token: item.lease_token, p_seconds: 60 }); if (error) throw new Error('renew_failed'); return data === true; },
  async recipient(orderId) {
   const { data: order, error } = await db.from('event_orders').select('buyer_id,purchase_snapshot').eq('id', orderId).single();
   if (error || !order) return null;
   // Authoritative auth record only; never accept addresses from the outbox or caller.
   const { data, error: userError } = await db.auth.admin.getUserById(order.buyer_id);
   if (userError || !data.user?.email || !data.user.email_confirmed_at) return null;
   return { userId: order.buyer_id, email: data.user.email, eventName: String(order.purchase_snapshot.event_name ?? 'Espetáculo') };
  },
  async finish(item, outcome, errorCode, maxAttempts) { const { data, error } = await db.rpc('event_notification_finish', { p_id: item.id, p_token: item.lease_token, p_outcome: outcome, p_error: errorCode, p_max_attempts: maxAttempts }); if (error) throw new Error('finish_failed'); return data === true; },
 };
}
export function notificationAttempts() {
 const n = Number(process.env.ESPECTACULOS_NOTIFICATION_MAX_ATTEMPTS ?? 5);
 return Number.isInteger(n) && n >= 1 && n <= 20 ? n : 5;
}
export async function processNotifications(options: { store?: OutboxStore; transport?: NotificationTransport; deadline?: number; limit?: number; maxAttempts?: number; origin?: string; requestId?: string } = {}) {
 const store = options.store ?? notificationStore(); const transport = options.transport ?? deferredNotifications;
 const deadline = options.deadline ?? Date.now() + 10000; const maxAttempts = options.maxAttempts ?? notificationAttempts();
 if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) throw new Error('Configuração inválida.');
 const requestId = options.requestId ?? randomUUID();
 const metrics = { claimed: 0, delivered: 0, deferred: 0, failed: 0, leaseLost: 0 };
 for (let i = 0; i < Math.min(10, Math.max(0, options.limit ?? 5)) && Date.now() + 1000 < deadline; i++) {
  const item = await store.claim(maxAttempts); if (!item) break; metrics.claimed++;
  const started = Date.now(); let outcome: 'delivered' | 'deferred' | 'failed' = 'deferred'; let errorCode: string | null = 'transport_unavailable';
  const signal = AbortSignal.timeout(Math.max(1, Math.min(15000, deadline - Date.now())));
  try {
   if (!(await store.renew(item))) { metrics.leaseLost++; logOperation({ operation: 'notification', outcome: 'lease_lost', requestId, entityId: item.id, durationMs: Date.now()-started, retryCount: item.attempts }); continue; }
   // No-op doesn't need to fetch personal data or manufacture a configured origin.
   if (transport.mode !== 'noop') {
    const recipient = await store.recipient(item.order_id);
    if (!recipient) { outcome = 'failed'; errorCode = 'recipient_unavailable'; }
    else {
     signal.throwIfAborted();
     const template = notificationTemplate(item.kind, item.order_id, recipient.eventName, options.origin ?? '');
     outcome = await transport.deliver({ id: item.id, kind: item.kind, orderId: item.order_id, ...recipient, deduplicationKey: item.deduplication_key, ...template }, signal);
     errorCode = outcome === 'delivered' ? null : 'transport_unavailable';
    }
   }
  } catch { outcome = 'failed'; errorCode = 'delivery_failed'; }
  // Fenced acknowledgement: an expired worker cannot overwrite a new worker.
  if (!(await store.finish(item, outcome, errorCode, maxAttempts))) { metrics.leaseLost++; continue; }
  metrics[outcome]++;
  logOperation({ operation: 'notification', outcome: outcome === 'delivered' ? 'success' : outcome, requestId, entityId: item.id, durationMs: Date.now()-started, retryCount: item.attempts });
 }
 return metrics;
}
