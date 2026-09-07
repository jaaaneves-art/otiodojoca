import 'server-only';
import { createClient } from '@/lib/supabase/server';
export async function signedIn() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) throw new Error('Inicia sessão para continuar.');
  return { db, user };
}
export async function requireEventRole(eventId: number, roles: string[]) {
  const { db, user } = await signedIn();
  const { data: event, error } = await db.from('eventos').select('id,nome,entidade_organizadora_id').eq('id', eventId).single();
  if (error || !event) throw new Error('Espetáculo indisponível.');
  const { data: member } = await db.from('event_organization_members').select('role').eq('entidade_id', event.entidade_organizadora_id).eq('user_id', user.id).maybeSingle();
  if (!member || !roles.includes(member.role)) throw new Error('Sem permissão para esta operação.');
  return { db, user, event };
}
