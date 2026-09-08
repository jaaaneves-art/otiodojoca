import { beforeEach, describe, expect, it, vi } from 'vitest';

// Fase 6 — cobertura ao nível da rota do webhook Stripe (secção 4 do plano).
// Sem contacto com a Stripe: `constructEvent`, `processProviderEvent` e o cliente
// admin do Supabase são todos duplos. Valida a verificação de assinatura, os
// limites de tamanho, a recusa de âmbito live/connected, o desconhecimento de
// eventos, a idempotência e o comportamento recuperável perante falha temporária.
vi.mock('server-only', () => ({}));

const h = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  processProviderEvent: vi.fn(),
  configured: vi.fn(),
  upsert: vi.fn(),
  receipt: vi.fn(),
}));

vi.mock('@/lib/espectaculos/payments', () => ({
  stripeConfigured: h.configured,
  stripeClient: () => ({ webhooks: { constructEvent: h.constructEvent } }),
}));
vi.mock('@/lib/espectaculos/reconciliation', () => ({ processProviderEvent: h.processProviderEvent }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      upsert: (...args: unknown[]) => { h.upsert(...args); return { error: null }; },
      select: () => ({ eq: () => ({ single: h.receipt }) }),
    }),
  }),
}));

import { POST } from './route';

const WEBHOOK_SECRET = 'whsec_fixture_only';

function post(body: string, headers: Record<string, string> = {}) {
  return POST(new Request('http://localhost/api/espectaculos/payments/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 't=1,v1=fixture', ...headers },
    body,
  }));
}

const providerEvent = (over: Record<string, unknown> = {}) => ({
  id: 'evt_fixture', type: 'payment_intent.succeeded', livemode: false, account: null,
  data: { object: { id: 'pi_fixture' } }, ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('ESPECTACULOS_STRIPE_WEBHOOK_SECRET', WEBHOOK_SECRET);
  h.configured.mockReturnValue(true);
  h.constructEvent.mockReturnValue(providerEvent());
  h.receipt.mockResolvedValue({ data: { status: 'pending' }, error: null });
  h.processProviderEvent.mockResolvedValue(undefined);
});

describe('Stripe webhook route', () => {
  it('accepts a correctly signed event and delegates to reconciliation', async () => {
    const res = await post('{"ok":true}');
    expect(res.status).toBe(204);
    expect(h.processProviderEvent).toHaveBeenCalledWith('evt_fixture', 'payment_intent.succeeded', 'pi_fixture');
  });

  it('rejects an invalid signature without any processing', async () => {
    h.constructEvent.mockImplementation(() => { throw new Error('signature mismatch'); });
    const res = await post('{}');
    expect(res.status).toBe(400);
    expect(h.processProviderEvent).not.toHaveBeenCalled();
    expect(await res.text()).not.toContain(WEBHOOK_SECRET);
  });

  it('refuses an oversized body by declared content-length', async () => {
    const res = await post('{}', { 'content-length': String(262144 + 1) });
    expect(res.status).toBe(413);
    expect(h.constructEvent).not.toHaveBeenCalled();
  });

  it('refuses an oversized body by actual byte length', async () => {
    const res = await post('x'.repeat(262144 + 10));
    expect(res.status).toBe(413);
    expect(h.constructEvent).not.toHaveBeenCalled();
  });

  it('is unavailable when Stripe is not configured', async () => {
    h.configured.mockReturnValue(false);
    expect((await post('{}')).status).toBe(503);
  });

  it('is unavailable when the webhook secret is absent', async () => {
    vi.stubEnv('ESPECTACULOS_STRIPE_WEBHOOK_SECRET', '');
    expect((await post('{}')).status).toBe(503);
  });

  it('refuses a live-mode event even under a test configuration', async () => {
    h.constructEvent.mockReturnValue(providerEvent({ livemode: true }));
    const res = await post('{}');
    expect(res.status).toBe(400);
    expect(h.processProviderEvent).not.toHaveBeenCalled();
  });

  it('refuses a connected-account event', async () => {
    h.constructEvent.mockReturnValue(providerEvent({ account: 'acct_other' }));
    expect((await post('{}')).status).toBe(400);
    expect(h.processProviderEvent).not.toHaveBeenCalled();
  });

  it('acknowledges an unknown event type without processing it', async () => {
    h.constructEvent.mockReturnValue(providerEvent({ type: 'customer.created' }));
    const res = await post('{}');
    expect(res.status).toBe(204);
    expect(h.processProviderEvent).not.toHaveBeenCalled();
  });

  it('is idempotent: an already-processed event is not processed again', async () => {
    h.receipt.mockResolvedValue({ data: { status: 'processed' }, error: null });
    const res = await post('{}');
    expect(res.status).toBe(204);
    expect(h.processProviderEvent).not.toHaveBeenCalled();
  });

  it('leaves a transient failure recoverable for Stripe to retry', async () => {
    h.processProviderEvent.mockRejectedValue(new Error('db unavailable secret payload'));
    const res = await post('{}');
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain('secret payload');
  });

  it('never echoes the webhook secret in any response body', async () => {
    const bodies = await Promise.all([
      post('{}').then(r => r.text()),
      (h.constructEvent.mockImplementationOnce(() => { throw new Error(WEBHOOK_SECRET); }), post('{}').then(r => r.text())),
    ]);
    for (const body of bodies) expect(body).not.toContain(WEBHOOK_SECRET);
  });
});
