import 'server-only';
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
  const deadline = Date.now() + 40000;
  const db = createAdminClient();
  const { data: expiredItems, error } = await db.rpc('event_expire_reservations');
  if (error) throw new Error('Não foi possível expirar reservas.');
  const { count, error: notificationError } = await db.from('event_notification_outbox').select('id', { count: 'exact', head: true }).is('delivered_at', null);
  if (notificationError) throw new Error('Fila de notificações indisponível.');
  const result = { expiredItems: expiredItems ?? 0, payments: 0, refunds: 0, events: 0, pendingReview: 0, notificationsDeferred: count ?? 0, interrupted: false };
  if (!stripeConfigured()) return result;
  const stripe = stripeClient();
  const { data: orders, error: orderError } = await db.from('event_orders').select('id').eq('status', 'payment_pending').lt('expires_at', new Date().toISOString()).order('expires_at').limit(25);
  if (orderError) throw new Error('Reconciliação indisponível.');
  for (const o of orders ?? []) {
    if (Date.now() >= deadline) { result.interrupted = true; break; }
    try {
      const { data: row, error: readError } = await db.from('event_payments').select('id').eq('order_id', o.id).single();
      if (readError || !row) throw new Error('Pagamento indisponível.');
      let intent = await ensureIntent(await loadPayment(row.id));
      if (!['succeeded', 'canceled'].includes(intent.status)) {
        try { intent = await stripe.paymentIntents.cancel(intent.id, {}, { idempotencyKey: `otj-expire-${row.id}` }); }
        catch { intent = await stripe.paymentIntents.retrieve(intent.id); }
      }
      await settleIntent(intent);
      if (!['succeeded', 'canceled'].includes(intent.status)) result.pendingReview++;
      result.payments++;
    } catch { result.pendingReview++; }
  }
  const { data: refunds, error: refundError } = await db.from('event_refunds').select('id').in('status', ['requested', 'pending']).order('created_at').limit(25);
  if (refundError) throw new Error('Reconciliação indisponível.');
  for (const refund of refunds ?? []) { if (Date.now() >= deadline) { result.interrupted = true; break; } try { await sendRefund(refund.id); result.refunds++; } catch { result.pendingReview++; } }
  const { data: events, error: eventError } = await db.from('event_payment_events').select('id,event_type,object_id').eq('status', 'pending').order('received_at').limit(25);
  if (eventError) throw new Error('Reconciliação indisponível.');
  for (const e of events ?? []) { if (Date.now() >= deadline) { result.interrupted = true; break; } try { await processProviderEvent(e.id, e.event_type, e.object_id); result.events++; } catch { result.pendingReview++; } }
  return result;
}
