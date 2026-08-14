"use client";

import { useState, useMemo, useEffect } from "react";

interface Freguesia {
  id: number;
  cod_ine: string;
  nome: string;
  municipio: string;
  localidade: string;
  email?: string;
  telefone?: string;
}

interface LocalSelectorProps {
  freguesias: Freguesia[];
}

export function LocalSelector({ freguesias }: LocalSelectorProps) {
  // Município
  const [municipioInput, setMunicipioInput] = useState("");
  const [municipioSel, setMunicipioSel] = useState<string | null>(null);
  const [municipioOpen, setMunicipioOpen] = useState(false);

  // Freguesia
  const [freguesiaInput, setFreguesiaInput] = useState("");
  const [freguesiaSel, setFreguesiaSel] = useState<Freguesia | null>(null);
  const [freguesiaOpen, setFreguesiaOpen] = useState(false);

  // Checkbox "com freguesia"
  const [comFreguesia, setComFreguesia] = useState(true);

  // Lista única de municípios
  const municipios = useMemo(() => {
    const set = new Set(freguesias.map((f) => f.municipio));
    return Array.from(set).sort();
  }, [freguesias]);

  // Sugestões de municípios
  const municipioSugestoes = useMemo(() => {
    if (municipioInput.trim().length === 0) return [];
    return municipios
      .filter((m) => m.toLowerCase().includes(municipioInput.toLowerCase()))
      .slice(0, 10);
  }, [municipioInput, municipios]);

  // Freguesias do município selecionado
  const freguesiasDoMunicipio = useMemo(() => {
    if (!municipioSel) return [];
    return freguesias.filter((f) => f.municipio === municipioSel);
  }, [municipioSel, freguesias]);

  // Sugestões de freguesias
  const freguesiaSugestoes = useMemo(() => {
    if (freguesiaInput.trim().length === 0) return freguesiasDoMunicipio.slice(0, 10);
    return freguesiasDoMunicipio
      .filter((f) => f.nome.toLowerCase().includes(freguesiaInput.toLowerCase()))
      .slice(0, 10);
  }, [freguesiaInput, freguesiasDoMunicipio]);

  // Se mudar de município, limpar a freguesia
  useEffect(() => {
    setFreguesiaSel(null);
    setFreguesiaInput("");
  }, [municipioSel]);

  const selecionarMunicipio = (m: string) => {
    setMunicipioInput(m);
    setMunicipioSel(m);
    setMunicipioOpen(false);
  };

  const selecionarFreguesia = (f: Freguesia) => {
    setFreguesiaInput(f.nome);
    setFreguesiaSel(f);
    setFreguesiaOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Localização *</label>

      {/* Hidden inputs para o form */}
      <input type="hidden" name="municipio" value={municipioSel ?? ""} />
      <input
        type="hidden"
        name="freguesia_id"
        value={comFreguesia && freguesiaSel ? freguesiaSel.id.toString() : ""}
      />

      <div className="flex items-start gap-3">
        {/* ESQUERDA: Município */}
        <div className="relative flex-1">
          <input
            type="text"
            value={municipioInput}
            onChange={(e) => {
              setMunicipioInput(e.target.value);
              setMunicipioSel(null);
              setMunicipioOpen(true);
            }}
            onFocus={() => municipioInput.length > 0 && setMunicipioOpen(true)}
            placeholder="Município..."
            className="w-full border rounded-lg p-2"
          />
          {municipioOpen && municipioSugestoes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
              {municipioSugestoes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selecionarMunicipio(m)}
                  className="w-full text-left px-4 py-2 hover:bg-terra-50 border-b last:border-b-0 transition"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MEIO: Checkbox com freguesia */}
        <label className="flex flex-col items-center justify-center gap-1 pt-1 text-xs text-gray-600 select-none">
          <input
            type="checkbox"
            checked={comFreguesia}
            onChange={(e) => setComFreguesia(e.target.checked)}
            className="w-5 h-5"
          />
          <span>freguesia</span>
        </label>

        {/* DIREITA: Freguesia */}
        <div className="relative flex-1">
          <input
            type="text"
            value={freguesiaInput}
            disabled={!comFreguesia || !municipioSel}
            onChange={(e) => {
              setFreguesiaInput(e.target.value);
              setFreguesiaSel(null);
              setFreguesiaOpen(true);
            }}
            onFocus={() => setFreguesiaOpen(true)}
            placeholder={
              !municipioSel
                ? "Escolhe o município primeiro"
                : !comFreguesia
                ? "Sem freguesia"
                : "Freguesia..."
            }
            className="w-full border rounded-lg p-2 disabled:bg-gray-100 disabled:text-gray-400"
          />
          {comFreguesia && municipioSel && freguesiaOpen && freguesiaSugestoes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
              {freguesiaSugestoes.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => selecionarFreguesia(f)}
                  className="w-full text-left px-4 py-2 hover:bg-terra-50 border-b last:border-b-0 transition"
                >
                  <div className="font-medium">{f.nome}</div>
                  <div className="text-xs text-gray-600">{f.localidade}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumo da seleção */}
      {municipioSel && (
        <div className="mt-1 p-2 bg-terra-50 rounded-lg text-sm">
          <strong>{municipioSel}</strong>
          {comFreguesia && freguesiaSel && <> • {freguesiaSel.nome}</>}
          {!comFreguesia && <span className="text-gray-500"> • sem freguesia</span>}
        </div>
      )}
    </div>
  );
}
