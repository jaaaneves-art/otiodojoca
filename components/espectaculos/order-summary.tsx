import { money, type Order } from '@/lib/espectaculos/types';
import { dateTime } from '@/lib/espectaculos/presentation';
export function OrderSummary({ order, items }: { order: Order; items: { id: string; name: string; quantity: number; unit_price_cents: number }[] }) {
  return <section aria-label="Resumo da encomenda" className="space-y-3 rounded-xl border p-4"><h2 className="text-xl font-bold">{order.purchase_snapshot.event_name}</h2><p>{dateTime(order.purchase_snapshot.session_starts_at)} · Hora de Lisboa</p><p>{order.purchase_snapshot.place || 'Local a confirmar'}</p>
    <ul>{items.map(i => <li className="flex justify-between gap-3 py-2" key={i.id}><span>{i.quantity} × {i.name}<small className="block">{money(i.unit_price_cents)} por bilhete</small></span><span>{money(i.quantity * i.unit_price_cents)}</span></li>)}</ul>
    <dl className="border-t pt-3"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(order.subtotal_cents)}</dd></div><div className="flex justify-between"><dt>Taxas adicionais ao comprador</dt><dd>{money(order.total_cents - order.subtotal_cents)}</dd></div><div className="flex justify-between text-lg font-bold"><dt>Total</dt><dd>{money(order.total_cents)}</dd></div></dl><p className="text-sm text-slate-600">Esta encomenda corresponde a uma única sessão.</p></section>;
}
