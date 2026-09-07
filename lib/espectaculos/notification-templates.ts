import { uuid } from './validation';
export type NotificationKind = 'order_confirmation' | 'payment_confirmed' | 'tickets_issued' | 'cancellation' | 'refund';
const copy: Record<NotificationKind, [string, string]> = {
 order_confirmation: ['Reserva registada', 'A tua reserva foi criada. Ainda não confirma pagamento nem emissão de bilhetes. Consulta o prazo e conclui a encomenda.'],
 payment_confirmed: ['Pagamento confirmado', 'O pagamento foi confirmado. Consulta o estado atual da encomenda e dos bilhetes.'],
 tickets_issued: ['Bilhetes disponíveis', 'Os bilhetes foram emitidos. Abre a tua área pessoal para consultar e imprimir cada bilhete.'],
 cancellation: ['Cancelamento', 'O espetáculo, a sessão ou a encomenda foi cancelado. Consulta a encomenda para acompanhar as condições e eventuais reembolsos. O cancelamento não confirma um reembolso.'],
 refund: ['Reembolso confirmado', 'Foi confirmado um reembolso. Consulta na encomenda o montante e os bilhetes abrangidos.'],
};
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export function notificationOrigin(origin: string) {
 const url = new URL(origin);
 if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname))) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Origem de notificações inválida.');
 return url.origin;
}
export function notificationTemplate(kind: NotificationKind, orderId: string, eventName: string, origin: string) {
 const [subject, message] = copy[kind];
 const link = `${notificationOrigin(origin)}/espectaculos/encomendas/${uuid(orderId)}`;
 const name = eventName.replace(/[\r\n\u0000-\u001f]/g, ' ').slice(0, 200);
 return { subject, text: `${subject} · ${name}\n${message}\n${link}`, html: `<h1>${escapeHtml(subject)}</h1><p>${escapeHtml(name)}</p><p>${escapeHtml(message)}</p><p><a href="${escapeHtml(link)}">Consultar encomenda</a></p>` };
}
