import type { Order } from './types';
export const dateTime = (value: string) => new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Lisbon' }).format(new Date(value));
export const ticketLabels: Record<string, string> = { valid: 'Válido', used: 'Utilizado', refund_pending: 'Reembolso pendente', refunded: 'Reembolsado', void: 'Cancelado' };
export const paymentLabels: Record<string, string> = { creating: 'A preparar', pending: 'Pendente', succeeded: 'Confirmado', cancelled: 'Cancelado / não concluído', review: 'Revisão manual', requested: 'Pedido registado', failed: 'Falhado' };
export function checkoutState(order: Pick<Order, 'status' | 'financial_review_required' | 'expires_at'>, now: number) {
  if (order.financial_review_required || order.status === 'review') return { payable: false, message: 'A encomenda está em revisão manual. Aguarda o contacto do organizador.' };
  if (['paid', 'partially_refunded', 'refunded'].includes(order.status)) return { payable: false, message: 'Pagamento confirmado. Consulta os bilhetes e eventuais reembolsos na encomenda.' };
  if (order.status === 'cancelled') return { payable: false, message: 'Pagamento cancelado ou não concluído. Consulta a encomenda antes de fazer uma nova reserva.' };
  if (order.status === 'expired' || Date.parse(order.expires_at) <= now) return { payable: false, message: order.status === 'payment_pending' ? 'Prazo terminado. O pagamento está a ser reconciliado; não faças um novo pagamento.' : 'A reserva expirou. Volta ao evento para consultar a disponibilidade.' };
  if (order.status === 'payment_pending') return { payable: true, message: 'Pagamento pendente. Se já autorizaste o pagamento, aguarda a confirmação nesta encomenda.' };
  return { payable: order.status === 'reserved', message: 'Confirma os bilhetes e conclui a compra antes de terminar a reserva.' };
}
