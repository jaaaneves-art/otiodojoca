import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarAlerta } from "../actions";

const MODALIDADE_LABEL: Record<string, string> = {
  presencial: "Presencial",
  remoto: "Remoto",
  hibrido: "Híbrido",
};

export default async function NovoAlertaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; municipio?: string; modalidade?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type MunicipioOpt = { id: number; nome: string; distrito_regiao: string };

  const { data: municipiosData } = await supabase
    .from("municipios")
    .select("id, nome, distrito_regiao")
    .order("nome");

  const municipios = (municipiosData ?? []) as MunicipioOpt[];

  // Sugestão de nome a partir dos filtros vindos de /empregos (ex: link
  // "Guardar esta pesquisa como alerta") -- o candidato pode sempre
  // mudar antes de guardar.
  const nomeSugerido = [
    params.q,
    params.municipio
      ? municipios.find((m) => m.id === Number(params.municipio))?.nome
      : null,
    params.modalidade ? MODALIDADE_LABEL[params.modalidade] : null,
  ]
    .filter(Boolean)
    .join(" · ") || "O meu alerta";

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <Link href="/empregos/alertas" className="text-sm text-terra-600 hover:text-terra-800">
            ← Os meus alertas
          </Link>
          <h1 className="text-xl font-bold text-terra-800 mt-1">Novo alerta de emprego</h1>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6">
        <p className="mb-4 text-sm text-terra-600">
          Avisamos-te por notificação sempre que surgir uma vaga nova publicada que corresponda
          a estes critérios.
        </p>

        <form action={criarAlerta} className="space-y-4 rounded-xl border border-terra-200 bg-white p-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-terra-800">Nome do alerta</label>
            <input
              type="text"
              name="nome"
              defaultValue={nomeSugerido}
              required
              className="w-full rounded-lg border p-2 text-sm"
              placeholder="Ex: Eletricista em Braga"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-terra-800">Palavra-chave (opcional)</label>
            <input
              type="text"
              name="termo"
              defaultValue={params.q ?? ""}
              className="w-full rounded-lg border p-2 text-sm"
              placeholder="Título ou área (ex: eletricista, hotelaria...)"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-terra-800">Município (opcional)</label>
            <select
              name="municipio_id"
              defaultValue={params.municipio ?? ""}
              className="w-full rounded-lg border p-2 text-sm"
            >
              <option value="">Qualquer município</option>
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}, {m.distrito_regiao}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-terra-800">Modalidade (opcional)</label>
            <select
              name="modalidade"
              defaultValue={params.modalidade ?? ""}
              className="w-full rounded-lg border p-2 text-sm"
            >
              <option value="">Qualquer modalidade</option>
              {Object.entries(MODALIDADE_LABEL).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-terra-600 px-4 py-2 text-sm font-medium text-white hover:bg-terra-700"
          >
            Criar alerta
          </button>
        </form>
      </main>
    </div>
  );
}
