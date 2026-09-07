import { SalesSummary, type SalesRow } from "@/components/espectaculos/sales-summary";
import Link from "next/link";
import { changeEventStatus } from "@/lib/espectaculos/actions";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  Plus,
  Ticket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Sessao = {
  id: number;
  starts_at: string;
  ends_at: string | null;
  capacity: number;
  status: string;
  sales_enabled: boolean;
};

type TipoBilhete = {
  id: number;
  session_id: number;
  name: string;
  price_cents: number;
  currency: string;
  quantity: number;
  active: boolean;
};

const estadoLabel: Record<string, string> = {
  rascunho: "Rascunho",
  validado: "Validado",
  publicado: "Publicado",
  cancelado: "Cancelado",
  arquivado: "Arquivado",
};

const sessaoLabel: Record<string, string> = {
  scheduled: "Agendada",
  sold_out: "Esgotada",
  cancelled: "Cancelada",
  finished: "Terminada",
};

export default async function GerirEventoPage({
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
    .select(
      "id,nome,descricao,inicio,fim,lugar,tipo,estado,freguesia_id,entidade_organizadora_id"
    )
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

  if (!membership) {
    notFound();
  }

  const [{ data: entidade }, { data: freguesia }, { data: sessoesData }] =
    await Promise.all([
      supabase
        .from("entidades")
        .select("id,nome")
        .eq("id", evento.entidade_organizadora_id)
        .maybeSingle(),

      supabase
        .from("freguesias")
        .select("id,nome,municipio")
        .eq("id", evento.freguesia_id)
        .maybeSingle(),

      supabase
        .from("event_sessions")
        .select(
          "id,starts_at,ends_at,capacity,status,sales_enabled"
        )
        .eq("evento_id", eventoId)
        .order("starts_at"),
    ]);

  const sessoes = (sessoesData ?? []) as Sessao[];
  const sessaoIds = sessoes.map((sessao) => sessao.id);

  let tiposBilhete: TipoBilhete[] = [];

  if (sessaoIds.length > 0) {
    const { data } = await supabase
      .from("event_ticket_types")
      .select(
        "id,session_id,name,price_cents,currency,quantity,active"
      )
      .in("session_id", sessaoIds)
      .order("sort_order");

    tiposBilhete = (data ?? []) as TipoBilhete[];
  }

  const podeGerir = ["owner", "admin", "manager"].includes(
    membership.role
  );

  const { data: sales, error: salesError } = membership.role !== 'checkin' ? await supabase.rpc('event_sales_summary', { p_event: eventoId }) : { data: null, error: null };
  if (salesError) throw new Error('Não foi possível carregar o resumo de vendas.');
  const availability = new Map<number, number>();
  for (const sessao of sessoes) {
    const { data } = await supabase.rpc("event_availability", { p_session: sessao.id });
    for (const row of data ?? []) availability.set(row.ticket_type_id, row.available);
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-5">
          <Link
            href="/espectaculos/organizador"
            className="text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            ← Painel do organizador
          </Link>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-950">
                  {evento.nome}
                </h1>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {estadoLabel[evento.estado] ?? evento.estado}
                </span>
              </div>

              {entidade && (
                <p className="mt-1 text-sm text-slate-500">
                  {entidade.nome}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-5 pt-5">
        {["owner", "admin", "finance"].includes(membership.role) && <Link className="rounded border p-2" href={`/espectaculos/organizador/eventos/${evento.id}/encomendas`}>Encomendas e reembolsos</Link>}
        {podeGerir && evento.estado !== "publicado" && evento.estado !== "cancelado" && <form action={changeEventStatus}><input type="hidden" name="event_id" value={evento.id} /><input type="hidden" name="status" value="publicado" /><Button>Publicar espetáculo</Button></form>}
        {podeGerir && evento.estado !== "cancelado" && <form action={changeEventStatus}><input type="hidden" name="event_id" value={evento.id} /><input type="hidden" name="status" value="cancelado" /><Button variant="outline">Cancelar e sinalizar análise financeira</Button></form>}
      </div>
      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {sales && <SalesSummary rows={sales as SalesRow[]} />}
          <Card>
            <CardHeader>
              <CardTitle>Informação</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex gap-3 text-sm text-slate-600">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />

                <div>
                  <div className="font-medium text-slate-900">
                    {new Intl.DateTimeFormat("pt-PT", {
                      dateStyle: "long",
                      timeStyle: "short",
                      timeZone: "Europe/Lisbon",
                    }).format(new Date(evento.inicio))}
                  </div>

                  {evento.fim && (
                    <div>
                      até{" "}
                      {new Intl.DateTimeFormat("pt-PT", {
                        dateStyle: "long",
                        timeStyle: "short",
                        timeZone: "Europe/Lisbon",
                      }).format(new Date(evento.fim))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 text-sm text-slate-600">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />

                <div>
                  {evento.lugar && (
                    <div className="font-medium text-slate-900">
                      {evento.lugar}
                    </div>
                  )}

                  {freguesia && (
                    <div>
                      {freguesia.nome}, {freguesia.municipio}
                    </div>
                  )}
                </div>
              </div>

              {evento.descricao && (
                <p className="whitespace-pre-line border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
                  {evento.descricao}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Sessões</CardTitle>

                {podeGerir && (
                  <Button size="sm" asChild>
                    <Link
                      href={`/espectaculos/organizador/eventos/${evento.id}/sessoes/nova`}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Nova sessão
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {sessoes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                  <CalendarDays className="mx-auto h-9 w-9 text-slate-400" />
                  <p className="mt-3 text-sm text-slate-500">
                    Ainda não existem sessões para este espetáculo.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessoes.map((sessao) => {
                    const bilhetes = tiposBilhete.filter(
                      (tipo) => tipo.session_id === sessao.id
                    );

                    return (
                      <div
                        key={sessao.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="font-bold text-slate-900">
                              {new Intl.DateTimeFormat("pt-PT", {
                                dateStyle: "medium",
                                timeStyle: "short",
                                timeZone: "Europe/Lisbon",
                              }).format(new Date(sessao.starts_at))}
                            </div>

                            <div className="mt-1 text-sm text-slate-500">
                              {sessaoLabel[sessao.status] ??
                                sessao.status}
                              {" · "}
                              capacidade {sessao.capacity}
                              {" · "}
                              vendas{" "}
                              {sessao.sales_enabled
                                ? "ativas"
                                : "desativadas"}
                            </div>
                          </div>

                          {["owner", "admin", "checkin"].includes(membership.role) && <Link className="text-rose-600" href={`/espectaculos/organizador/eventos/${evento.id}/sessoes/${sessao.id}/checkin`}>Check-in</Link>}
                          {podeGerir && (
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/espectaculos/organizador/eventos/${evento.id}/sessoes/${sessao.id}`}
                              >
                                Gerir
                              </Link>
                            </Button>
                          )}
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Ticket className="h-4 w-4" />
                            Tipos de bilhete
                          </div>

                          {bilhetes.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              Nenhum tipo de bilhete configurado.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {bilhetes.map((bilhete) => (
                                <div
                                  key={bilhete.id}
                                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                                >
                                  <span className="font-medium">
                                    {bilhete.name}
                                  </span>

                                  <span className="text-slate-600">
                                    {bilhete.price_cents === 0
                                      ? "Grátis"
                                      : new Intl.NumberFormat("pt-PT", {
                                          style: "currency",
                                          currency: bilhete.currency,
                                        }).format(
                                          bilhete.price_cents / 100
                                        )}
                                    {" · "}
                                    {availability.get(bilhete.id) ?? "—"} disponíveis
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bilheteira</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-3xl font-black text-slate-950">
                {tiposBilhete.length}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                tipos de bilhete configurados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Espetáculo</span>
                <strong>
                  {estadoLabel[evento.estado] ?? evento.estado}
                </strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Sessões</span>
                <strong>{sessoes.length}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Vendas ativas</span>
                <strong>
                  {sessoes.filter((sessao) => sessao.sales_enabled).length}
                </strong>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
