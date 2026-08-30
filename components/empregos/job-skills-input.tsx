"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface SkillOpt {
  id: number;
  nome: string;
}

export interface JobSkillValue {
  skill_id: number;
  nome: string;
  obrigatoria: boolean;
}

interface JobSkillsInputProps {
  catalogo: SkillOpt[];
  valorInicial?: JobSkillValue[];
}

/**
 * Equivalente a components/candidatos/skills-picker.tsx, mas para o lado
 * da vaga: em vez de um "nível" por competência, cada competência pedida
 * marca-se como obrigatória ou desejável (usado depois pelo motor de
 * matching da Fase 7 para pesar a sobreposição de forma diferente).
 * Pensado para formulários FormData + server action: guarda tudo num
 * único <input type="hidden" name="job_skills_json"> como JSON, para não
 * depender de nomes de campo indexados/paralelos.
 */
export function JobSkillsInput({ catalogo, valorInicial = [] }: JobSkillsInputProps) {
  const [value, setValue] = useState<JobSkillValue[]>(valorInicial);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selecionadosIds = useMemo(
    () => new Set(value.map((v) => v.skill_id)),
    [value]
  );

  const sugestoes = useMemo(() => {
    if (inputValue.trim() === "") return [];
    const query = inputValue.toLowerCase();
    return catalogo
      .filter(
        (s) => !selecionadosIds.has(s.id) && s.nome.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [inputValue, catalogo, selecionadosIds]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function adicionar(s: SkillOpt) {
    setValue((v) => [...v, { skill_id: s.id, nome: s.nome, obrigatoria: true }]);
    setInputValue("");
    setIsOpen(false);
  }

  function remover(skillId: number) {
    setValue((v) => v.filter((s) => s.skill_id !== skillId));
  }

  function toggleObrigatoria(skillId: number) {
    setValue((v) =>
      v.map((s) =>
        s.skill_id === skillId ? { ...s, obrigatoria: !s.obrigatoria } : s
      )
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name="job_skills_json"
        value={JSON.stringify(
          value.map((v) => ({ skill_id: v.skill_id, obrigatoria: v.obrigatoria }))
        )}
      />

      <div ref={containerRef} className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (sugestoes.length > 0) setIsOpen(true);
          }}
          placeholder="Procurar competência pedida (ex: Excel, Condução profissional...)"
          className="w-full border rounded-lg p-2"
        />
        {isOpen && sugestoes.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-terra-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {sugestoes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => adicionar(s)}
                className="w-full text-left px-4 py-2 hover:bg-terra-50 border-b border-terra-100 last:border-b-0"
              >
                {s.nome}
              </button>
            ))}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((v) => (
            <li key={v.skill_id} className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{v.nome}</Badge>
              <label className="flex items-center gap-1 text-xs text-terra-700">
                <input
                  type="checkbox"
                  checked={v.obrigatoria}
                  onChange={() => toggleObrigatoria(v.skill_id)}
                  className="w-3.5 h-3.5"
                />
                Obrigatória
              </label>
              <button
                type="button"
                onClick={() => remover(v.skill_id)}
                className="text-xs text-red-600 hover:underline"
              >
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
