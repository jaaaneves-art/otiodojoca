import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Fase 7 — manutenção com provider ATIVO (stripeConfigured() === true), a exercitar
// o ramo de reconciliação de runMaintenance que a Fase 5/6 não cobria: as três
// filas (event_payments / event_refunds / event_payment_events), next_reconcile_at,
// attempts, backoff exponencial, resiliência do lote a falha transitória, e o
// contrato de lease/mutex. Sem contacto com a Stripe: cliente e SDK são duplos.
vi.mock('server-only', () => ({}));
vi.mock('./notification-worker', () => ({
  processNotifications: async () => ({ claimed: 0, delivered: 0, deferred: 0, failed: 0, leaseLost: 0 }),
}));

const s = vi.hoisted(() => ({
  claim: vi.fn(),
  rpc: vi.fn(),
  lists: {} as Record<string, { data: unknown[]; error: unknown }>,
  singles: vi.fn(),
  updates: [] as { table: string; patch: Record<string, unknown>; id?: unknown }[],
  disputeRetrieve: vi.fn(),
  intentRetrieve: vi.fn(),
}));

function builder(table: string) {
  const b: Record<string, unknown> = {};
  const chain = () => b;
  b.select = chain; b.in = chain; b.lte = chain; b.order = chain;
  let eqPair: [string, unknown] | undefined;
  b.eq = (col: string, val: unknown) => { eqPair = [col, val]; return b; };
  b.maybeSingle = async () => s.singles(table, eqPair);
  b.single = async () => s.singles(table, eqPair);
  b.limit = async () => s.lists[table] ?? { data: [], error: null };
  b.update = (patch: Record<string, unknown>) => {
    const rec: { table: string; patch: Record<string, unknown>; id?: unknown } = { table, patch };
    s.updates.push(rec);
    return { eq: async (_c: string, v: unknown) => { rec.id = v; return { error: null }; } };
  };
  return b;
}
const db = {
  rpc: (name: string, args: unknown) => {
    if (name === 'event_maintenance_claim') return s.claim();
    return s.rpc(name, args);
  },
  from: (table: string) => builder(table),
};
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db }));
vi.mock('stripe', () => ({
  default: class {
    paymentIntents = { retrieve: s.intentRetrieve, create: vi.fn(), cancel: vi.fn() };
    refunds = { retrieve: vi.fn(), create: vi.fn() };
    disputes = { retrieve: s.disputeRetrieve };
  },
}));

import { maintainTicketing } from './reconciliation';

const LEASE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const soon = () => new Date(Date.now() + 600000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  s.updates.length = 0;
  s.lists = {};
  vi.stubEnv('ESPECTACULOS_STRIPE_ENABLED', 'true');
  vi.stubEnv('ESPECTACULOS_STRIPE_MODE', 'test');
  vi.stubEnv('ESPECTACULOS_STRIPE_SECRET_KEY', 'sk_test_fixture');
  vi.stubEnv('NEXT_PUBLIC_ESPECTACULOS_STRIPE_KEY', 'pk_test_fixture');
  s.claim.mockResolvedValue({ data: LEASE, error: null });
  s.rpc.mockResolvedValue({ data: 0, error: null }); // event_expire_reservations, bind/settle, release
  s.singles.mockResolvedValue({ data: null, error: null });
  s.disputeRetrieve.mockResolvedValue({ payment_intent: 'pi_x' });
});
afterEach(() => vi.unstubAllEnvs());

describe('manutenção com provider ativo', () => {
  it('drena as três filas com LIMIT e liberta sempre o lease', async () => {
    s.lists['event_payment_events'] = { data: [{ id: 'ev1', event_type: 'charge.dispute.created', object_id: 'dp1', attempts: 0 }], error: null };
    s.lists['event_refunds'] = { data: [{ id: 're1', reconcile_attempts: 0 }], error: null };
    s.lists['event_payments'] = { data: [{ id: 'pay1', order_id: 'ord1', reconcile_attempts: 0 }], error: null };
    s.singles.mockImplementation(async (table: string) => {
      if (table === 'event_refunds') return { data: { id: 're1', status: 'succeeded' }, error: null };
      if (table === 'event_orders') return { data: { expires_at: soon() }, error: null };
      if (table === 'event_payments') return { data: { id: 'pay1', order_id: 'ord1', amount_cents: 1000, provider_intent_id: 'pi_pay1', created_at: new Date().toISOString() }, error: null };
      return { data: null, error: null };
    });
    s.intentRetrieve.mockResolvedValue({ id: 'pi_pay1', status: 'succeeded', amount: 1000, amount_received: 1000, currency: 'eur', livemode: false, metadata: { otj_module: 'espectaculos', otj_payment_id: 'pay1', otj_order_id: 'ord1' }, transfer_data: { destination: 'acct_x' } });

    const result = await maintainTicketing();

    expect(result.busy).toBe(false);
    expect(result).toMatchObject({ events: 1, refunds: 1, payments: 1, pendingReview: 0 });
    expect(s.rpc).toHaveBeenCalledWith('event_maintenance_release', { p_token: LEASE });
    expect(s.rpc).toHaveBeenCalledWith('event_settle_payment', expect.objectContaining({ p_status: 'succeeded' }));
  });

  it('escreve next_reconcile_at com backoff exponencial e incrementa a contagem certa por tabela', async () => {
    s.lists['event_payment_events'] = { data: [{ id: 'ev1', event_type: 'charge.dispute.created', object_id: 'dp1', attempts: 0 }], error: null };
    s.lists['event_refunds'] = { data: [{ id: 're1', reconcile_attempts: 3 }], error: null };
    s.singles.mockImplementation(async (table: string) =>
      table === 'event_refunds' ? { data: { id: 're1', status: 'failed' }, error: null } : { data: null, error: null });

    const before = Date.now();
    await maintainTicketing();

    const ev = s.updates.find(u => u.table === 'event_payment_events')!;
    const re = s.updates.find(u => u.table === 'event_refunds')!;
    // event_payment_events usa a coluna `attempts`; as outras `reconcile_attempts`.
    expect(ev.patch).toMatchObject({ attempts: 1 });
    expect(re.patch).toMatchObject({ reconcile_attempts: 4 });
    // Backoff: 30s * 2**(attempts-1). Primeira tentativa ~30s; 4ª tentativa ~240s.
    const evDelay = Date.parse(ev.patch.next_reconcile_at as string) - before;
    const reDelay = Date.parse(re.patch.next_reconcile_at as string) - before;
    expect(evDelay).toBeGreaterThanOrEqual(29000);
    expect(evDelay).toBeLessThan(45000);
    expect(reDelay).toBeGreaterThanOrEqual(235000);
    expect(reDelay).toBeLessThan(260000);
  });

  it('uma falha transitória não aborta o lote e conta como pendingReview; o lease é sempre libertado', async () => {
    s.lists['event_payment_events'] = { data: [
      { id: 'ev_bad', event_type: 'charge.dispute.created', object_id: 'dp_bad', attempts: 0 },
      { id: 'ev_ok', event_type: 'charge.dispute.created', object_id: 'dp_ok', attempts: 0 },
    ], error: null };
    s.disputeRetrieve.mockRejectedValueOnce(new Error('stripe 503 transitório')).mockResolvedValue({ payment_intent: 'pi_ok' });

    const result = await maintainTicketing();

    expect(result).toMatchObject({ events: 1, pendingReview: 1 });
    // Ambas as linhas foram reagendadas para retry antes de correr (idempotência do lote).
    expect(s.updates.filter(u => u.table === 'event_payment_events' && 'next_reconcile_at' in u.patch)).toHaveLength(2);
    expect(s.rpc).toHaveBeenCalledWith('event_maintenance_release', { p_token: LEASE });
  });

  it('sem lease (mutex ocupado) não corre trabalho nem tenta libertar', async () => {
    s.claim.mockResolvedValue({ data: null, error: null });
    const fromSpy = vi.spyOn(db, 'from');

    const result = await maintainTicketing();

    expect(result.busy).toBe(true);
    expect(fromSpy).not.toHaveBeenCalled();
    expect(s.rpc).not.toHaveBeenCalledWith('event_maintenance_release', expect.anything());
    fromSpy.mockRestore();
  });

  it('falha ao expirar reservas é visível e mesmo assim liberta o lease', async () => {
    s.rpc.mockImplementation(async (name: string) =>
      name === 'event_expire_reservations' ? { data: null, error: new Error('bd indisponível') } : { data: 0, error: null });

    await expect(maintainTicketing()).rejects.toThrow('Manutenção pendente');
    expect(s.rpc).toHaveBeenCalledWith('event_maintenance_release', { p_token: LEASE });
  });
});
