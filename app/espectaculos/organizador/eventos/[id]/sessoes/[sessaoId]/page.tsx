import Link from "next/link";
import { cents } from "@/lib/espectaculos/validation";
import { cancelSession, updateTicketInventory, updateSessionCapacity } from "@/lib/espectaculos/actions";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function criarTipoBilhete(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");

  const eventoId = Number(formData.get("evento_id"));
  const sessaoId = Number(formData.get("sessao_id"));
  const nome = String(formData.get("name") ?? "").trim();
  const precoRaw = String(formData.get("price") ?? "").replace(",", ".");
  const quantidade = Number(formData.get("quantity"));
  const maxPorEncomendaRaw = String(
    formData.get("max_per_order") ?? ""
  ).trim();

  if (!eventoId || !sessaoId || !nome || !Number.isSafeInteger(quantidade) || quantidade < 1) {
    throw new Error("Preenche os campos obrigatórios.");
  }

  const priceCents = cents(precoRaw || "0");

  const maxPerOrder = maxPorEncomendaRaw
    ? Number(maxPorEncomendaRaw)
    : null;

  if (
    maxPerOrder !== null &&
    (!Number.isInteger(maxPerOrder) || maxPerOrder < 1)
  ) {
    throw new Error("Limite por encomenda inválido.");
  }

  const { data: sessao } = await supabase
    .from("event_sessions")
    .select("id,evento_id")
    .eq("id", sessaoId)
    .eq("evento_id", eventoId)
    .maybeSingle();

  if (!sessao) {
    throw new Error("Sessão não encontrada.");
  }

  const { data: evento } = await supabase
    .from("eventos")
    .select("entidade_organizadora_id")
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
    throw new Error("Não tens permissão para gerir esta sessão.");
  }

  const { error } = await supabase
    .from("event_ticket_types")
    .insert({
      session_id: sessaoId,
      name: nome,
      price_cents: priceCents,
      currency: "EUR",
      quantity: quantidade,
      max_per_order: maxPerOrder,
      active: true,
    });

  if (error) {
    throw new Error(
      "Não foi possível criar o tipo de bilhete: " + error.message
    );
  }

  revalidatePath(
    `/espectaculos/organizador/eventos/${eventoId}/sessoes/${sessaoId}`
  );
}

async function alterarVendas(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");

  const eventoId = Number(formData.get("evento_id"));
  const sessaoId = Number(formData.get("sessao_id"));
  const ativar = formData.get("ativar") === "true";

  const { data: evento } = await supabase
    .from("eventos")
    .select("entidade_organizadora_id")
    .eq("id", eventoId)
    .maybeSingle();

  if (!evento) throw new Error("Espetáculo não encontrado.");

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
    throw new Error("Sem permissão.");
  }

  const { data: sessao, error } = await supabase
    .from("event_sessions")
    .update({ sales_enabled: ativar })
    .eq("id", sessaoId)
    .eq("evento_id", eventoId)
    .select("id")
    .single();

  if (error || !sessao) {
    throw new Error(
      "Não foi possível alterar as vendas: " + (error?.message ?? "")
    );
  }

  revalidatePath(
    `/espectaculos/organizador/eventos/${eventoId}/sessoes/${sessaoId}`
  );
  revalidatePath(`/espectaculos/organizador/eventos/${eventoId}`);
}

export default async function GerirSessaoPage({
  params,
}: {
  params: Promise<{ id: string; sessaoId: string }>;
}) {
  const { id, sessaoId: sessaoParam } = await params;
  const eventoId = Number(id);
  const sessaoId = Number(sessaoParam);

  if (!eventoId || !sessaoId) notFound();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: evento } = await supabase
    .from("eventos")
    .select("id,nome,entidade_organizadora_id")
    .eq("id", eventoId)
    .maybeSingle();

  if (!evento) notFound();

  const { data: membership } = await supabase
    .from("event_organization_members")
    .select("role")
    .eq("entidade_id", evento.entidade_organizadora_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) notFound();

  const [{ data: sessao }, { data: tipos }] = await Promise.all([
    supabase
      .from("event_sessions")
      .select(
        "id,starts_at,ends_at,capacity,status,sales_enabled"
      )
      .eq("id", sessaoId)
      .eq("evento_id", eventoId)
      .maybeSingle(),

    supabase
      .from("event_ticket_types")
      .select(
        "id,name,description,price_cents,currency,quantity,max_per_order,active,sales_start,sales_end"
      )
      .eq("session_id", sessaoId)
      .order("sort_order"),
  ]);

  if (!sessao) notFound();

  const podeGerir = ["owner", "admin", "manager"].includes(
    membership.role
  );

  const { data: availability } = await supabase.rpc("event_availability", { p_session: sessao.id });
  const stock = new Map<number, number>((availability ?? []).map((row: { ticket_type_id: number; available: number }) => [row.ticket_type_id, row.available]));
  const localDate = (value: string | null) => {
    if (!value) return "";
    const parts = Object.fromEntries(new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-4">
          <Link
            href={`/espectaculos/organizador/eventos/${evento.id}`}
            className="text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            ← {evento.nome}
          </Link>

          <h1 className="mt-1 text-2xl font-black text-slate-950">
            Gerir sessão
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {new Intl.DateTimeFormat("pt-PT", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Europe/Lisbon",
            }).format(new Date(sessao.starts_at))}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8">
        {podeGerir && sessao.status !== "cancelled" && <form action={cancelSession}><input type="hidden" name="event_id" value={eventoId} /><input type="hidden" name="session_id" value={sessaoId} /><Button variant="outline">Cancelar sessão e sinalizar análise financeira</Button></form>}
        {podeGerir && <form action={updateSessionCapacity} className="flex flex-wrap items-end gap-3 rounded border p-4"><input type="hidden" name="event_id" value={eventoId} /><input type="hidden" name="session_id" value={sessaoId} /><label>Capacidade total<Input name="capacity" type="number" min="1" step="1" defaultValue={sessao.capacity} required /></label><Button variant="outline">Atualizar capacidade</Button></form>}
        <Card>
          <CardHeader>
            <CardTitle>Estado da sessão</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                <div>
                  Capacidade:{" "}
                  <strong>{sessao.capacity}</strong>
                </div>
                <div className="mt-1">
                  Vendas:{" "}
                  <strong>
                    {sessao.sales_enabled
                      ? "ativas"
                      : "desativadas"}
                  </strong>
                </div>
              </div>

              {podeGerir && (
                <form action={alterarVendas}>
                  <input
                    type="hidden"
                    name="evento_id"
                    value={eventoId}
                  />
                  <input
                    type="hidden"
                    name="sessao_id"
                    value={sessaoId}
                  />
                  <input
                    type="hidden"
                    name="ativar"
                    value={
                      sessao.sales_enabled ? "false" : "true"
                    }
                  />

                  <Button
                    type="submit"
                    variant={
                      sessao.sales_enabled
                        ? "outline"
                        : "default"
                    }
                  >
                    {sessao.sales_enabled
                      ? "Desativar vendas"
                      : "Ativar vendas"}
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de bilhete</CardTitle>
          </CardHeader>

          <CardContent>
            {!tipos || tipos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <Ticket className="mx-auto h-9 w-9 text-slate-400" />
                <p className="mt-3 text-sm text-slate-500">
                  Ainda não existem tipos de bilhete.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tipos.map((tipo) => (
                  <div
                    key={tipo.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {tipo.name}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        {tipo.quantity} configurados · {stock.get(tipo.id) ?? "—"} disponíveis
                        {tipo.max_per_order
                          ? ` · máximo ${tipo.max_per_order} por encomenda`
                          : ""}
                      </div>
                    </div>

                    <div className="text-lg font-black text-slate-900">
                      {tipo.price_cents === 0
                        ? "Grátis"
                        : new Intl.NumberFormat("pt-PT", {
                            style: "currency",
                            currency: tipo.currency,
                          }).format(tipo.price_cents / 100)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {podeGerir && tipos?.map(tipo => <details key={`edit-${tipo.id}`} className="rounded border p-4"><summary className="cursor-pointer font-semibold">Editar {tipo.name}</summary><form action={updateTicketInventory} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="event_id" value={eventoId} /><input type="hidden" name="session_id" value={sessaoId} /><input type="hidden" name="ticket_type_id" value={tipo.id} />
          <label>Quantidade total<Input name="quantity" type="number" min="1" step="1" defaultValue={tipo.quantity} required /></label>
          <label>Preço (€)<Input name="price" type="number" min="0" step="0.01" defaultValue={(tipo.price_cents / 100).toFixed(2)} required /></label>
          <label>Máximo por encomenda<Input name="max_per_order" type="number" min="1" step="1" defaultValue={tipo.max_per_order ?? ""} /></label>
          <label>Início de vendas (Portugal)<Input name="sales_start" type="datetime-local" defaultValue={localDate(tipo.sales_start)} /></label>
          <label>Fim de vendas (Portugal)<Input name="sales_end" type="datetime-local" defaultValue={localDate(tipo.sales_end)} /></label>
          <label><input name="active" type="checkbox" defaultChecked={tipo.active} /> Ativo</label>
          <p className="text-sm text-slate-500">As encomendas existentes mantêm o preço e as condições da compra.</p><Button>Guardar tipo de bilhete</Button>
        </form></details>)}
        {podeGerir && (
          <Card>
            <CardHeader>
              <CardTitle>Adicionar tipo de bilhete</CardTitle>
            </CardHeader>

            <CardContent>
              <form
                action={criarTipoBilhete}
                className="space-y-5"
              >
                <input
                  type="hidden"
                  name="evento_id"
                  value={eventoId}
                />
                <input
                  type="hidden"
                  name="sessao_id"
                  value={sessaoId}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Nome *
                  </label>
                  <Input
                    name="name"
                    required
                    placeholder="Ex.: Bilhete geral"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Preço (€) *
                    </label>
                    <Input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Quantidade *
                    </label>
                    <Input
                      name="quantity"
                      type="number"
                      min="1"
                      step="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Máximo por encomenda
                    </label>
                    <Input
                      name="max_per_order"
                      type="number"
                      min="1"
                      step="1"
                    />
                  </div>
                </div>

                <Button type="submit">
                  Adicionar bilhete
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
