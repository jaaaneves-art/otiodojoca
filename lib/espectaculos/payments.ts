import 'server-only';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Payment } from './types';
import { paymentParams } from './stripe-params';

export function stripeConfigured() {
  // This release deliberately cannot initiate live payments.
  return (process.env.ESPECTACULOS_STRIPE_MODE ?? 'test') === 'test' && process.env.ESPECTACULOS_STRIPE_ENABLED === 'true' &&
    process.env.ESPECTACULOS_STRIPE_SECRET_KEY?.startsWith('sk_test_') === true &&
    process.env.NEXT_PUBLIC_ESPECTACULOS_STRIPE_KEY?.startsWith('pk_test_') === true;
}
export function stripeClient() {
  if (!stripeConfigured()) throw new Error('Pagamentos online ainda indisponíveis.');
  return new Stripe(process.env.ESPECTACULOS_STRIPE_SECRET_KEY!, { maxNetworkRetries: 0, timeout: 3000 });
}
async function checked(error: unknown) { if (error) throw new Error('Não foi possível atualizar o pagamento.'); }
export async function loadPayment(id: string): Promise<Payment> {
  const { data, error } = await createAdminClient().from('event_payments').select('*').eq('id', id).single();
  if (error || !data) throw new Error('Pagamento indisponível.');
  return data as Payment;
}
export async function ensureIntent(p: Payment) {
  const stripe = stripeClient();
  if (p.provider_intent_id) return stripe.paymentIntents.retrieve(p.provider_intent_id);
  // Stripe idempotency keys may be pruned after 24 h. Never retry an uncertain
  // creation outside a conservative 23 h window: manual reconciliation required.
  if (Date.now() - Date.parse(p.created_at) > 23 * 3600000) throw new Error('Pagamento requer reconciliação manual.');
  const intent = await stripe.paymentIntents.create(paymentParams(p), { idempotencyKey: `otj-payment-${p.id}` });
  const { error } = await createAdminClient().rpc('event_bind_payment', { p_payment: p.id, p_intent: intent.id });
  await checked(error);
  return intent;
}
export async function settleIntent(intent: Stripe.PaymentIntent) {
  if (intent.metadata.otj_module !== 'espectaculos') return;
  const p = await loadPayment(intent.metadata.otj_payment_id);
  if (p.order_id !== intent.metadata.otj_order_id || intent.livemode) throw new Error('Pagamento não corresponde.');
  const db = createAdminClient();
  const bound = await db.rpc('event_bind_payment', { p_payment: p.id, p_intent: intent.id });
  await checked(bound.error);
  if (intent.status === 'succeeded' && intent.amount_received !== p.amount_cents) throw new Error('Montante recebido não corresponde.');
  const destination = intent.transfer_data?.destination;
  const { error } = await db.rpc('event_settle_payment', { p_payment: p.id, p_intent: intent.id, p_status: intent.status,
    p_amount: intent.amount, p_currency: intent.currency, p_destination: typeof destination === 'string' ? destination : destination?.id,
    p_fee: intent.application_fee_amount ?? 0 });
  await checked(error);
}
export async function settleRefund(refund: Stripe.Refund) {
  if (refund.metadata?.otj_module !== 'espectaculos') return;
  const { error } = await createAdminClient().rpc('event_settle_refund', { p_refund: refund.metadata.otj_refund_id,
    p_provider_id: refund.id, p_intent: typeof refund.payment_intent === 'string' ? refund.payment_intent : refund.payment_intent?.id,
    p_amount: refund.amount, p_status: refund.status });
  await checked(error);
}
export async function sendRefund(id: string) {
  const db = createAdminClient();
  const { data: r, error } = await db.from('event_refunds').select('*').eq('id', id).single();
  if (error || !r) throw new Error('Reembolso indisponível.');
  if (r.status === 'succeeded' || r.status === 'failed') return;
  const stripe = stripeClient();
  if (r.provider_refund_id) { await settleRefund(await stripe.refunds.retrieve(r.provider_refund_id)); return; }
  if (Date.now() - Date.parse(r.created_at) > 23 * 3600000) throw new Error('Reembolso requer reconciliação manual.');
  const p = await loadPayment(r.payment_id);
  if (!p.provider_intent_id) throw new Error('Pagamento por reconciliar.');
  const refund = await stripe.refunds.create({ payment_intent: p.provider_intent_id, amount: r.amount_cents,
    reverse_transfer: r.reverse_transfer, refund_application_fee: r.refund_application_fee,
    metadata: { otj_module: 'espectaculos', otj_refund_id: r.id } }, { idempotencyKey: `otj-refund-${r.id}` });
  await settleRefund(refund);
}
