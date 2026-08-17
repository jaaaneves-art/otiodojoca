import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { infoLua } from "@/lib/calendario/lua";
import { sugestaoLunar } from "@/lib/agenda-agricola/sugestao-lunar";
import FichaInterativa from "@/components/agenda-agricola/ficha-interativa";
import {
  ESTADO_LABEL,
  PROXIMO_ESTADO,
  type PlantacaoComCultura,
  type PlantacaoHistoricoItem,
} from "@/lib/agenda-agricola/tipos";

const FORMATADOR = new Intl.DateTimeFormat("pt-PT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const FORMATADOR_CURTO = new Intl.DateTimeFormat("pt-PT", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const EVENTO_LABEL: Record<PlantacaoHistoricoItem["evento"], string> = {
  estado_alterado: "Estado alterado",
  nota_adicionada: "Nota",
  foto_adicionada: "Foto adicionada",
  colhida: "Colhida",
};

export default async function FichaPlantacaoPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: plantacaoRaw } = await supabase
    .from("plantacoes")
    .select("*, cultura:culturas_guia(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!plantacaoRaw) notFound();

  const plantacao = plantacaoRaw as unknown as PlantacaoComCultura;

  const { data: historicoRaw } = await supabase
    .from("plantacao_historico")
    .select("*")
    .eq("plantacao_id", id)
    .order("created_at", { ascending: false });

  const historico = (historicoRaw ?? []) as PlantacaoHistoricoItem[];

  const hojeInfo = infoLua(new Date());
  const sugestao =
    plantacao.estado !== "colhida" && plantacao.estado !== "cancelada"
      ? sugestaoLunar(plantacao.cultura, hojeInfo.fase)
      : null;

  const proximoEstado = PROXIMO_ESTADO[plantacao.estado];
  const podeCancelar = plantacao.estado !== "colhida" && plantacao.estado !== "cancelada";

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/agenda-agricola" className="text-sm text-terra-500 hover:text-terra-700">
            ← A minha Agricultura
          </Link>
          <h1 className="text-xl font-bold text-terra-800 mt-1">{plantacao.cultura.nome}</h1>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-terra-100 text-terra-700 px-3 py-1 rounded-full text-sm font-medium">
              {ESTADO_LABEL[plantacao.estado]}
            </span>
            {plantacao.local_nome && (
              <span className="text-sm text-terra-500">📍 {plantacao.local_nome}</span>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-terra-500">Plantada em</dt>
              <dd className="font-medium text-terra-800">
                {FORMATADOR.format(new Date(`${plantacao.data_plantacao}T12:00:00`))}
              </dd>
            </div>
            {plantacao.fase_lunar_plantacao && (
              <div>
                <dt className="text-terra-500">Fase lunar na plantação</dt>
                <dd className="font-medium text-terra-800">{plantacao.fase_lunar_plantacao}</dd>
              </div>
            )}
            {plantacao.data_colheita_prevista && (
              <div>
                <dt className="text-terra-500">Colheita prevista</dt>
                <dd className="font-medium text-terra-800">
                  {FORMATADOR.format(new Date(`${plantacao.data_colheita_prevista}T12:00:00`))}
                </dd>
              </div>
            )}
            {plantacao.data_colheita_real && (
              <div>
                <dt className="text-terra-500">Colhida em</dt>
                <dd className="font-medium text-terra-800">
                  {FORMATADOR.format(new Date(`${plantacao.data_colheita_real}T12:00:00`))}
                </dd>
              </div>
            )}
          </dl>

          {plantacao.notas && <p className="text-sm text-terra-600 mt-4 italic">{plantacao.notas}</p>}

          {sugestao && (
            <p className="text-sm bg-terra-50 border border-terra-200 rounded-lg p-3 mt-4">
              {hojeInfo.simbolo} {sugestao}
            </p>
          )}
        </div>

        <FichaInterativa
          plantacaoId={plantacao.id}
          proximoEstado={proximoEstado}
          podeCancelar={podeCancelar}
          fotografias={plantacao.fotografias}
        />

        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-bold text-terra-900 mb-3">Histórico</h3>
          {historico.length === 0 ? (
            <p className="text-sm text-terra-500">Ainda sem eventos registados.</p>
          ) : (
            <ul className="space-y-3">
              {historico.map((h) => (
                <li key={h.id} className="text-sm border-l-2 border-terra-200 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-terra-800">{EVENTO_LABEL[h.evento]}</span>
                    <span className="text-xs text-terra-400">
                      {FORMATADOR_CURTO.format(new Date(h.created_at))}
                    </span>
                  </div>
                  {h.valor_antigo && h.valor_novo && (
                    <p className="text-terra-500">
                      {ESTADO_LABEL[h.valor_antigo as keyof typeof ESTADO_LABEL] ?? h.valor_antigo} →{" "}
                      {ESTADO_LABEL[h.valor_novo as keyof typeof ESTADO_LABEL] ?? h.valor_novo}
                    </p>
                  )}
                  {h.notas_utilizador && <p className="text-terra-600">{h.notas_utilizador}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
