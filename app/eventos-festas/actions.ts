'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { positiveInteger, profileData } from '@/lib/eventos-festas/validation';

export async function guardarEmpresa(form: FormData): Promise<{ error?: string; id?: number }> {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { error: 'A sessão expirou. Entre novamente.' };
  const rawId = form.get('entidade_id');
  const id = positiveInteger(rawId);
  if (rawId && !id) return { error: 'Entidade inválida.' };
  let input: ReturnType<typeof profileData>;
  try { input = profileData(form, process.env.NEXT_PUBLIC_SUPABASE_URL); } catch (error) { return { error: error instanceof Error ? error.message : 'Dados inválidos.' }; }
  const { data, error } = await db.rpc('eventos_festas_guardar', { p_entidade_id: id, p_dados: input.dados, p_servicos: input.servicos, p_tipos: input.tipos, p_submeter: form.get('intencao') === 'submeter' });
  if (error) return { error: ['22023', '23505', '42501'].includes(error.code) ? error.message : 'Não foi possível guardar. Confirme os dados e tente novamente.' };
  revalidatePath('/eventos-festas', 'layout');
  revalidatePath('/entidades', 'layout');
  return { id: Number(data) };
}
export async function pedirAcesso(form: FormData): Promise<{ error?: string; ok?: boolean }> {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { error: 'Entre na sua conta para pedir acesso.' };
  const slug = String(form.get('slug') ?? '').trim();
  const mensagem = String(form.get('mensagem') ?? '').trim();
  if (!/^[a-z0-9-]{1,250}$/.test(slug) || mensagem.length < 10 || mensagem.length > 2000) return { error: 'Indique o slug da entidade e explique a sua ligação (10 a 2000 caracteres).' };
  const { error } = await db.rpc('eventos_festas_pedir_acesso', { p_slug: slug, p_mensagem: mensagem });
  return error ? { error: 'Não foi possível enviar. Confirme que a entidade tem uma página pública.' } : { ok: true };
}
export async function moderar(form: FormData) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login?next=/eventos-festas/administracao');
  const { data: admin } = await db.rpc('eventos_festas_admin');
  if (!admin) redirect('/eventos-festas');
  const pedido = positiveInteger(form.get('pedido_id'));
  const entidade = positiveInteger(form.get('entidade_id'));
  const action = String(form.get('decisao'));
  if ((!pedido && !entidade) || !['ativo', 'suspenso', 'aprovar', 'rejeitar'].includes(action)) redirect('/eventos-festas/administracao?erro=1');
  const { error } = pedido
    ? await db.rpc('eventos_festas_resolver_acesso', { p_pedido_id: pedido, p_aprovar: action === 'aprovar' })
    : await db.rpc('eventos_festas_moderar', { p_entidade_id: entidade, p_estado: action });
  revalidatePath('/eventos-festas', 'layout');
  redirect(`/eventos-festas/administracao?${error ? 'erro' : 'guardado'}=1`);
}
