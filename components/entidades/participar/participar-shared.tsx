"use client";

import { useId } from "react";

// Peças reutilizadas pelos dois wizards dedicados
// (participar-wizard-municipio.tsx e participar-wizard-freguesia.tsx).
// Município e Freguesia deixaram de partilhar um único formulário com um
// passo de escolha de tipo — cada um tem agora a sua rota e o seu wizard
// próprio (/participar/municipio, /participar/freguesia); o que continua
// a fazer sentido partilhar é só estas peças de interface, não o fluxo.

export const PASSOS = [
  { numero: 1, titulo: "A sua entidade" },
  { numero: 2, titulo: "Responsáveis" },
  { numero: 3, titulo: "Acesso" },
  { numero: 4, titulo: "Confirmar" },
];

export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function semAcentos(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function ProgressoPassos({ step }: { step: number }) {
  return (
    <div className="mb-8" aria-label="Progresso do registo">
      <div className="flex items-center justify-between text-xs font-medium text-terra-500">
        {PASSOS.map((p) => (
          <span
            key={p.numero}
            className={step >= p.numero ? "text-terra-800" : ""}
            aria-current={step === p.numero ? "step" : undefined}
          >
            {String(p.numero).padStart(2, "0")} · {p.titulo}
          </span>
        ))}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-terra-100">
        <div
          className="h-full rounded-full bg-terra-600 transition-all duration-300"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function Cabecalho({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mb-7">
      <h3 className="text-xl font-semibold text-terra-900">{titulo}</h3>
      <p className="mt-1 text-sm leading-6 text-terra-500">{texto}</p>
    </div>
  );
}

interface CampoProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  error?: string;
}

export function Campo({ label, value, onChange, placeholder, required, type = "text", error }: CampoProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-terra-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-erro` : undefined}
        className="flex h-10 w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm placeholder:text-terra-400 focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
      />
      {error && (
        <p id={`${id}-erro`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function Resumo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-terra-50 p-5">
      <h4 className="mb-4 font-semibold text-terra-900">{titulo}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-terra-200 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between">
      <span className="text-sm text-terra-500">{label}</span>
      <span className="text-sm font-medium text-terra-800 sm:text-right">{value || "—"}</span>
    </div>
  );
}
