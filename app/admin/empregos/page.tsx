import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  rejeitarVagaAdmin,
  reativarVagaAdmin,
  ignorarDenuncia,
  rejeitarVagaEResolverDenuncia,
} from './actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MOTIVO_LABEL: Record<string, string> = {
  spam: 'Spam ou publicidade',
  fraude: 'Suspeita de fraude/burla',
  discriminatorio: 'Conteúdo discriminatório',
  conteudo_inadequado: 'Conteúdo inadequado',
  outro: 'Outro motivo',
};

const ESTADO_VAGA_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  pendente: 'Pendente',
  publicada: 'Publicada',
  pausada: 'Pausada',
  fechada: 'Fechada',
  rejeitada: 'Rejeitada',
};

const ESTADO_VAGA_COR: Record<string, string> = {
  rascunho: 'bg-terra-100 text-terra-700',
  pendente: 'bg-amber-100 text-amber-700',
  publicada: 'bg-green-100 text-green-700',
  pausada: 'bg-amber-100 text-amber-700',
  fechada: 'bg-terra-200 text-terra-600',
  rejeitada: 'bg-red-100 text-red-700',
};

const ESTADOS_VAGA_FILTRO = ['todas', 'publicada', 'pausada', 'fechada', 'rejeitada'] as const;
type EstadoVagaFiltro = (typeof ESTADOS_VAGA_FILTRO)[number];

// PostgREST às vezes devolve uma relação embutida (FK) como objeto
// único, às vezes como array de um elemento -- mesmo problema já
// documentado em app/admin/entidades/page.tsx.
function unwrap<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return (rel[0] as T) ?? null;
  return (rel as T) ?? null;
}

export default async function AdminEmpregosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado: estadoParam } = await searchParams;
  const estadoVaga: EstadoVagaFiltro = (ESTADOS_VAGA_FILTRO as readonly string[]).includes(
    estadoParam ?? ''
  )
    ? (estadoParam as EstadoVagaFiltro)
    : 'todas';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Mesmo mecanismo de RBAC do resto do projeto -- profiles.role, não
  // profiles.is_admin (ver nota em app/admin/entidades/page.tsx).
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
          <p className="mt-2 text-sm text-terra-600">Esta página é só para administradores.</p>
        </div>
      </div>
    );
  }

  type EmpresaRel = { nome_empresa: string };
  type JobRel = { id: number; titulo: string; empregos_empresas: EmpresaRel | EmpresaRel[] | null };
  type ReporterRel = { username: string; display_name: string | null };

  type DenunciaRow = {
    id: number;
    motivo: string;
    mensagem: string | null;
    created_at: string;
    jobs: JobRel | JobRel[] | null;
    reporter: ReporterRel | ReporterRel[] | null;
  };

  const { data: denunciasBrutas } = await supabase
    .from('job_reports')
    .select(
      `id, motivo, mensagem, created_at,
       jobs ( id, titulo, empregos_empresas ( nome_empresa ) ),
       reporter:profiles!job_reports_reporter_id_fkey ( username, display_name )`
    )
    .eq('estado', 'pendente')
    .order('created_at', { ascending: true });

  const denuncias = ((denunciasBrutas ?? []) as DenunciaRow[]).map((d) => {
    const job = unwrap<JobRel>(d.jobs);
    return {
      ...d,
      job,
      empresa: job ? unwrap<EmpresaRel>(job.empregos_empresas) : null,
      reporter: unwrap<ReporterRel>(d.reporter),
    };
  });

  type VagaRow = {
    id: number;
    titulo: string;
    estado: string;
    created_at: string;
    data_publicacao: string | null;
    empregos_empresas: EmpresaRel | EmpresaRel[] | null;
  };

  let vagasQuery = supabase
    .from('jobs')
    .select('id, titulo, estado, created_at, data_publicacao, empregos_empresas ( nome_empresa )')
    .order('created_at', { ascending: false });

  if (estadoVaga !== 'todas') {
    vagasQuery = vagasQuery.eq('estado', estadoVaga);
  }

  const { data: vagasBrutas } = await vagasQuery;

  const vagas = ((vagasBrutas ?? []) as VagaRow[]).map((v) => ({
    ...v,
    empresa: unwrap<EmpresaRel>(v.empregos_empresas),
  }));

  function estadoVagaHref(valor: EstadoVagaFiltro) {
    return valor === 'todas' ? '/admin/empregos' : `/admin/empregos?estado=${valor}`;
  }

  return (
    <div className="min-h-screen bg-terra-50">
      <div className="mx-auto max-w-4xl p-6 py-16">
        <Link href="/admin/entidades" className="text-sm text-terra-600 hover:text-terra-800">
          ← Pedidos de entidades
        </Link>
        <h1 className="mb-1 mt-1 text-2xl font-bold text-terra-900">Moderação — Empregos</h1>
        <p className="mb-8 text-sm text-terra-600">
          Denúncias de vagas e gestão direta do estado de qualquer vaga do módulo Empregos.
          Rejeitar uma vaga esconde-a de imediato do público; reativar repõe-na como pausada — a
          empresa tem de a republicar, nunca fica visível outra vez sem confirmação dela.
        </p>

        <h2 className="mb-3 text-lg font-semibold text-terra-900">
          Denúncias pendentes {denuncias.length > 0 && `(${denuncias.length})`}
        </h2>

        {denuncias.length === 0 && (
          <p className="mb-8 rounded-lg border border-terra-200 bg-white p-6 text-center text-sm text-terra-600">
            Sem denúncias pendentes de momento.
          </p>
        )}

        {denuncias.length > 0 && (
          <div className="mb-10 space-y-4">
            {denuncias.map((d) => (
              <Card key={d.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span>{d.job?.titulo ?? 'Vaga removida'}</span>
                    <span className="whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      {MOTIVO_LABEL[d.motivo] ?? d.motivo}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {d.empresa?.nome_empresa ?? 'Empresa'} · denunciada por{' '}
                    {d.reporter?.display_name || d.reporter?.username || 'utilizador'} em{' '}
                    {new Date(d.created_at).toLocaleDateString('pt-PT')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-terra-700">
                  {d.mensagem && (
                    <p className="rounded-lg bg-terra-50 p-3 italic text-terra-600">
                      &ldquo;{d.mensagem}&rdquo;
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {d.job && (
                      <Link
                        href={`/empregos/${d.job.id}`}
                        className="text-xs text-terra-600 underline self-center"
                      >
                        Ver vaga
                      </Link>
                    )}
                    <form action={rejeitarVagaEResolverDenuncia.bind(null, d.id, d.job?.id ?? 0)}>
                      <Button type="submit" size="sm" variant="outline">
                        Rejeitar vaga
                      </Button>
                    </form>
                    <form action={ignorarDenuncia.bind(null, d.id)}>
                      <Button type="submit" size="sm" variant="outline">
                        Ignorar denúncia
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <h2 className="mb-3 text-lg font-semibold text-terra-900">Todas as vagas</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {ESTADOS_VAGA_FILTRO.map((e) => (
            <Link
              key={e}
              href={estadoVagaHref(e)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                estadoVaga === e
                  ? 'border-terra-600 bg-terra-600 text-white'
                  : 'border-terra-200 bg-white text-terra-700 hover:border-terra-400'
              }`}
            >
              {e === 'todas' ? 'Todas' : ESTADO_VAGA_LABEL[e]}
            </Link>
          ))}
        </div>

        {vagas.length === 0 && (
          <p className="rounded-lg border border-terra-200 bg-white p-6 text-center text-sm text-terra-600">
            Nenhuma vaga neste estado.
          </p>
        )}

        <div className="space-y-2">
          {vagas.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-terra-200 bg-white p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-terra-900">{v.titulo}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_VAGA_COR[v.estado] ?? ''}`}>
                    {ESTADO_VAGA_LABEL[v.estado] ?? v.estado}
                  </span>
                </div>
                <p className="text-xs text-terra-500">
                  {v.empresa?.nome_empresa ?? 'Empresa'} · criada em{' '}
                  {new Date(v.created_at).toLocaleDateString('pt-PT')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {v.estado === 'publicada' && (
                  <Link href={`/empregos/${v.id}`} className="self-center text-xs text-terra-600 underline">
                    Ver vaga
                  </Link>
                )}
                {v.estado === 'rejeitada' ? (
                  <form action={reativarVagaAdmin.bind(null, v.id)}>
                    <Button type="submit" size="sm" variant="outline">
                      Reativar (repor como pausada)
                    </Button>
                  </form>
                ) : (
                  <form action={rejeitarVagaAdmin.bind(null, v.id)}>
                    <Button type="submit" size="sm" variant="outline">
                      Rejeitar vaga
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
