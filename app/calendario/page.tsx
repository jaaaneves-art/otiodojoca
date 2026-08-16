// app/calendario/page.tsx
"use client";

import { useEffect, useState } from "react";
import LocalizacaoCalendario from "@/components/calendario/localizacao-calendario";
import type { Localizacao } from "@/components/entidades/localizacao";
import { infoLua, estaCrescente } from "@/lib/calendario/lua";
import { TRADICAO, SEMEAR_POR_TIPO, REGIOES, NOTA_CIENTIFICA } from "@/lib/calendario/tradicao";
import LuaReal from "@/components/calendario/lua-real";
import MeteorologiaCalendario from "@/components/calendario/meteorologia-calendario";
import AstroCalendario from "@/components/calendario/astro-calendario";
import { eventosAstro, ehDeDia, type EventosAstro } from "@/lib/calendario/astro";
import AlmanaqueDiaCalendario from "@/components/calendario/almanaque-dia";
import { getAlmanaqueDia } from "@/lib/calendario/almanaque";
import {
  obterPrevisaoMeteorologica,
  descricaoTempo,
  type PrevisaoMeteorologica,
} from "@/lib/calendario/meteorologia";

// Portugal continental é estreito em latitude (~5°): esta coordenada serve
// de aproximação para decidir dia/noite enquanto não há localização real.
const COORDENADAS_PORTUGAL_DEFEITO = { latitude: 38.7167, longitude: -9.1393 };

const NOMES_DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const NOMES_MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

function diasAPartirDe(
  base: Date,
  n: number,
  localizacao: { latitude: number; longitude: number } | null,
) {
  const dias = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    dias.push({
      data: d,
      info: infoLua(d),
      astro: localizacao ? eventosAstro(d, localizacao.latitude, localizacao.longitude) : null,
      almanaque: getAlmanaqueDia(d),
    });
  }
  return dias;
}

function formatarDataLonga(d: Date) {
  return `${NOMES_DIAS[d.getDay()]}, ${d.getDate()} de ${NOMES_MESES[d.getMonth()]}`;
}

export default function CalendarioPage() {
  const [regiao, setRegiao] = useState<"norte" | "centro" | "sul">("centro");
  const [aberto, setAberto] = useState<number | null>(null); // índice do dia expandido
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null);
  const [previsao, setPrevisao] = useState<PrevisaoMeteorologica | null>(null);
  const [aCarregarPrevisao, setACarregarPrevisao] = useState(false);
  const [erroPrevisao, setErroPrevisao] = useState(false);

  useEffect(() => {
    if (localizacao?.latitude == null || localizacao.longitude == null) {
      setPrevisao(null);
      setACarregarPrevisao(false);
      setErroPrevisao(false);
      return;
    }

    const controlador = new AbortController();
    setACarregarPrevisao(true);
    setErroPrevisao(false);

    obterPrevisaoMeteorologica(
      localizacao.latitude,
      localizacao.longitude,
      controlador.signal,
    )
      .then(setPrevisao)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Não foi possível carregar a previsão meteorológica:", error);
        setErroPrevisao(true);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setACarregarPrevisao(false);
      });

    return () => controlador.abort();
  }, [localizacao]);

  const hoje = new Date();
  const hojeInfo = infoLua(hoje);
  const tradHoje = TRADICAO[hojeInfo.fase];
  const regiaoSel = REGIOES.find((r) => r.id === regiao)!;
  const coordenadas =
    localizacao?.latitude != null && localizacao?.longitude != null
      ? { latitude: localizacao.latitude, longitude: localizacao.longitude }
      : null;
  const astroHoje: EventosAstro | null = coordenadas
    ? eventosAstro(hoje, coordenadas.latitude, coordenadas.longitude)
    : null;
  const proximos = diasAPartirDe(hoje, 14, coordenadas);

  const coordenadasParaCeu = coordenadas ?? COORDENADAS_PORTUGAL_DEFEITO;
  const deDia = ehDeDia(hoje, coordenadasParaCeu.latitude, coordenadasParaCeu.longitude);
  const tempoAtual = previsao ? descricaoTempo(previsao.atual.codigoTempo) : null;
  const almanaqueHoje = getAlmanaqueDia(hoje);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO — dia de hoje */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0b1026] via-[#131a3a] to-[#1e2a54] text-white">
        <div className="absolute inset-0 opacity-70" aria-hidden>
          <div className="absolute top-8 left-[12%] w-1 h-1 bg-white rounded-full" />
          <div className="absolute top-16 left-[28%] w-0.5 h-0.5 bg-white rounded-full" />
          <div className="absolute top-24 left-[70%] w-1 h-1 bg-white rounded-full" />
          <div className="absolute top-10 left-[85%] w-0.5 h-0.5 bg-white rounded-full" />
          <div className="absolute top-32 left-[45%] w-0.5 h-0.5 bg-white rounded-full" />
          <div className="absolute top-40 left-[18%] w-1 h-1 bg-white/70 rounded-full" />
          <div className="absolute top-6 left-[58%] w-0.5 h-0.5 bg-white rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pt-6 pb-12">
          <a href="/" className="text-slate-300 hover:text-white text-sm">← Início</a>
          <div className="flex flex-col items-center text-center mt-6">
            {deDia ? (
              <div
                className="rounded-full flex items-center justify-center bg-gradient-to-b from-amber-300 to-orange-400 shadow-lg shadow-amber-500/30"
                style={{ width: 200, height: 200 }}
              >
                <span style={{ fontSize: 96 }} aria-label={tempoAtual?.texto ?? "Sol"}>
                  {tempoAtual?.icone ?? "☀️"}
                </span>
              </div>
            ) : (
              <LuaReal
                iluminacao={hojeInfo.iluminacao}
                crescente={estaCrescente(hojeInfo.fase)}
                idadeDias={hojeInfo.idadeDias}
                tamanho={200}
              />
            )}
            <div className="mt-6 text-sm text-slate-300 uppercase tracking-widest">
              Hoje · {formatarDataLonga(hoje)}
              {!coordenadas && <span className="text-slate-400"> · céu aproximado</span>}
            </div>
            <h1 className="text-4xl font-bold mt-2">{hojeInfo.nome}</h1>
            <p className="text-slate-300 mt-2 max-w-md">{tradHoje.resumo}</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm">
              <span className="text-yellow-200">☀</span> {hojeInfo.iluminacao}% iluminada
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 -mt-6">
        <LocalizacaoCalendario onSelect={setLocalizacao} />
        {localizacao && astroHoje && (
          <AstroCalendario nomeLocalizacao={localizacao.nome} eventos={astroHoje} />
        )}
        {localizacao && (
          <>
            {aCarregarPrevisao && (
              <p className="-mt-3 text-sm text-slate-600">A carregar a previsão meteorológica…</p>
            )}
            {erroPrevisao && (
              <p className="-mt-3 text-sm text-amber-700">Não foi possível carregar a previsão meteorológica.</p>
            )}
            {localizacao.latitude == null || localizacao.longitude == null ? (
              <p className="-mt-3 text-sm text-amber-700">Esta localização não tem coordenadas disponíveis.</p>
            ) : previsao ? (
              <MeteorologiaCalendario
                nomeLocalizacao={localizacao.nome}
                previsao={previsao}
              />
            ) : null}
          </>
        )}

        {/* Fazer / Evitar de HOJE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
            <h3 className="font-bold text-green-700 mb-4 flex items-center gap-2">
              <span className="text-lg">🌱</span> Bom para fazer
            </h3>
            <ul className="space-y-2.5">
              {tradHoje.fazer.map((item, i) => (
                <li key={i} className="text-slate-700 text-sm flex gap-2.5">
                  <span className="text-green-500 mt-0.5">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <h3 className="font-bold text-rose-600 mb-4 flex items-center gap-2">
              <span className="text-lg">✋</span> Melhor evitar
            </h3>
            <ul className="space-y-2.5">
              {tradHoje.evitar.map((item, i) => (
                <li key={i} className="text-slate-700 text-sm flex gap-2.5">
                  <span className="text-rose-400 mt-0.5">×</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Almanaque do dia */}
        {almanaqueHoje && (
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Almanaque do dia</h3>
            <AlmanaqueDiaCalendario dia={almanaqueHoje} />
          </div>
        )}

        {/* Região */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-3">A tua região</h3>
          <div className="flex gap-2 mb-4">
            {REGIOES.map((rg) => (
              <button
                key={rg.id}
                onClick={() => setRegiao(rg.id)}
                className={
                  "px-5 py-2 rounded-full text-sm font-medium transition-all " +
                  (regiao === rg.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }
              >
                {rg.nome}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{regiaoSel.ajuste}</p>
        </div>

        {/* Próximos dias — acordeão */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-1">Próximos dias</h3>
          <p className="text-xs text-slate-400 mb-4">Toca num dia para ver as recomendações desse dia.</p>
          <div className="space-y-1">
            {proximos.map(({ data, info, astro, almanaque }, i) => {
              const trad = TRADICAO[info.fase];
              const estaAberto = aberto === i;
              return (
                <div key={i} className="rounded-xl overflow-hidden">
                  <button
                    onClick={() => setAberto(estaAberto ? null : i)}
                    className={
                      "w-full flex items-center gap-3 py-2.5 px-3 transition-colors text-left " +
                      (estaAberto ? "bg-indigo-50" : "hover:bg-slate-50")
                    }
                  >
                    <div className="w-9 h-9 flex-shrink-0">
                      <LuaReal
                        iluminacao={info.iluminacao}
                        crescente={estaCrescente(info.fase)}
                        idadeDias={info.idadeDias}
                        tamanho={36}
                      />
                    </div>
                    <span className="text-sm text-slate-500 w-24">
                      {NOMES_DIAS[data.getDay()]}, {data.getDate()}/{data.getMonth() + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-800">{info.nome}</span>
                    <span className="text-xs text-slate-400 ml-auto">{info.iluminacao}%</span>
                    <span className={"text-slate-300 ml-2 transition-transform " + (estaAberto ? "rotate-90" : "")}>›</span>
                  </button>

                  {estaAberto && (
                    <div className="bg-slate-50 px-3 pb-4 pt-2">
                      <p className="text-sm text-slate-600 italic mb-3">{trad.resumo}</p>
                      {astro && (
                        <p className="text-xs text-slate-500 mb-3 flex flex-wrap gap-x-4 gap-y-1">
                          <span>🌅 {astro.sol.nascer ?? "—"} · 🌇 {astro.sol.poente ?? "—"}</span>
                          <span>🌙 {astro.lua.nascer ?? "—"} · 🌌 {astro.lua.poente ?? "—"}</span>
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg border border-green-100 p-3">
                          <div className="text-xs font-bold text-green-700 mb-2">🌱 Bom para fazer</div>
                          <ul className="space-y-1">
                            {trad.fazer.map((item, j) => (
                              <li key={j} className="text-xs text-slate-700 flex gap-1.5">
                                <span className="text-green-500">✓</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white rounded-lg border border-rose-100 p-3">
                          <div className="text-xs font-bold text-rose-600 mb-2">✋ Melhor evitar</div>
                          <ul className="space-y-1">
                            {trad.evitar.map((item, j) => (
                              <li key={j} className="text-xs text-slate-700 flex gap-1.5">
                                <span className="text-rose-400">×</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {almanaque && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <AlmanaqueDiaCalendario dia={almanaque} compacto />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Semear por tipo */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-4">O que semear em cada fase</h3>
          <div className="space-y-3">
            {SEMEAR_POR_TIPO.map((s, i) => (
              <div key={i} className="border-b last:border-b-0 border-slate-100 pb-3 last:pb-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">{s.tipo}</span>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                    Lua {s.faseIdeal}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{s.exemplos}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Nota */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
            <span>ℹ️</span> Nota
          </h3>
          <p className="text-sm text-amber-900 leading-relaxed">{NOTA_CIENTIFICA}</p>
        </div>
      </div>
    </div>
  );
}
