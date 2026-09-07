import 'server-only';
import { enviarEmailSeguro } from '@/lib/email/send-secure';
export type NotificationKind = 'order_confirmation' | 'payment_confirmed' | 'tickets_issued' | 'cancellation' | 'refund';
export type Notification = { id: string; kind: NotificationKind; orderId: string; userId: string; email: string; eventName: string };
export interface NotificationTransport {
  /** Production transports must deduplicate on notification.id before retrying. */
  deliver(notification: Notification): Promise<'delivered' | 'deferred'>;
}
const subjects: Record<NotificationKind, string> = {
  order_confirmation: 'Reserva registada', payment_confirmed: 'Pagamento confirmado',
  tickets_issued: 'Os teus bilhetes estão disponíveis', cancellation: 'Cancelamento do espetáculo ou encomenda', refund: 'Reembolso confirmado',
};
/** Default deliberately performs no external I/O and never acknowledges delivery. */
export const deferredNotifications: NotificationTransport = { async deliver() { return 'deferred'; } };
/** Reuses existing infrastructure; not wired into maintenance until delivery deduplication is configured. */
export function existingEmailTransport(origin: string): NotificationTransport {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') throw new Error('Origem de email inválida.');
  return { async deliver(n) {
    const result = await enviarEmailSeguro({ to: n.email, userId: n.userId, subject: subjects[n.kind], templateUsed: `espectaculos:${n.kind}`,
      text: `${subjects[n.kind]} · ${n.eventName}\nConsulta os detalhes na tua área pessoal: ${url.origin}/espectaculos/encomendas/${encodeURIComponent(n.orderId)}\n${n.kind === 'order_confirmation' ? 'A reserva ainda não confirma o pagamento ou a emissão de bilhetes.' : 'Consulta o estado atual antes de te deslocares ao evento.'}` });
    return result.sucesso ? 'delivered' : 'deferred';
  } };
}
