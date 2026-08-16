// components/calendario/almanaque-dia.tsx
// Mostra as secções do Almanaque Diário que existem para um dia (só as
// que têm dados — ver lib/calendario/almanaque.ts).
import type { AlmanaqueDia } from "@/lib/calendario/almanaque";

interface Props {
  dia: AlmanaqueDia;
  compacto?: boolean;
}

const SECCOES: { campo: keyof AlmanaqueDia; icone: string; titulo: string; citacao?: boolean }[] = [
  { campo: "santo", icone: "📜", titulo: "Santo do Dia" },
  { campo: "efemerides", icone: "🗓️", titulo: "Efemérides" },
  { campo: "proverbio", icone: "💬", titulo: "Provérbio", citacao: true },
  { campo: "agricultura", icone: "🌾", titulo: "Agricultura" },
  { campo: "hortaJardim", icone: "🪴", titulo: "Horta e Jardim" },
  { campo: "natureza", icone: "🌿", titulo: "Natureza" },
  { campo: "astronomia", icone: "🌌", titulo: "Astronomia" },
  { campo: "curiosidade", icone: "✨", titulo: "Curiosidade" },
];

export default function AlmanaqueDiaCalendario({ dia, compacto = false }: Props) {
  const seccoesComDados = SECCOES.filter((s) => (dia[s.campo]?.length ?? 0) > 0);
  if (seccoesComDados.length === 0) return null;

  const tituloTexto = compacto ? "text-xs mb-1" : "text-sm mb-1.5";
  const corpoTexto = compacto ? "text-xs" : "text-sm";

  return (
    <div className={compacto ? "space-y-3" : "space-y-4"}>
      {seccoesComDados.map((s) => {
        const itens = dia[s.campo]!;
        return (
          <div key={s.campo}>
            <div className={"font-semibold text-slate-700 flex items-center gap-1.5 " + tituloTexto}>
              <span aria-hidden>{s.icone}</span> {s.titulo}
            </div>
            {s.citacao ? (
              <p className={"italic text-slate-600 " + corpoTexto}>“{itens.join(" ")}”</p>
            ) : itens.length > 1 ? (
              <ul className="space-y-1">
                {itens.map((item, i) => (
                  <li key={i} className={"text-slate-600 flex gap-1.5 " + corpoTexto}>
                    <span className="text-slate-400" aria-hidden>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={"text-slate-600 " + corpoTexto}>{itens[0]}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
