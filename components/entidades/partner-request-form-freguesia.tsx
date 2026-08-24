"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FreguesiaAutocomplete } from "@/components/entidades/freguesias/freguesia-autocomplete";

type Freguesia = {
  id: number;
  cod_ine: string;
  nome: string;
  municipio: string;
  localidade: string;
  email?: string;
  telefone?: string;
};

const CARGOS = [
  "Presidente da Junta",
  "Secretario(a)",
  "Tesoureiro(a)",
  "Vogal",
  "Outro",
];

export function PartnerRequestFormFreguesia({
  freguesias,
  userEmail,
}: {
  freguesias: Freguesia[];
  userEmail?: string | null;
}) {
  const supabase = createClient();
  const [freguesia, setFreguesia] = useState<Freguesia | null>(null);
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState(userEmail ?? "");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function selecionarFreguesia(f: Freguesia | null) {
    setFreguesia(f);
    // Pre-preenche contacto com o que ja esta registado para a freguesia,
    // sem sobrepor o que o utilizador ja tenha escrito.
    if (f) {
      if (!email && f.email) setEmail(f.email);
      if (!telefone && f.telefone) setTelefone(f.telefone);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!freguesia) {
      setError("Seleciona a freguesia.");
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
      tipo_entidade: "freguesia",
      freguesia_id: freguesia.id,
      nome_entidade: `Junta de Freguesia de ${freguesia.nome}`,
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
          Obrigado. A nossa equipa vai analisar o pedido da{" "}
          <strong>Junta de Freguesia de {freguesia?.nome}</strong> e entra em
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
      <FreguesiaAutocomplete freguesias={freguesias} onFreguesiaSelect={selecionarFreguesia} />

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
          placeholder="O que gostaria a junta de fazer na plataforma?"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading || !freguesia}>
        {loading ? "A enviar..." : "Enviar pedido"}
      </Button>
    </form>
  );
}
