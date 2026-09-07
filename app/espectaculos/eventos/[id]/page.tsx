import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TicketSelector } from '@/components/espectaculos/ticket-selector';
import { dateTime } from '@/lib/espectaculos/presentation';
import type { Availability } from '@/lib/espectaculos/types';
export const dynamic = 'force-dynamic';
type PublicEvent = { id: number; name: string; description: string | null; place: string | null; organizer: string | null; status: string; sessions: { id: number; starts_at: string; ends_at: string | null; status: string; place: string | null }[] };
export default async function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params; if (!/^[1-9][0-9]*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
 // Dynamic server render: capture one request-time snapshot for session states.
 // eslint-disable-next-line react-hooks/purity
 const observedAt = Date.now();
 const db = await createClient();
 const { data, error } = await db.rpc('event_public_detail', { p_event: Number(id) });
 if (error) throw new Error('Não foi possível carregar o espetáculo.');
 if (!data) notFound(); const event = data as PublicEvent;
 const sessions = await Promise.all(event.sessions.map(async session => {
  const { data, error } = await db.rpc('event_public_availability', { p_session: session.id });
  return { session, types: (data ?? []) as Availability[], error };
 }));
 return <main className="mx-auto max-w-3xl space-y-6 p-5"><nav className="flex flex-wrap justify-between gap-3"><Link href="/espectaculos">← Espetáculos</Link><Link href="/espectaculos/encomendas">As minhas encomendas</Link></nav>
 <h1 className="text-3xl font-bold">{event.name}</h1><p>Organização: {event.organizer || 'A confirmar'}</p><p>{event.place || 'Consulta o local de cada sessão'}</p>
 {event.status === 'cancelado' && <p role="status" className="rounded bg-red-50 p-4 font-bold">Evento cancelado. Se já compraste bilhetes, consulta a tua encomenda.</p>}
 <p className="whitespace-pre-line leading-7">{event.description || 'Descrição a disponibilizar pelo organizador.'}</p><h2 className="text-2xl font-bold">Sessões e bilhetes</h2>
 {!sessions.length && <p>Ainda não existem sessões anunciadas.</p>}
 {sessions.map(({ session, types, error }) => {
 const ended = session.status === 'finished' || (session.ends_at !== null && Date.parse(session.ends_at) <= observedAt);
 const cancelled = event.status === 'cancelado' || session.status === 'cancelled';
 const sold = session.status === 'sold_out' || (types.length > 0 && types.every(t => t.available <= 0));
 return <section key={session.id} className="space-y-3 rounded-xl border p-4"><h3 className="text-lg font-bold">{dateTime(session.starts_at)} · Hora de Lisboa</h3><p>{session.place || 'Local a confirmar'}</p>
 {cancelled ? <p>Cancelada</p> : ended ? <p>Terminada</p> : error ? <p role="alert">Disponibilidade temporariamente indisponível.</p> : <>{sold && <p className="font-bold">Esgotada</p>}<TicketSelector sessionId={session.id} types={types} /></>}</section>;
 })}</main>;
}
