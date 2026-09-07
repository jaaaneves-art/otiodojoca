import 'server-only';
import { randomUUID } from 'node:crypto';
import { processNotifications } from './notification-worker';
import { logOperation } from './operation-log';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureIntent, loadPayment, sendRefund, settleIntent, settleRefund, stripeClient, stripeConfigured } from './payments';

export async function processProviderEvent(id: string, type: string, objectId: string) {
  const stripe = stripeClient();
  const db = createAdminClient();
  if (type.startsWith('payment_intent.')) {
    await settleIntent(await stripe.paymentIntents.retrieve(objectId));
  } else if (type.startsWith('refund.')) {
    const refund = await stripe.refunds.retrieve(objectId);
    if (refund.metadata?.otj_module === 'espectaculos') await settleRefund(refund);
    else if (refund.payment_intent) {
      const intentId = typeof refund.payment_intent === 'string' ? refund.payment_intent : refund.payment_intent.id;
      const { data: payment, error } = await db.from('event_payments').select('order_id').eq('provider_intent_id', intentId).maybeSingle();
      if (error) throw new Error('Reconciliação indisponível.');
      if (payment) {
        const result = await db.from('event_orders').update({ financial_review_required: true }).eq('id', payment.order_id);
        if (result.error) throw new Error('Reconciliação indisponível.');
      }
    }
  } else if (type.startsWith('charge.dispute.')) {
    const dispute = await stripe.disputes.retrieve(objectId);
    const intentId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent?.id;
    if (intentId) {
      const { data: payment, error } = await db.from('event_payments').select('order_id').eq('provider_intent_id', intentId).maybeSingle();
      if (error) throw new Error('Reconciliação indisponível.');
      if (payment) {
        const result = await db.from('event_orders').update({ financial_review_required: true }).eq('id', payment.order_id);
        if (result.error) throw new Error('Reconciliação indisponível.');
      }
    }
  }
  const { error } = await db.from('event_payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error('Reconciliação indisponível.');
}
export async function maintainTicketing() {
 const requestId = randomUUID(); const started = Date.now(); const deadline = started + 40000;
 const db = createAdminClient();
 const { data: lease, error } = await db.rpc('event_maintenance_claim');
 if (error) throw new Error('Manutenção indisponível.');
 if (!lease) { logOperation({ operation: 'maintenance', outcome: 'busy', requestId, durationMs: Date.now()-started }); return { requestId, busy: true }; }
 try {
  const result = await runMaintenance(deadline, requestId);
  logOperation({ operation: 'maintenance', outcome: 'success', requestId, durationMs: Date.now()-started });
  return { requestId, busy: false, durationMs: Date.now()-started, ...result };
 } catch {
  logOperation({ operation: 'maintenance', outcome: 'failed', requestId, durationMs: Date.now()-started });
  throw new Error('Manutenção pendente.');
 } finally { await db.rpc('event_maintenance_release', { p_token: lease }); }
}
async function runMaintenance(deadline: number, requestId: string) {
 const db = createAdminClient();
 const { data: expiredItems, error } = await db.rpc('event_expire_reservations');
 if (error) throw new Error('Não foi possível expirar reservas.');
 const notifications = await processNotifications({ deadline: Math.min(deadline, Date.now()+8000), requestId });
 const result = { expiredItems: expiredItems ?? 0, payments: 0, refunds: 0, events: 0, pendingReview: 0, notifications, interrupted: false };
 if (!stripeConfigured()) return result;
 // Every queue selects by next attempt, so repeated failures cannot starve newer work.
 const due = new Date().toISOString();
 const { data: payments, error: pe } = await db.from('event_payments').select('id,order_id,reconcile_attempts').in('status', ['creating','pending']).lte('next_reconcile_at',due).order('next_reconcile_at').limit(5);
 const { data: refunds, error: re } = await db.from('event_refunds').select('id,reconcile_attempts').in('status',['requested','pending']).lte('next_reconcile_at',due).order('next_reconcile_at').limit(5);
 const { data: events, error: ee } = await db.from('event_payment_events').select('id,event_type,object_id,attempts').eq('status','pending').lte('next_reconcile_at',due).order('next_reconcile_at').limit(5);
 if (pe || re || ee) throw new Error('Reconciliação indisponível.');
 const tasks = [
  ...(events ?? []).map(e => ({ table: 'event_payment_events', id: e.id, attempts: e.attempts, operation: 'webhook' as const, count: 'events' as const, run: () => processProviderEvent(e.id,e.event_type,e.object_id) })),
  ...(refunds ?? []).map(r => ({ table: 'event_refunds', id: r.id, attempts: r.reconcile_attempts, operation: 'refund' as const, count: 'refunds' as const, run: () => sendRefund(r.id) })),
  ...(payments ?? []).map(p => ({ table: 'event_payments', id: p.id, attempts: p.reconcile_attempts, operation: 'payment' as const, count: 'payments' as const, run: async () => {
   const { data: order, error } = await db.from('event_orders').select('expires_at').eq('id',p.order_id).single();
   if (error || !order) throw new Error('Pagamento indisponível.');
   let intent = await ensureIntent(await loadPayment(p.id));
   if (Date.parse(order.expires_at)<=Date.now() && !['succeeded','canceled'].includes(intent.status)) {
    try { intent = await stripeClient().paymentIntents.cancel(intent.id, {}, { idempotencyKey: `otj-expire-${p.id}` }); }
    catch { intent = await stripeClient().paymentIntents.retrieve(intent.id); }
   }
   await settleIntent(intent);
  } })),
 ];
 for (const task of tasks) {
  if (Date.now()+12000>=deadline) { result.interrupted=true; break; }
  const started=Date.now(); const attempts=task.attempts+1;
  const retryAt=new Date(Date.now()+Math.min(86400000,30000*2**Math.min(attempts-1,12))).toISOString();
  const { error } = await db.from(task.table).update({ next_reconcile_at:retryAt, [task.table==='event_payment_events'?'attempts':'reconcile_attempts']:attempts }).eq('id',task.id);
  if (error) throw new Error('Reconciliação indisponível.');
  try { await task.run(); result[task.count]++; logOperation({ operation: task.operation, outcome:'success',requestId,entityId:task.id,durationMs:Date.now()-started,retryCount:attempts }); }
  catch { result.pendingReview++; logOperation({ operation:task.operation,outcome:'failed',requestId,entityId:task.id,durationMs:Date.now()-started,retryCount:attempts }); }
 }
 return result;
}
