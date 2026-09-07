import { describe, expect, it } from 'vitest';
import { cents, positiveId, selection, uuid } from './validation';
describe('ticket input validation', () => {
  it('parses money without floating-point rounding', () => { expect(cents('12,30')).toBe(1230); expect(cents('0.29')).toBe(29); expect(cents('0')).toBe(0); });
  it.each(['1.001', '-1', 'Infinity', '1e3', '', '21474836.48'])('rejects invalid price %s', value => expect(() => cents(value)).toThrow());
  it.each([0, -1, 0.5, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid id %s', value => expect(() => positiveId(value)).toThrow());
  it('rejects malformed UUID', () => expect(() => uuid('123')).toThrow());
  it('accepts multi-type selection and ignores unselected types', () => { const f = new FormData(); f.set('quantity_1', '2'); f.set('quantity_2', '0'); expect(selection(f)).toEqual([{ ticket_type_id: 1, quantity: 2 }]); });
  it('rejects fractional quantity and oversized cart', () => { const f = new FormData(); f.set('quantity_1', '1.5'); expect(() => selection(f)).toThrow(); f.set('quantity_1', '100'); f.set('quantity_2', '1'); expect(() => selection(f)).toThrow(); });
});
