import 'server-only';
import { notFound } from 'next/navigation';
import { signedIn } from './permissions';
import { uuid } from './validation';
import type { Order } from './types';
export async function ownOrder(id: string) {
  const { db, user } = await signedIn();
  const { data, error } = await db.from('event_orders').select('id,buyer_id,session_id,entidade_id,status,total_cents,expires_at,financial_review_required,purchase_snapshot').eq('id', uuid(id)).eq('buyer_id', user.id).maybeSingle();
  if (error || !data) notFound();
  return { db, user, order: data as Order, observedAt: Date.now() };
}
