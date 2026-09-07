import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { portugalLocalToUtc } from "@/lib/portugal-datetime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function criarSessao(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Não autenticado.");
  }

  const eventoId = Number(formData.get("evento_id"));
  const inicioRaw = String(formData.get("starts_at") ?? "");
  const fimRaw = String(formData.get("ends_at") ?? "");
  const capacidade = Number(formData.get("capacity"));

  if (!eventoId || !inicioRaw || !capacidade || capacidade < 1) {
    throw new Error("Preenche os campos obrigatórios.");
  }

  const { data: evento } = await supabase
    .from("eventos")
    .select("id,entidade_organizadora_id")
    .eq("id", eventoId)
    .maybeSingle();

  if (!evento) {
    throw new Error("Espetáculo não encontrado.");
  }

  const { data: membership } = await supabase
    .from("event_organization_members")
    .select("role")
    .eq("entidade_id", evento.entidade_organizadora_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !membership ||
    !["owner", "admin", "manager"].includes(membership.role)
  ) {
    throw new Error("Não tens permissão para gerir este espetáculo.");
  }

  const inicio = portugalLocalToUtc(inicioRaw);

  if (Number.isNaN(inicio.getTime())) {
    throw new Error("Data de início inválida.");
  }

  let fim: Date | null = null;

  if (fimRaw) {
    fim = portugalLocalToUtc(fimRaw);

    if (Number.isNaN(fim.getTime()) || fim <= inicio) {
      throw new Error("A data de fim tem de ser posterior ao início.");
    }
  }

  const { data: sessao, error } = await supabase
    .from("event_sessions")
    .insert({
      evento_id: eventoId,
      starts_at: inicio.toISOString(),
      ends_at: fim?.toISOString() ?? null,
      capacity: capacidade,
      status: "scheduled",
      sales_enabled: false,
    })
    .select("id")
    .single();

  if (error || !sessao) {
    throw new Error(
      "Não foi possível criar a sessão: " + (error?.message ?? "")
    );
  }

  redirect(
    `/espectaculos/organizador/eventos/${eventoId}/sessoes/${sessao.id}`
  );
}

export default async function NovaSessaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventoId = Number(id);

  if (!eventoId) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: evento } = await supabase
    .from("eventos")
    .select("id,nome,entidade_organizadora_id")
    .eq("id", eventoId)
    .maybeSingle();

  if (!evento) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("event_organization_members")
    .select("role")
    .eq("entidade_id", evento.entidade_organizadora_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !membership ||
    !["owner", "admin", "manager"].includes(membership.role)
  ) {
    redirect(`/espectaculos/organizador/eventos/${eventoId}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <Link
            href={`/espectaculos/organizador/eventos/${evento.id}`}
            className="text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            ← {evento.nome}
          </Link>

          <h1 className="mt-1 text-2xl font-black text-slate-950">
            Nova sessão
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Horário e capacidade</CardTitle>
          </CardHeader>

          <CardContent>
            <form action={criarSessao} className="space-y-6">
              <input
                type="hidden"
                name="evento_id"
                value={evento.id}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Início *
                  </label>
                  <Input
                    type="datetime-local"
                    name="starts_at"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Fim
                  </label>
                  <Input
                    type="datetime-local"
                    name="ends_at"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Capacidade *
                </label>
                <Input
                  type="number"
                  name="capacity"
                  min="1"
                  step="1"
                  required
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                A sessão será criada com as vendas desativadas. Os tipos
                de bilhete são configurados no passo seguinte.
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                <Button variant="outline" asChild>
                  <Link
                    href={`/espectaculos/organizador/eventos/${evento.id}`}
                  >
                    Cancelar
                  </Link>
                </Button>

                <Button type="submit">
                  Criar sessão
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
