import { randomUUID } from 'node:crypto';
import { requestRefund } from '@/lib/espectaculos/actions';
export function RefundForm({ orderId, tickets, reviewWithoutTickets }: { orderId: string; tickets: { id: string; status: string }[]; reviewWithoutTickets: boolean }) {
  return <form action={requestRefund} className="space-y-4 rounded border p-4">
    <h2 className="text-xl font-bold">Pedir reembolso</h2><input type="hidden" name="order_id" value={orderId} /><input type="hidden" name="idempotency_key" value={randomUUID()} />
    <p>Seleciona todos os bilhetes válidos para um reembolso total, ou apenas os bilhetes a reembolsar. O stock não será reposto.</p>
    {tickets.map((t, i) => <label className="block" key={t.id}><input type="checkbox" name="ticket_id" value={t.id} disabled={t.status !== 'valid'} /> Bilhete {i + 1} · {t.status}</label>)}
    {reviewWithoutTickets && <p>Pagamento em análise sem emissão: será pedido o reembolso integral.</p>}
    <label className="block">Motivo<textarea name="reason" required minLength={1} maxLength={500} className="block w-full rounded border p-2" /></label>
    <label className="block"><input name="reverse_transfer" type="checkbox" /> Reverter a transferência para o organizador</label>
    <label className="block"><input name="refund_fee" type="checkbox" /> Devolver a comissão OTJ</label>
    <p className="text-sm">Estas opções afetam quem suporta o reembolso. Confirma as condições financeiras antes de submeter. A conclusão depende da confirmação do prestador.</p>
    <button className="rounded bg-rose-600 px-4 py-2 text-white">Registar pedido de reembolso</button>
  </form>;
}
