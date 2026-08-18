import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { infoLua } from "@/lib/calendario/lua";
import { ESTADOS_ATIVOS, type CulturaGuia, type PlantacaoComCultura } from "@/lib/agenda-agricola/tipos";
import PlantacaoCard from "@/components/agenda-agricola/plantacao-card";
import CatalogoCulturas from "@/components/agenda-agricola/catalogo-culturas";

export default async function AgendaAgricolaPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: plantacoes }, { data: culturas }] = await Promise.all([
    supabase
      .from("plantacoes")
      .select("*, cultura:culturas_guia(*)")
      .eq("utilizador_id", user.id)
      .order("data_plantacao", { ascending: false }),
    supabase.from("culturas_guia").select("*").order("nome"),
  ]);

  const todas = (plantacoes ?? []) as unknown as PlantacaoComCultura[];
  const ativas = todas
    .filter((p) => ESTADOS_ATIVOS.includes(p.estado))
    .sort((a, b) => {
      if (!a.data_colheita_prevista) return 1;
      if (!b.data_colheita_prevista) return -1;
      return a.data_colheita_prevista.localeCompare(b.data_colheita_prevista);
    });
  const historico = todas.filter((p) => p.estado === "colhido" || p.estado === "interrompido");

  const hojeInfo = infoLua(new Date());
  const catalogo = (culturas ?? []) as CulturaGuia[];

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-terra-500 hover:text-terra-700">
              ← Início
            </Link>
            <h1 className="text-xl font-bold text-terra-800 mt-1">A minha Agricultura</h1>
          </div>
          <Link
            href="/agenda-agricola/nova"
            className="bg-terra-700 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-terra-800"
          >
            + Nova plantação
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <div className="bg-white rounded-2xl border p-4 text-sm text-terra-600">
          {hojeInfo.simbolo} Hoje é <strong>{hojeInfo.nome}</strong> ({hojeInfo.iluminacao}% iluminada) —
          consulta a ficha de cada plantação para ver se é boa altura para semear ou podar.
        </div>

        <section>
          <h2 className="text-lg font-bold text-terra-900 mb-4">Plantações ativas</h2>
          {ativas.length === 0 ? (
            <p className="text-sm text-terra-500">
              Ainda não tens plantações ativas.{" "}
              <Link href="/agenda-agricola/nova" className="text-terra-700 underline">
                Regista a primeira
              </Link>
              .
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ativas.map((p) => (
                <PlantacaoCard key={p.id} plantacao={p} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-terra-900 mb-4">Histórico</h2>
          {historico.length === 0 ? (
            <p className="text-sm text-terra-500">Sem plantações colhidas ou interrompidas ainda.</p>
          ) : (
            <div className="bg-white rounded-2xl border divide-y">
              {historico.map((p) => (
                <Link
                  key={p.id}
                  href={`/agenda-agricola/plantacao/${p.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-terra-50 text-sm"
                >
                  <span className="font-medium text-terra-800">{p.cultura.nome}</span>
                  <span className="text-terra-500">
                    {p.data_plantacao} — {p.estado === "colhido" ? "colhido" : "interrompido"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-terra-900 mb-4">Catálogo de culturas</h2>
          {catalogo.length === 0 ? (
            <p className="text-sm text-amber-700">
              Catálogo vazio — verifica se sql/AGENDA_AGRICOLA.sql e sql/culturas_guia_seed.sql já foram
              corridos no Supabase.
            </p>
          ) : (
            <CatalogoCulturas culturas={catalogo} />
          )}
        </section>
      </main>
    </div>
  );
}
