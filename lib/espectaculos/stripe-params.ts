import type Stripe from 'stripe';
import type { Payment } from './types';
export function paymentParams(p: Payment): Stripe.PaymentIntentCreateParams {
  // Explicit allowlist: actual availability must still be verified on the account.
  const allowed = new Set(['card', 'mb_way', 'multibanco']);
  if (!p.payment_methods.length || p.payment_methods.some(m => !allowed.has(m))) throw new Error('Métodos de pagamento por validar.');
  if (!Number.isSafeInteger(p.amount_cents) || p.amount_cents < 50 || p.amount_cents > 99999999) throw new Error('Montante não suportado pelo checkout.');
  return { amount: p.amount_cents, currency: 'eur', capture_method: 'automatic',
    payment_method_types: p.payment_methods as NonNullable<Stripe.PaymentIntentCreateParams['payment_method_types']>,
    transfer_data: { destination: p.destination_account }, application_fee_amount: p.application_fee_cents,
    metadata: { otj_module: 'espectaculos', otj_payment_id: p.id, otj_order_id: p.order_id } };
}
