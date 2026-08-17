import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarPlantacao } from "@/lib/agenda-agricola/actions";
import type { CulturaGuia } from "@/lib/agenda-agricola/tipos";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NovaPlantacaoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: culturas } = await supabase
    .from("culturas_guia")
    .select("*")
    .order("nome");

  const lista = (culturas ?? []) as CulturaGuia[];

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/agenda-agricola" className="text-sm text-terra-500 hover:text-terra-700">
            ← A minha Agricultura
          </Link>
          <h1 className="text-xl font-bold text-terra-800 mt-1">Nova plantação</h1>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6">
        {lista.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
            Catálogo de culturas vazio — verifica se sql/AGENDA_AGRICOLA.sql e
            sql/culturas_guia_seed.sql já foram corridos no Supabase.
          </p>
        ) : (
          <form action={criarPlantacao} className="bg-white rounded-2xl border p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-terra-700 mb-1">Cultura</label>
              <select
                name="cultura_id"
                required
                className="w-full border rounded-lg p-3"
                defaultValue=""
              >
                <option value="" disabled>
                  Escolhe uma cultura...
                </option>
                {lista.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.categoria})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-terra-700 mb-1">
                Data de plantação
              </label>
              <input
                type="date"
                name="data_plantacao"
                required
                defaultValue={hojeISO()}
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-terra-700 mb-1">
                Localização (opcional)
              </label>
              <input
                type="text"
                name="local_nome"
                placeholder="Ex: Horta 2, Talhão A"
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-terra-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                name="notas"
                rows={3}
                placeholder="Ex: variedade, origem das sementes..."
                className="w-full border rounded-lg p-3"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-terra-700 text-white py-3 rounded-full font-medium hover:bg-terra-800"
            >
              Registar plantação
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
