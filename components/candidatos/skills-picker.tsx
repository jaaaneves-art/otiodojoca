"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface SkillOpt {
  id: number;
  nome: string;
}

export interface SelectedSkill {
  skill_id: number;
  nome: string;
  nivel: string;
}

interface SkillsPickerProps {
  catalogo: SkillOpt[];
  value: SelectedSkill[];
  onChange: (value: SelectedSkill[]) => void;
}

const NIVEIS = [
  { value: "basico", label: "Básico" },
  { value: "intermedio", label: "Intermédio" },
  { value: "avancado", label: "Avançado" },
];

/**
 * Seletor de competências: procura no catálogo `skills`, adiciona como
 * "tag" com um nível (básico/intermédio/avançado), remove com um clique.
 * Guarda tudo em memória (value/onChange) — quem chama decide quando
 * gravar (candidate-profile-form.tsx grava tudo junto no submit).
 */
export function SkillsPicker({ catalogo, value, onChange }: SkillsPickerProps) {
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
    onChange([...value, { skill_id: s.id, nome: s.nome, nivel: "intermedio" }]);
    setInputValue("");
    setIsOpen(false);
  }

  function remover(skillId: number) {
    onChange(value.filter((v) => v.skill_id !== skillId));
  }

  function mudarNivel(skillId: number, nivel: string) {
    onChange(
      value.map((v) => (v.skill_id === skillId ? { ...v, nivel } : v))
    );
  }

  return (
    <div className="space-y-3">
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
          placeholder="Procurar competência (ex: Excel, Cozinha, Vendas)..."
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
              <select
                value={v.nivel}
                onChange={(e) => mudarNivel(v.skill_id, e.target.value)}
                className="border rounded-lg px-2 py-1 text-sm"
              >
                {NIVEIS.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
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
