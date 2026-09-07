import Link from 'next/link';
import { requireEventRole } from '@/lib/espectaculos/permissions';
import { positiveId } from '@/lib/espectaculos/validation';
import { dateTime } from '@/lib/espectaculos/presentation';
export const dynamic = 'force-dynamic';
type Row = { session_id: number; starts_at: string; status: string; review_orders: number; pending_payments: number; pending_refunds: number; failed_notifications: number; deferred_notifications: number };
export default async function Operations({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params; const { db,event }=await requireEventRole(positiveId(id),['owner','admin','finance']);
 const { data,error }=await db.rpc('event_operational_summary',{ p_event:event.id });
 if(error) throw new Error('Estado operacional indisponível.');
 const rows=(data??[]) as Row[];
 return <main className="mx-auto max-w-3xl space-y-5 p-5"><Link href={`/espectaculos/organizador/eventos/${event.id}`}>← Espetáculo</Link><h1 className="text-2xl font-bold">Estado operacional · {event.nome}</h1><p>Notificações sem envio real nesta fase. Os estados adiados ou falhados exigem acompanhamento antes de ligar um transporte.</p><Link className="inline-block rounded border p-3 focus-visible:ring-2" href={`/espectaculos/organizador/eventos/${event.id}/encomendas`}>Consultar encomendas e revisões</Link>
 {!rows.length && <p>Sem sessões para acompanhar.</p>}{rows.map(r=><section className="space-y-2 rounded border p-4" key={r.session_id}><h2 className="text-lg font-bold">{dateTime(r.starts_at)}</h2>{r.status==='cancelled'&&<p className="font-semibold text-red-800">Sessão cancelada</p>}<dl className="grid grid-cols-2 gap-3"><dt>Encomendas em revisão</dt><dd>{r.review_orders}</dd><dt>Pagamentos pendentes</dt><dd>{r.pending_payments}</dd><dt>Reembolsos pendentes / em revisão</dt><dd>{r.pending_refunds}</dd><dt>Notificações falhadas</dt><dd>{r.failed_notifications}</dd><dt>Notificações adiadas</dt><dd>{r.deferred_notifications}</dd></dl></section>)}</main>;
}
