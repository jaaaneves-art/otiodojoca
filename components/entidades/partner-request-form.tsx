"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Categoria = { id: number; nome: string; icone?: string | null };

export function PartnerRequestForm({
  categorias,
  userEmail,
}: {
  categorias: Categoria[];
  userEmail?: string | null;
}) {
  const supabase = createClient();
  const [nomeEntidade, setNomeEntidade] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [localizacao, setLocalizacao] = useState("");
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
      tipo_entidade: "outro",
      nome_entidade: nomeEntidade.trim(),
      categoria_id: categoriaId ? Number(categoriaId) : null,
      localizacao_texto: localizacao.trim() || null,
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
          Nome da entidade *
        </label>
        <Input
          id="nome_entidade"
          required
          value={nomeEntidade}
          onChange={(e) => setNomeEntidade(e.target.value)}
          placeholder="ex.: Junta de Freguesia de..."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="categoria" className="text-sm font-medium">
          Tipo de entidade
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
      </div>

      <div className="space-y-2">
        <label htmlFor="localizacao" className="text-sm font-medium">
          Concelho / Freguesia
        </label>
        <Input
          id="localizacao"
          value={localizacao}
          onChange={(e) => setLocalizacao(e.target.value)}
          placeholder="ex.: Sintra — Sao Pedro de Penaferrim"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="contacto_email" className="text-sm font-medium">
            Email de contacto
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
          placeholder="Conta-nos um pouco sobre a entidade e o que gostavam de fazer na plataforma."
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
