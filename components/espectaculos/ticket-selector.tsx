import { randomUUID } from 'node:crypto';
import { reserveOrder } from '@/lib/espectaculos/actions';
import { money, type Availability } from '@/lib/espectaculos/types';
export function TicketSelector({ sessionId, types }: { sessionId: number; types: Availability[] }) {
  const open = types.some(t => t.sales_open && t.available > 0);
  return <form action={reserveOrder} className="space-y-3 rounded-xl border p-4">
    <input type="hidden" name="session_id" value={sessionId} />
    <input type="hidden" name="idempotency_key" value={randomUUID()} />
    {types.map(t => <label key={t.ticket_type_id} className="flex items-center justify-between gap-3 text-sm">
      <span>{t.name} · {money(t.price_cents)}<small className="block text-slate-500">{t.sales_open ? `${t.available} disponíveis` : 'Vendas encerradas'}</small></span>
      <input aria-label={`Quantidade de ${t.name}`} className="w-16 rounded border p-2" type="number" name={`quantity_${t.ticket_type_id}`} min="0" max={Math.min(t.available, t.max_per_order ?? 100, 100)} step="1" defaultValue="0" disabled={!t.sales_open || t.available < 1} />
    </label>)}
    {types.length === 0 && <p>Sem tipos de bilhete disponíveis.</p>}
    <p className="text-xs text-slate-500">Reserva de 15 minutos. É necessário iniciar sessão. A disponibilidade é confirmada ao reservar.</p>
    <button className="rounded bg-rose-600 px-4 py-2 font-semibold text-white disabled:opacity-40" disabled={!open}>Reservar bilhetes</button>
  </form>;
}
