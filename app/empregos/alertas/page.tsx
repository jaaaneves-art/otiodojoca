import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { pausarAlerta, reativarAlerta, removerAlerta } from "./actions";

const MODALIDADE_LABEL: Record<string, string> = {
  presencial: "Presencial",
  remoto: "Remoto",
  hibrido: "Híbrido",
};

function unwrap<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return (rel[0] as T) ?? null;
  return (rel as T) ?? null;
}

export default async function MeusAlertasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type AlertaRow = {
    id: number;
    nome: string;
    termo: string | null;
    municipio_id: number | null;
    modalidade: string | null;
    ativo: boolean;
    created_at: string;
    municipios: { nome: string; distrito_regiao: string } | { nome: string; distrito_regiao: string }[] | null;
  };

  const { data: alertasData } = await supabase
    .from("job_alerts")
    .select("id, nome, termo, municipio_id, modalidade, ativo, created_at, municipios ( nome, distrito_regiao )")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false });

  const alertas = ((alertasData ?? []) as AlertaRow[]).map((a) => ({
    ...a,
    municipio: unwrap<{ nome: string; distrito_regiao: string }>(a.municipios),
  }));

  type MatchRow = {
    alert_id: number;
    created_at: string;
    jobs: { id: number; titulo: string } | { id: number; titulo: string }[] | null;
  };

  const alertIds = alertas.map((a) => a.id);
  const matchesPorAlerta = new Map<number, { jobId: number; titulo: string; created_at: string }[]>();

  if (alertIds.length > 0) {
    const { data: matchesData } = await supabase
      .from("job_alert_matches")
      .select("alert_id, created_at, jobs ( id, titulo )")
      .in("alert_id", alertIds)
      .order("created_at", { ascending: false });

    for (const m of (matchesData ?? []) as MatchRow[]) {
      const job = unwrap<{ id: number; titulo: string }>(m.jobs);
      if (!job) continue;
      const lista = matchesPorAlerta.get(m.alert_id) ?? [];
      lista.push({ jobId: job.id, titulo: job.titulo, created_at: m.created_at });
      matchesPorAlerta.set(m.alert_id, lista);
    }
  }

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/empregos" className="text-sm text-terra-600 hover:text-terra-800">
              ← Empregos
            </Link>
            <h1 className="text-xl font-bold text-terra-800 mt-1">Os meus alertas</h1>
          </div>
          <Button asChild size="sm">
            <Link href="/empregos/alertas/novo">Novo alerta</Link>
          </Button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-3">
        <p className="text-sm text-terra-600">
          Avisamos-te por notificação sempre que surgir uma vaga nova publicada que corresponda
          aos critérios de um alerta ativo. A verificação corre periodicamente, não em tempo
          real — pode demorar até um dia a aparecer uma vaga nova.
        </p>

        {alertas.length === 0 && (
          <p className="rounded-lg border border-terra-200 bg-white p-8 text-center text-sm text-terra-600">
            Ainda não tens nenhum alerta.{" "}
            <Link href="/empregos/alertas/novo" className="underline">
              Criar o primeiro
            </Link>
          </p>
        )}

        {alertas.map((a) => {
          const matches = matchesPorAlerta.get(a.id) ?? [];
          const criterios = [
            a.termo && `"${a.termo}"`,
            a.municipio && `${a.municipio.nome}, ${a.municipio.distrito_regiao}`,
            a.modalidade && MODALIDADE_LABEL[a.modalidade],
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <div key={a.id} className="rounded-xl border border-terra-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-terra-900">{a.nome}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.ativo ? "bg-green-100 text-green-700" : "bg-terra-100 text-terra-600"
                      }`}
                    >
                      {a.ativo ? "Ativo" : "Pausado"}
                    </span>
                  </div>
                  <p className="text-xs text-terra-500">{criterios || "Qualquer vaga nova"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.ativo ? (
                    <form action={pausarAlerta.bind(null, a.id)}>
                      <Button type="submit" size="sm" variant="outline">
                        Pausar
                      </Button>
                    </form>
                  ) : (
                    <form action={reativarAlerta.bind(null, a.id)}>
                      <Button type="submit" size="sm" variant="outline">
                        Reativar
                      </Button>
                    </form>
                  )}
                  <form action={removerAlerta.bind(null, a.id)}>
                    <Button type="submit" size="sm" variant="outline">
                      Remover
                    </Button>
                  </form>
                </div>
              </div>

              {matches.length > 0 && (
                <div className="mt-3 border-t border-terra-100 pt-3">
                  <p className="mb-1 text-xs font-medium text-terra-700">
                    Vagas encontradas ({matches.length})
                  </p>
                  <ul className="space-y-1">
                    {matches.slice(0, 5).map((m, i) => (
                      <li key={i} className="text-xs">
                        <Link href={`/empregos/${m.jobId}`} className="text-terra-600 underline">
                          {m.titulo}
                        </Link>{" "}
                        <span className="text-terra-400">
                          — {new Date(m.created_at).toLocaleDateString("pt-PT")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
