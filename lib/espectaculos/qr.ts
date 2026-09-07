import 'server-only';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/supabase/admin';
import { ticketToken, tokenHash } from './qr-crypto';
export function qrConfigured() { return Buffer.byteLength(process.env.ESPECTACULOS_QR_KEY_V1 ?? '') >= 32; }
export async function renderTicketQR(ticketId: string, buyerId: string, version: number) {
  const key = process.env[`ESPECTACULOS_QR_KEY_V${version}`];
  if (!key) return null;
  const token = ticketToken(ticketId, version, key);
  const { error } = await createAdminClient().rpc('event_set_ticket_hash', { p_ticket: ticketId, p_buyer: buyerId, p_hash: tokenHash(token) });
  if (error) throw new Error('Não foi possível preparar o QR.');
  return QRCode.toDataURL(token, { width: 320, margin: 4, errorCorrectionLevel: 'M' });
}
