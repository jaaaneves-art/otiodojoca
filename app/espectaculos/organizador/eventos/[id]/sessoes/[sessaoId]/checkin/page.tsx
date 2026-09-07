import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireEventRole } from '@/lib/espectaculos/permissions';
import { positiveId } from '@/lib/espectaculos/validation';
import { CheckinScanner } from '@/components/espectaculos/checkin-scanner';
export const dynamic = 'force-dynamic';
export default async function Checkin({ params }: { params: Promise<{ id: string; sessaoId: string }> }) {
  const { id, sessaoId } = await params; const { db, event } = await requireEventRole(positiveId(id), ['owner', 'admin', 'checkin']);
  const { data: session } = await db.from('event_sessions').select('id,starts_at').eq('id', positiveId(sessaoId)).eq('evento_id', event.id).maybeSingle();
  if (!session) notFound();
  return <main className="mx-auto max-w-2xl space-y-5 p-6"><Link href={`/espectaculos/organizador/eventos/${event.id}`}>← Espetáculo</Link><h1 className="text-2xl font-bold">Check-in · {event.nome}</h1><p>{new Date(session.starts_at).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}</p><CheckinScanner sessionId={session.id} /></main>;
}
