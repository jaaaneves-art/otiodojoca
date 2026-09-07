import { createHash, createHmac } from 'node:crypto';
// A keyed PRF produces 256 unpredictable bits per random ticket UUID/version.
// Only the SHA-256 hash is persisted. The key is never stored in the database.
export function ticketToken(id: string, version: number, key: string): string {
  if (Buffer.byteLength(key) < 32) throw new Error('Chave QR indisponível.');
  return `otj1_${createHmac('sha256', key).update(`espectaculos:ticket:${version}:${id}`).digest('base64url')}`;
}
export function tokenHash(token: string) {
  if (!/^otj1_[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('QR inválido.');
  return createHash('sha256').update(token).digest('hex');
}
