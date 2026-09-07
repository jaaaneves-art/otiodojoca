import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LocalSelector } from "@/components/entidades/local-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TIPOS = [
  ["cultural", "Cultural"],
  ["festa", "Festa"],
  ["desporto", "Desporto"],
  ["workshop", "Workshop"],
  ["encontro", "Encontro"],
  ["culto", "Culto"],
  ["outro", "Outro"],
] as const;

function criarSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function criarEvento(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Não autenticado.");
  }

  const entidadeId = Number(formData.get("entidade_id"));
  const freguesiaId = Number(formData.get("freguesia_id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const lugar = String(formData.get("lugar") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const inicioRaw = String(formData.get("inicio") ?? "");
  const fimRaw = String(formData.get("fim") ?? "");

  if (!entidadeId || !freguesiaId || !nome || !tipo || !inicioRaw) {
    throw new Error("Preenche os campos obrigatórios.");
  }

  if (!TIPOS.some(([value]) => value === tipo)) {
    throw new Error("Tipo de espetáculo inválido.");
  }

  const { data: membership } = await supabase
    .from("event_organization_members")
    .select("role")
    .eq("entidade_id", entidadeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !membership ||
    !["owner", "admin", "manager"].includes(membership.role)
  ) {
    throw new Error("Não tens permissão para criar espetáculos nesta entidade.");
  }

  const inicio = new Date(inicioRaw);

  if (Number.isNaN(inicio.getTime())) {
    throw new Error("Data de início inválida.");
  }

  let fim: Date | null = null;

  if (fimRaw) {
    fim = new Date(fimRaw);

    if (Number.isNaN(fim.getTime()) || fim <= inicio) {
      throw new Error("A data de fim tem de ser posterior ao início.");
    }
  }

  const slugBase = criarSlug(nome);

  if (!slugBase) {
    throw new Error("Nome do espetáculo inválido.");
  }

  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const { data: evento, error } = await supabase
    .from("eventos")
    .insert({
      nome,
      slug,
      descricao: descricao || null,
      inicio: inicio.toISOString(),
      fim: fim?.toISOString() ?? null,
      freguesia_id: freguesiaId,
      lugar: lugar || null,
      entidade_organizadora_id: entidadeId,
      tipo,
      estado: "rascunho",
      criado_por: user.id,
      atualizado_por: user.id,
    })
    .select("id")
    .single();

  if (error || !evento) {
    throw new Error(
      "Não foi possível criar o espetáculo: " + (error?.message ?? "")
    );
  }

  redirect(`/espectaculos/organizador/eventos/${evento.id}`);
}

export default async function NovoEventoPage({
  searchParams,
}: {
  searchParams: Promise<{ entidade?: string }>;
}) {
  const params = await searchParams;
  const entidadeId = Number(params.entidade);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!entidadeId) {
    redirect("/espectaculos/organizador");
  }

  const { data: membership } = await supabase
    .from("event_organization_members")
    .select("role")
    .eq("entidade_id", entidadeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !membership ||
    !["owner", "admin", "manager"].includes(membership.role)
  ) {
    redirect("/espectaculos/organizador");
  }

  const [{ data: entidade }, { data: freguesias }] = await Promise.all([
    supabase
      .from("entidades")
      .select("id,nome")
      .eq("id", entidadeId)
      .single(),
    supabase
      .from("freguesias")
      .select("id,cod_ine,nome,municipio,localidade,email,telefone")
      .eq("active", true)
      .order("municipio")
      .order("nome"),
  ]);

  if (!entidade) {
    redirect("/espectaculos/organizador");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <Link
            href="/espectaculos/organizador"
            className="text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            ← Painel do organizador
          </Link>
          <h1 className="mt-1 text-2xl font-black text-slate-950">
            Novo espetáculo
          </h1>
          <p className="mt-1 text-sm text-slate-500">{entidade.nome}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Informação do espetáculo</CardTitle>
          </CardHeader>

          <CardContent>
            <form action={criarEvento} className="space-y-6">
              <input
                type="hidden"
                name="entidade_id"
                value={entidade.id}
              />

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nome *
                </label>
                <Input name="nome" required maxLength={200} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  rows={6}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Tipo *
                </label>
                <select
                  name="tipo"
                  required
                  defaultValue=""
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Escolher tipo
                  </option>
                  {TIPOS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <LocalSelector freguesias={freguesias ?? []} />

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Lugar
                </label>
                <Input
                  name="lugar"
                  placeholder="Ex.: Auditório Municipal"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Início *
                  </label>
                  <Input type="datetime-local" name="inicio" required />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Fim
                  </label>
                  <Input type="datetime-local" name="fim" />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                <Button variant="outline" asChild>
                  <Link href="/espectaculos/organizador">
                    Cancelar
                  </Link>
                </Button>

                <Button type="submit">
                  Criar rascunho
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
