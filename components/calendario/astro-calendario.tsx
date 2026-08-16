// components/calendario/astro-calendario.tsx
import type { EventosAstro } from "@/lib/calendario/astro";

interface Props {
  nomeLocalizacao: string;
  eventos: EventosAstro;
}

export default function AstroCalendario({ nomeLocalizacao, eventos }: Props) {
  return (
    <section className="bg-white rounded-2xl border shadow-sm p-6">
      <h3 className="font-bold text-slate-900">Sol e lua hoje</h3>
      <p className="text-sm text-slate-500 mb-4">📍 {nomeLocalizacao}</p>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-lg bg-amber-50 p-3">
          <div className="text-amber-700">🌅 Nascer do sol</div>
          <div className="font-semibold text-slate-800">{eventos.sol.nascer ?? "—"}</div>
        </div>
        <div className="rounded-lg bg-orange-50 p-3">
          <div className="text-orange-700">🌇 Pôr do sol</div>
          <div className="font-semibold text-slate-800">{eventos.sol.poente ?? "—"}</div>
        </div>
        <div className="rounded-lg bg-indigo-50 p-3">
          <div className="text-indigo-700">🌙 Nascer da lua</div>
          <div className="font-semibold text-slate-800">{eventos.lua.nascer ?? "—"}</div>
        </div>
        <div className="rounded-lg bg-slate-100 p-3">
          <div className="text-slate-600">🌌 Pôr da lua</div>
          <div className="font-semibold text-slate-800">{eventos.lua.poente ?? "—"}</div>
        </div>
      </div>
    </section>
  );
}
