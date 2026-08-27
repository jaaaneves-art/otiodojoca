import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { aprovarPedido, rejeitarPedido } from './actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TIPO_LABEL: Record<string, string> = {
  municipio: 'Município',
  freguesia: 'Freguesia',
  organismo_publico: 'Organismo público',
  outro: 'Outra entidade',
};

const ESTADOS = ['pendente', 'aprovado', 'rejeitado'] as const;
type Estado = (typeof ESTADOS)[number];

// PostgREST às vezes devolve uma relação embutida (FK) como objeto único,
// às vezes como array de um elemento, consoante consiga inferir a
// cardinalidade — mesmo problema já documentado em
// lib/alojamento/actions.ts (normalizarLocalizacao). Normalizamos aqui
// para sempre objeto ou null.
function unwrap<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return (rel[0] as T) ?? null;
  return (rel as T) ?? null;
}

export default async function AdminEntidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado: estadoParam } = await searchParams;
  const estado: Estado = (ESTADOS as readonly string[]).includes(estadoParam ?? '')
    ? (estadoParam as Estado)
    : 'pendente';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // profiles.role (enum), não profiles.is_admin — ver LACUNA-07 /
  // migration 20260827100000_entidade_pedidos_rls_usar_role.sql: o
  // projeto tinha os dois mecanismos de RBAC em paralelo, esta página
  // (e a RLS de entidade_pedidos por trás dela) foram alinhados com o
  // que já era usado pelo resto do projeto (reservas_alojamento, MFA).
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-terra-50">
        <div className="mx-auto max-w-md p-6 py-16 text-center">
          <h1 className="text-xl font-semibold text-terra-900">Acesso restrito</h1>
          <p className="mt-2 text-sm text-terra-600">
            Esta página é só para administradores.
          </p>
        </div>
      </div>
    );
  }

  const { data: pedidosBrutos, error } = await supabase
    .from('entidade_pedidos')
    .select(
      `id, tipo_entidade, nome_entidade, categoria_id, localizacao_texto,
       contacto_email, contacto_telefone, cargo, nipc, mensagem, estado,
       created_at, resolvido_em,
       municipios ( nome, distrito_regiao ),
       freguesias ( nome, municipio ),
       categorias_entidade ( nome ),
       requerente:profiles!entidade_pedidos_profile_id_fkey ( username, display_name, email )`
    )
    .eq('estado', estado)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar pedidos: ${error.message}`);
  }

  const pedidos = (pedidosBrutos ?? []) as any[];

  return (
    <div className="min-h-screen bg-terra-50">
      <div className="mx-auto max-w-3xl p-6 py-16">
        <h1 className="mb-1 text-2xl font-bold text-terra-900">
          Pedidos de entidades parceiras
        </h1>
        <p className="mb-6 text-sm text-terra-600">
          Revê e aprova ou rejeita pedidos de associação de entidades
          parceiras. A ligação a um registo em <code>entidades</code> (novo
          ou existente) continua a ser feita à parte, depois de aprovado.
        </p>

        <div className="mb-6 flex gap-2">
          {ESTADOS.map((e) => (
            <Link
              key={e}
              href={`/admin/entidades?estado=${e}`}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                estado === e
                  ? 'border-terra-600 bg-terra-600 text-white'
                  : 'border-terra-200 bg-white text-terra-700 hover:border-terra-400'
              }`}
            >
              {e === 'pendente' ? 'Pendentes' : e === 'aprovado' ? 'Aprovados' : 'Rejeitados'}
            </Link>
          ))}
        </div>

        {pedidos.length === 0 && (
          <p className="rounded-lg border border-terra-200 bg-white p-6 text-center text-sm text-terra-600">
            Nenhum pedido {estado === 'pendente' ? 'pendente' : estado} de momento.
          </p>
        )}

        <div className="space-y-4">
          {pedidos.map((p) => {
            const municipio = unwrap<{ nome: string; distrito_regiao: string }>(p.municipios);
            const freguesia = unwrap<{ nome: string; municipio: string }>(p.freguesias);
            const categoria = unwrap<{ nome: string }>(p.categorias_entidade);
            const requerente = unwrap<{
              username: string;
              display_name: string | null;
              email: string | null;
            }>(p.requerente);

            const localizacao = freguesia
              ? `${freguesia.nome} (${freguesia.municipio})`
              : municipio
                ? `${municipio.nome} — ${municipio.distrito_regiao}`
                : p.localizacao_texto || null;

            return (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span>{p.nome_entidade}</span>
                    <span className="whitespace-nowrap rounded-full bg-terra-100 px-2 py-0.5 text-xs font-medium text-terra-700">
                      {TIPO_LABEL[p.tipo_entidade] ?? p.tipo_entidade}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Pedido de{' '}
                    {requerente?.display_name || requerente?.username || 'utilizador'}
                    {p.cargo ? ` (${p.cargo})` : ''} em{' '}
                    {new Date(p.created_at).toLocaleDateString('pt-PT')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-terra-700">
                  {localizacao && <p>📍 {localizacao}</p>}
                  {categoria?.nome && <p>🏷️ {categoria.nome}</p>}
                  {p.nipc && <p>NIPC: {p.nipc}</p>}
                  {p.contacto_email && <p>✉️ {p.contacto_email}</p>}
                  {p.contacto_telefone && <p>📞 {p.contacto_telefone}</p>}
                  {requerente?.email && requerente.email !== p.contacto_email && (
                    <p className="text-xs text-terra-500">
                      Conta: {requerente.email}
                    </p>
                  )}
                  {p.mensagem && (
                    <p className="rounded-lg bg-terra-50 p-3 italic text-terra-600">
                      &ldquo;{p.mensagem}&rdquo;
                    </p>
                  )}

                  {estado === 'pendente' ? (
                    <div className="flex gap-2 pt-2">
                      <form action={aprovarPedido.bind(null, p.id)}>
                        <Button type="submit" size="sm">
                          Aprovar
                        </Button>
                      </form>
                      <form action={rejeitarPedido.bind(null, p.id)}>
                        <Button type="submit" size="sm" variant="outline">
                          Rejeitar
                        </Button>
                      </form>
                    </div>
                  ) : (
                    p.resolvido_em && (
                      <p className="pt-2 text-xs text-terra-500">
                        Resolvido em {new Date(p.resolvido_em).toLocaleDateString('pt-PT')}
                      </p>
                    )
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
