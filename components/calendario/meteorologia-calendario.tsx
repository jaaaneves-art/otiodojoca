import type { PrevisaoMeteorologica } from "@/lib/calendario/meteorologia";
import { avisosParaHorta, descricaoTempo } from "@/lib/calendario/meteorologia";

interface Props {
  nomeLocalizacao: string;
  previsao: PrevisaoMeteorologica;
}

const FORMATADOR_DIA = new Intl.DateTimeFormat("pt-PT", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export default function MeteorologiaCalendario({
  nomeLocalizacao,
  previsao,
}: Props) {
  const tempoAtual = descricaoTempo(previsao.atual.codigoTempo);
  const avisos = previsao.diaria[0] ? avisosParaHorta(previsao.diaria[0]) : [];

  return (
    <section className="bg-white rounded-2xl border shadow-sm p-6" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">Previsão meteorológica</h3>
          <p className="text-sm text-slate-500">📍 {nomeLocalizacao}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900">
            {Math.round(previsao.atual.temperatura)}°
          </div>
          <div className="text-sm text-slate-600">{tempoAtual.icone} {tempoAtual.texto}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-slate-500">Sensação</div>
          <div className="font-semibold text-slate-800">{Math.round(previsao.atual.sensacaoTermica)}°C</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-slate-500">Chuva agora</div>
          <div className="font-semibold text-slate-800">{previsao.atual.precipitacao} mm</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-slate-500">Vento</div>
          <div className="font-semibold text-slate-800">{Math.round(previsao.atual.vento)} km/h</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {previsao.diaria.slice(0, 7).map((dia) => {
          const tempo = descricaoTempo(dia.codigoTempo);
          return (
            <div key={dia.data} className="rounded-xl border border-slate-100 p-3 text-center text-sm">
              <div className="capitalize text-slate-500">{FORMATADOR_DIA.format(new Date(`${dia.data}T12:00:00`))}</div>
              <div className="my-1 text-xl" aria-label={tempo.texto}>{tempo.icone}</div>
              <div className="font-medium text-slate-800">{Math.round(dia.temperaturaMaxima)}° / {Math.round(dia.temperaturaMinima)}°</div>
              <div className="mt-1 text-xs text-sky-700">💧 {dia.probabilidadePrecipitacao}%</div>
            </div>
          );
        })}
      </div>

      {avisos.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="font-semibold text-amber-900">Avisos para a horta</h4>
          <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
            {avisos.map((aviso) => (
              <li key={aviso.texto} className="flex gap-2">
                <span aria-hidden>{aviso.icone}</span>
                <span>{aviso.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
