"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Categoria = { id: number; nome: string; icone?: string | null };

export function PartnerRequestFormOrganismo({
  categorias,
  userEmail,
}: {
  categorias: Categoria[];
  userEmail?: string | null;
}) {
  const supabase = createClient();
  const [nomeEntidade, setNomeEntidade] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [nipc, setNipc] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState(userEmail ?? "");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setLoading(false);
      setError("A tua sessao expirou. Entra novamente e tenta outra vez.");
      return;
    }

    const { error: insertError } = await supabase.from("entidade_pedidos").insert({
      profile_id: auth.user.id,
      tipo_entidade: "organismo_publico",
      nome_entidade: nomeEntidade.trim(),
      categoria_id: categoriaId ? Number(categoriaId) : null,
      nipc: nipc.trim() || null,
      cargo: cargo.trim() || null,
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
          Obrigado. A nossa equipa vai analisar o pedido de{" "}
          <strong>{nomeEntidade}</strong> e entra em contacto brevemente.
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
        <label htmlFor="nome_entidade" className="text-sm font-medium">
          Nome do organismo *
        </label>
        <Input
          id="nome_entidade"
          required
          value={nomeEntidade}
          onChange={(e) => setNomeEntidade(e.target.value)}
          placeholder="ex.: Direcao Regional de Agricultura e Pescas do..."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="categoria" className="text-sm font-medium">
          Tipo de organismo
        </label>
        <select
          id="categoria"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent"
        >
          <option value="">Selecionar…</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icone ? `${c.icone} ` : ""}
              {c.nome}
            </option>
          ))}
        </select>
        <p className="text-xs text-terra-500">
          Direcao Regional, Instituicao de Ensino, Centro de Investigacao,
          Casa do Povo ou outro organismo publico.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="nipc" className="text-sm font-medium">
            NIPC (opcional)
          </label>
          <Input id="nipc" value={nipc} onChange={(e) => setNipc(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="cargo" className="text-sm font-medium">
            O teu cargo/funcao
          </label>
          <Input id="cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} />
        </div>
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
          placeholder="Conta-nos um pouco sobre o organismo e o que gostavam de fazer na plataforma."
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading || !nomeEntidade.trim()}>
        {loading ? "A enviar..." : "Enviar pedido"}
      </Button>
    </form>
  );
}
