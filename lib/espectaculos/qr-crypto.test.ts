import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { randomBytes, randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ticketToken, tokenHash } from './qr-crypto';
describe('ticket QR credentials', () => {
  it('is stable for reprinting but differs per ticket, key and version', () => {
    const key = randomBytes(32).toString('hex'), id = randomUUID(); const token = ticketToken(id, 1, key);
    expect(token).toBe(ticketToken(id, 1, key)); expect(token).not.toContain(id);
    expect(token).not.toBe(ticketToken(randomUUID(), 1, key)); expect(token).not.toBe(ticketToken(id, 2, key)); expect(token).not.toBe(ticketToken(id, 1, randomBytes(32).toString('hex')));
    expect(tokenHash(token)).toMatch(/^[a-f0-9]{64}$/);
  });
  it('encodes a credential into a real QR and decodes it with the scanner library', () => {
    const token = ticketToken(randomUUID(), 1, randomBytes(32).toString('hex'));
    const qr = QRCode.create(token, { errorCorrectionLevel: 'M' });
    const scale = 6, margin = 4, width = (qr.modules.size + margin * 2) * scale;
    const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
    for (let y = 0; y < qr.modules.size; y++) for (let x = 0; x < qr.modules.size; x++) {
      if (!qr.modules.get(y, x)) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const offset = (((y + margin) * scale + dy) * width + (x + margin) * scale + dx) * 4;
        pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0;
      }
    }
    expect(jsQR(pixels, width, width)?.data).toBe(token);
  });
  it('rejects weak keys and malformed QR payloads', () => { expect(() => ticketToken(randomUUID(), 1, '')).toThrow(); expect(() => tokenHash('https://example.invalid')).toThrow(); expect(() => tokenHash('123')).toThrow(); });
});
