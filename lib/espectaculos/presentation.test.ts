import { describe, expect, it } from 'vitest';
import { checkoutState } from './presentation';
const now = Date.parse('2026-09-07T12:00:00Z');
const base = { status: 'reserved', financial_review_required: false, expires_at: '2026-09-07T12:15:00Z' };
describe('checkout eligibility and financial feedback', () => {
 it('allows a current reservation', () => expect(checkoutState(base, now).payable).toBe(true));
 it.each(['paid', 'partially_refunded', 'refunded', 'review', 'cancelled', 'expired'])('blocks %s even with future expiry', status => expect(checkoutState({ ...base, status }, now).payable).toBe(false));
 it('review overrides a current reservation', () => expect(checkoutState({ ...base, financial_review_required: true }, now).payable).toBe(false));
 it('expires exactly at deadline', () => expect(checkoutState(base, Date.parse(base.expires_at)).payable).toBe(false));
 it('pending expiry asks for reconciliation', () => expect(checkoutState({ ...base, status: 'payment_pending' }, now + 900000).message).toContain('reconciliado'));
 it('confirmed payment does not become expired', () => expect(checkoutState({ ...base, status: 'paid' }, now + 900000).message).toContain('confirmado'));
});
