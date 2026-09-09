import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), email: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => mocks }));
vi.mock('./notification-worker', () => ({ processNotifications: async () => ({ claimed: 0, delivered: 0, deferred: 0, failed: 0, leaseLost: 0 }) }));
vi.mock('@/lib/email/send-secure', () => ({ enviarEmailSeguro: mocks.email }));
import { stripeConfigured } from './payments';
import { maintainTicketing } from './reconciliation';
import { deferredNotifications, existingEmailTransport } from './notifications';
beforeEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); vi.stubEnv('ESPECTACULOS_STRIPE_ENABLED', 'false'); });
describe('explicit Stripe mode', () => {
 it.each(['live', 'invalid'])('rejects %s mode even with test keys', mode => {
  vi.stubEnv('ESPECTACULOS_STRIPE_MODE', mode); vi.stubEnv('ESPECTACULOS_STRIPE_ENABLED', 'true');
  vi.stubEnv('ESPECTACULOS_STRIPE_SECRET_KEY', 'sk_test_fixture'); vi.stubEnv('NEXT_PUBLIC_ESPECTACULOS_STRIPE_KEY', 'pk_test_fixture');
  expect(stripeConfigured()).toBe(false);
 });
 it('accepts only enabled test configuration', () => {
  vi.stubEnv('ESPECTACULOS_STRIPE_MODE', 'test'); vi.stubEnv('ESPECTACULOS_STRIPE_ENABLED', 'true');
  vi.stubEnv('ESPECTACULOS_STRIPE_SECRET_KEY', 'sk_test_fixture'); vi.stubEnv('NEXT_PUBLIC_ESPECTACULOS_STRIPE_KEY', 'pk_test_fixture');
  expect(stripeConfigured()).toBe(true);
  vi.stubEnv('ESPECTACULOS_STRIPE_SECRET_KEY', 'sk_live_fixture'); expect(stripeConfigured()).toBe(false);
 });
});
describe('local operation without provider', () => {
 it('expires stock and reports deferred notifications without external payment calls', async () => {
  mocks.rpc.mockImplementation(async (name: string) => ({ data: name === 'event_maintenance_claim' ? '00000000-0000-4000-8000-000000000001' : 2, error: null }));
  mocks.from.mockReturnValue({ select: () => ({ is: async () => ({ count: 3, error: null }) }) });
  expect(await maintainTicketing()).toMatchObject({ expiredItems: 2, notifications: { claimed: 0 }, payments: 0 });
  expect(mocks.rpc).toHaveBeenCalledWith('event_expire_reservations');
  expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.email).not.toHaveBeenCalled();
 });
 it('fails visibly when expiration fails', async () => {
  mocks.rpc.mockResolvedValue({ error: new Error('fixture') });
  await expect(maintainTicketing()).rejects.toThrow('Manutenção indisponível');
 });
 it('default notification transport defers without acknowledging delivery', async () => {
  expect(await deferredNotifications.deliver({ deduplicationKey: 'fixture', subject: '', text: '', html: '', id: 'fixture', kind: 'tickets_issued', orderId: 'fixture', userId: 'fixture', email: 'buyer@example.invalid', eventName: 'Evento' })).toBe('deferred');
  expect(mocks.email).not.toHaveBeenCalled();
 });
 it('email adapter rejects an unsafe configured origin', () => expect(() => existingEmailTransport('http://example.invalid')).toThrow());
});
