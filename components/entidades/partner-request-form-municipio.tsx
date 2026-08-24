"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Municipio = { id: number; nome: string; distrito_regiao: string };

const CARGOS = [
  "Presidente da Camara",
  "Vice-Presidente",
  "Vereador(a)",
  "Tecnico(a) Municipal",
  "Outro",
];

export function PartnerRequestFormMunicipio({
  municipios,
  userEmail,
}: {
  municipios: Municipio[];
  userEmail?: string | null;
}) {
  const supabase = createClient();
  const [municipioId, setMunicipioId] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState(userEmail ?? "");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const municipioSelecionado = municipios.find((m) => String(m.id) === municipioId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!municipioSelecionado) {
      setError("Seleciona o municipio.");
      return;
    }

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setLoading(false);
      setError("A tua sessao expirou. Entra novamente e tenta outra vez.");
      return;
    }

    const { error: insertError } = await supabase.from("entidade_pedidos").insert({
      profile_id: auth.user.id,
      tipo_entidade: "municipio",
      municipio_id: municipioSelecionado.id,
      nome_entidade: `Camara Municipal de ${municipioSelecionado.nome}`,
      cargo: cargo || null,
      contacto_email: email.trim() || null,
      contacto_telefone: telefone.trim() || null,
      mensagem: mensagem.trim() || null,
    });

    setLoading(false);

    if (insertError) {
      setError("Nao foi possivel enviar o pedido. Tenta novamente.");
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="rounded-xl border border-terra-200 bg-white p-6 text-center">
        <div className="mb-2 text-3xl">✅</div>
        <h2 className="text-lg font-semibold text-terra-900">Pedido enviado</h2>
        <p className="mt-2 text-sm text-terra-600">
          Obrigado. A nossa equipa vai analisar o pedido do{" "}
          <strong>Municipio de {municipioSelecionado?.nome}</strong> e entra em
          contacto brevemente.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-terra-200 bg-white p-6"
    >
      <div className="space-y-2">
        <label htmlFor="municipio" className="text-sm font-medium">
          Municipio *
        </label>
        <select
          id="municipio"
          required
          value={municipioId}
          onChange={(e) => setMunicipioId(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent"
        >
          <option value="">Selecionar…</option>
          {municipios.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome} — {m.distrito_regiao}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="cargo" className="text-sm font-medium">
          O teu cargo
        </label>
        <select
          id="cargo"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent"
        >
          <option value="">Selecionar…</option>
          {CARGOS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="contacto_email" className="text-sm font-medium">
            Email institucional
          </label>
          <Input
            id="contacto_email"
            type="email"
            placeholder="ex.: geral@cm-municipio.pt"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="contacto_telefone" className="text-sm font-medium">
            Telefone
          </label>
          <Input
            id="contacto_telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="mensagem" className="text-sm font-medium">
          Mensagem (opcional)
        </label>
        <textarea
          id="mensagem"
          rows={4}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          className="flex w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm placeholder:text-terra-400 focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent"
          placeholder="O que gostaria o municipio de fazer na plataforma?"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading || !municipioId}>
        {loading ? "A enviar..." : "Enviar pedido"}
      </Button>
    </form>
  );
}
