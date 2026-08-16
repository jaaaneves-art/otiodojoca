"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Localizacao } from "@/components/entidades/localizacao";
import { obterCoordenadasPorCodigoPostal } from "@/lib/calendario/geocoding";

interface Municipio {
  id: number;
  nome: string;
}

interface Freguesia {
  id: number;
  nome: string;
  municipio: string;
  localidade: string;
  codigo_postal: string;
}

interface Props {
  onSelect: (localizacao: Localizacao | null) => void;
}

// "Gove (BAIÃO)" + município "Baião" -> "Gove"
function nomeCurto(nomeFreguesia: string, nomeMunicipio: string) {
  const sufixo = ` (${nomeMunicipio.toUpperCase()})`;
  return nomeFreguesia.toUpperCase().endsWith(sufixo)
    ? nomeFreguesia.slice(0, nomeFreguesia.length - sufixo.length)
    : nomeFreguesia;
}

export default function LocalizacaoCascata({ onSelect }: Props) {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [erroMunicipios, setErroMunicipios] = useState(false);

  const [municipioTexto, setMunicipioTexto] = useState("");
  const [municipioAberto, setMunicipioAberto] = useState(false);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<Municipio | null>(null);

  const [freguesias, setFreguesias] = useState<Freguesia[]>([]);
  const [aCarregarFreguesias, setACarregarFreguesias] = useState(false);
  const [erroFreguesias, setErroFreguesias] = useState(false);

  const [freguesiaTexto, setFreguesiaTexto] = useState("");
  const [freguesiaAberto, setFreguesiaAberto] = useState(false);
  const [freguesiaSelecionada, setFreguesiaSelecionada] = useState<Freguesia | null>(null);

  const [aGeocodificar, setAGeocodificar] = useState(false);
  const [erroGeocoding, setErroGeocoding] = useState(false);

  const municipioRef = useRef<HTMLDivElement>(null);
  const freguesiaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function carregarMunicipios() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("municipios")
        .select("id, nome")
        .order("nome");

      if (error) {
        setErroMunicipios(true);
        return;
      }
      setMunicipios(data ?? []);
    }
    carregarMunicipios();
  }, []);

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (municipioRef.current && !municipioRef.current.contains(evento.target as Node)) {
        setMunicipioAberto(false);
      }
      if (freguesiaRef.current && !freguesiaRef.current.contains(evento.target as Node)) {
        setFreguesiaAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const municipiosFiltrados = municipioTexto.trim()
    ? municipios
        .filter((m) => m.nome.toLowerCase().includes(municipioTexto.toLowerCase()))
        .slice(0, 10)
    : [];

  const freguesiasFiltradas = freguesiaTexto.trim()
    ? freguesias
        .filter((f) =>
          [f.nome, f.localidade, f.codigo_postal, f.municipio]
            .join(" ")
            .toLowerCase()
            .includes(freguesiaTexto.toLowerCase()),
        )
        .slice(0, 15)
    : freguesias.slice(0, 15);

  async function selecionarMunicipio(municipio: Municipio) {
    setMunicipioSelecionado(municipio);
    setMunicipioTexto(municipio.nome);
    setMunicipioAberto(false);

    setFreguesiaTexto("");
    setFreguesiaSelecionada(null);
    setFreguesias([]);
    setErroFreguesias(false);
    setACarregarFreguesias(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("freguesias")
      .select("id, nome, municipio, localidade, codigo_postal")
      .eq("municipio", municipio.nome.toUpperCase())
      .order("nome");

    setACarregarFreguesias(false);

    if (error) {
      setErroFreguesias(true);
      return;
    }
    setFreguesias(data ?? []);
  }

  function limparMunicipio() {
    setMunicipioSelecionado(null);
    setMunicipioTexto("");
    setFreguesias([]);
    setFreguesiaTexto("");
    setFreguesiaSelecionada(null);
    setErroGeocoding(false);
    onSelect(null);
  }

  async function selecionarFreguesia(freguesia: Freguesia) {
    setFreguesiaSelecionada(freguesia);
    setFreguesiaTexto(freguesia.nome);
    setFreguesiaAberto(false);
    setErroGeocoding(false);
    setAGeocodificar(true);

    try {
      const coordenadas = await obterCoordenadasPorCodigoPostal(freguesia.codigo_postal, {
        nome: freguesia.localidade || freguesia.nome,
        municipio: freguesia.municipio,
      });
      onSelect({
        id: freguesia.id,
        codigo_postal: freguesia.codigo_postal,
        nome: nomeCurto(freguesia.nome, freguesia.municipio),
        localidade: freguesia.localidade,
        municipio: municipioSelecionado?.nome ?? freguesia.municipio,
        latitude: coordenadas.latitude,
        longitude: coordenadas.longitude,
      });
    } catch {
      setErroGeocoding(true);
      onSelect(null);
    } finally {
      setAGeocodificar(false);
    }
  }

  function limparFreguesia() {
    setFreguesiaSelecionada(null);
    setFreguesiaTexto("");
    setErroGeocoding(false);
    onSelect(null);
  }

  if (freguesiaSelecionada) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-lg border bg-slate-50 p-3">
        <div>
          <div className="font-medium text-slate-800">
            📍 {nomeCurto(freguesiaSelecionada.nome, freguesiaSelecionada.municipio)}
          </div>
          <div className="text-xs text-slate-500">
            {[freguesiaSelecionada.codigo_postal, municipioSelecionado?.nome]
              .filter(Boolean)
              .join(" • ")}
          </div>
          {aGeocodificar && (
            <div className="mt-1 text-xs text-slate-500">A localizar coordenadas…</div>
          )}
          {erroGeocoding && (
            <div className="mt-1 text-xs text-amber-700">
              Não foi possível obter coordenadas para esta freguesia.
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={limparFreguesia}
          aria-label="Limpar seleção"
          className="text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={municipioRef} className="relative">
        {municipioSelecionado ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-slate-50 p-3">
            <div>
              <div className="text-xs text-slate-500">Município</div>
              <div className="font-medium text-slate-800">{municipioSelecionado.nome}</div>
            </div>
            <button
              type="button"
              onClick={limparMunicipio}
              aria-label="Trocar município"
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={municipioTexto}
              onChange={(e) => {
                setMunicipioTexto(e.target.value);
                setMunicipioAberto(true);
              }}
              onFocus={() => municipioTexto && setMunicipioAberto(true)}
              placeholder="Procura o teu município..."
              className="w-full border rounded-lg p-3"
            />
            {erroMunicipios && (
              <p className="mt-1 text-xs text-amber-700">Não foi possível carregar os municípios.</p>
            )}
            {municipioAberto && municipiosFiltrados.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {municipiosFiltrados.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selecionarMunicipio(m)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b last:border-b-0"
                  >
                    <div className="font-medium">{m.nome}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {municipioSelecionado && (
        <div ref={freguesiaRef} className="relative">
          <input
            type="text"
            value={freguesiaTexto}
            onChange={(e) => {
              setFreguesiaTexto(e.target.value);
              setFreguesiaAberto(true);
            }}
            onFocus={() => setFreguesiaAberto(true)}
            placeholder="Procura a freguesia ou o código postal..."
            disabled={aCarregarFreguesias}
            className="w-full border rounded-lg p-3 disabled:bg-slate-50"
          />
          {aCarregarFreguesias && (
            <p className="mt-1 text-xs text-slate-500">A carregar freguesias…</p>
          )}
          {erroFreguesias && (
            <p className="mt-1 text-xs text-amber-700">Não foi possível carregar as freguesias.</p>
          )}
          {freguesiaAberto && !aCarregarFreguesias && freguesiasFiltradas.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {freguesiasFiltradas.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => selecionarFreguesia(f)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b last:border-b-0"
                >
                  <div className="font-medium">{nomeCurto(f.nome, f.municipio)}</div>
                  <div className="text-xs text-slate-500">{f.codigo_postal} • {f.localidade}</div>
                </button>
              ))}
            </div>
          )}
          {freguesiaAberto && !aCarregarFreguesias && freguesiaTexto && freguesiasFiltradas.length === 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-sm text-slate-500">
              Nenhuma freguesia encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}
