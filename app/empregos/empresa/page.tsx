import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { publicarVaga, pausarVaga, fecharVaga, reabrirVaga } from "@/app/empregos/empresa/vagas/actions";

const ESTADO_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  pendente: "Pendente",
  publicada: "Publicada",
  pausada: "Pausada",
  fechada: "Fechada",
  rejeitada: "Rejeitada",
};

const ESTADO_COR: Record<string, string> = {
  rascunho: "bg-terra-100 text-terra-700",
  pendente: "bg-amber-100 text-amber-700",
  publicada: "bg-green-100 text-green-700",
  pausada: "bg-amber-100 text-amber-700",
  fechada: "bg-terra-200 text-terra-600",
  rejeitada: "bg-red-100 text-red-700",
};

export default async function PainelEmpresaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: empresa } = await supabase
    .from("empregos_empresas")
    .select("id, nome_empresa, estado, website, descricao")
    .eq("profile_id", user.id)
    .maybeSingle();

  // Sem empresa ainda: ver se há um pedido em curso (pendente/rejeitado)
  // ou se o utilizador ainda nem chegou a pedir nada.
  if (!empresa) {
    const { data: pedido } = await supabase
      .from("entidade_pedidos")
      .select("estado, created_at, resolvido_em, mensagem")
      .eq("profile_id", user.id)
      .eq("tipo_entidade", "empregador")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (
      <div className="min-h-screen bg-terra-50">
        <div className="mx-auto max-w-md p-6 py-16 text-center">
          <h1 className="text-xl font-semibold text-terra-900">Painel de empresa</h1>
          {!pedido && (
            <>
              <p className="mt-2 text-sm text-terra-600">
                Ainda não registaste a tua empresa no Empregos.
              </p>
              <Button asChild className="mt-6">
                <Link href="/parceiros/pedido/empregador">Registar empresa</Link>
              </Button>
            </>
          )}
          {pedido?.estado === "pendente" && (
            <p className="mt-2 text-sm text-terra-600">
              O teu pedido de registo está em análise pela nossa equipa. Volta
              a esta página depois de seres notificado.
            </p>
          )}
          {pedido?.estado === "rejeitado" && (
            <>
              <p className="mt-2 text-sm text-terra-600">
                O teu pedido de registo não foi aprovado
                {pedido.resolvido_em
                  ? ` (${new Date(pedido.resolvido_em).toLocaleDateString("pt-PT")})`
                  : ""}
                .
              </p>
              {pedido.mensagem && (
                <p className="mt-2 rounded-lg bg-terra-100 p-3 text-xs italic text-terra-600">
                  &ldquo;{pedido.mensagem}&rdquo;
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  type JobRow = {
    id: number;
    titulo: string;
    estado: string;
    created_at: string;
    data_publicacao: string | null;
  };

  const { data: jobsData } = await supabase
    .from("jobs")
    .select("id, titulo, estado, created_at, data_publicacao")
    .eq("empresa_id", empresa.id)
    .order("created_at", { ascending: false });

  const jobs = (jobsData ?? []) as JobRow[];

  const jobIds = jobs.map((j) => j.id);
  const candidaturaCounts: Record<number, number> = {};
  if (jobIds.length > 0) {
    const { data: candidaturasData } = await supabase
      .from("applications")
      .select("job_id")
      .in("job_id", jobIds)
      .neq("estado", "retirada");

    ((candidaturasData ?? []) as { job_id: number }[]).forEach((c) => {
      candidaturaCounts[c.job_id] = (candidaturaCounts[c.job_id] ?? 0) + 1;
    });
  }

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-terra-800">Painel de empresa — Empregos</h1>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{empresa.nome_empresa}</CardTitle>
            <CardDescription>
              Estado da empresa:{" "}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COR[empresa.estado] ?? ""}`}>
                {ESTADO_LABEL[empresa.estado] ?? empresa.estado}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>

        {empresa.estado !== "aprovado" && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            A tua empresa não está atualmente aprovada — não podes publicar
            novas vagas enquanto este estado não mudar. Contacta a equipa se
            achas que isto é um engano.
          </p>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-terra-900">As tuas vagas</h2>
          {empresa.estado === "aprovado" && (
            <Button asChild size="sm">
              <Link href="/empregos/empresa/vagas/nova">Nova vaga</Link>
            </Button>
          )}
        </div>

        {jobs.length === 0 && (
          <p className="rounded-lg border border-terra-200 bg-white p-6 text-center text-sm text-terra-600">
            Ainda não publicaste nenhuma vaga.
          </p>
        )}

        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-terra-900">{job.titulo}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COR[job.estado] ?? ""}`}>
                      {ESTADO_LABEL[job.estado] ?? job.estado}
                    </span>
                  </div>
                  <p className="text-xs text-terra-500">
                    Criada em {new Date(job.created_at).toLocaleDateString("pt-PT")}
                    {job.data_publicacao &&
                      ` · publicada em ${new Date(job.data_publicacao).toLocaleDateString("pt-PT")}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/empregos/empresa/vagas/${job.id}/editar`}>Editar</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/empregos/empresa/vagas/${job.id}/candidaturas`}>
                      Candidaturas{candidaturaCounts[job.id] ? ` (${candidaturaCounts[job.id]})` : ""}
                    </Link>
                  </Button>
                  {(job.estado === "rascunho" || job.estado === "pausada") && (
                    <form action={publicarVaga.bind(null, job.id)}>
                      <Button type="submit" size="sm">
                        Publicar
                      </Button>
                    </form>
                  )}
                  {job.estado === "publicada" && (
                    <form action={pausarVaga.bind(null, job.id)}>
                      <Button type="submit" size="sm" variant="outline">
                        Pausar
                      </Button>
                    </form>
                  )}
                  {(job.estado === "publicada" || job.estado === "pausada") && (
                    <form action={fecharVaga.bind(null, job.id)}>
                      <Button type="submit" size="sm" variant="outline">
                        Fechar
                      </Button>
                    </form>
                  )}
                  {job.estado === "fechada" && (
                    <form action={reabrirVaga.bind(null, job.id)}>
                      <Button type="submit" size="sm" variant="outline">
                        Reabrir
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
