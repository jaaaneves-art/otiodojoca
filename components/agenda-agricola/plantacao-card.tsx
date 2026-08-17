import Link from "next/link";
import { ESTADO_LABEL, type PlantacaoComCultura } from "@/lib/agenda-agricola/tipos";

const FORMATADOR = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" });

function diasAte(dataISO: string): number {
  const alvo = new Date(`${dataISO}T00:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

export default function PlantacaoCard({ plantacao }: { plantacao: PlantacaoComCultura }) {
  const dias = plantacao.data_colheita_prevista ? diasAte(plantacao.data_colheita_prevista) : null;

  return (
    <Link
      href={`/agenda-agricola/plantacao/${plantacao.id}`}
      className="block bg-white rounded-xl border p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-terra-800">{plantacao.cultura.nome}</h4>
          <p className="text-xs text-terra-500 mt-0.5">
            Plantada {FORMATADOR.format(new Date(`${plantacao.data_plantacao}T12:00:00`))}
            {plantacao.local_nome ? ` · ${plantacao.local_nome}` : ""}
          </p>
        </div>
        <span className="text-xs bg-terra-100 text-terra-700 px-2 py-0.5 rounded-full whitespace-nowrap">
          {ESTADO_LABEL[plantacao.estado]}
        </span>
      </div>
      {dias !== null && plantacao.estado !== "colhida" && plantacao.estado !== "cancelada" && (
        <p className="text-sm text-terra-600 mt-3">
          {dias > 0 ? `Colheita prevista em ${dias} dias` : dias === 0 ? "Colheita prevista hoje" : `Colheita prevista há ${-dias} dias`}
        </p>
      )}
    </Link>
  );
}
