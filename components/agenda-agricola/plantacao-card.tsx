import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import {
  ESTADO_LABEL,
  type EstadoPlantacao,
  type PlantacaoComCultura,
} from "@/lib/agenda-agricola/tipos";

const FORMATADOR = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" });

const ESTADO_COR: Record<EstadoPlantacao, string> = {
  plantada: "bg-blue-100 text-blue-800",
  germinada: "bg-green-100 text-green-800",
  em_crescimento: "bg-emerald-100 text-emerald-800",
  florada: "bg-pink-100 text-pink-800",
  colhida: "bg-amber-100 text-amber-800",
  cancelada: "bg-gray-100 text-gray-600",
};

function diasEntre(a: Date, b: Date): number {
  const inicio = new Date(a);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(b);
  fim.setHours(0, 0, 0, 0);
  return Math.round((fim.getTime() - inicio.getTime()) / 86400000);
}

export default function PlantacaoCard({ plantacao }: { plantacao: PlantacaoComCultura }) {
  const hoje = new Date();
  const dataPlantacao = new Date(`${plantacao.data_plantacao}T12:00:00`);
  const diasPassados = Math.max(0, diasEntre(dataPlantacao, hoje));
  const ativa = plantacao.estado !== "colhida" && plantacao.estado !== "cancelada";

  const dataColheita = plantacao.data_colheita_prevista
    ? new Date(`${plantacao.data_colheita_prevista}T12:00:00`)
    : null;
  const diasAteColheita = dataColheita ? diasEntre(hoje, dataColheita) : null;

  const cicloMedio =
    plantacao.cultura.ciclo_dias_min != null && plantacao.cultura.ciclo_dias_max != null
      ? Math.round((plantacao.cultura.ciclo_dias_min + plantacao.cultura.ciclo_dias_max) / 2)
      : null;
  const progresso = cicloMedio ? Math.min(100, Math.round((diasPassados / cicloMedio) * 100)) : null;

  return (
    <Link
      href={`/agenda-agricola/plantacao/${plantacao.id}`}
      className="block bg-white rounded-xl border p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-terra-800">{plantacao.cultura.nome}</h4>
          <p className="text-xs text-terra-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {FORMATADOR.format(dataPlantacao)}
            </span>
            {plantacao.local_nome && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {plantacao.local_nome}
              </span>
            )}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${ESTADO_COR[plantacao.estado]}`}
        >
          {ESTADO_LABEL[plantacao.estado]}
        </span>
      </div>

      {ativa && progresso !== null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-terra-500 mb-1">
            <span>Progresso</span>
            <span>{diasPassados} dias</span>
          </div>
          <div className="h-1.5 w-full bg-terra-100 rounded-full overflow-hidden">
            <div className="h-full bg-terra-600" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      )}

      {ativa && diasAteColheita !== null && (
        <p className="text-sm text-terra-600 mt-3">
          {diasAteColheita > 0
            ? `Colheita prevista em ${diasAteColheita} dias`
            : diasAteColheita === 0
              ? "Colheita prevista hoje"
              : "Já deveria estar pronta"}
        </p>
      )}
    </Link>
  );
}
