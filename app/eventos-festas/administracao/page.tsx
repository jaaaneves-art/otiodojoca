import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { moderar } from '../actions';
import type { SearchParams } from '@/lib/eventos-festas/types';
export const metadata = { title: 'Moderação', robots: { index: false } };
type Queue = { empresas: { id: number; nome: string; descricao: string; estado: string; pais_codigo: string; localidade: string }[]; pedidos: { id: number; nome: string; mensagem: string; profile_id: string }[] };
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const db = await createClient(); const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login?next=/eventos-festas/administracao');
  const { data: admin } = await db.rpc('eventos_festas_admin'); if (!admin) notFound();
  const { data, error } = await db.rpc('eventos_festas_moderacao'); const q = await searchParams;
  if (error) return <p role="alert">Não foi possível carregar a moderação.</p>;
  const queue = data as Queue;
  return <><h1 className="text-3xl font-bold">Moderação de Eventos & Festas</h1><p className="mt-3">Aprovar uma presença publica a entidade pendente. A verificação profissional mantém-se independente.</p>{q.erro && <p role="alert" className="mt-4 text-red-700">A operação não foi concluída. Reveja o estado atual.</p>}{q.guardado && <p role="status" className="mt-4 text-emerald-700">Decisão guardada.</p>}
    <h2 className="mt-8 text-xl font-semibold">Presenças</h2><div className="mt-4 space-y-4">{queue.empresas.map(e => <article key={e.id} className="rounded-xl border bg-white p-5"><h3 className="font-semibold">{e.nome} · {e.estado}</h3><p className="my-2">{e.localidade} · {e.pais_codigo}</p><p className="whitespace-pre-line">{e.descricao}</p><form action={moderar} className="mt-4 flex gap-3"><input type="hidden" name="entidade_id" value={e.id} /><button name="decisao" value="ativo" className="rounded-lg bg-emerald-800 px-4 py-2 text-white">Aprovar publicação</button><button name="decisao" value="suspenso" className="rounded-lg border border-red-800 px-4 py-2 text-red-800">Suspender</button></form></article>)}</div>
    <h2 className="mt-8 text-xl font-semibold">Pedidos de acesso</h2><p className="mt-2 text-sm">Confirme a ligação do requerente à entidade antes de conceder o papel de gestor.</p><div className="mt-4 space-y-4">{queue.pedidos.map(p => <article key={p.id} className="rounded-xl border bg-white p-5"><h3 className="font-semibold">{p.nome}</h3><p className="my-2 whitespace-pre-line">{p.mensagem}</p><p className="break-all text-xs text-stone-500">Referência interna do requerente: {p.profile_id}</p><form action={moderar} className="mt-4 flex gap-3"><input type="hidden" name="pedido_id" value={p.id} /><button name="decisao" value="aprovar" className="rounded-lg bg-emerald-800 px-4 py-2 text-white">Conceder acesso</button><button name="decisao" value="rejeitar" className="rounded-lg border px-4 py-2">Rejeitar</button></form></article>)}</div>
  </>;
}
